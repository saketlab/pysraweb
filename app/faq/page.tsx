import SearchBar from "@/components/search-bar";
import { Flex, Link, Text } from "@radix-ui/themes";
import Image from "next/image";

export default function FAQ() {
  return (
    <>
      <SearchBar />
      <Flex
        gap="4"
        py={"4"}
        ml={{ initial: "1rem", md: "13rem" }}
        mr={{ initial: "1rem", md: "16rem" }}
        direction={"column"}
      >
        <Text size={"8"} weight={"bold"}>
          About
        </Text>
        <Text>
          pysraweb is a web app for fast exploration of datasets from the{" "}
          <Link href="https://www.ncbi.nlm.nih.gov/sra">
            Sequence Read Archive
          </Link>{" "}
          and{" "}
          <Link href="https://www.ncbi.nlm.nih.gov/geo/">
            Gene Expression Omnibus
          </Link>{" "}
          featuring consolidated tabular views of experiment- and sample-level
          metadata, substantially reducing navigation overhead and enabling
          faster exploration and comparison of studies.
        </Text>
        <Text size={"8"} weight={"bold"}>
          Frequently Asked Questions
        </Text>
        <Flex direction={"column"} gap={"3"}>
          <Text size={"6"} weight={"medium"}>
            Where does pysraweb fetch its datasets from?
          </Text>
          <Text>
            We maintain a local mirror of all publicly available datasets on
            NCBI&apos;s FTP servers. This includes all{" "}
            <Link href="https://ftp.ncbi.nlm.nih.gov/sra/reports/Metadata/">
              SRA datasets
            </Link>{" "}
            and{" "}
            <Link href="https://ftp.ncbi.nlm.nih.gov/geo/">GEO datasets</Link>.
            We do not own or modify the original data.
          </Text>
        </Flex>

        <Flex direction={"column"} gap={"3"}>
          <Text size={"6"} weight={"medium"}>
            Does pysraweb download sequencing data?
          </Text>
          <Text>
            No. pysraweb only indexes and serves metadata. It does not download
            or host raw sequencing files such as FASTQ or BAM.
          </Text>
        </Flex>

        <Flex direction={"column"} gap={"3"}>
          <Text size={"6"} weight={"medium"}>
            How is pysraweb different from browsing NCBI directly?
          </Text>
          <Text>
            pysraweb provides unified SRA and GEO metadata, relevance-ranked
            search, and consolidated tabular views, eliminating multi-page
            navigation and reducing discovery time.
          </Text>
        </Flex>

        <Flex direction={"column"} gap={"3"}>
          <Text size={"6"} weight={"medium"}>
            Is pysraweb suitable for large-scale searches?
          </Text>
          <Text>
            Yes. The backend is optimized for low-latency queries over millions
            of records, enabling fast filtering and comparison across studies.
          </Text>
        </Flex>
        <Flex direction={"column"} gap={"3"}>
          <Text size={"6"} weight={"medium"}>
            Who is pysraweb intended for?
          </Text>
          <Text>
            pysraweb is designed for researchers who frequently explore public
            sequencing metadata and want faster, more structured discovery
            workflows.
          </Text>
        </Flex>
      </Flex>
      <Flex
        direction={{ initial: "column", md: "row" }}
        pt={"6"}
        pb={"4"}
        align={"baseline"}
        gap={"4"}
        justify={"between"}
        ml={{ initial: "1rem", md: "13rem" }}
        mr={{ initial: "1rem", md: "16rem" }}
      >
        <Image
          width="198"
          height="63"
          alt="KCDH + IITB Logo"
          src={"/KCDH_logo.webp"}
        />
        <Text size={"2"}>© Saket Lab, 2026</Text>
      </Flex>
    </>
  );
}
