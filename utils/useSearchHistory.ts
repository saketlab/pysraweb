import { useState } from "react";
import { SERVER_URL } from "./constants";
import { getProjectShortUrl } from "./shortUrl";

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

  const performSearch = async (
    query: string,
    navigate: (url: string) => void,
  ) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const normalized = trimmed.toUpperCase();

    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(
      0,
      MAX_HISTORY,
    );
    saveHistory(newHistory);

    const isSingleTerm = normalized.split(/\s+/).length === 1;
    const fetchPrefixes = [
      "SRS",
      "SRX",
      "DRS",
      "DRX",
      "ERX",
      "ERS",
      "GSM",
      "PRJ",
    ];

    if (
      isSingleTerm &&
      (normalized.startsWith("GSE") || normalized.startsWith("E-"))
    ) {
      navigate(getProjectShortUrl(normalized));
    } else if (
      isSingleTerm &&
      (normalized.startsWith("SRP") ||
        normalized.startsWith("ERP") ||
        normalized.startsWith("DRP"))
    ) {
      navigate(getProjectShortUrl(normalized));
    } else if (
      isSingleTerm &&
      fetchPrefixes.some((p) => normalized.startsWith(p))
    ) {
      try {
        let url;
        if (normalized.startsWith("PRJ")) {
          url = `${SERVER_URL}/prj/${encodeURIComponent(normalized)}`;
        } else {
          url = `${SERVER_URL}/accession/${encodeURIComponent(normalized)}/project`;
        }
        const res = await fetch(url);
        if (res.status === 500) {
          alert("project not found");
          return;
        }
        if (!res.ok) {
          navigate(`/search?q=${encodeURIComponent(trimmed)}`);
          return;
        }
        const data = await res.json();
        const projectAccession =
          typeof data.project_accession === "string" && data.project_accession
            ? data.project_accession
            : normalized;
        navigate(getProjectShortUrl(projectAccession));
      } catch (error) {
        console.error("Error fetching project:", error);
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return { history, saveHistory, performSearch };
}
