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

/**
 * The eight ontologies whose synonyms feed query expansion. Mirrors
 * `expansions.ONTOLOGIES` on the server, which mirrors
 * `ontology-scripts/GRAPH.md` — the ingest set changes about never, and the
 * server ignores ids it doesn't know, so a drift here is inert rather than
 * broken.
 */
export const ONTOLOGIES: readonly {
  id: string;
  label: string;
  description: string;
}[] = [
  {
    id: "MONDO",
    label: "Diseases (MONDO)",
    description: "Human diseases and disease-related conditions.",
  },
  {
    id: "MeSH",
    label: "MeSH",
    description: "Biomedical and health-related concepts.",
  },
  {
    id: "HGNC",
    label: "Genes (HGNC)",
    description: "Human genes and gene names.",
  },
  {
    id: "CHEBI",
    label: "Chemicals (ChEBI)",
    description: "Biologically relevant chemical entities.",
  },
  {
    id: "UBERON",
    label: "Anatomy (Uberon)",
    description: "Anatomical structures across species.",
  },
  {
    id: "CL",
    label: "Cell types (CL)",
    description: "Cell types and their relationships.",
  },
  {
    id: "EFO",
    label: "Experimental factors (EFO)",
    description: "Experimental variables and conditions.",
  },
  {
    id: "CVCL",
    label: "Cell lines (Cellosaurus)",
    description: "Biological cell lines and their properties.",
  },
] as const;

/** Same name the API takes, so the page URL copies straight into the request. */
export const ONTOLOGY_PARAM = "exclude_ontology";

const ONTOLOGY_STORAGE_KEY = "seqout:disabled-ontologies";
const KNOWN = new Set(ONTOLOGIES.map((o) => o.id));

function clean(ids: Iterable<string>): string[] {
  return [...new Set([...ids].filter((id) => KNOWN.has(id)))];
}

/** Ontologies this search had switched off. */
export function disabledOntologies(params: {
  getAll(key: string): string[];
}): string[] {
  return clean(params.getAll(ONTOLOGY_PARAM));
}

export function readDisabledOntologies(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ONTOLOGY_STORAGE_KEY);
    return raw ? clean(JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeDisabledOntologies(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ONTOLOGY_STORAGE_KEY,
      JSON.stringify(clean(ids)),
    );
  } catch {
    // private mode / quota — the dialog still works for this page
  }
}

/** Order-insensitive, so reordering the URL doesn't read as a pending change. */
export function sameOntologies(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join();
}

/**
 * What a search URL that says nothing about expansion should inherit from this
 * browser's stored default, or null when it should be left alone. A URL naming
 * either param is explicit — a shared link searches what its sender saw.
 */
export function inheritedSettings(params: {
  has(key: string): boolean;
}): { off: boolean; disabled: string[] } | null {
  if (params.has(EXPANSION_PARAM) || params.has(ONTOLOGY_PARAM)) return null;
  const off = !readExpansionPreference();
  const disabled = readDisabledOntologies();
  return off || disabled.length ? { off, disabled } : null;
}
