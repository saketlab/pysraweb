import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ result: {} });
  }

  const url = new URL(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
  );
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("retmode", "json");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    return NextResponse.json({ result: {} }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
