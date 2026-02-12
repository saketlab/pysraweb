import {
  generateProjectOgImage,
  projectOgContentType,
  projectOgSize,
} from "@/lib/project-og";

type Props = {
  params: Promise<{ accession: string }>;
};

export const size = projectOgSize;
export const contentType = projectOgContentType;

function detectProjectType(
  accession: string,
): "geo" | "sra" | "ena" | "arrayexpress" {
  const upper = accession.toUpperCase();

  if (upper.startsWith("E-")) {
    return "arrayexpress";
  }

  if (upper.startsWith("G")) {
    return "geo";
  }

  if (upper.startsWith("ERP") || upper.startsWith("DRP")) {
    return "ena";
  }

  return "sra";
}

export default async function OpengraphImage({ params }: Props) {
  const { accession } = await params;
  const projectType = detectProjectType(accession);
  return generateProjectOgImage(accession, projectType);
}
