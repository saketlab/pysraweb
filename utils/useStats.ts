import { getJson } from "@/utils/api";
import type {
  EnrichedCrosstab,
  LastUpdated,
  ProjectOverlap,
  SingleCellOverview,
  SourceTotals,
} from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const ONE_DAY = 24 * 60 * 60 * 1000;

export function useSourceTotals() {
  return useQuery({
    queryKey: ["source-totals"],
    queryFn: () => getJson<SourceTotals>("/stats/source-totals"),
    staleTime: ONE_DAY,
  });
}

export function useProjectOverlap() {
  return useQuery({
    queryKey: ["project-overlap"],
    queryFn: () => getJson<ProjectOverlap>("/stats/project-overlap"),
    staleTime: ONE_DAY,
  });
}

export function useLastUpdated() {
  return useQuery({
    queryKey: ["last-updated"],
    queryFn: () => getJson<LastUpdated>("/stats/last-updated"),
    staleTime: ONE_DAY,
  });
}

export function useSingleCellOverview() {
  return useQuery({
    queryKey: ["single-cell-overview"],
    queryFn: () => getJson<SingleCellOverview>("/stats/single-cell"),
    staleTime: ONE_DAY,
  });
}

export function useEnrichedCrosstab(group: string, breakdown: string) {
  return useQuery({
    queryKey: ["enriched-crosstab", group, breakdown],
    queryFn: () =>
      getJson<EnrichedCrosstab>(
        `/stats/enriched/crosstab?group=${group}&breakdown=${breakdown}`,
      ),
    enabled: group !== breakdown,
    staleTime: ONE_DAY,
  });
}

export interface SexCounts {
  stated_male: number;
  stated_female: number;
  stated_missing: number;
  reads_male: number;
  reads_female: number;
}

export interface DiseaseSummary extends SexCounts {
  studies: number;
  samples: number;
  cells: number;
  studies_cells_measured: number;
  studies_human_primary: number;
  studies_cell_line: number;
  studies_with_ancestry: number;
}

export interface DiseaseFacetValue {
  value: string;
  studies: number;
}

export interface DiseaseProject {
  study_accession: string;
  title: string | null;
  organisms: string[] | null;
  n_samples: number;
  n_diseases: number;
  cells: number | null;
  assay_category: string | null;
  stated_male: number;
  stated_female: number;
  stated_missing: number;
  reads_male: number;
  reads_female: number;
  diseases: string[] | null;
  mondo_ids: string[] | null;
  catalogue_diseases: string[] | null;
  catalogue_diseases_direct: string[] | null;
  ancestors: string[] | null;
  n_samples_in_scope: number;
  ancestries: string[] | null;
  inheritance: string[] | null;
  has_fastq: boolean | null;
  has_sra: boolean | null;
  n_fastq_runs: number | null;
  n_sra_runs: number | null;
}

export function useDiseaseSummary(collection: string) {
  return useQuery({
    queryKey: ["disease-summary", collection],
    queryFn: ({ signal }) =>
      getJson<DiseaseSummary>(`/disease/${collection}/summary`, signal),
    staleTime: ONE_DAY,
  });
}

export type DiseaseFacets = Record<string, DiseaseFacetValue[]>;

export type DiseaseFilters = Record<string, string>;

export type DiseaseScope =
  "human_primary" | "patient_derived_model" | "cell_line" | "all";

export interface DiseaseSort {
  key: string;
  order: "asc" | "desc";
}

export function useDiseaseFacets(collection: string) {
  return useQuery({
    queryKey: ["disease-facets", collection],
    queryFn: ({ signal }) =>
      getJson<DiseaseFacets>(`/disease/${collection}/facets`, signal),
    staleTime: ONE_DAY,
  });
}

export function useDiseaseProjects(
  collection: string,
  filters: DiseaseFilters,
  sort: DiseaseSort,
  scope: DiseaseScope,
) {
  const active = useMemo(
    () => Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)),
    [filters],
  );
  return useQuery({
    queryKey: ["disease-projects", collection, active, sort, scope],
    queryFn: ({ signal }) => {
      const qs = new URLSearchParams([
        ["limit", "100"],
        ["sort", sort.key],
        ["order", sort.order],
        ["scope", scope],
        ...active,
      ]);
      return getJson<{ total: number; results: DiseaseProject[] }>(
        `/disease/${collection}/projects?${qs.toString()}`,
        signal,
      );
    },
    placeholderData: (prev) => prev,
    staleTime: ONE_DAY,
  });
}
