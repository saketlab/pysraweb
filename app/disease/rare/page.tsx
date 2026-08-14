import DiseaseCollectionCard from "@/components/disease-collection-card";
import SearchBar from "@/components/search-bar";
import { Flex, Heading, Text } from "@radix-ui/themes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rare disease datasets: GEO, SRA, ENA & ArrayExpress",
  description:
    "Explore sequencing studies annotated with NIH GARD rare diseases, matched by MONDO identifier, with per-study sample, cell, assay and sex breakdowns.",
  alternates: {
    canonical: "https://seqout.org/disease/rare",
  },
};

export default function RarePage() {
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
        <Heading as="h1" size={{ initial: "6", md: "8" }} weight={"bold"}>
          Rare disease datasets
        </Heading>
        <Text size={{ initial: "2", md: "3" }} color="gray">
          Studies with at least one sample annotated with a NIH GARD rare
          disease, matched by MONDO identifier and its ancestor closure.
        </Text>
        <DiseaseCollectionCard collection="rare" />
      </Flex>
    </>
  );
}
