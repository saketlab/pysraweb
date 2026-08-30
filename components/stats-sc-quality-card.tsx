"use client";

import ChartFooter, { chartFooterEvents } from "@/components/chart-footer";
import SectionAnchor from "@/components/section-anchor";
import {
  getApexChartTheme,
  technologyColor,
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
    label: "Counts",
    median: "median_ncount",
    p25: "p25_ncount",
    p75: "p75_ncount",
    axis: "Median UMIs per cell",
  },
  genes: {
    label: "Genes",
    median: "median_nfeature",
    p25: "p25_nfeature",
    p75: "p75_nfeature",
    axis: "Median genes per cell",
  },
} as const;

const BAND_FILL = "#94a3b8";
const BAND_LINE = "#64748b";

type MetricKey = keyof typeof METRIC;

const key = (technology: string, year: number) => `${technology}\u0000${year}`;

export default function StatsScQualityCard() {
  const { data, isLoading } = useScQuality();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const reduced = useReducedMotion();
  const [metric, setMetric] = useState<MetricKey>("counts");

  const { years, techs, at, overall, declared } = useMemo(() => {
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
      overall: new Map((data?.overall ?? []).map((p) => [p.year, p])),
      years: [...new Set(points.map((p) => p.year))].sort((a, b) => a - b),
      declared: (data?.technologies ?? [])
        .filter((t) => !t.evidence.includes("read"))
        .map((t) => t.technology),
    };
  }, [data]);

  const series = useMemo(() => {
    const { median, p25, p75 } = METRIC[metric];
    const round = (v: number | null | undefined) =>
      v == null ? null : Math.round(v);
    const band = years.map((y) => {
      const o = overall.get(y);
      const lo = round(o?.[p25]);
      const hi = round(o?.[p75]);
      return { x: y, y: lo == null || hi == null ? [] : [lo, hi] };
    });
    return [
      {
        name: "All chemistries (IQR)",
        type: "rangeArea",
        color: BAND_FILL,
        data: band,
      },
      {
        name: "All chemistries (median)",
        type: "rangeArea",
        color: BAND_LINE,
        data: years.map((y) => round(overall.get(y)?.[median])),
      },
      ...techs.map((technology, i) => ({
        name: technology,
        type: "line",
        color: technologyColor(technology, i),
        data: years.map((y) => round(at.get(key(technology, y))?.[median])),
      })),
    ];
  }, [techs, at, overall, years, metric]);

  const flatValues = useMemo(
    () =>
      series.flatMap((s) =>
        s.data.flatMap((d) =>
          d == null ? [] : typeof d === "number" ? [d] : d.y,
        ),
      ),
    [series],
  );

  const decades = useMemo(() => {
    const vs = flatValues.filter((v): v is number => v != null && v > 0);
    if (vs.length === 0) return null;
    let min = Infinity;
    let max = 0;
    for (const v of vs) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const lo = Math.floor(Math.log10(min));
    const hi = Math.ceil(Math.log10(max));
    return { lo: 10 ** lo, hi: 10 ** hi, ticks: hi - lo };
  }, [flatValues]);

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
      stroke: {
        width: series.map((s, i) => (i === 0 ? 0 : i === 1 ? 3 : 2)),
        curve: "straight",
      },
      fill: {
        type: "solid",
        opacity: series.map((_, i) => (i === 0 ? 0.18 : 1)),
      },
      markers: {
        size: series.map((s, i) =>
          i < 2
            ? 0
            : s.data.filter((v) => v != null).length < 3
              ? 7
              : 3,
        ),
        strokeWidth: 0,
        hover: { sizeOffset: 3 },
      },
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
        tickAmount: decades?.ticks,
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
  }, [years, metric, isDark, reduced, series, decades]);

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
          type="rangeArea"
          height={340}
        />
        <ChartFooter chartId="seqout-sc-quality" />
      </Box>

      <Text size="1" color="gray">
        Each point is the median across that year&apos;s matrices, over cells
        that clear the matrix&apos;s own count threshold. A year needs{" "}
        {data.min_matrices} or more matrices from {data.min_studies} or more
        studies to appear. The grey band is the interquartile range across all
        chemistries pooled and the grey line its median. 
        {declared.length > 0 && (
          <>
            {" "}
            We read the chemistry off the FASTQs where we can. That caller
            reaches 10x and Drop-seq, so {declared.slice(0, 4).join(", ")}
            {declared.length > 4 ? " and others" : ""} are grouped by the assay
            the submitter declared instead.
          </>
        )}
      </Text>
    </Flex>
  );
}
