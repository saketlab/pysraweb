"use client";
import ResultCard from "@/components/result-card";
import SearchBar from "@/components/search-bar";
import { SERVER_URL } from "@/utils/constants";
import { SearchResults } from "@/utils/types";
import { Flex, Skeleton, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
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
  } = useQuery({
    queryKey: ["search", query],
    queryFn: ({ queryKey }) => getSearchResults(queryKey[1] as string | null),
    enabled: !!query,
  });

  return (
    <>
      {/* Navbar and search */}
      <SearchBar initialQuery={query} />

      {/* Search results and filters */}
      <Flex
        gap="4"
        direction="column"
        pt={"3"}
        ml={{ md: "8rem" }}
        mr={{ md: "16rem" }}
      >
        {!query ? (
          <Flex align="center" justify="center">
            <Text>Start by typing a search query above.</Text>
          </Flex>
        ) : isLoading ? (
          <Flex
            gap="3"
            align="start"
            // style={{ width: "65%" }}
            justify="start"
            direction={"column"}
          >
            <Skeleton width={"100%"} height={"6rem"} />
            <Skeleton width={"100%"} height={"6rem"} />
            <Skeleton width={"100%"} height={"6rem"} />
            <Skeleton width={"100%"} height={"6rem"} />
            <Skeleton width={"100%"} height={"6rem"} />
          </Flex>
        ) : isError ? (
          <Flex
            gap="2"
            align="center"
            justify="center"
            height={"20rem"}
            direction={"column"}
          >
            <Image
              src="./controls.svg"
              alt="empty box"
              width={"100"}
              height={"100"}
            />
            <Text color="gray" size={"6"} weight={"bold"}>
              Failed to connect
            </Text>
            <Text color="gray" size={"2"}>
              Check your network connection
            </Text>
          </Flex>
        ) : searchResults ? (
          searchResults.map((searchResult) => (
            <ResultCard
              key={searchResult.accession}
              accesssion={searchResult.accession}
              title={searchResult.title}
              summary={searchResult.summary}
              updated_at={searchResult.updated_at}
            />
          ))
        ) : (
          <Flex
            align="center"
            justify="center"
            direction={"column"}
            height={"20rem"}
          >
            {/* Credits: https://www.svgrepo.com/svg/489659/empty-box */}
            <Image
              src="./empty-box.svg"
              alt="empty box"
              width={"100"}
              height={"100"}
            />
            <Text color="gray" size={"6"} weight={"bold"}>
              No results found
            </Text>
            <Text color="gray" size={"2"}>
              Try refining you search text
            </Text>
          </Flex>
        )}
      </Flex>
    </>
  );
}
