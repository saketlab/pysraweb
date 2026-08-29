export type ApexChartTheme = {
  background: string;
  foreColor: string;
  titleColor: string;
  subtitleColor: string;
  legendLabelColor: string;
  dataLabelColor: string;
  gridBorderColor: string;
};

export function getApexChartTheme(isDark: boolean): ApexChartTheme {
  return isDark
    ? {
        background: "#111113",
        foreColor: "#a1a1aa",
        titleColor: "#fafafa",
        subtitleColor: "#a1a1aa",
        legendLabelColor: "#d4d4d8",
        dataLabelColor: "#e4e4e7",
        gridBorderColor: "#3f3f46",
      }
    : {
        background: "#ffffff",
        foreColor: "#71717a",
        titleColor: "#000000",
        subtitleColor: "#555555",
        legendLabelColor: "#3f3f46",
        dataLabelColor: "#18181b",
        gridBorderColor: "#e4e4e7",
      };
}

export const CHART_SERIES_PALETTE: readonly string[] = [
  "#e20000",
  "#c8b712",
  "#348557",
  "#22c9b4",
  "#aea0ff",
  "#8144ff",
  "#9d5581",
  "#ff698e",
] as const;

export type MapCanvasTheme = {
  background: string;
  title: string;
  attribution: string;
};

export function getMapCanvasTheme(isDark: boolean): MapCanvasTheme {
  return isDark
    ? {
        background: "#0d1117",
        title: "#e6edf3",
        attribution: MAP_ATTRIBUTION_COLOR,
      }
    : {
        background: "#ffffff",
        title: "#1c2024",
        attribution: MAP_ATTRIBUTION_COLOR,
      };
}

export const MAP_ATTRIBUTION_COLOR = "#999999" as const;

export function getMapPanelBackground(isDark: boolean): string {
  return isDark ? "#000000" : "#f0f0f0";
}

export function getMapMutedTextColor(isDark: boolean): string {
  return isDark ? "#6b7280" : "#9ca3af";
}

export type LeafletPopupTheme = {
  link: string;
  markerFill: string;
  markerBorder: string;
};

export function getLeafletPopupTheme(isDark: boolean): LeafletPopupTheme {
  return isDark
    ? {
        link: "#63b3ed",
        markerFill: "#e05252",
        markerBorder: "#ffffff",
      }
    : {
        link: "#2b6cb0",
        markerFill: "#d63031",
        markerBorder: "#2d3436",
      };
}

export const SIMILARITY_GRAPH_COLORS = {
  link: "#9ca3af",
  center: "#d97706",
  geo: "#2563eb",
  sra: "#8b4513",
  arrayexpress: "#eab308",
  gsa: "#e54d2e",
} as const;

// stats-sc-quality-card.tsx; keys must match the technology CASE in
// seqout-ingestion/sql/tables/sc_quality_by_year_pg.sql
export const TECHNOLOGY_COLOR: Record<string, string> = {
  "10x 3'": "#2563eb",
  "10x 5'": "#0ea5e9",
  "10x (unspecified)": "#7dd3fc",
  "Drop-seq": "#059669",
  inDrop: "#34d399",
  PIPseq: "#14b8a6",
  "Seq-Well": "#84cc16",
  "Microwell-seq": "#a3e635",
  "Smart-seq": "#dc2626",
  "CEL-seq": "#f97316",
  "MARS-seq": "#f59e0b",
  "Quartz-seq": "#fbbf24",
  "SPLiT-seq/Parse": "#9333ea",
  "sci-RNA-seq": "#db2777",
  "BD Rhapsody": "#f472b6",
};
export const TECHNOLOGY_FALLBACK_COLOR = "#94a3b8" as const;
