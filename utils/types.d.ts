export type SearchResult = {
  accession: string;
  title: string;
  summary: string;
  updated_at: Date;
  source: string;
  rank: number;
};

export type SearchResults = SearchResult[];
