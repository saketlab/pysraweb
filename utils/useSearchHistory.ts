import { useState } from "react";
import { SERVER_URL } from "./constants";

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

    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(
      0,
      MAX_HISTORY,
    );
    saveHistory(newHistory);

    const isSingleTerm = trimmed.split(/\s+/).length === 1;
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

    if (isSingleTerm && trimmed.startsWith("GSE")) {
      navigate(`/project/geo/${encodeURIComponent(trimmed)}`);
    } else if (
      isSingleTerm &&
      (trimmed.startsWith("SRP") ||
        trimmed.startsWith("ERP") ||
        trimmed.startsWith("DRP"))
    ) {
      navigate(`/project/sra/${encodeURIComponent(trimmed)}`);
    } else if (
      isSingleTerm &&
      fetchPrefixes.some((p) => trimmed.startsWith(p))
    ) {
      try {
        let url;
        if (trimmed.startsWith("PRJ")) {
          url = `${SERVER_URL}/prj/${encodeURIComponent(trimmed)}`;
        } else {
          url = `${SERVER_URL}/accession/${encodeURIComponent(trimmed)}/project`;
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
        const projectAccession = data.project_accession;
        if (projectAccession.startsWith("GSE")) {
          navigate(`/project/geo/${encodeURIComponent(projectAccession)}`);
        } else if (
          projectAccession.startsWith("SRP") ||
          projectAccession.startsWith("ERP") ||
          projectAccession.startsWith("DRP")
        ) {
          navigate(`/project/sra/${encodeURIComponent(projectAccession)}`);
        } else {
          navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        }
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
