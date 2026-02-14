"use client";
import { SearchQueryProvider } from "@/context/search_query";
import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import DynamicFavicon from "./dynamic-favicon";

export default function Wrapper({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute={"class"}>
        <DynamicFavicon />
        <SearchQueryProvider>
          <Theme accentColor="indigo">{children}</Theme>
        </SearchQueryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
