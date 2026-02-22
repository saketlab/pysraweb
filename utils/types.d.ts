export type SearchResult = {
  accession: string;
  title: string;
  summary: string;
  updated_at: string;
  organisms: string[] | null;
  source: string;
  rank: number;
  pmid: string | null;
  publication_title: string | null;
  journal: string | null;
  doi: string | null;
  citation_count: number | null;
  publications: unknown[] | null;
};

export type SearchResults = SearchResult[];
