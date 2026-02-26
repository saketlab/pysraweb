"use client";
import { OrganismNameMode } from "@/components/organism_filter";
import ResultCard from "@/components/result-card";
import SearchBar from "@/components/search-bar";
import { SearchFilters, SearchOrganismRail } from "@/components/search-filters";
import { useSearchQuery } from "@/context/search_query";
import { SERVER_URL } from "@/utils/constants";
import { SearchResult } from "@/utils/types";
import { ArrowUpIcon, DownloadIcon } from "@radix-ui/react-icons";
import {
  Button,
  Flex,
  Skeleton,
  Spinner,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type SortBy = "relevance" | "date" | "citations" | "journal";

type RelevanceCursor = { rank: number; accession: string };
type SortedCursor = { sort_value: string | number; accession: string };
type Cursor = RelevanceCursor | SortedCursor | null;

type SearchResponse = {
  results: SearchResult[];
  total: number;
  took_ms: number;
  next_cursor: Cursor;
};

const SORT_CONFIG: Record<
  Exclude<SortBy, "relevance">,
  { param: string; order: string }
> = {
  date: { param: "year", order: "desc" },
  citations: { param: "citations", order: "desc" },
  journal: { param: "journal", order: "asc" },
};

const getSearchResults = async (
  query: string | null,
  db: string | null,
  cursor: Cursor,
  sortBy: SortBy,
): Promise<SearchResponse | null> => {
  if (!query) return null;

  let url = `${SERVER_URL}/search?q=${encodeURIComponent(query)}`;
  if (db === "sra" || db === "geo" || db === "arrayexpress") {
    url += `&db=${encodeURIComponent(db)}`;
  }

  if (sortBy !== "relevance") {
    const config = SORT_CONFIG[sortBy];
    url += `&sortby=${config.param}&order=${config.order}`;
    if (cursor && "sort_value" in cursor) {
      url += `&cursor_sort=${encodeURIComponent(String(cursor.sort_value))}&cursor_acc=${encodeURIComponent(cursor.accession)}`;
    }
  } else if (cursor && "rank" in cursor) {
    url += `&cursor_rank=${cursor.rank}&cursor_acc=${encodeURIComponent(cursor.accession)}`;
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
  const db = searchParams.get("db");
  const { setLastSearchQuery } = useSearchQuery();

  useEffect(() => {
    if (query) setLastSearchQuery(query);
  }, [query, setLastSearchQuery]);

  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [timeFilter, setTimeFilter] = useState<
    "any" | "1" | "5" | "10" | "20" | "custom"
  >("any");
  const [customYearRange, setCustomYearRange] = useState<{
    from: string;
    to: string;
  }>({ from: "", to: "" });

  const [organismNameMode, setOrganismNameMode] =
    useState<OrganismNameMode>("common");
  const [selectedOrganismKey, setSelectedOrganismKey] = useState<string | null>(
    null,
  );
  const [selectedJournalFilters, setSelectedJournalFilters] = useState<
    string[]
  >([]);
  const [selectedCountryFilters, setSelectedCountryFilters] = useState<
    string[]
  >([]);
  const [selectedLibraryStrategyFilters, setSelectedLibraryStrategyFilters] =
    useState<string[]>([]);
  const [selectedInstrumentModelFilters, setSelectedInstrumentModelFilters] =
    useState<string[]>([]);

  useEffect(() => {
    setSelectedJournalFilters([]);
    setSelectedCountryFilters([]);
    setSelectedLibraryStrategyFilters([]);
    setSelectedInstrumentModelFilters([]);
  }, [query, db]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["search", query, db, sortBy],
    queryFn: ({ pageParam }) =>
      getSearchResults(query, db, pageParam as Cursor, sortBy),
    initialPageParam: null as Cursor,
    getNextPageParam: (lastPage) => lastPage?.next_cursor ?? undefined,
    enabled: !!query,
  });

  const total = data?.pages?.[0]?.total ?? 0;
  const tookMs = data?.pages?.[0]?.took_ms ?? 0;

  // Flatten all pages into a single array of results
  const flattenedResults =
    data?.pages.flatMap((page) => page?.results ?? []) ?? [];
  const seenResultIds = new Set<string>();
  const searchResults = flattenedResults.filter((result) => {
    const resultId = `${result.source}:${result.accession}`;
    if (seenResultIds.has(resultId)) return false;
    seenResultIds.add(resultId);
    return true;
  });

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

  const shouldShowOrganismRail =
    !isLoading && !isError && searchResults.length > 0;
  const shouldReserveRailSpace =
    isLoading || (!!query && (isError || searchResults.length === 0));

  useEffect(() => {
    const onScroll = () => {
      setShowTopButton(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const timeFilteredResults = searchResults.filter((result) => {
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

  const organismFilteredResults = selectedOrganismKey
    ? timeFilteredResults.filter((result) =>
        (result.organisms ?? []).includes(selectedOrganismKey),
      )
    : timeFilteredResults;

  const journalFilteredResults =
    selectedJournalFilters.length > 0
      ? organismFilteredResults.filter((result) => {
          const journal = result.journal?.trim();
          return journal ? selectedJournalFilters.includes(journal) : false;
        })
      : organismFilteredResults;

  const countryFilteredResults =
    selectedCountryFilters.length > 0
      ? journalFilteredResults.filter((result) => {
          const countries = (result.countries ?? []).map((country) =>
            country.trim().toUpperCase(),
          );
          return countries.some((country) =>
            selectedCountryFilters.includes(country),
          );
        })
      : journalFilteredResults;

  const libraryStrategyFilteredResults =
    selectedLibraryStrategyFilters.length > 0
      ? countryFilteredResults.filter((result) => {
          const strategies = (result.library_strategies ?? []).map((strategy) =>
            strategy.trim(),
          );
          return strategies.some((strategy) =>
            selectedLibraryStrategyFilters.includes(strategy),
          );
        })
      : countryFilteredResults;

  const instrumentModelFilteredResults =
    selectedInstrumentModelFilters.length > 0
      ? libraryStrategyFilteredResults.filter((result) => {
          const instrumentModels = (result.instrument_models ?? []).map((model) =>
            model.trim(),
          );
          return instrumentModels.some((model) =>
            selectedInstrumentModelFilters.includes(model),
          );
        })
      : libraryStrategyFilteredResults;

  const handleDownloadResults = async () => {
    if (isDownloading || !query) return;

    setIsDownloading(true);
    setDownloadFailed(false);

    try {
      const params = new URLSearchParams();
      params.set("q", query);
      if (db === "sra" || db === "geo" || db === "arrayexpress") {
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

  const handleDatabaseChange = (
    value: "geo" | "sra" | "arrayexpress" | "both",
  ) => {
    if (!query) return;

    let url = `/search?q=${encodeURIComponent(query)}`;
    if (value === "sra" || value === "geo" || value === "arrayexpress") {
      url += `&db=${encodeURIComponent(value)}`;
    }

    router.push(url);
  };

  return (
    <>
      {/* Navbar and search */}
      <SearchBar initialQuery={query} />

      {/* Search results and filters */}
      {/* Parent Flex */}
      <Flex
        gap={"4"}
        p={"4"}
        justify={{ initial: "start", md: "between" }}
        direction={{ initial: "column", md: "row" }}
      >
        <SearchFilters
          db={db}
          query={query}
          setSortBy={setSortBy}
          setTimeFilter={setTimeFilter}
          timeFilter={timeFilter}
          customYearRange={customYearRange}
          setCustomYearRange={setCustomYearRange}
          onDatabaseChange={handleDatabaseChange}
        />
        {shouldShowOrganismRail ? (
          <SearchOrganismRail
            results={searchResults}
            journalResults={organismFilteredResults}
            countryResults={organismFilteredResults}
            libraryStrategyResults={organismFilteredResults}
            instrumentModelResults={organismFilteredResults}
            organismNameMode={organismNameMode}
            setOrganismNameMode={setOrganismNameMode}
            selectedOrganismKey={selectedOrganismKey}
            setSelectedOrganismFilter={setSelectedOrganismKey}
            selectedJournalFilters={selectedJournalFilters}
            setSelectedJournalFilters={setSelectedJournalFilters}
            selectedCountryFilters={selectedCountryFilters}
            setSelectedCountryFilters={setSelectedCountryFilters}
            selectedLibraryStrategyFilters={selectedLibraryStrategyFilters}
            setSelectedLibraryStrategyFilters={setSelectedLibraryStrategyFilters}
            selectedInstrumentModelFilters={selectedInstrumentModelFilters}
            setSelectedInstrumentModelFilters={setSelectedInstrumentModelFilters}
            showMobile
            showDesktop={false}
          />
        ) : null}

        {/* Child Flex-3 : handles middle col */}
        <Flex
          gap="4"
          direction="column"
          width={{ initial: "100%", md: "58%", lg: "65%", xl: "73%" }}
        >
          {!query ? (
            <Text>Start by typing a search query above.</Text>
          ) : isLoading ? (
            <>
              <Flex gap="2" align="center">
                <Spinner size="1" />
                <Text color="gray" weight="light">
                  Fetching results...
                </Text>
              </Flex>
              <Skeleton width={"100%"} height={"6rem"} />
              <Skeleton width={"100%"} height={"6rem"} />
              <Skeleton width={"100%"} height={"6rem"} />
              <Skeleton width={"100%"} height={"6rem"} />
              <Skeleton width={"100%"} height={"6rem"} />
            </>
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
              {instrumentModelFilteredResults.length === 0 ? (
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
                    Try clearing active filters or widening the time range.
                  </Text>
                </Flex>
              ) : (
                instrumentModelFilteredResults.map((searchResult) => (
                  <ResultCard
                    key={`${searchResult.source}:${searchResult.accession}`}
                    accesssion={searchResult.accession}
                    title={searchResult.title}
                    summary={searchResult.summary}
                    updated_at={searchResult.updated_at}
                    journal={searchResult.journal}
                    doi={searchResult.doi}
                    citation_count={searchResult.citation_count}
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

        {shouldReserveRailSpace ? (
          <Flex
            display={{ initial: "none", md: "flex" }}
            direction="column"
            width={{ md: "220px", lg: "280px" }}
          />
        ) : shouldShowOrganismRail ? (
          <SearchOrganismRail
            results={searchResults}
            journalResults={organismFilteredResults}
            countryResults={organismFilteredResults}
            libraryStrategyResults={organismFilteredResults}
            instrumentModelResults={organismFilteredResults}
            organismNameMode={organismNameMode}
            setOrganismNameMode={setOrganismNameMode}
            selectedOrganismKey={selectedOrganismKey}
            setSelectedOrganismFilter={setSelectedOrganismKey}
            selectedJournalFilters={selectedJournalFilters}
            setSelectedJournalFilters={setSelectedJournalFilters}
            selectedCountryFilters={selectedCountryFilters}
            setSelectedCountryFilters={setSelectedCountryFilters}
            selectedLibraryStrategyFilters={selectedLibraryStrategyFilters}
            setSelectedLibraryStrategyFilters={setSelectedLibraryStrategyFilters}
            selectedInstrumentModelFilters={selectedInstrumentModelFilters}
            setSelectedInstrumentModelFilters={setSelectedInstrumentModelFilters}
            showMobile={false}
            showDesktop
          />
        ) : null}

        {instrumentModelFilteredResults.length > 0 && (
          <Flex
            position="fixed"
            direction="column"
            align={"end"}
            gap="2"
            style={{ right: "1rem", bottom: "1rem", zIndex: 999 }}
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
