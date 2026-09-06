import { SITE_URL } from "@/utils/constants";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ accession: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { accession } = await params;
  const acc = decodeURIComponent(accession).toUpperCase();
  const canonicalUrl = `${SITE_URL}/r/${encodeURIComponent(acc)}`;
  const description = `Metadata, checksums, and FASTQ download links for run ${acc} on seqout.`;
  return {
    title: `${acc} - Run`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${acc} - Run`,
      description,
      url: canonicalUrl,
    },
    robots: { index: false, follow: true },
  };
}

export default function RunLayout({ children }: Props) {
  return children;
}
