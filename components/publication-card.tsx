import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { Box, Card, Flex, Link, Text } from "@radix-ui/themes";
import Image from "next/image";

type PubMedAuthor = {
  name: string;
  authtype: string;
  clusterid: string;
};

type PubMedArticleId = {
  idtype: string;
  idtypen: number;
  value: string;
};

export type PubMedArticle = {
  uid: string;
  title: string;
  authors: PubMedAuthor[];
  fulljournalname: string;
  pubdate: string;
  source: string;
  articleids: PubMedArticleId[];
};

type PublicationCardProps = {
  publication: PubMedArticle;
};

export default function PublicationCard({ publication }: PublicationCardProps) {
  const doi = publication.articleids.find((id) => id.idtype === "doi")?.value;

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
          <Link
            href={`https://doi.org/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
            size={{ initial: "2", md: "3" }}
            weight={"medium"}
          >
            {publication.title} <ExternalLinkIcon />
          </Link>

          <Text
            style={{ fontStyle: "italic" }}
            size={{ initial: "1", md: "2" }}
          >
            {publication.authors.length > 4
              ? `${publication.authors
                  .slice(0, 4)
                  .map((a) => a.name)
                  .join(", ")} et al.`
              : publication.authors.map((a) => a.name).join(", ")}
          </Text>
          <Text weight={"light"} size={{ initial: "1", md: "2" }}>
            {publication.fulljournalname}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
