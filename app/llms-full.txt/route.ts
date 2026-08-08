import { faqItems, updateFrequencyAnswer } from "@/app/faq/faq-items";
import { extractHowSearchWorks } from "@/app/llms-full.txt/jsx-prose";
import { LAST_INDEX_REFRESH, SERVER_API_BASE, SITE_URL } from "@/utils/constants";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const revalidate = 86400;

type OpenApiOperation = { summary?: string; description?: string };
type OpenApiSpec = {
  paths?: Record<string, Record<string, OpenApiOperation>>;
};

const METHODS = ["get", "post", "put", "patch", "delete"];

const INTERNAL = ["/cache/"];

async function apiReference(): Promise<string> {
  let spec: OpenApiSpec;
  try {
    const res = await fetch(`${SERVER_API_BASE}/openapi.json`, {
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`openapi.json answered ${res.status}`);
    spec = (await res.json()) as OpenApiSpec;
  } catch {
    return `The REST API is documented at ${SITE_URL}/api-docs.`;
  }

  const lines: string[] = [];
  for (const [route, ops] of Object.entries(spec.paths ?? {})) {
    if (INTERNAL.some((prefix) => route.startsWith(prefix))) continue;
    for (const method of METHODS) {
      const op = ops[method];
      if (!op) continue;
      const note = op.summary ?? op.description?.split("\n")[0] ?? "";
      lines.push(
        `- \`${method.toUpperCase()} /api${route}\`${note ? `: ${note}` : ""}`,
      );
    }
  }
  return lines.length
    ? `Base URL \`${SITE_URL}/api\`. No authentication. JSON responses with\ncursor-based pagination.\n\n${lines.join("\n")}`
    : `The REST API is documented at ${SITE_URL}/api-docs.`;
}

type McpTool = { name: string; description?: string };

async function mcpReference(): Promise<string> {
  const fallback = `The MCP server is at \`${SITE_URL}/api/mcp\`. Setup instructions for each client are at ${SITE_URL}/mcp.`;
  try {
    const res = await fetch(`${SERVER_API_BASE}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`tools/list answered ${res.status}`);
    const { result } = (await res.json()) as { result?: { tools?: McpTool[] } };
    const tools = result?.tools ?? [];
    if (!tools.length) return fallback;

    const lines = tools
      .map((tool) => {
        const note = tool.description?.split("\n")[0]?.trim() ?? "";
        return `- \`${tool.name}\`${note ? `: ${note}` : ""}`;
      })
      .sort();
    return `Endpoint \`${SITE_URL}/api/mcp\`, streamable HTTP, no authentication.\nSetup for each client is at ${SITE_URL}/mcp. It exposes ${tools.length} tools:\n\n${lines.join("\n")}`;
  } catch {
    return fallback;
  }
}

async function searchGuide(): Promise<string> {
  const src = await readFile(
    path.join(process.cwd(), "app", "howsearchworks", "page.tsx"),
    "utf8",
  ).catch(() => null);
  const text = src && extractHowSearchWorks(src);
  return text || `The search guide is at ${SITE_URL}/howsearchworks.`;
}

export async function GET() {
  const index = await readFile(
    path.join(process.cwd(), "public", "llms.txt"),
    "utf8",
  );

  const faq = faqItems
    .map((item) => {
      const answer =
        item.id === "update-frequency"
          ? updateFrequencyAnswer(LAST_INDEX_REFRESH)
          : item.answer;
      return `### ${item.question}\n\n${answer}`;
    })
    .join("\n\n");

  const body = [
    index.trimEnd(),
    "---",
    "# Full documentation",
    "## Frequently asked questions",
    faq,
    "## REST API",
    await apiReference(),
    "## MCP server",
    await mcpReference(),
    "## How search works",
    await searchGuide(),
  ].join("\n\n");

  return new Response(`${body}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": `public, max-age=0, s-maxage=${revalidate}`,
    },
  });
}
