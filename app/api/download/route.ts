import { NextRequest } from "next/server";

export const runtime = "nodejs";

const sanitizeFileName = (fileName: string): string => {
  const cleaned = fileName
    .replace(/[\\/\r\n\t]+/g, "_")
    .replace(/"/g, "")
    .trim();
  return cleaned || "download";
};

export async function GET(request: NextRequest): Promise<Response> {
  const rawUrl = request.nextUrl.searchParams.get("url");
  const requestedFileName = request.nextUrl.searchParams.get("filename");

  if (!rawUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (parsedUrl.protocol === "ftp:") {
    parsedUrl.protocol = "https:";
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return new Response("Unsupported url protocol", { status: 400 });
  }

  const upstreamResponse = await fetch(parsedUrl.toString(), {
    cache: "no-store",
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return new Response("Failed to fetch remote file", {
      status: upstreamResponse.status || 502,
    });
  }

  const inferredName =
    requestedFileName ||
    parsedUrl.pathname.split("/").filter(Boolean).pop() ||
    "download";
  const safeFileName = sanitizeFileName(inferredName);

  const responseHeaders = new Headers();
  responseHeaders.set(
    "content-type",
    upstreamResponse.headers.get("content-type") || "application/octet-stream",
  );

  const contentLength = upstreamResponse.headers.get("content-length");
  if (contentLength) {
    responseHeaders.set("content-length", contentLength);
  }

  responseHeaders.set(
    "content-disposition",
    `attachment; filename="${safeFileName}"`,
  );
  responseHeaders.set("x-content-type-options", "nosniff");

  return new Response(upstreamResponse.body, {
    status: 200,
    headers: responseHeaders,
  });
}
