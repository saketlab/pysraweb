"use client";

import {createContext,useContext,useState,ReactNode} from "react";

type SearchQueryContextValue = {
  lastSearchQuery: string;
  setLastSearchQuery: (q: string) => void;
};

const SearchQueryContext = createContext<SearchQueryContextValue>({
  lastSearchQuery: "",
  setLastSearchQuery: () => {},
});

export function SearchQueryProvider({ children }: { children: ReactNode }) {
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  return (
    <SearchQueryContext.Provider value={{ lastSearchQuery, setLastSearchQuery }}>
      {children}
    </SearchQueryContext.Provider>
  );
}

export function useSearchQuery() {
  return useContext(SearchQueryContext);
}
