"use client";

import { SERVER_URL } from "@/utils/constants";
import { Card, Flex, SegmentedControl, Skeleton, Text, Tooltip } from "@radix-ui/themes";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Mode = "projects" | "experiments";
type View = "cumulative" | "monthly";

interface GrowthPoint {
  month: string;
  count: number;
}

interface GrowthResponse {
  mode: string;
  series: Record<string, GrowthPoint[]>;
  took_ms: number;
}

const DB_LABELS: Record<string, string> = {
  geo: "GEO",
  sra: "SRA",
  arrayexpress: "ArrayExpress",
  ena: "ENA",
};

const DB_COLORS: Record<string, string> = {
  geo: "#3b82f6",
  sra: "#8b5cf6",
  arrayexpress: "#f59e0b",
  ena: "#10b981",
};

const DB_ORDER = ["geo", "sra", "arrayexpress", "ena"];

async function fetchGrowth(mode: Mode): Promise<GrowthResponse> {
  const res = await fetch(`${SERVER_URL}/stats/growth?mode=${mode}`);
  if (!res.ok) throw new Error(`Failed to fetch growth data`);
  return res.json();
}

function buildCumulative(points: GrowthPoint[]): GrowthPoint[] {
  let total = 0;
  return points.map((p) => {
    total += p.count;
    return { month: p.month, count: total };
  });
}

export default function StatsGrowthChartCard() {
  const [mode, setMode] = useState<Mode>("projects");
  const [view, setView] = useState<View>("cumulative");
  const [logScale, setLogScale] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { data, isLoading } = useQuery({
    queryKey: ["growth", mode],
    queryFn: () => fetchGrowth(mode),
    staleTime: Infinity,
  });

  const chartSeries = useMemo(() => {
    if (!data?.series) return [];
    return DB_ORDER.filter((db) => db in data.series).map((db) => {
      const raw = data.series[db];
      const points = view === "cumulative" ? buildCumulative(raw) : raw;
      return {
        name: DB_LABELS[db],
        data: points.map((p) => ({
          x: new Date(p.month + "-01").getTime(),
          y: p.count,
        })),
        color: DB_COLORS[db],
      };
    });
  }, [data, view]);

  // Build Jan + Jul tick positions from data range
  const xaxisTicks = useMemo(() => {
    if (!data?.series) return undefined;
    let minYear = 9999;
    let maxYear = 0;
    for (const pts of Object.values(data.series)) {
      for (const p of pts as GrowthPoint[]) {
        const y = parseInt(p.month.slice(0, 4), 10);
        if (y < minYear) minYear = y;
        if (y > maxYear) maxYear = y;
      }
    }
    const ticks: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      ticks.push(new Date(y, 0, 1).getTime()); // Jan
    }
    return ticks;
  }, [data]);

  const chartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: view === "cumulative" ? "area" : "line",
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        foreColor: isDark ? "#a1a1aa" : "#71717a",
        zoom: { enabled: true },
        animations: { enabled: false },
      },
      stroke: {
        curve: "smooth",
        width: view === "cumulative" ? 2 : 1.5,
      },
      fill: {
        type: view === "cumulative" ? "gradient" : "solid",
        gradient: {
          opacityFrom: 0.25,
          opacityTo: 0.02,
        },
      },
      xaxis: {
        type: "datetime",
        tickAmount: xaxisTicks?.length,
        labels: {
          datetimeUTC: false,
          formatter: (_value, timestamp) => {
            if (timestamp == null) return "";
            const d = new Date(timestamp);
            const mo = d.getMonth(); // 0=Jan, 6=Jul
            const yr = d.getFullYear();
            return `Jan ${yr}`;
          },
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
        },
      },
      yaxis: {
        logarithmic: logScale,
        labels: {
          formatter: (value) => humanize(Math.round(value)),
        },
        title: {
          text: mode === "projects" ? "Projects" : "Experiments",
        },
      },
      dataLabels: { enabled: false },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontSize: "13px",
        fontFamily: "system-ui, sans-serif",
        labels: { colors: isDark ? "#d4d4d8" : "#3f3f46" },
      },
      grid: {
        strokeDashArray: 4,
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
      },
      tooltip: {
        theme: isDark ? "dark" : "light",
        x: { format: "MMM yyyy" },
        y: {
          formatter: (value) => value.toLocaleString(),
        },
      },
    }),
    [mode, view, logScale, isDark],
  );

  return (
    <Card style={{ width: "100%" }}>
      <Flex justify="between" align="center" mb="4" gap="3" wrap="wrap">
        <Text size="5" weight="bold" ml="1">
          Database growth
        </Text>
        <Flex gap="3" align="center" wrap="wrap">
          <Tooltip content="Toggle logarithmic Y-axis">
            <button
              onClick={() => setLogScale((v) => !v)}
              style={{
                background: logScale
                  ? (isDark ? "#3f3f46" : "#e4e4e7")
                  : "transparent",
                border: `1px solid ${isDark ? "#52525b" : "#d4d4d8"}`,
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "system-ui, sans-serif",
                color: isDark ? "#d4d4d8" : "#3f3f46",
                fontWeight: logScale ? 600 : 400,
              }}
            >
              Log
            </button>
          </Tooltip>
          <SegmentedControl.Root
            value={view}
            onValueChange={(v) => setView(v as View)}
            size="1"
          >
            <SegmentedControl.Item value="cumulative">
              Cumulative
            </SegmentedControl.Item>
            <SegmentedControl.Item value="monthly">
              Monthly
            </SegmentedControl.Item>
          </SegmentedControl.Root>
          <SegmentedControl.Root
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            size="1"
          >
            <SegmentedControl.Item value="projects">
              Projects
            </SegmentedControl.Item>
            <SegmentedControl.Item value="experiments">
              Experiments
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex>
      </Flex>
      {isLoading ? (
        <Skeleton height="360px" />
      ) : (
        <Chart
          type={view === "cumulative" ? "area" : "line"}
          options={chartOptions}
          series={chartSeries}
          height={400}
          width="100%"
        />
      )}
    </Card>
  );
}

function humanize(value: number): string {
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000)
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${value}`;
}
