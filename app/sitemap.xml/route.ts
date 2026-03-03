import { SITE_URL } from "@/utils/constants";

export const dynamic = "force-dynamic";

const API_BASE = process.env.PYSRAWEB_API_BASE ?? "https://seqout.org/api";
const LIMIT = 50_000;

export async function GET() {
  const res = await fetch(`${API_BASE}/sitemap/counts`, {
    next: { revalidate: 2592000 },
  });
  if (!res.ok) {
    return new Response("Failed to fetch sitemap counts", { status: 502 });
  }

  const { total } = (await res.json()) as { total: number };
  const chunks = Math.ceil(total / LIMIT);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  xml += `  <sitemap><loc>${SITE_URL}/sitemap/static.xml</loc></sitemap>\n`;

  for (let i = 0; i < chunks; i++) {
    xml += `  <sitemap><loc>${SITE_URL}/sitemap/${i}.xml</loc></sitemap>\n`;
  }

  xml += `</sitemapindex>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=2592000",
    },
  });
}
