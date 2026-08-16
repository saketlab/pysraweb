"use client";
import {
  ensureAgGridModules,
  infiniteScrollOnBodyScroll,
  TABLE_PAGE_SIZE,
  wrapColDef,
} from "@/lib/ag-grid";
import { useWrapText } from "@/components/wrap-text-toggle";
import { getJsonOrNull } from "@/utils/api";
import {
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { Badge, Flex, Spinner, Text, Tooltip } from "@radix-ui/themes";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";

ensureAgGridModules();

// flags is tri-state: null = not measurable, [] = measured and clean
export interface SingleCellSample {
  sample_accession: string;
  title: string | null;
  tissue: string | null;
  cells: number | null;
  genes: number | null;
  unfiltered: boolean;
  n_runs: number | null;
  species_called: string | null;
  species_confidence: string | null;
  species_hit_reads: number | null;
  species_hit_fraction: number | null;
  species_runner_up: string | null;
  species_margin: number | null;
  species_ambiguous: boolean | null;
  sex_verdict: string | null;
  sex_confidence: string | null;
  sex_reads_scanned: number | null;
  y_hits: number | null;
  xist_hits: number | null;
  y_xist_ratio: number | null;
  sex_panel_status: string | null;
  sex_mixed_suspected: boolean | null;
  species_mislabel: boolean | null;
  assay_is_single_cell: boolean | null;
  // a run can be linked to a sample and never screened
  n_runs_measurable: number | null;
  deep_n_reads: number | null;
  assay: string | null;
  assay_display: string | null;
  calls_ambiguous: boolean | null;
  flags: string[] | null;
  n_flags: number | null;
  hpv_top_type: string | null;
  hpv_ambiguous: boolean | null;
  // has_viral_reads is the strict 0.50 gate, has_viral_evidence the 0.20 one
  has_viral_reads: boolean | null;
  has_viral_evidence: boolean | null;
  has_bacterial_reads: boolean | null;
  viral_kmer_mass: number | null;
  bacterial_kmer_mass: number | null;
}

export interface SingleCellResponse {
  study_accession: string;
  study_cells: number | null;
  // all nullable in Postgres, so every read below needs a guard
  any_unfiltered: boolean | null;
  n_samples_detailed: number | null;
  unassigned_cells: number | null;
  sample_breakdown_complete: boolean | null;
  // three separate coverages, differing by ~7x; never collapse into one number
  n_runs_linked: number | null;
  n_runs_preflightx: number | null;
  n_runs_measurable: number | null;
  samples: SingleCellSample[];
}

// host-genome and lentiviral-vector sequence; badged as provenance
const ENDOGENOUS_FLAGS = new Set(["is_mlv", "is_mmtv", "is_hiv", "is_htlv"]);

const CONTAMINANT_FLAGS = new Set(["is_mycoplasma"]);

const FLAG_LABELS: Record<string, string> = {
  is_hpv: "HPV",
  is_ebv: "EBV",
  is_cmv: "CMV",
  is_hsv: "HSV",
  is_hhv6: "HHV-6",
  is_hhv7: "HHV-7",
  is_kshv: "KSHV",
  is_polyomavirus: "Polyomavirus",
  is_hbv: "HBV",
  is_hcv: "HCV",
  is_hav: "HAV",
  is_sars_cov_2: "SARS-CoV-2",
  is_influenza_a: "Influenza A",
  is_rsv: "RSV",
  is_adenovirus: "Adenovirus",
  is_flavivirus: "Flavivirus",
  is_lcmv: "LCMV",
  is_mlv: "MLV",
  is_mmtv: "MMTV",
  is_hiv: "HIV-1",
  is_htlv: "HTLV-1",
  is_mycoplasma: "Mycoplasma",
  is_gardnerella: "Gardnerella",
  is_fusobacterium: "Fusobacterium",
};

function NotMeasured({ reason }: { reason: string }) {
  return (
    <Tooltip content={reason}>
      <Text size="2" color="gray" style={{ cursor: "help" }}>
        —
      </Text>
    </Tooltip>
  );
}

const FLAG_KIND = {
  endogenous: {
    color: "gray",
    note: "sequence also present in the host genome or in lentiviral vectors. Read as contamination or provenance, not infection.",
  },
  contaminant: {
    color: "amber",
    note: "cell-culture contaminant, not a donor infection.",
  },
  panel: {
    color: "crimson",
    note: "unitigs align across ≥20% of the reference (50% for host-endogenous). Sequence evidence, not a clinical positivity call.",
  },
} as const;

function FlagBadge({ flag }: { flag: string }) {
  const kind = ENDOGENOUS_FLAGS.has(flag)
    ? "endogenous"
    : CONTAMINANT_FLAGS.has(flag)
      ? "contaminant"
      : "panel";
  const label = FLAG_LABELS[flag] ?? flag;
  return (
    <Tooltip content={`${label}: ${FLAG_KIND[kind].note}`}>
      <Badge
        size="1"
        variant="soft"
        color={FLAG_KIND[kind].color}
        style={{ cursor: "help" }}
      >
        {label}
      </Badge>
    </Tooltip>
  );
}

function FlagsCellRenderer(params: ICellRendererParams<SingleCellSample>) {
  const row = params.data;
  if (!row) return null;
  if (row.flags == null) {
    return (
      <NotMeasured
        reason={
          row.n_runs_measurable
            ? "Screened, but no run was deep enough to call absence"
            : row.n_runs
              ? "Runs exist, but none were screened against the microbial panel"
              : "No sequencing runs were quantified for this sample"
        }
      />
    );
  }
  if (row.flags.length === 0) {
    return (
      <Tooltip content="Measured; no panel taxon passed the detection gate">
        <Text size="2" color="gray" style={{ cursor: "help" }}>
          none detected
        </Text>
      </Tooltip>
    );
  }
  return (
    <Flex align="center" gap="1" wrap="wrap">
      {row.flags.map((f) => (
        <FlagBadge key={f} flag={f} />
      ))}
      {row.hpv_top_type && (
        <Tooltip
          content={
            row.hpv_ambiguous
              ? "Several HPV types pass the gate. Papillomavirus genomes share conserved regions, so this is more likely cross-mapping than co-infection — the type shown is only the best-supported one."
              : "Best-supported HPV type"
          }
        >
          <Badge
            size="1"
            variant="outline"
            color="crimson"
            style={{ cursor: "help" }}
          >
            {row.hpv_top_type}
            {row.hpv_ambiguous ? " (ambiguous)" : ""}
          </Badge>
        </Tooltip>
      )}
    </Flex>
  );
}

function CellsCellRenderer(params: ICellRendererParams<SingleCellSample>) {
  const row = params.data;
  if (!row) return null;
  if (row.cells == null) return <NotMeasured reason="No cell count reported" />;
  const text = row.cells.toLocaleString();
  if (!row.unfiltered) return <Text size="2">{text}</Text>;
  return (
    <Tooltip content="Unfiltered matrix: counts 10x barcodes.">
      <Flex align="center" gap="1" style={{ cursor: "help" }}>
        <Text size="2" style={{ textDecoration: "line-through" }} color="gray">
          {text}
        </Text>
        <ExclamationTriangleIcon color="orange" />
      </Flex>
    </Tooltip>
  );
}

const DERIVATION = {
  sex: "Derived from Y-unique and XIST read counts",
  assay: "Inferred from read structure",
};

const num = (n: number | null) => (n == null ? "?" : n.toLocaleString());

const SEX_EVIDENCE = (row: SingleCellSample) => {
  const lines: string[] = [];
  // caveats below sit outside the hit-count guard on purpose
  if (row.y_hits != null || row.xist_hits != null) {
    lines.push(
      `Y-unique reads: ${num(row.y_hits)}, XIST reads: ${num(row.xist_hits)}`,
      `of ${num(row.sex_reads_scanned)} reads scanned`,
    );
    if (row.y_xist_ratio != null) {
      lines.push(`Y:XIST ratio ${row.y_xist_ratio.toFixed(2)}`);
    }
  }
  if (row.deep_n_reads) lines.push(`deep pass: ${num(row.deep_n_reads)} reads`);
  if (row.sex_confidence) lines.push(`confidence: ${row.sex_confidence}`);
  if (row.sex_panel_status === "unsupported") {
    lines.push("Panel UNSUPPORTED for this species — treat as indicative only");
  }
  if (row.sex_mixed_suspected) {
    lines.push("Mixed/pooled donors suspected — a single sex may not apply");
  }
  return lines.length ? lines.join("\n") : null;
};

const ASSAY_EVIDENCE = (row: SingleCellSample) =>
  row.assay_display && row.assay_display !== row.assay
    ? `Chemistry: ${row.assay_display}`
    : null;

// === because null means the comparison was never made
const CONTRADICTION: Partial<
  Record<keyof SingleCellSample, (row: SingleCellSample) => string | null>
> = {
  assay: (row) =>
    row.assay_is_single_cell === false
      ? "The reads do not look single-cell, however this study is published."
      : null,
};

function CallCellRenderer(
  field: keyof SingleCellSample,
  unknownReason: string,
  evidence?: (row: SingleCellSample) => string | null,
) {
  const contradiction = CONTRADICTION[field];
  return function Renderer(params: ICellRendererParams<SingleCellSample>) {
    const row = params.data;
    if (!row) return null;
    const value = row[field];
    if (value == null || value === "") {
      return <NotMeasured reason={unknownReason} />;
    }
    const conflict = contradiction?.(row) ?? null;
    const detail = evidence?.(row) ?? null;
    const label = (
      <Text
        truncate
        size="2"
        style={detail ? { cursor: "help" } : undefined}
      >
        {String(value).replace(/_/g, " ")}
      </Text>
    );
    return (
      <Flex align="center" gap="1" style={{ overflow: "hidden" }}>
        {detail ? (
          <Tooltip content={<span style={{ whiteSpace: "pre-line" }}>{detail}</span>}>
            {label}
          </Tooltip>
        ) : (
          label
        )}
        {conflict && (
          <Tooltip content={conflict}>
            <Badge
              color="crimson"
              size="1"
              variant="soft"
              style={{ cursor: "help" }}
            >
              conflict
            </Badge>
          </Tooltip>
        )}
        {row.calls_ambiguous && (
          <Tooltip content="This sample's runs disagreed; the value shown is the best-supported one.">
            <Badge
              color="amber"
              size="1"
              variant="soft"
              style={{ cursor: "help" }}
            >
              <ExclamationTriangleIcon />
            </Badge>
          </Tooltip>
        )}
      </Flex>
    );
  };
}

// module scope: built per render, these remount every cell in their column
const SexCell = CallCellRenderer(
  "sex_verdict",
  "No read-derived sex call for this sample",
  SEX_EVIDENCE,
);
const AssayCell = CallCellRenderer(
  "assay",
  "No read-derived assay call for this sample",
  ASSAY_EVIDENCE,
);

const getRowId = (params: { data: SingleCellSample }) =>
  params.data.sample_accession;

async function fetchPage(
  accession: string,
  offset: number,
): Promise<SingleCellResponse | null> {
  return getJsonOrNull<SingleCellResponse>(
    `/project/${accession}/single-cell?limit=${TABLE_PAGE_SIZE}&offset=${offset}`,
  );
}

export default function SingleCellCard({ accession }: { accession: string }) {
  const { resolvedTheme } = useTheme();
  const wrapText = useWrapText();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["single-cell", accession],
    queryFn: ({ pageParam = 0 }) => fetchPage(accession, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      !last || last.samples.length < TABLE_PAGE_SIZE
        ? undefined
        : pages.length * TABLE_PAGE_SIZE,
    retry: false,
  });

  // above the early returns; hooks cannot be called conditionally
  const rows = useMemo(
    () => data?.pages.flatMap((page) => page?.samples ?? []) ?? [],
    [data],
  );
  const defaultColDef = useMemo(
    () => ({
      filter: true,
      sortable: true,
      resizable: true,
      ...wrapColDef<SingleCellSample>(wrapText),
    }),
    [wrapText],
  );
  const onBodyScroll = useMemo(
    () =>
      infiniteScrollOnBodyScroll({
        loadedCount: rows.length,
        hasNextPage: !!hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
      }),
    [rows.length, hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  // most studies have no Pentimento row, so render nothing
  if (isError || (!isLoading && !data?.pages[0])) return null;
  if (isLoading) return <Spinner />;

  const head = data!.pages[0]!;

  const allColumns: ColDef<SingleCellSample>[] = [
    {
      field: "sample_accession",
      headerName: "Sample",
      pinned: "left",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "title",
      headerName: "Title",
      pinned: "left",
      minWidth: 200,
      flex: 1,
    },
    {
      field: "tissue",
      headerName: "Tissue",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "cells",
      headerName: "Cells",
      minWidth: 120,
      flex: 1,
      cellRenderer: CellsCellRenderer,
    },
    {
      field: "genes",
      headerName: "Genes",
      minWidth: 110,
      flex: 1,
      valueFormatter: (p) => (p.value == null ? "—" : p.value.toLocaleString()),
    },
    {
      field: "sex_verdict",
      headerName: "Sex (reads)",
      headerTooltip: DERIVATION.sex,
      minWidth: 140,
      flex: 1,
      cellRenderer: SexCell,
    },
    {
      field: "assay",
      headerName: "Assay (reads)",
      headerTooltip: DERIVATION.assay,
      minWidth: 190,
      flex: 1,
      cellRenderer: AssayCell,
    },
    {
      field: "flags",
      headerName: "Microbial evidence",
      flex: 1,
      minWidth: 240,
      cellRenderer: FlagsCellRenderer,
      sortable: false,
    },
  ];

  const columnDefs = allColumns.filter(
    (c) =>
      c.field === "sample_accession" ||
      rows.some((r) => {
        const v = r[c.field as keyof SingleCellSample];
        return v != null && v !== "";
      }),
  );

  const gridHeight = Math.min(400, 42 + rows.length * 42);

  return (
    <Flex direction="column" gap="2">
      <Text size="2" color="gray">
        Sex, assay and microbial content derived from the reads.
      </Text>
      <Flex align="center" gap="2" wrap="wrap">
        <Text size="2" color="gray">
          {(head.n_samples_detailed ?? 0).toLocaleString()} samples
          {head.study_cells != null && (
            <>
              {" · "}
              {head.study_cells.toLocaleString()} matrix columns
            </>
          )}
          {head.n_runs_linked != null && (
            <>
              {" · "}
              {head.n_runs_linked.toLocaleString()} runs,{" "}
              {(head.n_runs_preflightx ?? 0).toLocaleString()} with a read-derived
              call, {(head.n_runs_measurable ?? 0).toLocaleString()} screened for
              microbes
            </>
          )}
        </Text>
        {head.any_unfiltered && (
          <Tooltip content="Study has an unfiltered matrix, so the total counts 10x barcodes.">
            <Badge
              color="orange"
              size="1"
              variant="soft"
              style={{ cursor: "help" }}
            >
              <ExclamationTriangleIcon /> unfiltered matrix
            </Badge>
          </Tooltip>
        )}
        {head.unassigned_cells ? (
          <Tooltip content="Per-sample breakdown was not deposited. The rows below do not sum to study total.">
            <Badge
              color="gray"
              size="1"
              variant="soft"
              style={{ cursor: "help" }}
            >
              <InfoCircledIcon /> {head.unassigned_cells.toLocaleString()} cells
              unassigned
            </Badge>
          </Tooltip>
        ) : null}
        {/* === 0 only; a null coverage is unknown */}
        {head.n_runs_measurable === 0 && (
          <Tooltip content="No run in this study was sequenced deeply enough to screen for microbial sequence. Absence of flags here means unknown, not clean.">
            <Badge
              color="gray"
              size="1"
              variant="soft"
              style={{ cursor: "help" }}
            >
              <InfoCircledIcon /> not screened
            </Badge>
          </Tooltip>
        )}
      </Flex>

      <div
        className={
          resolvedTheme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz"
        }
        style={{ height: `${gridHeight}px`, width: "100%" }}
      >
        <AgGridReact<SingleCellSample>
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          enableCellTextSelection
          ensureDomOrder
          getRowId={getRowId}
          theme="legacy"
          onBodyScroll={onBodyScroll}
        />
      </div>
      {isFetchingNextPage && (
        <Flex align="center" gap="2">
          <Spinner size="1" />
          <Text size="1" color="gray">
            Loading more samples...
          </Text>
        </Flex>
      )}
    </Flex>
  );
}
