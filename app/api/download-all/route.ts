import JSZip from "jszip";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type DownloadAllFile = {
  url: string;
  filename?: string;
};

type DownloadAllPayload = {
  archiveName?: string;
  files?: DownloadAllFile[];
};

const sanitizeFileName = (fileName: string): string => {
  const cleaned = fileName
    .replace(/[\\/\r\n\t]+/g, "_")
    .replace(/"/g, "")
    .trim();
  return cleaned || "download";
};

const resolveHttpUrl = (rawUrl: string): URL | null => {
  try {
    const parsedUrl = new URL(rawUrl);
    if (parsedUrl.protocol === "ftp:") {
      parsedUrl.protocol = "https:";
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }
    return parsedUrl;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest): Promise<Response> {
  let payload: DownloadAllPayload;
  try {
    payload = (await request.json()) as DownloadAllPayload;
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const files = Array.isArray(payload.files) ? payload.files : [];
  if (files.length === 0) {
    return new Response("No files provided", { status: 400 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const file of files) {
    const resolvedUrl = resolveHttpUrl(file.url);
    if (!resolvedUrl) {
      return new Response(`Unsupported or invalid URL: ${file.url}`, {
        status: 400,
      });
    }

    const upstreamResponse = await fetch(resolvedUrl.toString(), {
      cache: "no-store",
    });
    if (!upstreamResponse.ok) {
      return new Response(`Failed to fetch file: ${resolvedUrl.toString()}`, {
        status: 502,
      });
    }

    const baseName = sanitizeFileName(
      file.filename ||
        resolvedUrl.pathname.split("/").filter(Boolean).pop() ||
        "download",
    );

    let finalName = baseName;
    let duplicateCounter = 2;
    while (usedNames.has(finalName)) {
      const extensionMatch = baseName.match(/(\.[^.]*)$/);
      if (extensionMatch) {
        const extension = extensionMatch[1];
        const withoutExtension = baseName.slice(0, -extension.length);
        finalName = `${withoutExtension}_${duplicateCounter}${extension}`;
      } else {
        finalName = `${baseName}_${duplicateCounter}`;
      }
      duplicateCounter += 1;
    }
    usedNames.add(finalName);

    const fileBuffer = await upstreamResponse.arrayBuffer();
    zip.file(finalName, fileBuffer);
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  const zipBytes = new Uint8Array(zipBuffer);

  const archiveNameBase = sanitizeFileName(
    payload.archiveName?.trim() || "supplementary_files.zip",
  );
  const archiveName = archiveNameBase.endsWith(".zip")
    ? archiveNameBase
    : `${archiveNameBase}.zip`;

  return new Response(zipBytes, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-length": String(zipBytes.byteLength),
      "content-disposition": `attachment; filename="${archiveName}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
