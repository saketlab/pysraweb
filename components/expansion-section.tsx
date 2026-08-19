"use client";

// Navbar button (next to the search box, only once a search has run) that opens
// the synonym network for the current query: which synonyms the search actually
// used, per term. Fetched only when the dialog is opened.

import {
  TermExpansionLearnMore,
  WaypointsIcon,
} from "@/components/term-expansion-control";
import { getSearchExpansion } from "@/utils/api";
import {
  EXPANSION_PARAM,
  expansionDisabled,
  writeExpansionPreference,
} from "@/utils/termExpansion";
import {
  Button,
  Card,
  Dialog,
  Flex,
  IconButton,
  Link,
  Select,
  Separator,
  Spinner,
  Switch,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

// client-only: React Flow touches the DOM and has no business rendering on the server
const ExpansionGraph = dynamic(() => import("@/components/expansion-graph"), {
  ssr: false,
});

export default function ExpansionSection({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // What the results on screen actually ran with. The switch starts there and
  // can drift from it; the apply button below is what closes the gap, so
  // flicking the switch never silently re-runs a search behind the dialog.
  const ranExpanded = !expansionDisabled(searchParams);
  const [on, setOn] = useState(ranExpanded);
  // Re-sync when the search itself changes (adjust during render, as elsewhere
  // in the search UI) so applying the change doesn't leave the switch pending
  // against the results it just produced.
  const [prevRanExpanded, setPrevRanExpanded] = useState(ranExpanded);
  if (prevRanExpanded !== ranExpanded) {
    setPrevRanExpanded(ranExpanded);
    setOn(ranExpanded);
  }
  const pendingChange = on !== ranExpanded;

  const applyExpansion = () => {
    const next = new URLSearchParams(searchParams.toString());
    if (on) next.delete(EXPANSION_PARAM);
    else next.set(EXPANSION_PARAM, "0");
    writeExpansionPreference(on);
    setOpen(false);
    router.push(`${pathname}?${next.toString()}`);
  };
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
        <Flex align="center" justify="between" gap="4">
          <Dialog.Title size="4" mb="0">
            Term expansion
          </Dialog.Title>
          <Switch
            checked={on}
            onCheckedChange={setOn}
            aria-label="Term expansion"
          />
        </Flex>
        <Dialog.Description mb="3">
          <TermExpansionLearnMore />
        </Dialog.Description>
        <Separator size="4" mb="3" />
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
            {!ranExpanded && (
              <Text size="2" color="gray">
                This search ran without term expansion. These are the synonyms
                it would have used.
              </Text>
            )}
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
        {pendingChange && (
          <Flex justify="end" mt="4">
            <Button onClick={applyExpansion}>
              {on
                ? "Search with term expansion"
                : "Search without term expansion"}
            </Button>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
