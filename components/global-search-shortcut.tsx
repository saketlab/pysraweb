"use client";

import { useEffect } from "react";

const SEARCH_SELECTOR = 'input[data-global-search-target="true"]';

function isVisible(element: HTMLElement) {
  return element.getClientRects().length > 0;
}

export default function GlobalSearchShortcut() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!(event.metaKey || event.ctrlKey)) return;

      const candidates = Array.from(
        document.querySelectorAll<HTMLInputElement>(SEARCH_SELECTOR),
      );
      const target = candidates.find((candidate) => {
        return !candidate.disabled && isVisible(candidate);
      });

      if (!target) return;

      event.preventDefault();
      target.focus();
      target.select();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
