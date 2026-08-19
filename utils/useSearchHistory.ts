import { useState } from "react";
import { SERVER_URL } from "./constants";
import {
  isAccessionUrl,
  parseAccessions,
  startsWithAccession,
} from "./accessionLinks";
import { getProjectShortUrl } from "./shortUrl";

const HISTORY_KEY = "searchHistory";
const MAX_HISTORY = 5;
// Modifier-bar params carried over to a new search so it keeps the user's
// sort / time / source selections. (Deep "more filters" facets are not carried
// — a fresh query text resets them.)
const CARRIED_PARAM_KEYS = [
  "db",
  "sort",
  "time",
  "year_from",
  "year_to",
  "expand",
];
// Repeatable, so it needs getAll/append rather than get/set.
const CARRIED_MULTI_PARAM_KEYS = ["exclude_ontology"];

const buildSearchUrl = (query: string, carry?: URLSearchParams | null) => {
  const params = new URLSearchParams();
  params.set("q", query);
  if (carry) {
    for (const key of CARRIED_PARAM_KEYS) {
      const value = carry.get(key);
      if (value) params.set(key, value);
    }
    for (const key of CARRIED_MULTI_PARAM_KEYS) {
      for (const value of carry.getAll(key)) params.append(key, value);
    }
  }
  return `/search?${params.toString()}`;
};

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
    carry?: URLSearchParams | null,
  ) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(
      0,
      MAX_HISTORY,
    );
    saveHistory(newHistory);

    // "<accession> ..." (optionally with a pasted title/notes), or an archive URL
    // with the accession inside it → jump to the first recognized accession
    // instead of full-text search. Any further accessions in the text are ignored.
    if (startsWithAccession(trimmed) || isAccessionUrl(trimmed)) {
      const first = parseAccessions(trimmed)[0];
      if (first) {
        if (first.isPrj) {
          // PRJ* needs a server round-trip to resolve to its GSE/SRP study.
          try {
            const res = await fetch(
              `${SERVER_URL}/prj/${encodeURIComponent(first.raw)}`,
            );
            if (res.status === 500) {
              alert("project not found");
              return;
            }
            if (!res.ok) {
              navigate(buildSearchUrl(trimmed, carry));
              return;
            }
            const data = await res.json();
            const projectAccession =
              typeof data.project_accession === "string" &&
              data.project_accession
                ? data.project_accession
                : first.raw;
            navigate(getProjectShortUrl(projectAccession));
          } catch (error) {
            console.error("Error fetching project:", error);
            navigate(buildSearchUrl(trimmed, carry));
          }
          return;
        }

        if (first.isSubmission) {
          // A submission accession maps to one or many studies. Resolve first so
          // the common single-study case jumps straight to the study; only the
          // rare multi-study submission loads the listing page.
          try {
            const res = await fetch(
              `${SERVER_URL}/submission/${encodeURIComponent(first.raw)}`,
            );
            if (res.ok) {
              const data = await res.json();
              const studies: { accession: string }[] = data.studies ?? [];
              if (studies.length === 1) {
                navigate(getProjectShortUrl(studies[0].accession));
              } else if (studies.length > 1) {
                navigate(first.url);
              } else {
                navigate(buildSearchUrl(trimmed, carry));
              }
              return;
            }
            // 404 (no studies) or any error → full-text search still helps.
            navigate(buildSearchUrl(trimmed, carry));
          } catch (error) {
            console.error("Error resolving submission:", error);
            navigate(buildSearchUrl(trimmed, carry));
          }
          return;
        }

        navigate(first.url);
        return;
      }
    }

    navigate(buildSearchUrl(trimmed, carry));
  };

  return { history, saveHistory, performSearch };
}
