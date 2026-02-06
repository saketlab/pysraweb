"use client";

import {
  Badge,
  Button,
  Card,
  CheckboxGroup,
  Flex,
  ScrollArea,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useMemo, useState } from "react";

type OrganismItem = {
  name: string;
  count: number;
};

type OrganismFilterProps = {
  items: OrganismItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  loading: boolean;
};

const DEFAULT_LIMIT = 12;

export default function OrganismFilter({
  items,
  selected,
  onChange,
  loading,
}: OrganismFilterProps) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  const visible = showAll ? filtered : filtered.slice(0, DEFAULT_LIMIT);
  const hasMore = filtered.length > DEFAULT_LIMIT;

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between" gap="2">
          <Text weight="medium">Top organisms</Text>
          {selected.length > 0 && (
            <Button variant="ghost" size="1" onClick={() => onChange([])}>
              Clear
            </Button>
          )}
        </Flex>
        <TextField.Root
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search organism"
          size="2"
        />
        {loading && (
          <Text size="2" color="gray">
            Loading organisms
          </Text>
        )}
        {!loading && filtered.length === 0 && (
          <Text size="2" color="gray">
            No organisms found
          </Text>
        )}
        {!loading && filtered.length > 0 && (
          <ScrollArea type="always" scrollbars="vertical">
            <CheckboxGroup.Root value={selected} onValueChange={onChange}>
              <Flex direction="column" gap="2" style={{ maxHeight: 360 }}>
                {visible.map((item) => (
                  <CheckboxGroup.Item key={item.name} value={item.name}>
                    <Flex align="center" justify="between" width="100%">
                      <Text size="2">{item.name}</Text>
                      <Badge size="1" color="gray">
                        {item.count}
                      </Badge>
                    </Flex>
                  </CheckboxGroup.Item>
                ))}
              </Flex>
            </CheckboxGroup.Root>
          </ScrollArea>
        )}
        {hasMore && (
          <Button
            variant="soft"
            size="1"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show less" : "Show more"}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
