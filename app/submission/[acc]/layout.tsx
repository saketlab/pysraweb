import { ARCHIVE_LIST_TEXT, SITE_URL } from "@/utils/constants";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ acc: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { acc } = await params;
  const canonicalUrl = `${SITE_URL}/submission/${encodeURIComponent(acc)}`;
  const description = `Sequencing studies filed under submission ${acc} across ${ARCHIVE_LIST_TEXT}.`;
  return {
    title: `Submission ${acc} - Studies`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Submission ${acc} - Studies`,
      description,
      url: canonicalUrl,
    },
    robots: { index: false, follow: true },
  };
}

export default function SubmissionLayout({ children }: Props) {
  return children;
}
