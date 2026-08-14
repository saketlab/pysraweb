import { getJson } from "@/utils/api";
import type {
  EnrichedCrosstab,
  LastUpdated,
  SourceTotals,
} from "@/utils/types";
import { useQuery } from "@tanstack/react-query";

const ONE_DAY = 24 * 60 * 60 * 1000;

export function useSourceTotals() {
  return useQuery({
    queryKey: ["source-totals"],
    queryFn: () => getJson<SourceTotals>("/stats/source-totals"),
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
  studies_single_cell: number;
}

export interface DiseaseFacetValue {
  value: string;
  studies: number;
}

export interface DiseaseProject {
  study_accession: string;
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
  categories: string[] | null;
  gard_diseases: string[] | null;
}

export function useDiseaseSummary(collection: string) {
  return useQuery({
    queryKey: ["disease-summary", collection],
    queryFn: ({ signal }) =>
      getJson<DiseaseSummary>(`/disease/${collection}/summary`, signal),
    staleTime: ONE_DAY,
  });
}

export interface DiseaseFacets {
  category: DiseaseFacetValue[];
  assay_category: DiseaseFacetValue[];
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
  category: string | null,
  assay: string | null,
) {
  return useQuery({
    queryKey: ["disease-projects", collection, category, assay],
    queryFn: ({ signal }) => {
      const qs = new URLSearchParams({ limit: "100" });
      if (category) qs.set("category", category);
      if (assay) qs.set("assay_category", assay);
      return getJson<{ count: number; results: DiseaseProject[] }>(
        `/disease/${collection}/projects?${qs.toString()}`,
        signal,
      );
    },
    placeholderData: (prev) => prev,
    staleTime: ONE_DAY,
  });
}
