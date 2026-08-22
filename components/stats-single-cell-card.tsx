"use client";

import SectionAnchor from "@/components/section-anchor";
import { humanize } from "@/utils/format";
import { useSingleCellOverview } from "@/utils/useStats";
import { Box, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";

const KIND_LABELS: Record<string, string> = {
  fastq_only: "Raw reads only",
  matrix_only: "Count matrix only",
  fastq_and_matrix: "Reads + matrix",
};

// ponytail: plain CSS bars, not ApexCharts — these are two ranked top-15 lists.
function TopList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <Box style={{ flex: "1 1 280px", minWidth: 0 }}>
      <Text size="2" weight="bold">
        {title}
      </Text>
      <Flex direction="column" gap="1" mt="2">
        {rows.map((r) => (
          <Flex key={r.label} align="center" gap="2">
            <Text
              size="1"
              style={{
                width: 140,
                flexShrink: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={r.label}
            >
              {r.label}
            </Text>
            <Box
              style={{
                height: 10,
                borderRadius: 3,
                background: "var(--accent-9)",
                width: `${(r.value / max) * 100}%`,
                minWidth: 2,
              }}
            />
            <Text
              size="1"
              color="gray"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {humanize(r.value)}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
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
    { label: "Samples", value: data.n_samples },
    { label: "Cells", value: data.n_cells },
  ];

  return (
    <Flex direction="column" gap="4" width="100%" py={{ initial: "4", md: "5" }}>
      <Flex align="center" gap="2">
        <Heading as="h2" size="5" weight="bold" ml="1">
          Single-cell datasets
        </Heading>
        <SectionAnchor id="single-cell" />
      </Flex>

      <Flex gap="5" wrap="wrap">
        {stats.map((s) => (
          <Box key={s.label}>
            <Text size="6" weight="bold" as="div">
              {humanize(s.value)}
            </Text>
            <Text size="1" color="gray">
              {s.label}
            </Text>
          </Box>
        ))}
      </Flex>

      <Text size="1" color="gray">
        {data.by_kind
          .map(
            (k) =>
              `${KIND_LABELS[k.kind] ?? k.kind}: ${k.n_studies.toLocaleString()}`,
          )
          .join(" · ")}
      </Text>

      <Flex gap="5" wrap="wrap">
        <TopList
          title="Top tissues"
          rows={data.top_tissues.map((t) => ({
            label: t.tissue,
            value: t.n_studies,
          }))}
        />
        <TopList
          title="Top organisms"
          rows={data.top_organisms.map((o) => ({
            label: o.organism,
            value: o.n_studies,
          }))}
        />
      </Flex>
    </Flex>
  );
}
