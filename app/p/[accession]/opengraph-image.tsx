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

export default async function OpengraphImage({ params }: Props) {
  const { accession } = await params;
  // Auto-detect project type from accession prefix
  const projectType = accession.startsWith("G") ? "geo" : "sra";
  return generateProjectOgImage(accession, projectType);
}
