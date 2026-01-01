"use client";
import ResultCard from "@/components/result-card";
import SearchBar from "@/components/search-bar";
import { SERVER_URL } from "@/utils/constants";
import { SearchResult } from "@/utils/types";
import {
  Button,
  Flex,
  RadioGroup,
  Select,
  Separator,
  Skeleton,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Cursor = {
  rank: number;
  accession: string;
} | null;

type SearchResponse = {
  results: SearchResult[];
  next_cursor: Cursor;
};

const getSearchResults = async (
  query: string | null,
  db: string | null,
  cursor: Cursor
): Promise<SearchResponse | null> => {
  if (!query) return null;

  let url = `${SERVER_URL}/search?q=${encodeURIComponent(query)}`;
  if (db === "sra" || db === "geo") {
    url += `&db=${encodeURIComponent(db)}`;
  }
  if (cursor) {
    url += `&cursor_rank=${cursor.rank}&cursor_acc=${encodeURIComponent(
      cursor.accession
    )}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Network Error");
  }
  return res.json();
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q");

  const db = searchParams.get("db");
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");
  const [timeFilter, setTimeFilter] = useState<"any" | "1" | "5" | "10" | "20">(
    "any"
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["search", query, db],
    queryFn: ({ pageParam }) =>
      getSearchResults(query, db, pageParam as Cursor),
    initialPageParam: null as Cursor,
    getNextPageParam: (lastPage) => lastPage?.next_cursor ?? undefined,
    enabled: !!query,
  });

  // Flatten all pages into a single array of results
  const searchResults =
    data?.pages.flatMap((page) => page?.results ?? []) ?? [];

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      {/* Navbar and search */}
      <SearchBar initialQuery={query} />

      {/* Search results and filters */}
      <Flex
        gap={{ initial: "4", md: "8" }}
        p={"4"}
        justify={"start"}
        direction={{ initial: "column", md: "row" }}
      >
        {/* Filters for small screens */}
        <Flex
          direction={"row-reverse"}
          justify={"center"}
          gap={"2"}
          display={{ initial: "flex", md: "none" }}
        >
          <Select.Root
            defaultValue="relevance"
            name="sort"
            onValueChange={(value) => setSortBy(value as "relevance" | "date")}
            size={"1"}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Group>
                <Select.Item value="relevance">Sort by relevance</Select.Item>
                <Select.Item value="date">Sort by date</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>

          <Select.Root
            defaultValue="any"
            name="time"
            onValueChange={(value) =>
              setTimeFilter(value as "any" | "1" | "5" | "10" | "20")
            }
            size={"1"}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Group>
                <Select.Item value="any">Any time</Select.Item>
                <Select.Item value="1">Last year</Select.Item>
                <Select.Item value="5">Last 5 yrs</Select.Item>
                <Select.Item value="10">Last 10 yrs</Select.Item>
                <Select.Item value="20">Last 20 yrs</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>

          <Select.Root
            defaultValue={db ? db : "both"}
            onValueChange={(value) => {
              if (query) {
                let url = `/search?q=${encodeURIComponent(query)}`;
                if (value === "sra" || value === "geo") {
                  url += `&db=${encodeURIComponent(value)}`;
                }
                router.push(url);
              }
            }}
            size={"1"}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Group>
                <Select.Item value="geo">From GEO</Select.Item>
                <Select.Item value="sra">From SRA</Select.Item>
                <Select.Item value="both">From GEO & SRA</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </Flex>
        {/* Filters for md+ screens*/}
        <Flex
          direction={"column"}
          gap={"4"}
          display={{ initial: "none", md: "flex" }}
          position={"sticky"}
          style={{ top: "7rem" }}
          height={"fit-content"}
        >
          <RadioGroup.Root
            defaultValue={db ? db : "both"}
            name="dataset"
            onValueChange={(value) => {
              if (query) {
                let url = `/search?q=${encodeURIComponent(query)}`;
                if (value === "sra" || value === "geo") {
                  url += `&db=${encodeURIComponent(value)}`;
                }
                router.push(url);
              }
            }}
          >
            <RadioGroup.Item value="geo">From GEO</RadioGroup.Item>
            <RadioGroup.Item value="sra">From SRA</RadioGroup.Item>
            <RadioGroup.Item value="both">From GEO & SRA</RadioGroup.Item>
          </RadioGroup.Root>

          <Separator orientation={"horizontal"} size={"4"} />

          <RadioGroup.Root
            defaultValue="relevance"
            name="sort"
            onValueChange={(value) => setSortBy(value as "relevance" | "date")}
          >
            <RadioGroup.Item value="relevance">
              Sort by relevance
            </RadioGroup.Item>
            <RadioGroup.Item value="date">Sort by date</RadioGroup.Item>
          </RadioGroup.Root>

          <Separator orientation={"horizontal"} size={"4"} />

          <RadioGroup.Root
            defaultValue="any"
            name="time"
            onValueChange={(value) =>
              setTimeFilter(value as "any" | "1" | "5" | "10" | "20")
            }
          >
            <RadioGroup.Item value="any">Any time</RadioGroup.Item>
            <RadioGroup.Item value="1">Since last year</RadioGroup.Item>
            <RadioGroup.Item value="5">Since last 5 years</RadioGroup.Item>
            <RadioGroup.Item value="10">Since last 10 years</RadioGroup.Item>
            <RadioGroup.Item value="20">Since last 20 years</RadioGroup.Item>
          </RadioGroup.Root>
        </Flex>

        <Flex gap="4" direction="column" width={{ initial: "100%", md: "70%" }}>
          {!query ? (
            <Text>Start by typing a search query above.</Text>
          ) : isLoading ? (
            <Flex gap="3" align="start" justify="start" direction={"column"}>
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
          ) : searchResults.length > 0 ? (
            <>
              {(sortBy === "date"
                ? [...searchResults].sort(
                    (a, b) =>
                      new Date(b.updated_at).getTime() -
                      new Date(a.updated_at).getTime()
                  )
                : searchResults
              )
                .filter((result) => {
                  if (timeFilter === "any") return true;
                  const years = parseInt(timeFilter);
                  const cutoffDate = new Date();
                  cutoffDate.setFullYear(cutoffDate.getFullYear() - years);
                  return new Date(result.updated_at) >= cutoffDate;
                })
                .map((searchResult) => (
                  <ResultCard
                    key={searchResult.accession}
                    accesssion={searchResult.accession}
                    title={searchResult.title}
                    summary={searchResult.summary}
                    updated_at={searchResult.updated_at}
                  />
                ))}

              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} style={{ minHeight: "1px" }}>
                {isFetchingNextPage && (
                  <Flex justify="center" py="4">
                    <Spinner size="3" />
                  </Flex>
                )}
                {hasNextPage && !isFetchingNextPage && (
                  <Flex justify="center" py="4">
                    <Button variant="soft" onClick={() => fetchNextPage()}>
                      Load more
                    </Button>
                  </Flex>
                )}
              </div>
            </>
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
      </Flex>
    </>
  );
}
