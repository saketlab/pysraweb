"use client";

import SectionAnchor from "@/components/section-anchor";
import { BarList, ShareBar, StatTiles } from "@/components/stats-ui";
import { useSingleCellOverview } from "@/utils/useStats";
import { Box, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";

// fixed hue per kind; a kind dropping to zero never repaints the others
const KINDS = [
  {
    key: "matrix_only",
    label: "Count matrix only",
    color: "var(--teal-9)",
  },
  {
    key: "fastq_and_matrix",
    label: "Reads + matrix",
    color: "var(--blue-9)",
  },
  {
    key: "fastq_only",
    label: "Raw reads only",
    color: "var(--purple-9)",
  },
] as const;

// NCBI records genus above species; label the rank so it is not read as one
const GENUS_TAXA = new Set(["Mus", "Rattus", "Drosophila", "Macaca", "Danio"]);

function organismLabel(name: string): string {
  return GENUS_TAXA.has(name.trim()) ? `${name} (genus)` : name;
}


export default function StatsSingleCellCard() {
  const { data, isLoading } = useSingleCellOverview();

  if (isLoading || !data) {
    return (
      <Flex direction="column" gap="3" py={{ initial: "4", md: "5" }}>
        <Skeleton height="24px" width="280px" />
        <Skeleton height="260px" />
      </Flex>
    );
  }

  const stats = [
    { label: "Studies", value: data.n_studies },
    { label: "Samples counted so far", value: data.n_samples },
    { label: "Cells", value: data.n_cells },
  ];
  const counts = Object.fromEntries(
    data.by_kind.map((k) => [k.kind, k.n_studies]),
  );
  const coverage = Object.fromEntries(
    data.by_kind.map((k) => [
      k.kind,
      { n: k.n_samples, counted: k.n_studies_counted, of: k.n_studies },
    ]),
  );

  return (
    <Flex direction="column" gap="4" width="100%" py={{ initial: "4", md: "5" }}>
      <Flex align="center" gap="2">
        <Heading as="h2" size="5" weight="bold" ml="1">
          Single-cell datasets
        </Heading>
        <SectionAnchor id="single-cell" />
      </Flex>

      <StatTiles stats={stats} />

      <Box>
        <Text size="2" weight="bold" as="div" mb="2">
          What each study ships
        </Text>
        <ShareBar
          segments={KINDS.map((k) => ({ ...k, n: counts[k.key] ?? 0 }))}
        />
        <Text size="1" color="gray" as="div" mt="2">
          {KINDS.map((k) => {
            const c = coverage[k.key];
            // lower bound; not every study is counted
            if (!c || c.counted === 0) return `${k.label}: not counted yet`;
            return `${k.label}: ${(c.n ?? 0).toLocaleString()} samples across ${c.counted.toLocaleString()} of ${c.of.toLocaleString()} studies`;
          }).join(" · ")}
        </Text>
      </Box>

      <Flex gap="5" wrap="wrap">
        <BarList
          title="Top tissues"
          rows={data.top_tissues.map((t) => ({
            label: t.tissue,
            value: t.n_studies,
          }))}
          labelWidth={140}
        />
        <BarList
          title="Top organisms"
          rows={data.top_organisms.map((o) => ({
            label: organismLabel(o.organism),
            value: o.n_studies,
          }))}
          labelWidth={140}
        />
      </Flex>
    </Flex>
  );
}
