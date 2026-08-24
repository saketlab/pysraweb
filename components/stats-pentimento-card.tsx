"use client";

import SectionAnchor from "@/components/section-anchor";
import { BarList, ShareBar, StatTiles } from "@/components/stats-ui";
import { usePentimentoOverview } from "@/utils/useStats";
import { Box, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";

// fixed hue per class; a class dropping out never repaints the others
const CLASS_COLOR: Record<string, string> = {
  culture: "var(--teal-9)",
  virus: "var(--blue-9)",
  pathogen: "var(--purple-9)",
};
const CLASS_LABEL: Record<string, string> = {
  culture: "Culture contaminant",
  virus: "Virus",
  pathogen: "Pathogen",
};

// runs that disagree are folded into no_verdict
const SEX_SEGMENTS = [
  { keys: ["male"], label: "Male", color: "var(--blue-9)" },
  { keys: ["female"], label: "Female", color: "var(--purple-9)" },
  {
    keys: ["no_verdict", "conflicting"],
    label: "No verdict",
    color: "var(--gray-6)",
  },
] as const;

const ASSAY_GROUPS = [
  { key: "single_cell", label: "Single-cell assay", color: "var(--teal-9)" },
  { key: "not_single_cell", label: "Not single-cell", color: "var(--blue-9)" },
  { key: "no_call", label: "No call", color: "var(--gray-6)" },
] as const;

export default function StatsPentimentoCard() {
  const { data, isLoading } = usePentimentoOverview();

  if (isLoading || !data) {
    return (
      <Flex direction="column" gap="3" py={{ initial: "4", md: "5" }}>
        <Skeleton height="24px" width="280px" />
        <Skeleton height="240px" />
      </Flex>
    );
  }

  const sexCounts = Object.fromEntries(
    data.sex.map((s) => [s.verdict, s.n_samples]),
  );
  const assayCounts = Object.fromEntries(
    data.assay_groups.map((g) => [g.group_name, g.n_samples]),
  );
  const conflicting = sexCounts.conflicting ?? 0;
  const segments = SEX_SEGMENTS.map((seg) => ({
    ...seg,
    n: seg.keys.reduce((s, k) => s + (sexCounts[k] ?? 0), 0),
  }));

  return (
    <Flex direction="column" gap="4" width="100%" py={{ initial: "4", md: "5" }}>
      <Flex align="center" gap="2">
        <Heading as="h2" size="5" weight="bold" ml="1">
          Read-level checks
        </Heading>
        <SectionAnchor id="pentimento" />
      </Flex>

      <Text size="2" color="gray">
        Signals read off the FASTQ itself, so they hold whatever the submitted
        metadata says.
      </Text>

      <StatTiles
        stats={[
          { label: "Samples scanned", value: data.n_samples },
          { label: "Studies", value: data.n_studies },
          {
            label: "Samples with a validated detection",
            value: data.n_samples_with_hit,
          },
        ]}
      />

      <Box>
        <Text size="2" weight="bold" as="div" mb="1">
          What was found in the reads
        </Text>
        <Text size="1" color="gray" as="div" mb="2">
          {data.microbe_by_class
            .map(
              (c) =>
                `${CLASS_LABEL[c.class] ?? c.class}: ${c.n_samples.toLocaleString()} samples, ${c.n_organisms} organism${c.n_organisms === 1 ? "" : "s"}`,
            )
            .join(" · ")}
        </Text>
        <BarList
          rows={data.top_microbes.map((m) => ({
            label: m.organism.replace(/_/g, " "),
            value: m.n_samples,
            color: CLASS_COLOR[m.class] ?? "var(--gray-8)",
          }))}
        />
      </Box>

      <Box>
        <Text size="2" weight="bold" as="div" mb="1">
          Assay read off the reads
        </Text>
        <Text size="1" color="gray" as="div" mb="2">
          Every scanned sample falls in one of three groups. The named chemistries
          below are the single-cell slice drawn on its own scale, so a large
          no-call group cannot flatten them.
        </Text>
        <ShareBar
          segments={ASSAY_GROUPS.map((g) => ({
            ...g,
            n: assayCounts[g.key] ?? 0,
          }))}
        />
        <Box mt="3">
          <BarList
            rows={data.by_assay.map((a) => ({
              label: a.assay,
              value: a.n_samples,
              color: "var(--teal-9)",
            }))}
          />
        </Box>
      </Box>

      <Box>
        <Text size="2" weight="bold" as="div" mb="1">
          Sex called from reads
        </Text>
        <Text size="1" color="gray" as="div" mb="2">
          Share of every scanned sample. A verdict needs enough signal, so most
          have none; read the called counts against this whole bar.
          {conflicting > 0
            ? ` ${conflicting.toLocaleString()} samples had runs that disagreed.`
            : ""}
        </Text>
        <ShareBar segments={segments} />
      </Box>
    </Flex>
  );
}
