import { ARCHIVE_LIST_TEXT, SITE_URL } from "@/utils/constants";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ pmid: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pmid } = await params;
  const canonicalUrl = `${SITE_URL}/pmid/${encodeURIComponent(pmid)}`;
  const description = `Sequencing datasets linked to PMID ${pmid} across ${ARCHIVE_LIST_TEXT}.`;
  return {
    title: `PMID ${pmid} - Datasets`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `PMID ${pmid} - Datasets`,
      description,
      url: canonicalUrl,
    },
    robots: { index: false, follow: true },
  };
}

export default function PublicationLayout({ children }: Props) {
  return children;
}
