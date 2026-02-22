import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { Box, Card, Flex, Link, Text } from "@radix-ui/themes";
import Image from "next/image";

export type StudyPublication = {
  pmid: string | null;
  title: string | null;
  journal: string | null;
  doi: string | null;
  pub_date: string | null;
  authors: string | null;
  issn: string | null;
  citation_count: number | null;
  journal_h_index: number | null;
  journal_i10_index: number | null;
  journal_2yr_mean_citedness: number | null;
  journal_cited_by_count: number | null;
  journal_works_count: number | null;
};

type PublicationCardProps = {
  publication: StudyPublication;
};

function cleanJournalName(name: string): string {
  let cleaned = name;
  const colonIndex = cleaned.indexOf(": ");
  if (colonIndex !== -1) cleaned = cleaned.slice(0, colonIndex);
  const parenIndex = cleaned.indexOf("(");
  if (parenIndex !== -1) cleaned = cleaned.slice(0, parenIndex);
  return cleaned.trimEnd();
}

function formatAuthors(authors: string | null): string {
  if (!authors) return "";
  const list = authors.split(",").map((a) => a.trim());
  if (list.length > 4) {
    return `${list.slice(0, 4).join(", ")} et al.`;
  }
  return list.join(", ");
}

export default function PublicationCard({ publication }: PublicationCardProps) {
  const doi = publication.doi;
  const citationCount = publication.citation_count;
  const titleLink = doi
    ? `https://doi.org/${doi}`
    : publication.pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${publication.pmid}`
      : null;

  return (
    <Card>
      <Flex gap={"4"} align={"center"}>
        <Box display={{ initial: "block", md: "none" }}>
          <Image
            draggable={"false"}
            src={"/page.svg"}
            height={24}
            width={24}
            alt="page icon"
          />
        </Box>
        <Box display={{ initial: "none", md: "block" }}>
          <Image
            draggable={"false"}
            src={"/page.svg"}
            height={40}
            width={40}
            alt="page icon"
          />
        </Box>
        <Flex direction={"column"}>
          {titleLink ? (
            <Link
              href={titleLink}
              target="_blank"
              rel="noopener noreferrer"
              size={{ initial: "2", md: "3" }}
              weight={"medium"}
            >
              {publication.title} <ExternalLinkIcon />
            </Link>
          ) : (
            <Text size={{ initial: "2", md: "3" }} weight={"medium"}>
              {publication.title}
            </Text>
          )}

          {publication.authors && (
            <Text
              style={{ fontStyle: "italic" }}
              size={{ initial: "1", md: "2" }}
            >
              {formatAuthors(publication.authors)}
            </Text>
          )}
          {publication.journal && (
            doi ? (
              <Link
                href={`https://doi.org/${doi}`}
                target="_blank"
                rel="noopener noreferrer"
                size={{ initial: "1", md: "2" }}
                weight={"light"}
              >
                {cleanJournalName(publication.journal)}
                {citationCount != null &&
                  citationCount > 0 &&
                  ` (${citationCount})`}
              </Link>
            ) : (
              <Text weight={"light"} size={{ initial: "1", md: "2" }}>
                {cleanJournalName(publication.journal)}
                {citationCount != null &&
                  citationCount > 0 &&
                  ` (${citationCount})`}
              </Text>
            )
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
