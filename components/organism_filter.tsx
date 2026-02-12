"use client";

import * as React from "react";
import { Badge, Box, Button, Card, Flex, Popover, ScrollArea, Separator, Text } from "@radix-ui/themes";

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
  return (
    <Flex direction="column" gap="2">
      <Flex align="center" justify="between">
        <Text weight="bold">Organisms</Text>
        {selected ? (
          <Button size="1" variant="soft" onClick={onClear}>
            Clear
          </Button>
        ) : null}
      </Flex>

      <Text size="1" color="gray">
        Click an organism to filter results.
      </Text>

      <Separator size="4" />

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
      <ScrollArea type="always" scrollbars="vertical" style={{ maxHeight: 420 }}>
        <Flex direction="column" gap="2" pr="2">
          {facets.map((f) => {
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
      </ScrollArea>
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
    <>
      {/* Desktop right sidebar */}
      <Box className="hidden lg:block">
        <Card className="sticky top-24">
          <FilterList
            facets={facets}
            selected={selected}
            totalCount={totalCount}
            onSelect={onSelect}
            onClear={onClear}
          />
        </Card>
      </Box>

      {/* Mobile: Popover */}
      <Box className="lg:hidden">
        <Popover.Root>
          <Popover.Trigger>
            <Button variant="soft" style={{ width: "100%" }}>
              Organism filter {selected ? `• ${selected}` : ""}
            </Button>
          </Popover.Trigger>

          <Popover.Content style={{ width: "min(92vw, 420px)" }}>
            <FilterList
              facets={facets}
              selected={selected}
              totalCount={totalCount}
              onSelect={onSelect}
              onClear={onClear}
            />
          </Popover.Content>
        </Popover.Root>
      </Box>
    </>
  );
}
