import { SITE_URL } from "@/utils/constants";

export { SITE_URL };

export const API_BASE =
  process.env.PYSRAWEB_API_BASE ?? "https://seqout.org/api";
export const LIMIT = 50_000;
export const SOURCES = ["geo", "sra", "arrayexpress", "ena"] as const;
export const VALID_SOURCES = new Set<string>(SOURCES);

export function xmlResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=2592000",
    },
  });
}
