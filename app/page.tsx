import HomeSearchBar from "@/components/home-search-bar";
import Navabar from "@/components/navbar";
import { Flex } from "@radix-ui/themes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "pysraweb - Search GEO & SRA Datasets",
  description:
    "Search and explore millions of GEO and SRA sequencing datasets. Unified metadata views, relevance-ranked results, and consolidated sample tables for faster research.",
  alternates: {
    canonical: "https://pysraweb.saketlab.org",
  },
};

export default function Home() {
  return (
    <Flex style={{ height: "100dvh" }} direction="column">
      <Navabar />
      <main>
        <HomeSearchBar />
      </main>
    </Flex>
  );
}
