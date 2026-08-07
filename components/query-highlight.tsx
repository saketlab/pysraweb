"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSearchHighlight } from "@/utils/api";

const HIGHLIGHT_NAME = "seqout-query";
const SHOW_MS = 5000;
/** Project pages fetch client-side, so give the text time to arrive. */
const GIVE_UP_MS = 10000;
const MAX_RANGES = 500;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NAV", "FOOTER", "BUTTON"]);

/**
 * Whole-word matcher for the surface forms Postgres reported. It already
 * returned every inflection it matched ("rat" *and* "rats"), so matching inside
 * words is not just unnecessary, it is wrong — that is what lit up "accurate".
 */
export function wordsPattern(words: string[]): RegExp | null {
  const escaped = words
    .filter((w) => w.trim())
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return null;
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${escaped.join("|")})(?![\\p{L}\\p{N}])`,
    "giu",
  );
}

export function findRanges(pattern: RegExp): Range[] {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName))
        return NodeFilter.FILTER_REJECT;
      return node.nodeValue?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const ranges: Range[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    pattern.lastIndex = 0;
    for (const m of node.nodeValue!.matchAll(pattern)) {
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      ranges.push(range);
      if (ranges.length >= MAX_RANGES) return ranges;
    }
  }
  return ranges;
}

/**
 * Briefly highlights the words that made this project a search hit. Reads `q`
 * from the URL, which search results append when they link here, and asks the
 * server which words actually matched.
 */
export default function QueryHighlight() {
  const q = useSearchParams().get("q") ?? "";
  const accession = (useParams().accession as string | undefined) ?? "";

  useEffect(() => {
    // CSS Custom Highlight API: no DOM mutation, so React never fights it.
    if (!q || !accession || typeof CSS === "undefined" || !CSS.highlights) return;

    const abort = new AbortController();
    let poll: ReturnType<typeof setInterval> | undefined;
    let hide: ReturnType<typeof setTimeout> | undefined;

    getSearchHighlight(q, accession, abort.signal)
      .then(({ words }) => {
        const pattern = wordsPattern(words);
        if (!pattern) return;
        const deadline = Date.now() + GIVE_UP_MS;
        poll = setInterval(() => {
          const ranges = findRanges(pattern);
          if (!ranges.length) {
            if (Date.now() > deadline) clearInterval(poll);
            return;
          }
          clearInterval(poll);
          CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges));
          hide = setTimeout(
            () => CSS.highlights.delete(HIGHLIGHT_NAME),
            SHOW_MS,
          );
        }, 300);
      })
      // Highlighting is decoration; a failed lookup just means none.
      .catch(() => {});

    return () => {
      abort.abort();
      clearInterval(poll);
      clearTimeout(hide);
      CSS.highlights.delete(HIGHLIGHT_NAME);
    };
  }, [q, accession]);

  return (
    <style>{`::highlight(${HIGHLIGHT_NAME}) { background-color: var(--amber-a6); color: var(--gray-12); }`}</style>
  );
}
