"use client";
import ProjectSummary from "@/components/project-summary";
import PublicationCard, {
  StudyPublication,
} from "@/components/publication-card";
import SearchBar from "@/components/search-bar";
import SimilarProjectsGraph, {
  SimilarNeighbor,
} from "@/components/similar-projects-graph";
import SubmittingOrgPanel, {
  CenterInfo,
} from "@/components/submitting-org-panel";
import TextWithLineBreaks from "@/components/text-with-line-breaks";
import { ensureAgGridModules } from "@/lib/ag-grid";
import { SERVER_URL } from "@/utils/constants";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  EnterIcon,
  ExternalLinkIcon,
  HomeIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import {
  Badge,
  Button,
  Flex,
  Link,
  Spinner,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import type {
  ColDef,
  ICellRendererParams,
  ValueGetterParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useState } from "react";

ensureAgGridModules();

type Project = {
  accession: string;
  alias: string | null;
  title: string;
  abstract: string;
  organisms?: string[] | string | null;
  coords_2d?: number[] | null;
  coords_3d?: number[] | null;
  neighbors?: SimilarNeighbor[] | null;
  submission: string;
  study_type: string;
  updated_at: Date;
  external_id?: Record<string, string> | string | null;
  links?: unknown;
  center?: CenterInfo | null;
  publications?: StudyPublication[] | null;
};

type GeoNeighborsPayload = {
  coords_3d?: unknown;
  neighbors?: SimilarNeighbor[] | string | null;
};

const normalizeCoords3d = (value: unknown): number[] | null => {
  if (!Array.isArray(value)) return null;
  const parsed = value
    .map((item) =>
      typeof item === "number"
        ? item
        : typeof item === "string"
          ? Number(item)
          : NaN,
    )
    .filter((item) => Number.isFinite(item));
  return parsed.length > 0 ? parsed : null;
};

// type SimilarProject = {
//   accession: string;
//   title: string | null;
//   summary: string | null;
//   updated_at: Date | null;
// };

type Experiment = {
  accession: string;
  title: string | null;
  design_description: string | null;
  library_layout: string | null;
  library_name: string | null;
  library_selection: string | null;
  library_source: string | null;
  library_strategy: string | null;
  samples: string[];
  platform: string | null;
  instrument_model: string | null;
  submission: string | null;
};

type Sample = {
  accession: string;
  alias: string | null;
  description: string | null;
  title: string | null;
  scientific_name: string | null;
  taxon_id: string | null;
  attributes_json: Record<string, string> | null;
};

type ExperimentGridRow = {
  rowKey: string;
  accession: string;
  title: string | null;
  library: string | null;
  layout: string | null;
  platform: string | null;
  instrument: string | null;
  sample: string | null;
  sampleAlias: string | null;
  sampleTitle: string | null;
  description: string | null;
  scientificName: string | null;
  taxonId: string | null;
  attributes: Record<string, string>;
};

const toDisplayText = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const fetchProject = async (
  accession: string | null,
): Promise<Project | null> => {
  if (!accession) {
    return null;
  }

  const res = await fetch(`${SERVER_URL}/project/${accession}`);
  if (!res.ok) {
    throw new Error("Network error");
  }
  const data = (await res.json()) as Project & {
    neighbors?: SimilarNeighbor[] | string | null;
  };
  if (data && typeof data.external_id === "string") {
    try {
      data.external_id = JSON.parse(data.external_id) as Record<string, string>;
    } catch {
      data.external_id = null;
    }
  }
  if (data && typeof data.links === "string") {
    try {
      data.links = JSON.parse(data.links) as Record<string, unknown>;
    } catch {
      data.links = null;
    }
  }
  if (data && typeof data.neighbors === "string") {
    try {
      data.neighbors = JSON.parse(data.neighbors) as SimilarNeighbor[];
    } catch {
      data.neighbors = null;
    }
  }
  if (data && typeof data.organisms === "string") {
    const organismText = data.organisms;
    try {
      data.organisms = JSON.parse(organismText) as string[];
    } catch {
      data.organisms = organismText
        .split(/[;,|]/)
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);
    }
  }

  const alias = data?.alias?.trim().toUpperCase();
  const shouldFetchGeoNeighbors =
    !!alias &&
    alias.startsWith("GSE") &&
    (!Array.isArray(data.neighbors) ||
      data.neighbors.length === 0 ||
      !Array.isArray(data.coords_3d) ||
      data.coords_3d.length === 0);

  if (shouldFetchGeoNeighbors) {
    try {
      const geoRes = await fetch(`${SERVER_URL}/geo/series/${alias}/neighbors`);
      if (geoRes.ok) {
        const geoData = (await geoRes.json()) as GeoNeighborsPayload;
        if (typeof geoData.neighbors === "string") {
          try {
            geoData.neighbors = JSON.parse(
              geoData.neighbors,
            ) as SimilarNeighbor[];
          } catch {
            geoData.neighbors = null;
          }
        }
        const parsedCoords3d = normalizeCoords3d(geoData.coords_3d);
        if (Array.isArray(geoData.neighbors) && geoData.neighbors.length > 0) {
          data.neighbors = geoData.neighbors;
        }
        if (parsedCoords3d) {
          data.coords_3d = parsedCoords3d;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch GEO neighbors for alias ${alias}:`, error);
    }
  }

  return data;
};

const normalizeExternalIds = (
  externalId: unknown,
): { key: string; value: string }[] => {
  if (!externalId) return [];

  let parsed = externalId;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object") return [];

  const entries: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) entries.push({ key, value: String(item) });
      });
    } else if (value) {
      entries.push({ key, value: String(value) });
    }
  }

  return entries;
};

// const fetchSimilarProjects = async (
//   searchText: string,
//   currentAccession: string,
// ): Promise<SimilarProject[]> => {
//   const res = await fetch(
//     `${SERVER_URL}/search?q=${encodeURIComponent(searchText)}&db=sra`,
//   );
//   if (!res.ok) {
//     throw new Error("Network error");
//   }
//   const data = await res.json();
//   // Filter out the current project and return top 5
//   return (data.results as SimilarProject[])
//     .filter((p) => p.accession !== currentAccession)
//     .slice(0, 5);
// };

const fetchExperiments = async (
  accession: string | null,
): Promise<Experiment[]> => {
  if (!accession) return [];
  const res = await fetch(`${SERVER_URL}/project/${accession}/experiments`);
  if (!res.ok) throw new Error("Network error");
  const data = await res.json();
  return data as Experiment[];
};
const fetchSample = async (accession: string): Promise<Sample | null> => {
  const res = await fetch(`${SERVER_URL}/sample/${accession}`);
  if (!res.ok) return null;

  const s = (await res.json()) as Sample | { attributes_json: unknown };

  if (typeof s.attributes_json === "string") {
    try {
      s.attributes_json = JSON.parse(s.attributes_json);
    } catch {
      s.attributes_json = null;
    }
  }

  return s as Sample;
};

const fetchSamplesForExperiments = async (
  experiments: Experiment[],
): Promise<Map<string, Sample>> => {
  const sampleAccessions = experiments
    .map((exp) => exp.samples[0])
    .filter(Boolean);
  const samples = await Promise.all(
    sampleAccessions.map((acc) => fetchSample(acc)),
  );
  const sampleMap = new Map<string, Sample>();
  samples.forEach((s) => {
    if (s) sampleMap.set(s.accession, s);
  });
  return sampleMap;
};

const ABSTRACT_CHAR_LIMIT = 350;

export default function ProjectPage() {
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const accession = params.accession as string | undefined;
  const isArrayExpressAccession =
    accession?.toUpperCase().startsWith("E-") ?? false;
  const [isAccessionCopied, setIsAccessionCopied] = useState(false);
  const agGridThemeClassName =
    resolvedTheme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";
  // abstract expansion handled by ProjectSummary component
  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["project", accession],
    queryFn: () => fetchProject(accession ?? null),
    enabled: !!accession,
  });

  const {
    data: experiments,
    isLoading: isExperimentsLoading,
    isError: isExperimentsError,
  } = useQuery({
    queryKey: ["project-experiments", accession],
    queryFn: () => fetchExperiments(accession ?? null),
    enabled: !!accession,
  });

  const { data: samplesMap } = useQuery({
    queryKey: ["project-samples", accession],
    queryFn: () => fetchSamplesForExperiments(experiments!),
    enabled: !!experiments && experiments.length > 0,
  });

  const externalIds = React.useMemo(
    () => normalizeExternalIds(project?.external_id),
    [project?.external_id],
  );

  const publications = project?.publications ?? null;

  const handleCopyAccession = async () => {
    if (!accession) return;
    try {
      await navigator.clipboard.writeText(accession);
      setIsAccessionCopied(true);
      window.setTimeout(() => setIsAccessionCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy accession:", error);
    }
  };

  // Compute unique attribute keys from all samples
  const attributeKeys = React.useMemo(() => {
    if (!samplesMap) return [];
    const keys = new Set<string>();

    samplesMap.forEach((s) => {
      if (s.attributes_json) {
        Object.keys(s.attributes_json).forEach((k) => keys.add(k));
      }
    });

    return Array.from(keys);
  }, [samplesMap]);

  const experimentRows = React.useMemo<ExperimentGridRow[]>(() => {
    if (!experiments) return [];

    return experiments.map((experiment) => {
      const sampleAccession = experiment.samples[0] ?? null;
      const sample =
        sampleAccession && samplesMap ? samplesMap.get(sampleAccession) : null;

      return {
        rowKey: experiment.accession,
        accession: experiment.accession,
        title: experiment.title,
        library: experiment.library_name ?? experiment.library_strategy,
        layout: experiment.library_layout,
        platform: experiment.platform,
        instrument: experiment.instrument_model,
        sample: sampleAccession,
        sampleAlias: sample?.alias ?? null,
        sampleTitle: sample?.title ?? null,
        description: sample?.description ?? null,
        scientificName: sample?.scientific_name ?? null,
        taxonId: sample?.taxon_id ?? null,
        attributes: sample?.attributes_json ?? {},
      };
    });
  }, [experiments, samplesMap]);

  const experimentsGridDefaultColDef = React.useMemo<ColDef<ExperimentGridRow>>(
    () => ({
      filter: true,
      resizable: true,
      sortable: true,
    }),
    [],
  );

  const experimentColumnDefs = React.useMemo<ColDef<ExperimentGridRow>[]>(
    () => [
      {
        headerName: "Accession",
        field: "accession",
        minWidth: 140,
        pinned: "left",
        cellRenderer: (params: ICellRendererParams<ExperimentGridRow>) => {
          const experimentAccession = toDisplayText(params.value);
          if (experimentAccession === "-") return "-";
          return (
            <Link
              href={`https://www.ncbi.nlm.nih.gov/sra/${experimentAccession}[accn]`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {experimentAccession}
            </Link>
          );
        },
      },
      {
        headerName: "Title",
        field: "title",
        minWidth: 220,
        valueFormatter: (params) => toDisplayText(params.value),
      },
      {
        headerName: "Library",
        field: "library",
        minWidth: 140,
        valueFormatter: (params) => toDisplayText(params.value),
      },
      {
        headerName: "Layout",
        field: "layout",
        minWidth: 120,
        valueFormatter: (params) => toDisplayText(params.value),
      },
      {
        headerName: "Platform",
        field: "platform",
        minWidth: 130,
        valueFormatter: (params) => toDisplayText(params.value),
      },
      {
        headerName: "Instrument",
        field: "instrument",
        minWidth: 150,
        valueFormatter: (params) => toDisplayText(params.value),
      },
      {
        headerName: "Sample",
        field: "sample",
        minWidth: 130,
        cellRenderer: (params: ICellRendererParams<ExperimentGridRow>) => {
          const sampleAccession = toDisplayText(params.value);
          if (sampleAccession === "-") return "-";
          if (
            sampleAccession.startsWith("SRS") ||
            sampleAccession.startsWith("ERS") ||
            sampleAccession.startsWith("DRS")
          ) {
            return (
              <Link
                href={`https://www.ncbi.nlm.nih.gov/sra/${sampleAccession}[accn]`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sampleAccession}
              </Link>
            );
          }
          return <span>{sampleAccession}</span>;
        },
      },
      {
        headerName: "Sample Alias",
        field: "sampleAlias",
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams<ExperimentGridRow>) => {
          const sampleAlias = toDisplayText(params.value);
          if (sampleAlias === "-") return "-";
          if (sampleAlias.startsWith("GSM")) {
            return (
              <Link
                href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${sampleAlias}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sampleAlias}
              </Link>
            );
          }
          if (sampleAlias.startsWith("SAM")) {
            return (
              <Link
                href={`https://www.ncbi.nlm.nih.gov/biosample/${sampleAlias}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sampleAlias}
              </Link>
            );
          }
          return <span>{sampleAlias}</span>;
        },
      },
      {
        headerName: "Sample Title",
        field: "sampleTitle",
        minWidth: 220,
        valueFormatter: (params) => toDisplayText(params.value),
      },
      {
        headerName: "Description",
        field: "description",
        minWidth: 240,
        autoHeight: true,
        wrapText: true,
        cellRenderer: (params: ICellRendererParams<ExperimentGridRow>) => {
          const value = toDisplayText(params.value);
          if (value === "-") return "-";
          return <TextWithLineBreaks text={value} />;
        },
      },
      {
        headerName: "Scientific Name",
        field: "scientificName",
        minWidth: 200,
        valueFormatter: (params) => toDisplayText(params.value),
      },
      {
        headerName: "Taxon ID",
        field: "taxonId",
        minWidth: 120,
        valueFormatter: (params) => toDisplayText(params.value),
      },
      ...attributeKeys.map(
        (key): ColDef<ExperimentGridRow> => ({
          headerName: key,
          minWidth: 170,
          valueGetter: (params: ValueGetterParams<ExperimentGridRow>) =>
            params.data?.attributes[key] ?? "-",
        }),
      ),
    ],
    [attributeKeys],
  );

  // const { data: similarProjects, isLoading: isSimilarLoading } = useQuery({
  //   queryKey: ["similarProjects", project?.abstract],
  //   queryFn: () => fetchSimilarProjects(project!.abstract, project!.accession),
  //   enabled: !!project?.abstract,
  // });
  return (
    <>
      <SearchBar initialQuery={""} />

      {!accession && (
        <Flex
          gap="4"
          align="center"
          p={"4"}
          ml={{ initial: "0", md: "8rem" }}
          mr={{ md: "16rem" }}
          justify="center"
          direction={"column"}
        >
          <Text size={"4"} weight={"bold"} color="gray" align={"center"}>
            No project selected 🤷
          </Text>
          <Button
            variant="surface"
            onClick={() => (window.location.href = "/")}
          >
            <HomeIcon /> Go back
          </Button>
        </Flex>
      )}

      {/* Loading state */}
      {accession && isLoading && (
        <Flex
          gap="2"
          align="center"
          pt={"3"}
          ml={{ initial: "0", md: "8rem" }}
          mr={{ md: "16rem" }}
          justify="center"
        >
          <Spinner size="3" />
          <Text>Getting metadata</Text>
        </Flex>
      )}

      {/* Error state */}
      {accession && isError && (
        <Flex
          gap="2"
          align="center"
          justify="center"
          height={"20rem"}
          direction={"column"}
        >
          <Image
            draggable={"false"}
            src="/empty-box.svg"
            alt="empty box"
            width={100}
            height={100}
          />
          <Text color="gray" size={"6"} weight={"bold"}>
            Could not find project
          </Text>
          <Text color="gray" size={"2"}>
            Check your network connection or query
          </Text>
        </Flex>
      )}

      {/* Data state */}
      {accession && !isLoading && !isError && project && (
        <>
          <Flex
            ml={{ initial: "0", md: "12rem" }}
            mr={{ initial: "0", md: "8rem" }}
            py="3"
            px={{ initial: "4", md: "3" }}
            direction="column"
            gap="4"
          >
            <Flex justify="between" style={{ width: "100%" }} align="center">
              <Text size={{ initial: "4", md: "6" }} weight="bold">
                {project.title}
              </Text>
            </Flex>
            <Flex justify="start" align={"center"} gap="2" wrap={"wrap"}>
              <Badge
                size={{ initial: "1", md: "3" }}
                color={isArrayExpressAccession ? "gold" : "brown"}
                variant={isArrayExpressAccession ? "solid" : undefined}
              >
                <Flex align="center" gap="1">
                  <Text>{accession}</Text>
                  <Tooltip content="Copy accession">
                    <button
                      type="button"
                      onClick={handleCopyAccession}
                      aria-label="Copy accession"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "inherit",
                        padding: 0,
                        margin: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      {isAccessionCopied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </Tooltip>
                </Flex>
              </Badge>
              <Badge size={{ initial: "1", md: "3" }} color="gray">
                {isExperimentsLoading
                  ? "Loading..."
                  : experiments
                    ? `${experiments.length} Experiments`
                    : "0 Experiments"}
              </Badge>
              {project.alias?.startsWith("P") && (
                <a
                  href={`https://www.ncbi.nlm.nih.gov/bioproject/${project.alias}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge
                    size={{ initial: "1", md: "3" }}
                    color="green"
                    style={{ cursor: "pointer" }}
                  >
                    {project.alias}
                    <ExternalLinkIcon />
                  </Badge>
                </a>
              )}
              {project.alias?.startsWith("G") && (
                <a href={`/p/${project.alias}`}>
                  <Badge
                    size={{ initial: "1", md: "3" }}
                    style={{ cursor: "pointer" }}
                  >
                    {project.alias}
                    <EnterIcon />
                  </Badge>
                </a>
              )}
              {externalIds
                .filter((entry) => entry.value !== project.alias)
                .map((entry) => {
                  const keyLower = entry.key.toLowerCase();
                  const value = entry.value;
                  if (keyLower === "bioproject") {
                    return (
                      <a
                        key={`${entry.key}:${value}`}
                        href={`https://www.ncbi.nlm.nih.gov/bioproject/${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge
                          size={{ initial: "1", md: "3" }}
                          color="green"
                          style={{ cursor: "pointer" }}
                        >
                          {value}
                          <ExternalLinkIcon />
                        </Badge>
                      </a>
                    );
                  }
                  if (keyLower === "biosample") {
                    return (
                      <a
                        key={`${entry.key}:${value}`}
                        href={`https://www.ncbi.nlm.nih.gov/biosample/${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge
                          size={{ initial: "1", md: "3" }}
                          color="gray"
                          style={{ cursor: "pointer" }}
                        >
                          {value}
                          <ExternalLinkIcon />
                        </Badge>
                      </a>
                    );
                  }
                  if (keyLower === "geo" || value.startsWith("GSE")) {
                    return (
                      <a key={`${entry.key}:${value}`} href={`/p/${value}`}>
                        <Badge
                          size={{ initial: "1", md: "3" }}
                          style={{ cursor: "pointer" }}
                        >
                          {value}
                          <EnterIcon />
                        </Badge>
                      </a>
                    );
                  }

                  return (
                    <Badge
                      key={`${entry.key}:${value}`}
                      size={{ initial: "1", md: "3" }}
                      color="gray"
                    >
                      {entry.key}: {value}
                    </Badge>
                  );
                })}
              <a
                href={`https://trace.ncbi.nlm.nih.gov/Traces/?view=study&acc=${accession}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge size={{ initial: "1", md: "3" }} color="sky">
                  Visit SRA page <ExternalLinkIcon />
                </Badge>
              </a>
            </Flex>
            <Flex align={"center"} gap={"2"}>
              <InfoCircledIcon />
              <Text color="gray">
                Last updated on{" "}
                {project.updated_at
                  ? new Date(project.updated_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </Text>
            </Flex>
            <ProjectSummary
              text={project.abstract}
              charLimit={ABSTRACT_CHAR_LIMIT}
            />
            <Flex justify={"between"} align={"center"}>
              <Text weight="medium" size="6">
                Experiments
              </Text>
              <Button
                onClick={() => {
                  if (!experiments || !samplesMap) return;
                  // Compose CSV header
                  const baseHeaders = [
                    "Accession",
                    "Title",
                    "Library",
                    "Layout",
                    "Platform",
                    "Instrument",
                    "Sample",
                    "Sample Alias",
                    "Sample Title",
                    "Description",
                    "Scientific Name",
                    "Taxon ID",
                  ];
                  const allHeaders = baseHeaders.concat(attributeKeys);
                  // Compose CSV rows
                  const rows = experiments.map((e) => {
                    const sampleAcc = e.samples[0];
                    const sample =
                      sampleAcc && samplesMap
                        ? samplesMap.get(sampleAcc)
                        : null;
                    const baseRow = [
                      e.accession,
                      e.title ?? "-",
                      e.library_name ?? e.library_strategy ?? "-",
                      e.library_layout ?? "-",
                      e.platform ?? "-",
                      e.instrument_model ?? "-",
                      sampleAcc ?? "-",
                      sample?.alias ?? "-",
                      sample?.title ?? "-",
                      sample?.description ?? "-",
                      sample?.scientific_name ?? "-",
                      sample?.taxon_id ?? "-",
                    ];
                    const attrRow = attributeKeys.map(
                      (key) => sample?.attributes_json?.[key] ?? "-",
                    );
                    return [...baseRow, ...attrRow];
                  });
                  // Convert to CSV string
                  const escape = (val: string) =>
                    `"${String(val).replace(/"/g, '""')}"`;
                  const csv = [
                    allHeaders.map(escape).join(","),
                    ...rows.map((row) => row.map(escape).join(",")),
                  ].join("\n");
                  // Download
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${accession}_experiments.csv`;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }, 0);
                }}
              >
                <DownloadIcon /> CSV
              </Button>
            </Flex>
            {/* Experiments table */}
            <Flex
              align="start"
              gap="2"
              direction="column"
              style={{
                width: "100%",
              }}
            >
              {isExperimentsLoading && (
                <Flex gap="2" align="center">
                  <Spinner size="2" />
                  <Text size="2">Loading experiments...</Text>
                </Flex>
              )}
              {isExperimentsError && (
                <Text color="red">Failed to load experiments</Text>
              )}
              {!isExperimentsLoading &&
                experiments &&
                experiments.length === 0 && (
                  <Text size="2" color="gray">
                    No experiments found
                  </Text>
                )}
              {!isExperimentsLoading &&
                experiments &&
                experiments.length > 0 && (
                  <div
                    className={agGridThemeClassName}
                    style={{
                      width: "100%",
                      height: "500px",
                    }}
                  >
                    <AgGridReact<ExperimentGridRow>
                      columnDefs={experimentColumnDefs}
                      defaultColDef={experimentsGridDefaultColDef}
                      getRowId={(params) => params.data.rowKey}
                      rowData={experimentRows}
                      theme="legacy"
                    />
                  </div>
                )}
            </Flex>
            <Text weight="medium" size="6">
              Linked publications
            </Text>

            {publications && publications.length > 0 ? (
              <Flex direction="column" gap="3">
                {publications.map((pub) => (
                  <PublicationCard
                    key={pub.pmid ?? pub.doi ?? pub.title}
                    publication={pub}
                  />
                ))}
              </Flex>
            ) : (
              <Text size="2" color="gray">
                No linked publications found
              </Text>
            )}
            <Flex align="center" gap="2">
              <Text weight="medium" size="6">
                Similar projects
              </Text>
              <Badge color="teal" size={"2"}>
                Beta
              </Badge>
            </Flex>
            <SimilarProjectsGraph
              accession={project.accession}
              source="sra"
              title={project.title}
              description={project.abstract}
              organisms={project.organisms}
              coords2d={project.coords_2d}
              coords3d={project.coords_3d}
              neighbors={project.neighbors}
            />
            <SubmittingOrgPanel center={project.center} />
          </Flex>
        </>
      )}
    </>
  );
}
