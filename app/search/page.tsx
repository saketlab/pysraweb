import SearchPageBody from "@/components/search-page-body";
import SearchPageSkeleton from "@/components/search-page-skeleton";
import { Suspense } from "react";
import type { Metadata } from "next";

const API_BASE_URL =
  process.env.PYSRAWEB_API_BASE ?? "https://pysraweb.saketlab.org/api";

type SearchParams = Promise<{ q?: string; db?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { q, db } = await searchParams;

  if (!q) {
    const fallbackDesc =
      "Search results for GEO and SRA sequencing datasets. Filter by organism, library strategy, and more.";
    return {
      title: "Search Results",
      description: fallbackDesc,
      openGraph: {
        title: "pysraweb - Search Results",
        description: fallbackDesc,
      },
      twitter: {
        card: "summary_large_image" as const,
        title: "pysraweb - Search Results",
        description: fallbackDesc,
      },
      alternates: {
        canonical: "https://pysraweb.saketlab.org/search",
      },
    };
  }

  let total: number | null = null;
  try {
    let url = `${API_BASE_URL}/search?q=${encodeURIComponent(q)}`;
    if (db === "sra" || db === "geo") {
      url += `&db=${encodeURIComponent(db)}`;
    }
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      total = data.total ?? null;
    }
  } catch {
    // Fall back to description without count
  }

  const description =
    total !== null
      ? `${total.toLocaleString()} result${total === 1 ? "" : "s"} found for "${q}" across GEO and SRA sequencing datasets.`
      : `Search results for "${q}" across GEO and SRA sequencing datasets.`;

  const title = `pysraweb: ${q} - Search results`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
    alternates: {
      canonical: "https://pysraweb.saketlab.org/search",
    },
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageBody />
    </Suspense>
  );
}
