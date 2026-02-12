"use client";

import * as React from "react";
import { Badge, Button, Card, Flex, Text } from "@radix-ui/themes";

type OrganismFacet = { name: string; count: number };

function buildOrganismFacets(results: Array<{ organisms: string[] | null }>): OrganismFacet[] {
  const counts = new Map<string, number>();

  for (const r of results) {
    const orgs = r.organisms ?? [];
    for (const org of orgs) {
      const key = org.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  // Convert to array + sort 
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function FilterList({
  facets,
  selected,
  totalCount,
  onSelect,
  onClear,
}: {
  facets: OrganismFacet[];
  selected: string | null;
  totalCount: number;
  onSelect: (name: string) => void;
  onClear: () => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasMoreThanTop = facets.length > 5;
  const visibleFacets = isExpanded ? facets : facets.slice(0, 5);

  return (
    <Flex direction="column" gap="2">
      {selected ? (
        <Flex justify="end">
          <Button size="1" variant="soft" onClick={onClear}>
            Clear
          </Button>
        </Flex>
      ) : null}

      {/* "All" options */}
      <Button
        variant={selected === null ? "solid" : "soft"}
        color={selected === null ? "blue" : "gray"}
        onClick={onClear}
        style={{ justifyContent: "space-between" }}
      >
        <span>All organisms</span>
        <Badge variant="soft">{totalCount}</Badge>
      </Button>

      {/* Organisms list */}
      <div
        className={isExpanded ? "organism-list-scroll" : undefined}
        style={{ maxHeight: isExpanded ? 360 : undefined, overflowY: isExpanded ? "auto" : "visible" }}
      >
        <Flex direction="column" gap="2">
          {visibleFacets.map((f) => {
            const active = selected === f.name;
            return (
              <Button
                key={f.name}
                variant={active ? "solid" : "soft"}
                color={active ? "blue" : "gray"}
                onClick={() => onSelect(f.name)}
                style={{ justifyContent: "space-between", textAlign: "left" }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name}
                </span>
                <Badge variant={active ? "solid" : "soft"}>{f.count}</Badge>
              </Button>
            );
          })}

          {facets.length === 0 ? (
            <Text size="2" color="gray">
              No organism data available for these results.
            </Text>
          ) : null}
        </Flex>
      </div>

      {hasMoreThanTop ? (
        <Button
          size="1"
          variant="soft"
          color="gray"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "Show less" : `Show ${facets.length - 5} more`}
        </Button>
      ) : null}
      <style jsx>{`
        .organism-list-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .organism-list-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Flex>
  );
}

export function OrganismFilter({
  results,
  selected,
  onChangeSelected,
}: {
  results: Array<{ organisms: string[] | null }>;
  selected: string | null;
  onChangeSelected: (next: string | null) => void;
}) {
  const facets = React.useMemo(() => buildOrganismFacets(results), [results]);

  const totalCount = results.length;

  const onClear = () => onChangeSelected(null);
  const onSelect = (name: string) => onChangeSelected(name);

  return (
    <Card>
      <FilterList
        facets={facets}
        selected={selected}
        totalCount={totalCount}
        onSelect={onSelect}
        onClear={onClear}
      />
    </Card>
  );
}
