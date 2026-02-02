"use client";
import SearchHistoryDropdown from "@/components/search-history-dropdown";
import { useSearchHistory } from "@/utils/useSearchHistory";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Flex, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function HeroSearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { history, saveHistory, performSearch } = useSearchHistory();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await performSearch(query, router.push);
  };

  const handleHistoryClick = async (item: string) => {
    setQuery(item);
    setIsFocused(false);
    await performSearch(item, router.push);
  };

  const removeItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistory(history.filter((h) => h !== item));
  };

  // Filter history based on query - only show if query has text
  const trimmedQuery = query.trim();
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
      <SearchHistoryDropdown
        isVisible={isFocused}
        filteredHistory={filteredHistory}
        onHistoryClick={handleHistoryClick}
        onRemoveItem={removeItem}
        position="relative"
      />
    </Box>
  );
}
