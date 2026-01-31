"use client";
import {
  CountdownTimerIcon,
  Cross1Icon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, Text, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

const HISTORY_KEY = "searchHistory";
const MAX_HISTORY = 5;

export default function HeroSearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse search history", e);
          return [];
        }
      }
    }
    return [];
  });
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const saveHistory = (newHistory: string[]) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const performSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(
      0,
      MAX_HISTORY,
    );
    saveHistory(newHistory);

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleHistoryClick = (item: string) => {
    setQuery(item);
    setIsFocused(false);
    performSearch(item);
  };

  const removeItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((h) => h !== item);
    saveHistory(newHistory);
  };

  // Filter history based on query - only show if query has text
  const filteredHistory = query.trim()
    ? history
        .filter((h) => h.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, MAX_HISTORY)
    : [];

  return (
    <Box width={{ initial: "85%", md: "50%" }}>
      <Flex direction={"column"} gap={"4"}>
        <form onSubmit={handleSubmit}>
          <TextField.Root
            aria-label="main search bar"
            size="3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>
        </form>
      </Flex>
      {isFocused && filteredHistory.length > 0 && (
        <Flex style={{ width: "100%" }}>
          <Card
            ref={dropdownRef}
            style={{ width: "100%" }}
            onMouseDown={(e) => {
              // Prevent blur when clicking inside dropdown
              e.preventDefault();
            }}
          >
            <Flex direction={"column"} gap={"2"}>
              {filteredHistory.map((item) => (
                <div key={item}>
                  <Flex
                    align={"center"}
                    justify={"between"}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleHistoryClick(item)}
                  >
                    <Flex align={"center"} gap={"2"}>
                      <CountdownTimerIcon color="gray" />
                      <Text color="gray">{item}</Text>
                    </Flex>
                    <Button
                      variant="ghost"
                      onClick={(e) => removeItem(item, e)}
                    >
                      <Cross1Icon color="gray" />
                    </Button>
                  </Flex>
                </div>
              ))}
            </Flex>
          </Card>
        </Flex>
      )}
    </Box>
  );
}
