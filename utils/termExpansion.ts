// Term expansion is on by default. Off means the search runs the words as
// typed, which is the API's `structured` mode (exact terms, no ontology
// synonyms). Two things can say so, and they have different lifetimes: the
// `expand=0` URL param is the current search's override, and localStorage is
// the default the *next* search starts from. The URL always wins where it
// exists, so a shared link searches what its sender saw.
export const EXPANSION_PARAM = "expand";

const STORAGE_KEY = "seqout:term-expansion";

/** Did this search run without expansion? Reads the URL, not the preference. */
export function expansionDisabled(params: {
  get(key: string): string | null;
}): boolean {
  return params.get(EXPANSION_PARAM) === "0";
}

/** The stored default. On (true) unless it was explicitly turned off. */
export function readExpansionPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function writeExpansionPreference(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    // private mode / quota — the toggle still works for this page
  }
}
