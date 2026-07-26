import DownloadTables from "@/components/download-tables";
import SearchBar from "@/components/search-bar";
import { Code, Flex, Heading, Link, Text } from "@radix-ui/themes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Downloads",
  description:
    "Download the full seqout database as Parquet files — GEO, SRA, ENA, ArrayExpress and unified cross-source tables. Query directly with DuckDB or the seqout CLI.",
  alternates: {
    canonical: "https://seqout.org/data",
  },
};

export default function Page() {
  return (
    <>
      <SearchBar />
      <Flex
        gap="4"
        py={{ initial: "4", md: "4" }}
        px={{ initial: "4", md: "0" }}
        ml={{ initial: "0", md: "13rem" }}
        mr={{ initial: "0", md: "16rem" }}
        direction="column"
      >
        <Heading as="h1" size={{ initial: "6", md: "8" }} weight="bold">
          Data Downloads
        </Heading>
        <Text size={{ initial: "2", md: "3" }} color="gray">
          The full seqout database as Parquet files. Each source&apos;s tables
          are listed below. Files are served with HTTP range support, so you can
          query them in place with{" "}
          <Link href="https://duckdb.org" target="_blank" rel="noreferrer">
            DuckDB
          </Link>{" "}
          without downloading, e.g.{" "}
          <Code>
            SELECT * FROM
            read_parquet(&apos;https://seqout.org/data/geo_series.parquet&apos;)
          </Code>
          , or via the seqout CLI.
        </Text>
        <DownloadTables />
      </Flex>
    </>
  );
}
