"use client";

// Navbar button (next to the search box, only once a search has run) that opens
// the synonym network for the current query: which synonyms the search actually
// used, per term. Fetched only when the dialog is opened.

import { getSearchExpansion } from "@/utils/api";
import {
  Card,
  Dialog,
  Flex,
  IconButton,
  Link,
  Select,
  Spinner,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";

// lucide "waypoints"
function WaypointsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="4.5" r="2.5" />
      <path d="m10.2 6.3-3.9 3.9" />
      <circle cx="4.5" cy="12" r="2.5" />
      <path d="M7 12h10" />
      <circle cx="19.5" cy="12" r="2.5" />
      <path d="m13.8 17.7 3.9-3.9" />
      <circle cx="12" cy="19.5" r="2.5" />
    </svg>
  );
}

// client-only: React Flow touches the DOM and has no business rendering on the server
const ExpansionGraph = dynamic(() => import("@/components/expansion-graph"), {
  ssr: false,
});

export default function ExpansionSection({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["search-expansion", query],
    queryFn: ({ signal }) => getSearchExpansion(query, signal),
    enabled: open && query.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Only terms that kept at least one synonym have a graph to draw.
  const chunks = (data?.chunks ?? []).filter((c) => c.synonyms.length > 0);
  // Default to the first term; fall back to it if the selection isn't in the
  // (possibly refreshed) list. Derived, so no reset-in-effect needed.
  const active =
    chunks.find((c) => c.term === selectedTerm) ?? chunks[0] ?? null;

  if (!query.trim()) return null;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Tooltip content="Term expansions used for this search">
        <Dialog.Trigger>
          <IconButton
            variant="outline"
            color="gray"
            size="3"
            aria-label="Term expansions used for this search"
          >
            <WaypointsIcon />
          </IconButton>
        </Dialog.Trigger>
      </Tooltip>
      <Dialog.Content
        size="4"
        style={{ width: "56rem", maxWidth: "calc(100vw - 2rem)" }}
      >
        <Dialog.Title size="4">
          Term expansions used for this search
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          Read{" "}
          <Link href="/howsearchworks#expansion" target="_blank">
            <em>How search works</em>
          </Link>{" "}
          to learn more about how term expansion works.
        </Dialog.Description>
        {isLoading ? (
          <Flex align="center" gap="2" py="4">
            <Spinner size="2" />
            <Text size="2" color="gray">
              Loading…
            </Text>
          </Flex>
        ) : isError ? (
          <Text size="2" color="gray">
            Could not load the expansion for this query.
          </Text>
        ) : data?.structured ? (
          <Card>
            <Text size="2" color="gray">
              This is a structured search, so it runs your exact terms with no
              term expansion. See{" "}
              <Link href="/howsearchworks#structured-search" target="_blank">
                Structured search
              </Link>
              .
            </Text>
          </Card>
        ) : active ? (
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2" wrap="wrap">
              <Text size="2" weight="medium">
                Expansions for
              </Text>
              <Select.Root
                value={active.term}
                onValueChange={setSelectedTerm}
                disabled={chunks.length < 2}
              >
                <Select.Trigger />
                <Select.Content>
                  {chunks.map((c) => (
                    <Select.Item key={c.term} value={c.term}>
                      {c.term}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
            <ExpansionGraph key={active.term} chunk={active} />
          </Flex>
        ) : (
          <Text size="2" color="gray">
            No term in this query has synonyms in the ontology graph, so the
            search ran your words as you typed them.
          </Text>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
