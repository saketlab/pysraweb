import { useState } from "react";

const HISTORY_KEY = "searchHistory";
const MAX_HISTORY = 5;

export function useSearchHistory() {
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

  const saveHistory = (newHistory: string[]) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const performSearch = (query: string, navigate: (url: string) => void) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(
      0,
      MAX_HISTORY,
    );
    saveHistory(newHistory);

    const isSingleTerm = trimmed.split(/\s+/).length === 1;

    if (isSingleTerm && trimmed.startsWith("GSE")) {
      navigate(`/project/geo/${encodeURIComponent(trimmed)}`);
    } else if (
      isSingleTerm &&
      (trimmed.startsWith("SRP") ||
        trimmed.startsWith("ERP") ||
        trimmed.startsWith("DRP"))
    ) {
      navigate(`/project/sra/${encodeURIComponent(trimmed)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return { history, saveHistory, performSearch };
}
