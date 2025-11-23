"use client";
import ResultCard from "@/components/result-card";
import { SearchResult } from "@/utils/types";
import {
  CaretSortIcon,
  GitHubLogoIcon,
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  Flex,
  IconButton,
  Link as RadixLink,
  Spinner,
  Text,
  TextField,
} from "@radix-ui/themes";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q"));
  const [searchResults, setSearchResults] = useState<SearchResult[]>();
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  //   const [numSearchResults, setNumSearchResults] = useState(0);

  useEffect(() => {
    if (query) {
      fetch(`http://localhost:8000/?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setIsError(true);
            setErrorMessage(data.error);
          } else {
            setSearchResults(data);
          }
        });
    }
  }, [query]);

  return (
    <>
      {/* Navbar and search */}
      <Flex
        justify="between"
        align="center"
        p="3"
        gap={"4"}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "white",
          boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
        }}
      >
        <Flex gap={"4"} align={"center"} flexGrow={"1"}>
          <Link href={"/"}>
            <Image
              src="/pysradb_v3.png"
              alt="pysradb logo"
              width={116}
              height={50}
            />
          </Link>
          <form style={{ width: "70%" }}>
            <TextField.Root
              placeholder="all scRNA-seq datasets from 2024 to 2023 which use 10x technology"
              size="3"
              onChange={(e) => setQuery(e.target.value)}
              value={query ?? ""}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </form>
          <IconButton variant="outline">
            <MixerHorizontalIcon />
          </IconButton>
          <IconButton variant="outline">
            <CaretSortIcon />
          </IconButton>
        </Flex>
        <RadixLink href="https://saketlab.in/">Saket Lab</RadixLink>
        <RadixLink href="https://saket-choudhary.me/pysradb/index.html">
          Docs
        </RadixLink>
        <Button>
          <GitHubLogoIcon /> Star on GitHub
        </Button>
      </Flex>
      {/* Search results and filters */}
      <Flex
        gap={"4"}
        p="3"
        style={{ marginLeft: "8.2rem" }}
        direction={"column"}
      >
        {searchResults ? (
          searchResults.map((searchResult) => (
            <ResultCard
              key={searchResult.experiment_title}
              experimentTitle={searchResult.experiment_title}
            />
          ))
        ) : isError ? (
          <Flex gap={"2"} align={"center"} justify={"center"}>
            <Text color="red">
              {errorMessage || "An error occurred while searching"}
            </Text>
          </Flex>
        ) : (
          <Flex gap={"2"} align={"center"} justify={"center"}>
            <Spinner size={"3"} />
            <Text>Search in progress</Text>
          </Flex>
        )}
      </Flex>
    </>
  );
}
