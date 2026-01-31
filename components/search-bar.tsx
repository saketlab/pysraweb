"use client";
import GitHubButton from "@/components/github-button";
import ThemeToggle from "@/components/theme-toggle";
import {
  CountdownTimerIcon,
  Cross1Icon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Card,
  Flex,
  Link,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface SearchBarProps {
  initialQuery?: string | null;
}

const HISTORY_KEY = "searchHistory";
const MAX_HISTORY = 5;

export default function SearchBar({ initialQuery }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
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

  const performSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(
      0,
      MAX_HISTORY,
    );
    saveHistory(newHistory);

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleHistoryClick = (item: string) => {
    setSearchQuery(item);
    setIsFocused(false);
    performSearch(item);
  };

  const removeItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((h) => h !== item);
    saveHistory(newHistory);
  };

  // Filter history based on query - only show if query has text
  const filteredHistory = searchQuery.trim()
    ? history
        .filter((h) =>
          h.toLowerCase().includes(searchQuery.trim().toLowerCase()),
        )
        .slice(0, MAX_HISTORY)
    : [];

  return (
    <Flex
      justify={{ initial: "center", md: "between" }}
      align="center"
      p={{ initial: "0", md: "3" }}
      pb={"3"}
      gap={"4"}
      style={{
        position: "sticky",
        top: 0,
        width: "100%",
        zIndex: 50,
        boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
        backgroundColor: "inherit",
      }}
    >
      <Flex
        gap={"4"}
        align={"center"}
        flexGrow={"1"}
        direction={{ initial: "column", md: "row" }}
        pt={"2"}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Box width={{ initial: "6rem", md: "11rem" }}>
            <Text
              color="gray"
              size={{ initial: "5", md: "8" }}
              weight={"bold"}
              style={{ fontFamily: "monospace" }}
              align={"center"}
            >
              pysraweb
            </Text>
          </Box>
        </Link>

        <Box
          width={{ initial: "90%", md: "70%" }}
          style={{ position: "relative" }}
        >
          <form onSubmit={handleSubmit}>
            <TextField.Root
              size={"3"}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              value={searchQuery}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </form>

          {isFocused && filteredHistory.length > 0 && (
            <Box
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 100,
              }}
            >
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
            </Box>
          )}
        </Box>
      </Flex>
      <Flex
        gap={"3"}
        align={"center"}
        display={{ initial: "none", md: "flex" }}
      >
        <ThemeToggle />
        <GitHubButton />
      </Flex>
    </Flex>
  );
}
