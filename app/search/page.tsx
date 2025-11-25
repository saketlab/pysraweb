"use client";
import ResultCard from "@/components/result-card";
import SearchBar from "@/components/search-bar";
import { SERVER_URL } from "@/utils/constants";
import { SearchResults } from "@/utils/types";
import { Flex, Spinner, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

const getSearchResults = async (
  query: string | null
): Promise<SearchResults | null> => {
  if (!query) return null;

  const res = await fetch(
    `${SERVER_URL}/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) {
    throw new Error("Network Error");
  }
  return res.json();
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const {
    data: searchResults,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["search", query],
    queryFn: ({ queryKey }) => getSearchResults(queryKey[1] as string | null),
    enabled: !!query,
  });

  return (
    <>
      {/* Navbar and search */}
      <SearchBar searchQuery={query} />

      {/* Search results and filters */}
      <Flex
        gap="4"
        p="3"
        style={{ marginLeft: "8.2rem", width: "65%" }}
        direction="column"
      >
        {!query ? (
          <Flex align="center" justify="center">
            <Text>Start by typing a search query above.</Text>
          </Flex>
        ) : isLoading ? (
          <Flex
            gap="2"
            align="center"
            style={{ width: "65%" }}
            justify="center"
          >
            <Spinner size="3" />
            <Text>Search in progress</Text>
          </Flex>
        ) : isError ? (
          <Flex gap="2" align="center" justify="center">
            <Text>
              {error instanceof Error
                ? error.message
                : "An error occurred while searching"}
            </Text>
          </Flex>
        ) : searchResults ? (
          Object.entries(searchResults).flatMap(([studyAcc, results]) => (
            <ResultCard
              key={studyAcc}
              studyAcc={studyAcc}
              experiments={results}
            />
          ))
        ) : (
          <Flex align="center" justify="center">
            <Text>No results found.</Text>
          </Flex>
        )}
      </Flex>
    </>
  );
}
