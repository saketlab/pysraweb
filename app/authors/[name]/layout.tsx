import { ARCHIVE_LIST_TEXT, SITE_URL } from "@/utils/constants";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const author = decodeURIComponent(name);
  const canonicalUrl = `${SITE_URL}/authors/${encodeURIComponent(author)}`;
  const description = `Sequencing datasets authored by ${author} across ${ARCHIVE_LIST_TEXT}.`;
  return {
    title: `${author} - Datasets`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${author} - Datasets`,
      description,
      url: canonicalUrl,
    },
    robots: { index: false, follow: true },
  };
}

export default function AuthorLayout({ children }: Props) {
  return children;
}
