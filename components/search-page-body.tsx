"use client";
import { OrganismFilter } from "@/components/organism_filter";
import ResultCard from "@/components/result-card";
import SearchBar from "@/components/search-bar";
import { useSearchQuery } from "@/context/search_query";
import { SERVER_URL } from "@/utils/constants";
import { SearchResult } from "@/utils/types";
import { ArrowUpIcon, DownloadIcon } from "@radix-ui/react-icons";
import {
  Button,
  Flex,
  RadioGroup,
  Select,
  Separator,
  Skeleton,
  Spinner,
  Text,
  TextField,
  Tooltip,
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
  total: number;
  took_ms: number;
  next_cursor: Cursor;
};

const getSearchResults = async (
  query: string | null,
  db: string | null,
  cursor: Cursor,
): Promise<SearchResponse | null> => {
  if (!query) return null;

  let url = `${SERVER_URL}/search?q=${encodeURIComponent(query)}`;
  if (db === "sra" || db === "geo") {
    url += `&db=${encodeURIComponent(db)}`;
  }
  if (cursor) {
    url += `&cursor_rank=${cursor.rank}&cursor_acc=${encodeURIComponent(
      cursor.accession,
    )}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Network Error");
  }
  return res.json();
};

export default function SearchPageBody() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q");
  const { setLastSearchQuery } = useSearchQuery();

  useEffect(() => {
    if (query) setLastSearchQuery(query);
  }, [query, setLastSearchQuery]);

  const db = searchParams.get("db");
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");
  const [timeFilter, setTimeFilter] = useState<
    "any" | "1" | "5" | "10" | "20" | "custom"
  >("any");
  const [customYearRange, setCustomYearRange] = useState<{
    from: string;
    to: string;
  }>({ from: "", to: "" });


  const [selectedOrganism, setSelectedOrganism] = useState<string | null>(null);

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

  const total = data?.pages?.[0]?.total ?? 0;

  const tookMs = data?.pages?.[0]?.took_ms ?? 0;

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
      { threshold: 0.1 },
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

  const [showTopButton, setShowTopButton] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTopButton(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sortedResults =
    sortBy === "date"
      ? [...searchResults].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
      : searchResults;

  const timeFilteredResults = sortedResults.filter((result) => {
    if (timeFilter === "any") return true;
    if (timeFilter === "custom") {
      const from = parseInt(customYearRange.from);
      const to = parseInt(customYearRange.to);
      if (!from || !to) return true;
      const d = new Date(result.updated_at);
      return d.getFullYear() >= from && d.getFullYear() <= to;
    }
    const years = parseInt(timeFilter);
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years);
    return new Date(result.updated_at) >= cutoffDate;
  });

  const organismFilteredResults = selectedOrganism
  ? timeFilteredResults.filter((result) =>
      (result.organisms ?? []).includes(selectedOrganism)
    )
  : timeFilteredResults;


  const handleDownloadResults = async () => {
    if (isDownloading || !query) return;

    setIsDownloading(true);
    setDownloadFailed(false);

    try {
      const params = new URLSearchParams();
      params.set("q", query);
      if (db === "sra" || db === "geo") {
        params.set("db", db);
      }

      if (timeFilter === "custom") {
        const from = parseInt(customYearRange.from);
        const to = parseInt(customYearRange.to);
        if (from) params.set("updated_year_from", String(from));
        if (to) params.set("updated_year_to", String(to));
      } else if (timeFilter !== "any") {
        const years = parseInt(timeFilter);
        const currentYear = new Date().getFullYear();
        params.set("updated_year_from", String(currentYear - years));
        params.set("updated_year_to", String(currentYear));
      }

      const res = await fetch(
        `${SERVER_URL}/download/query?${params.toString()}`,
      );

      if (!res.ok) {
        throw new Error("Download failed");
      }

      const zipBlob = await res.blob();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
        .replace("T", "_");
      a.download = `results_${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setDownloadFailed(true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Navbar and search */}
      <SearchBar initialQuery={query} />

      {/* Search results and filters */} 
      {/* Parent Flex */}
      <Flex
        gap={{ initial: "4", md: "8" }}
        p={"4"}
        justify={"start"}
        direction={{ initial: "column", md: "row" }}
      >
        
        {/* Filters for small screens  */}
        {/* Child flex-1 */}
        <Flex
          direction={"row-reverse"}
          justify={"center"}
          gap={"2"}
          wrap="wrap"
          display={{ initial: "flex", md: "none" }}
        >
          <OrganismFilter
            results={searchResults}
            selected={selectedOrganism}
            onChangeSelected={setSelectedOrganism}
          />
            
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
        {/* Child flex-2 */}
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
              setTimeFilter(value as "any" | "1" | "5" | "10" | "20" | "custom")
            }
          >
            <RadioGroup.Item value="any">Any time</RadioGroup.Item>
            <RadioGroup.Item value="1">Since last year</RadioGroup.Item>
            <RadioGroup.Item value="5">Since last 5 years</RadioGroup.Item>
            <RadioGroup.Item value="10">Since last 10 years</RadioGroup.Item>
            <RadioGroup.Item value="20">Since last 20 years</RadioGroup.Item>
            <RadioGroup.Item value="custom">Custom range</RadioGroup.Item>
          </RadioGroup.Root>
          {timeFilter === "custom" && (
            <Flex gap="2" align="center">
              <TextField.Root
                type="number"
                min="2000"
                max={new Date().getFullYear()}
                value={customYearRange.from}
                onChange={(e) =>
                  setCustomYearRange((r) => ({ ...r, from: e.target.value }))
                }
                placeholder="YYYY"
                variant="surface"
                size={"2"}
                style={{ width: "3.5rem" }}
              />
              <Text size="2">to</Text>
              <TextField.Root
                type="number"
                min="2000"
                max={new Date().getFullYear()}
                value={customYearRange.to}
                onChange={(e) =>
                  setCustomYearRange((r) => ({ ...r, to: e.target.value }))
                }
                placeholder="YYYY"
                variant="surface"
                style={{ width: "3.5rem" }}
                size={"2"}
              />
            </Flex>
          )}
        </Flex>

          {/* Child Flex-3 : handles middle col */}
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
              <Text color="gray" weight={"light"}>
                Fetched {total} result{total == 1 ? "" : "s"} in{" "}
                {(tookMs / 1000).toFixed(2)} seconds
              </Text>
              
              {organismFilteredResults.length === 0 ? (
                <Flex
                  align="center"
                  justify="center"
                  direction={"column"}
                  height={"12rem"}
                >
                  <Text color="gray" size={"4"} weight={"bold"}>
                    No results match your filters
                  </Text>
                  <Text color="gray" size={"2"}>
                    Try clearing the organism filter or widening the time range.
                  </Text>
                </Flex>
              ) : (
                organismFilteredResults.map((searchResult) => (
                  <ResultCard
                    key={searchResult.accession}
                    accesssion={searchResult.accession}
                    title={searchResult.title}
                    summary={searchResult.summary}
                    updated_at={searchResult.updated_at}
                  />
                ))
              )}

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
                draggable={"false"}
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

        {/* Right-side organism filter (desktop only) */}
          <Flex
            display={{ initial: "none", lg: "flex" }}
            direction="column"
            width="280px"
            position="sticky"
            style={{ top: "7rem", height: "fit-content" }}
          >
            <OrganismFilter
              results={searchResults}
              selected={selectedOrganism}
              onChangeSelected={setSelectedOrganism}
            />
          </Flex>


        {organismFilteredResults.length > 0 && (
          <Flex
            position="fixed"
            direction="column"
            align={"end"}
            gap="2"
            style={{ right: "2rem", bottom: "1.5rem", zIndex: 999 }}
          >
            {showTopButton && (
              <Tooltip content="Go back to top">
                <Button
                  style={{ width: "fit-content", padding: 16 }}
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  <ArrowUpIcon />
                </Button>
              </Tooltip>
            )}
            <Tooltip
              content={
                downloadFailed
                  ? "Download failed. Please try again."
                  : "Download search results as ZIP"
              }
            >
              <Button onClick={handleDownloadResults} disabled={isDownloading}>
                {isDownloading ? <Spinner /> : <DownloadIcon />}
                {isDownloading ? "Preparing ZIP..." : "Download"}
              </Button>
            </Tooltip>
          </Flex>
        )}
      </Flex>
    </>
  );
}
