"use client";

import { OrganismFilter } from "@/components/organism_filter";
import { SearchResult } from "@/utils/types";
import {
  Flex,
  RadioGroup,
  Select,
  Separator,
  Text,
  TextField,
} from "@radix-ui/themes";

type TimeFilter = "any" | "1" | "5" | "10" | "20" | "custom";

type SearchFiltersProps = {
  db: string | null;
  query: string | null;
  setSortBy: (value: "relevance" | "date") => void;
  setTimeFilter: (value: TimeFilter) => void;
  timeFilter: TimeFilter;
  customYearRange: { from: string; to: string };
  setCustomYearRange: (value: { from: string; to: string }) => void;
  onDatabaseChange: (value: "geo" | "sra" | "both") => void;
};

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
            if (!query) return;
            onDatabaseChange(value as "geo" | "sra" | "both");
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
          defaultValue={db ? db : "both"}
          name="dataset"
          onValueChange={(value) => {
            if (!query) return;
            onDatabaseChange(value as "geo" | "sra" | "both");
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
          <RadioGroup.Item value="relevance">Sort by relevance</RadioGroup.Item>
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
  selectedOrganism,
  setSelectedOrganism,
}: {
  results: SearchResult[];
  selectedOrganism: string | null;
  setSelectedOrganism: (value: string | null) => void;
}) {
  return (
    <Flex
      display={{ initial: "none", md: "flex" }}
      direction="column"
      width={{ md: "220px", lg: "280px" }}
      position="sticky"
      style={{ top: "7rem", height: "fit-content" }}
    >
      <OrganismFilter
        results={results}
        selected={selectedOrganism}
        onChangeSelected={setSelectedOrganism}
      />
    </Flex>
  );
}
