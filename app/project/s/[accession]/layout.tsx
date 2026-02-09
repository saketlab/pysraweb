import { fetchProjectSocialTitle } from "@/lib/project-og";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ accession: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { accession } = await params;
  const title = await fetchProjectSocialTitle(accession);
  const pageTitle = `${title} (${accession})`;
  const description = `SRA Study ${accession} on pysraweb.saketlab.org`;
  const image = `/project/s/${encodeURIComponent(accession)}/opengraph-image`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} ${accession} SRA Study`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [image],
    },
  };
}

export default function SraProjectLayout({ children }: Props) {
  return children;
}
