"use client";

import { OrganismFilter, OrganismNameMode } from "@/components/organism_filter";
import type { SortBy } from "@/components/search-page-body";
import { SearchResult } from "@/utils/types";
import { Cross2Icon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  RadioGroup,
  Select,
  Separator,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useState } from "react";

type TimeFilter = "any" | "1" | "5" | "10" | "20" | "custom";

type SearchFiltersProps = {
  db: string | null;
  query: string | null;
  setSortBy: (value: SortBy) => void;
  setTimeFilter: (value: TimeFilter) => void;
  timeFilter: TimeFilter;
  customYearRange: { from: string; to: string };
  setCustomYearRange: (value: { from: string; to: string }) => void;
  onDatabaseChange: (value: "geo" | "sra" | "arrayexpress" | "both") => void;
};

function AppliedCountBadge({
  count,
  label,
  onClear,
}: {
  count: number;
  label: string;
  onClear: () => void;
}) {
  return (
    <Badge>
      <Flex align="center" gap="1">
        <span>{count}</span>
        <Tooltip content="Clear filters">
          <button
            type="button"
            aria-label={`Clear ${label} filters`}
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "inherit",
              padding: 0,
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Cross2Icon />
          </button>
        </Tooltip>
      </Flex>
    </Badge>
  );
}

export function SearchFilters({
  db,
  query,
  setSortBy,
  setTimeFilter,
  timeFilter,
  customYearRange,
  setCustomYearRange,
  onDatabaseChange,
}: SearchFiltersProps) {
  return (
    <>
      <Flex
        direction={"row-reverse"}
        justify={"center"}
        gap={"2"}
        wrap="wrap"
        display={{ initial: "flex", md: "none" }}
      >
        <Select.Root
          defaultValue="relevance"
          name="sort"
          onValueChange={(value) => setSortBy(value as SortBy)}
          size={"1"}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Group>
              <Select.Item value="relevance">Sort by relevance</Select.Item>
              <Select.Item value="date">Sort by date</Select.Item>
              <Select.Item value="citations">Sort by citations</Select.Item>
              <Select.Item value="journal">Sort by journal</Select.Item>
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
            if (!query) return;
            onDatabaseChange(value as "geo" | "sra" | "arrayexpress" | "both");
          }}
          size={"1"}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Group>
              <Select.Item value="geo">Only GEO</Select.Item>
              <Select.Item value="sra">Only SRA</Select.Item>
              <Select.Item value="arrayexpress">Only ArrayExpress</Select.Item>
              <Select.Item value="both">From all sources</Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Flex
        direction={"column"}
        gap={"4"}
        display={{ initial: "none", md: "flex" }}
        position={"sticky"}
        style={{ top: "9rem" }}
        height={"fit-content"}
      >
        <RadioGroup.Root
          defaultValue={db ? db : "both"}
          name="dataset"
          onValueChange={(value) => {
            if (!query) return;
            onDatabaseChange(value as "geo" | "sra" | "arrayexpress" | "both");
          }}
        >
          <RadioGroup.Item value="geo">Only GEO</RadioGroup.Item>
          <RadioGroup.Item value="sra">Only SRA</RadioGroup.Item>
          <RadioGroup.Item value="arrayexpress">
            Only ArrayExpress
          </RadioGroup.Item>
          <RadioGroup.Item value="both">From all sources</RadioGroup.Item>
        </RadioGroup.Root>

        <Separator orientation={"horizontal"} size={"4"} />

        <RadioGroup.Root
          defaultValue="relevance"
          name="sort"
          onValueChange={(value) => setSortBy(value as SortBy)}
        >
          <RadioGroup.Item value="relevance">Sort by relevance</RadioGroup.Item>
          <RadioGroup.Item value="date">Sort by date</RadioGroup.Item>
          <RadioGroup.Item value="citations">Sort by citations</RadioGroup.Item>
          <RadioGroup.Item value="journal">Sort by journal</RadioGroup.Item>
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
                setCustomYearRange({ ...customYearRange, from: e.target.value })
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
                setCustomYearRange({ ...customYearRange, to: e.target.value })
              }
              placeholder="YYYY"
              variant="surface"
              style={{ width: "3.5rem" }}
              size={"2"}
            />
          </Flex>
        )}
      </Flex>
    </>
  );
}

export function SearchOrganismRail({
  results,
  journalResults,
  organismNameMode,
  setOrganismNameMode,
  selectedOrganismKey,
  setSelectedOrganismFilter,
  selectedJournalFilters,
  setSelectedJournalFilters,
}: {
  results: SearchResult[];
  journalResults: SearchResult[];
  organismNameMode: OrganismNameMode;
  setOrganismNameMode: (value: OrganismNameMode) => void;
  selectedOrganismKey: string | null;
  setSelectedOrganismFilter: (value: string | null) => void;
  selectedJournalFilters: string[];
  setSelectedJournalFilters: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [journalQuery, setJournalQuery] = useState("");

  const journalCounts = new Map<string, number>();
  for (const result of journalResults) {
    const journal = result.journal?.trim();
    if (!journal) continue;
    journalCounts.set(journal, (journalCounts.get(journal) ?? 0) + 1);
  }

  const journalOptions = Array.from(journalCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const normalizedJournalQuery = journalQuery.trim().toLowerCase();
  const visibleJournalOptions = normalizedJournalQuery
    ? journalOptions.filter((option) =>
        option.name.toLowerCase().includes(normalizedJournalQuery),
      )
    : journalOptions;

  const toggleJournalSelection = (journal: string) => {
    if (selectedJournalFilters.includes(journal)) {
      setSelectedJournalFilters(
        selectedJournalFilters.filter((item) => item !== journal),
      );
      return;
    }
    setSelectedJournalFilters([...selectedJournalFilters, journal]);
  };

  return (
    <Flex
      display={{ initial: "none", md: "flex" }}
      direction="column"
      gap="2"
      width={{ md: "220px", lg: "280px" }}
      position="sticky"
      style={{ top: "7rem", height: "fit-content" }}
    >
      <OrganismFilter
        results={results}
        mode={organismNameMode}
        onChangeMode={setOrganismNameMode}
        selectedKey={selectedOrganismKey}
        onChangeSelection={setSelectedOrganismFilter}
      />
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger>
          <Button variant="surface">
            <MixerHorizontalIcon />
            More filters
            {selectedJournalFilters.length > 0 ? (
              <Badge color="blue">{selectedJournalFilters.length}</Badge>
            ) : null}
          </Button>
        </Dialog.Trigger>
        <Dialog.Content size="3">
          <Dialog.Title>More filters</Dialog.Title>
          <Dialog.Description>
            Filters apply only to loaded results. Scroll to load more. Selecting
            a filter also has the effect of fetching more results.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <Card variant="surface" style={{ marginTop: "0.5rem" }}>
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between" px="2">
                  <Text size="3" style={{ fontSize: 14, lineHeight: "20px" }}>
                    Journals
                  </Text>
                  {selectedJournalFilters.length > 0 ? (
                    <AppliedCountBadge
                      count={selectedJournalFilters.length}
                      label="journal"
                      onClear={() => setSelectedJournalFilters([])}
                    />
                  ) : null}
                </Flex>
                <TextField.Root
                  value={journalQuery}
                  onChange={(event) => setJournalQuery(event.target.value)}
                  placeholder="Search journals"
                  size="2"
                />
                {visibleJournalOptions.length > 0 ? (
                  <Flex
                    direction="column"
                    gap="2"
                    style={{ maxHeight: "16rem", overflowY: "auto" }}
                  >
                    {visibleJournalOptions.map((journalOption) => (
                      <Text as="label" size="2" key={journalOption.name}>
                        <Flex align="center" justify="between" gap="2">
                          <Flex align="center" gap="2">
                            <Checkbox
                              checked={selectedJournalFilters.includes(
                                journalOption.name,
                              )}
                              onCheckedChange={() =>
                                toggleJournalSelection(journalOption.name)
                              }
                            />
                            <span>{journalOption.name}</span>
                          </Flex>
                          <Badge color="gray" variant="soft">
                            {journalOption.count}
                          </Badge>
                        </Flex>
                      </Text>
                    ))}
                  </Flex>
                ) : (
                  <Text size="2" color="gray">
                    No journals found.
                  </Text>
                )}
              </Flex>
            </Card>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
