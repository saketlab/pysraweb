"use client";

import ChartFooter, { chartFooterEvents } from "@/components/chart-footer";
import SectionAnchor from "@/components/section-anchor";
import {
  getApexChartTheme,
  TECHNOLOGY_COLOR,
  TECHNOLOGY_FALLBACK_COLOR,
} from "@/utils/chart-theme";
import { humanize } from "@/utils/format";
import type { ScQualityPoint } from "@/utils/types";
import { useScQuality } from "@/utils/useStats";
import { useReducedMotion } from "@/utils/useReducedMotion";
import {
  Box,
  Flex,
  Heading,
  SegmentedControl,
  Skeleton,
  Text,
} from "@radix-ui/themes";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const METRIC = {
  counts: {
    label: "UMI counts",
    median: "median_ncount",
    axis: "Median UMIs per cell",
  },
  genes: {
    label: "Genes",
    median: "median_nfeature",
    axis: "Median genes per cell",
  },
} as const;

type MetricKey = keyof typeof METRIC;

const key = (technology: string, year: number) => `${technology}\u0000${year}`;

export default function StatsScQualityCard() {
  const { data, isLoading } = useScQuality();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const reduced = useReducedMotion();
  const [metric, setMetric] = useState<MetricKey>("counts");

  const { years, techs, at, declared } = useMemo(() => {
    const points = data?.points ?? [];
    const techs = (data?.technologies ?? []).map((t) => t.technology);
    const at = new Map<string, ScQualityPoint>();
    for (const p of points) {
      const k = key(p.technology, p.year);
      if (p.evidence === "read" || !at.has(k)) at.set(k, p);
    }
    return {
      techs,
      at,
      years: [...new Set(points.map((p) => p.year))].sort((a, b) => a - b),
      declared: (data?.technologies ?? [])
        .filter((t) => !t.evidence.includes("read"))
        .map((t) => t.technology),
    };
  }, [data]);

  const series = useMemo(() => {
    const field = METRIC[metric].median;
    return techs.map((technology) => ({
      name: technology,
      color: TECHNOLOGY_COLOR[technology] ?? TECHNOLOGY_FALLBACK_COLOR,
      data: years.map((y) => {
        const v = at.get(key(technology, y))?.[field];
        return v == null ? null : Math.round(v);
      }),
    }));
  }, [techs, at, years, metric]);

  const decades = useMemo(() => {
    const vs = series
      .flatMap((s) => s.data)
      .filter((v): v is number => v != null && v > 0);
    if (vs.length === 0) return null;
    const lo = 10 ** Math.floor(Math.log10(Math.min(...vs)));
    const hi = 10 ** Math.ceil(Math.log10(Math.max(...vs)));
    return { lo, hi, ticks: Math.round(Math.log10(hi / lo)) };
  }, [series]);

  const chartOptions = useMemo<ApexOptions>(() => {
    const theme = getApexChartTheme(isDark);
    return {
      chart: {
        id: "seqout-sc-quality",
        type: "line",
        background: theme.background,
        toolbar: { show: false },
        foreColor: theme.foreColor,
        animations: { enabled: !reduced },
        events: chartFooterEvents,
        zoom: { enabled: false },
      },
      stroke: { width: 2, curve: "straight" },
      markers: { size: 3 },
      dataLabels: { enabled: false },
      xaxis: {
        categories: years,
        title: { text: "Archive release year" },
        tickPlacement: "on",
      },
      yaxis: {
        logarithmic: true,
        min: decades?.lo,
        max: decades?.hi,
        tickAmount: decades ? Math.max(decades.ticks, 4) : undefined,
        title: { text: METRIC[metric].axis },
        labels: { formatter: (v) => humanize(Math.round(Number(v))) },
      },
      legend: {
        position: "bottom",
        labels: { colors: theme.legendLabelColor },
      },
      grid: { strokeDashArray: 4, borderColor: theme.gridBorderColor },
      tooltip: {
        theme: isDark ? "dark" : "light",
        y: { formatter: (v) => (v == null ? "?" : v.toLocaleString()) },
      },
    };
  }, [years, metric, isDark, reduced, decades]);

  if (isLoading) {
    return (
      <Flex direction="column" gap="3" py={{ initial: "4", md: "5" }}>
        <Skeleton height="24px" width="280px" />
        <Skeleton height="320px" />
      </Flex>
    );
  }

  if (!data || series.length === 0) return null;

  return (
    <Flex
      direction="column"
      gap="4"
      width="100%"
      py={{ initial: "4", md: "5" }}
    >
      <Flex align="center" gap="2" id="sc-quality">
        <Heading as="h2" size="5" weight="bold" ml="1">
          Single-cell depth over time
        </Heading>
        <SectionAnchor id="sc-quality" />
      </Flex>

      <Text size="2" color="gray">
        Median UMIs and genes per cell, taken from the matrices themselves and
        grouped by sequencing chemistry.
      </Text>

      <SegmentedControl.Root
        size="1"
        value={metric}
        onValueChange={(v) => setMetric(v as MetricKey)}
      >
        <SegmentedControl.Item value="counts">
          {METRIC.counts.label}
        </SegmentedControl.Item>
        <SegmentedControl.Item value="genes">
          {METRIC.genes.label}
        </SegmentedControl.Item>
      </SegmentedControl.Root>

      <Box>
        <Chart
          options={chartOptions}
          series={series}
          type="line"
          height={340}
        />
        <ChartFooter chartId="seqout-sc-quality" />
      </Box>

      <Text size="1" color="gray">
        Each point is the median across that year&apos;s matrices, over cells
        that clear the matrix&apos;s own count threshold. A year needs{" "}
        {data.min_matrices} or more matrices from {data.min_studies} or more
        studies to appear, so a chemistry enters the chart the year it reaches
        that footing, and the plate-based and combinatorial chemistries stay off
        it entirely for want of deposited matrices. The y-axis is logarithmic so
        that chemistries an order of magnitude apart share it without the lower
        series pressing flat. Release year comes from the archive, which runs
        ahead of the paper by a few months.
        {declared.length > 0 && (
          <>
            {" "}
            We read the chemistry off the FASTQs where we can. That caller
            reaches 10x, Drop-seq and ATAC, so {declared.slice(0, 4).join(", ")}
            {declared.length > 4 ? " and others" : ""} are grouped by the assay
            the submitter declared instead.
          </>
        )}
      </Text>
    </Flex>
  );
}
