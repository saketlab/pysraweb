"use client";
import GitHubButton from "@/components/github-button";
import SearchHistoryDropdown from "@/components/search-history-dropdown";
import ThemeToggle from "@/components/theme-toggle";
import { useSearchHistory } from "@/utils/useSearchHistory";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Flex, Link, Text, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchBarProps {
  initialQuery?: string | null;
}

export default function SearchBar({ initialQuery }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { history, saveHistory, performSearch } = useSearchHistory();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchQuery, router.push);
  };

  const handleHistoryClick = async (item: string) => {
    setSearchQuery(item);
    setIsFocused(false);
    await performSearch(item, router.push);
  };

  const removeItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistory(history.filter((h) => h !== item));
  };

  // Filter history based on query - only show if query has text
  const trimmedQuery = searchQuery.trim();
  const filteredHistory = trimmedQuery
    ? history
        .filter((h) => {
          const hLower = h.toLowerCase();
          const qLower = trimmedQuery.toLowerCase();
          // include if it contains the query but is not an exact match
          return hLower.includes(qLower) && hLower !== qLower;
        })
        .slice(0, 5)
    : [];

  useEffect(() => {
    if (!isFocused) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(-1);
  }, [isFocused, filteredHistory.length, trimmedQuery]);

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
              onKeyDown={(e) => {
                if (!isFocused || filteredHistory.length === 0) return;

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((prev) => {
                    if (prev === -1) return 0;
                    return (prev + 1) % filteredHistory.length;
                  });
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((prev) => {
                    if (prev === -1) return filteredHistory.length - 1;
                    return (prev - 1 + filteredHistory.length) %
                      filteredHistory.length;
                  });
                } else if (e.key === "Enter") {
                  if (activeIndex >= 0) {
                    e.preventDefault();
                    const item = filteredHistory[activeIndex];
                    void handleHistoryClick(item);
                  }
                } else if (e.key === "Escape") {
                  setIsFocused(false);
                  setActiveIndex(-1);
                }
              }}
              value={searchQuery}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </form>

          <SearchHistoryDropdown
            isVisible={isFocused}
            filteredHistory={filteredHistory}
            onHistoryClick={handleHistoryClick}
            onRemoveItem={removeItem}
            activeItem={
              activeIndex >= 0 ? filteredHistory[activeIndex] : null
            }
            position="absolute"
          />
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
