"use client";
import ResultCard from "@/components/result-card";
import SearchBar from "@/components/search-bar";
import OrganismFilter from "@/components/organism-filter";
import { useSearchQuery } from "@/context/search_query";
import { SERVER_URL } from "@/utils/constants";
import { SearchResult } from "@/utils/types";
import { ArrowUpIcon, DownloadIcon } from "@radix-ui/react-icons";
import {
  Button,
  Dialog,
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
import { useEffect, useMemo, useRef, useState } from "react";

type Cursor = {
  rank: number;
  accession: string;
} | null;

type SearchResponse = {
  results: SearchResult[];
  total: number;
  took_ms: number;
  next_cursor: Cursor;
  facets?: {
    organism?: unknown;
  };
};

const getSearchResults = async (
  query: string | null,
  db: string | null,
  cursor: Cursor,
  organisms: string[],
): Promise<SearchResponse | null> => {
  if (!query) return null;

  const params = new URLSearchParams();
  params.set("q", query);
  if (db === "sra" || db === "geo") params.set("db", db);
  params.append("facets", "organism");
  if (cursor) {
    params.set("cursor_rank", String(cursor.rank));
    params.set("cursor_acc", cursor.accession);
  }
  organisms.forEach((item) => params.append("organism", item));

  const res = await fetch(`${SERVER_URL}/search?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Network Error");
  }
  return res.json();
};

type OrganismItem = {
  name: string;
  count: number;
};

const getOrganismSource = (page: unknown): unknown => {
  if (!page || typeof page !== "object") return null;
  const obj = page as Record<string, unknown>;
  const facets = obj.facets;
  if (facets && typeof facets === "object") {
    const f = facets as Record<string, unknown>;
    if (f.organism) return f.organism;
    if (f.organisms) return f.organisms;
  }
  const facet = obj.facet;
  if (facet && typeof facet === "object") {
    const f = facet as Record<string, unknown>;
    if (f.organism) return f.organism;
    if (f.organisms) return f.organisms;
  }
  const aggs = obj.aggregations;
  if (aggs && typeof aggs === "object") {
    const f = aggs as Record<string, unknown>;
    if (f.organism) return f.organism;
    if (f.organisms) return f.organisms;
  }
  const agg = obj.aggregation;
  if (agg && typeof agg === "object") {
    const f = agg as Record<string, unknown>;
    if (f.organism) return f.organism;
    if (f.organisms) return f.organisms;
  }
  return obj.organisms ?? obj.organism ?? null;
};

const normalizeOrganisms = (input: unknown): OrganismItem[] => {
  const map = new Map<string, number>();
  const add = (name: unknown, count: unknown) => {
    if (typeof name !== "string") return;
    const key = name.trim();
    if (!key) return;
    const num = Number(count);
    const value = Number.isFinite(num) ? num : 0;
    map.set(key, (map.get(key) ?? 0) + value);
  };

  if (Array.isArray(input)) {
    input.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const obj = item as Record<string, unknown>;
      add(obj.name ?? obj.key ?? obj.organism, obj.count ?? obj.doc_count);
    });
  } else if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const buckets = obj.buckets;
    if (Array.isArray(buckets)) {
      buckets.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const bucket = item as Record<string, unknown>;
        add(bucket.key ?? bucket.name, bucket.doc_count ?? bucket.count);
      });
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === "number") {
          add(key, value);
        } else if (value && typeof value === "object") {
          const entry = value as Record<string, unknown>;
          add(key, entry.count ?? entry.doc_count);
        }
      });
    }
  }

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

const normalizeFromResults = (results: SearchResult[]): OrganismItem[] => {
  const map = new Map<string, number>();
  const addValue = (value: unknown) => {
    if (!value) return;
    if (typeof value === "string") {
      const key = value.trim();
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(addValue);
      return;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      addValue(obj.name ?? obj.organism ?? obj.scientific_name);
    }
  };

  results.forEach((item) => {
    const obj = item as Record<string, unknown>;
    addValue(
      obj.organism ??
        obj.organisms ??
        obj.scientific_name ??
        obj.species ??
        obj.taxon_name ??
        obj.organism_name ??
        obj.organismName,
    );
  });

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

const getOrganismValues = (item: SearchResult): string[] => {
  const values: string[] = [];
  const addValue = (value: unknown) => {
    if (!value) return;
    if (typeof value === "string") {
      const key = value.trim();
      if (key) values.push(key);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(addValue);
      return;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      addValue(obj.name ?? obj.organism ?? obj.scientific_name);
    }
  };

  const obj = item as Record<string, unknown>;
  addValue(
    obj.organism ??
      obj.organisms ??
      obj.scientific_name ??
      obj.species ??
      obj.taxon_name ??
      obj.organism_name ??
      obj.organismName,
  );

  return values;
};

export default function SearchPageBody() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const query = mounted ? searchParams.get("q") : null;
  const { setLastSearchQuery } = useSearchQuery();

  useEffect(() => {
    if (query) setLastSearchQuery(query);
  }, [query, setLastSearchQuery]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const db = mounted ? searchParams.get("db") : null;
  const selectedOrganisms = mounted
    ? Array.from(new Set(searchParams.getAll("organism").filter(Boolean)))
    : [];
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");
  const [timeFilter, setTimeFilter] = useState<
    "any" | "1" | "5" | "10" | "20" | "custom"
  >("any");
  const [customYearRange, setCustomYearRange] = useState<{
    from: string;
    to: string;
  }>({ from: "", to: "" });
  const [now, setNow] = useState<Date | null>(null);
  const datasetValue = db === "sra" || db === "geo" ? db : "both";

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["search", query, db, selectedOrganisms.join("|")],
    queryFn: ({ pageParam }) =>
      getSearchResults(query, db, pageParam as Cursor, selectedOrganisms),
    initialPageParam: null as Cursor,
    getNextPageParam: (lastPage) => lastPage?.next_cursor ?? undefined,
    enabled: mounted && !!query,
  });

  const total = data?.pages?.[0]?.total ?? 0;

  const tookMs = data?.pages?.[0]?.took_ms ?? 0;

  const searchResults =
    data?.pages.flatMap((page) => page?.results ?? []) ?? [];

  const organismItems = useMemo(() => {
    const source = getOrganismSource(data?.pages?.[0]);
    const fromFacet = normalizeOrganisms(source);
    if (fromFacet.length > 0) return fromFacet;
    return normalizeFromResults(searchResults);
  }, [data?.pages, searchResults]);

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
  const [organismDialogOpen, setOrganismDialogOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTopButton(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const sortedResults =
    sortBy === "date"
      ? [...searchResults].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
      : searchResults;

  const filteredResults = sortedResults.filter((result) => {
    if (selectedOrganisms.length > 0) {
      const values = getOrganismValues(result).map((v) => v.toLowerCase());
      const matches = selectedOrganisms.some((sel) =>
        values.includes(sel.toLowerCase()),
      );
      if (!matches) return false;
    }
    if (timeFilter === "any") return true;
    if (timeFilter === "custom") {
      const from = parseInt(customYearRange.from);
      const to = parseInt(customYearRange.to);
      if (!from || !to) return true;
      const d = new Date(result.updated_at);
      return d.getFullYear() >= from && d.getFullYear() <= to;
    }
    const years = parseInt(timeFilter);
    if (!now) return true;
    const cutoffDate = new Date(now.getTime());
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years);
    return new Date(result.updated_at) >= cutoffDate;
  });

  const updateSearchParams = (next: URLSearchParams) => {
    const text = next.toString();
    router.push(text ? `/search?${text}` : "/search");
  };

  const handleOrganismChange = (next: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("organism");
    next.forEach((item) => params.append("organism", item));
    updateSearchParams(params);
  };

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
      selectedOrganisms.forEach((item) => params.append("organism", item));

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
      <SearchBar initialQuery={query} />

      <Flex
        gap={{ initial: "4", md: "8" }}
        p={"4"}
        justify={"start"}
        direction={{ initial: "column", md: "row" }}
      >
        <Flex
          direction={"row-reverse"}
          justify={"center"}
          gap={"2"}
          display={{ initial: "flex", md: "none" }}
        >
          <Dialog.Root
            open={organismDialogOpen}
            onOpenChange={setOrganismDialogOpen}
          >
            <Dialog.Trigger>
              <Button variant="soft" size="1">
                Organisms
              </Button>
            </Dialog.Trigger>
            <Dialog.Content size="3">
              <Dialog.Title>Organisms</Dialog.Title>
              <OrganismFilter
                items={organismItems}
                selected={selectedOrganisms}
                onChange={handleOrganismChange}
                loading={isLoading}
              />
            </Dialog.Content>
          </Dialog.Root>
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
            value={datasetValue}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              if (value === "sra" || value === "geo") {
                params.set("db", value);
              } else {
                params.delete("db");
              }
              updateSearchParams(params);
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
        <Flex
          direction={"column"}
          gap={"4"}
          display={{ initial: "none", md: "flex" }}
          position={"sticky"}
          style={{ top: "7rem" }}
          height={"fit-content"}
        >
          <RadioGroup.Root
            value={datasetValue}
            name="dataset"
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              if (value === "sra" || value === "geo") {
                params.set("db", value);
              } else {
                params.delete("db");
              }
              updateSearchParams(params);
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
                max={now ? now.getFullYear() : undefined}
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
                max={now ? now.getFullYear() : undefined}
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

        <Flex
          gap="4"
          direction="column"
          width={{ initial: "100%", md: "auto" }}
          style={{ flex: 1, minWidth: 0 }}
        >
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
              {filteredResults.map((searchResult) => (
                <ResultCard
                  key={searchResult.accession}
                  accesssion={searchResult.accession}
                  title={searchResult.title}
                  summary={searchResult.summary}
                  updated_at={searchResult.updated_at}
                />
              ))}

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
        <Flex
          display={{ initial: "none", md: "flex" }}
          direction="column"
          width="18rem"
          height="fit-content"
          position="sticky"
          style={{ top: "7rem" }}
        >
          <OrganismFilter
            items={organismItems}
            selected={selectedOrganisms}
            onChange={handleOrganismChange}
            loading={isLoading}
          />
        </Flex>

        {filteredResults.length > 0 && (
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
