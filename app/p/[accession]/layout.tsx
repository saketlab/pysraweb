import { fetchProjectSocialTitle } from "@/lib/project-og";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ accession: string }>;
};

function detectProjectType(accession: string): {
  type: string;
  database: string;
} {
  const upper = accession.toUpperCase();

  if (upper.startsWith("E-")) {
    return { type: "ArrayExpress Experiment", database: "ArrayExpress" };
  }

  if (upper.startsWith("G")) {
    return { type: "GEO Series", database: "GEO" };
  }

  if (upper.startsWith("ERP") || upper.startsWith("DRP")) {
    return { type: "ENA Study", database: "ENA" };
  }

  return { type: "SRA Study", database: "SRA" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { accession } = await params;
  const title = await fetchProjectSocialTitle(accession);
  const { type: projectType, database } = detectProjectType(accession);

  const pageTitle = `${accession} - ${title}`;
  const description = `Explore ${projectType} ${accession}: ${title}. View unified metadata, samples, experiments, and similar projects on pysraweb.`;
  const image = `/p/${encodeURIComponent(accession)}/opengraph-image`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: `${title} • ${accession}`,
      description: `${projectType} on ${database} • ${title}`,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${accession} - ${title} (${database})`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} • ${accession}`,
      description: `${projectType} on ${database}`,
      images: [image],
    },
  };
}

export default function ProjectLayout({ children }: Props) {
  return children;
}
