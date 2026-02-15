"use client";
import ProjectSummary from "@/components/project-summary";
import { CaretDownIcon, ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { DropdownMenu, IconButton } from "@radix-ui/themes";
import PublicationCard, { PubMedArticle } from "@/components/publication-card";
import SearchBar from "@/components/search-bar";
import SimilarProjectsGraph, {
  SimilarNeighbor,
} from "@/components/similar-projects-graph";
import { SERVER_URL } from "@/utils/constants";
import {
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
  Table,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import React from "react";

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
            geoData.neighbors = JSON.parse(geoData.neighbors) as SimilarNeighbor[];
          } catch {
            geoData.neighbors = null;
          }
        }
        const parsedCoords3d = normalizeCoords3d(geoData.coords_3d);
        if (
          Array.isArray(geoData.neighbors) &&
          geoData.neighbors.length > 0
        ) {
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

const fetchPubMedData = async (
  pubmedIds: string[],
): Promise<PubMedArticle[]> => {
  if (!pubmedIds || pubmedIds.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(
    new Set(pubmedIds.map((id) => id.trim()).filter(Boolean)),
  );
  const chunkSize = 100;
  const articles: PubMedArticle[] = [];

  for (let i = 0; i < uniqueIds.length; i += chunkSize) {
    const chunk = uniqueIds.slice(i, i + chunkSize);

    try {
      const res = await fetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${encodeURIComponent(chunk.join(","))}&retmode=json`,
      );
      if (!res.ok) continue;

      const data = (await res.json()) as {
        result?: Record<string, PubMedArticle | string[]>;
      };
      const result = data.result;
      if (!result) continue;

      chunk.forEach((id) => {
        const article = result[id];
        if (article && typeof article === "object") {
          articles.push(article as PubMedArticle);
        }
      });
    } catch (error) {
      console.error(`Failed to fetch PubMed data for chunk:`, error);
    }
  }

  return articles;
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

const extractPubmedIds = (links: unknown): string[] => {
  if (!links) return [];

  let parsed = links;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object") return [];

  const obj = parsed as Record<string, unknown>;
  const ids = new Set<string>();

  const addFrom = (item: unknown) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const db = String(record.DB ?? record.db ?? "").toLowerCase();
    if (db === "pubmed") {
      const id = record.ID ?? record.Id ?? record.id;
      if (id) ids.add(String(id));
    }
  };

  const xref = obj.XREF_LINK ?? obj.xref_link ?? obj.XrefLink;
  if (Array.isArray(xref)) {
    xref.forEach(addFrom);
  } else {
    addFrom(xref);
  }

  return Array.from(ids);
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


type SortDirection = "asc" | "desc";
type SortState = { key: string; direction: SortDirection } | null;

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function normalize(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function stableSort<T>(arr: T[], cmp: (a: T, b: T) => number): T[] {
  return arr
    .map((item, index) => ({ item, index }))
    .sort((x, y) => {
      const res = cmp(x.item, y.item);
      return res !== 0 ? res : x.index - y.index;
    })
    .map((x) => x.item);
}


export default function ProjectPage() 
{
  const params = useParams();
  const accession = params.accession as string | undefined;
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

  const [sort, setSort] = React.useState<SortState>(null);

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

  const pubmedIds = React.useMemo(
    () => extractPubmedIds(project?.links),
    [project?.links],
  );

  const { data: publications, isLoading: isPublicationsLoading } = useQuery({
    queryKey: ["publications", pubmedIds.join(",")],
    queryFn: () => fetchPubMedData(pubmedIds),
    enabled: pubmedIds.length > 0,
  });

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

  // const { data: similarProjects, isLoading: isSimilarLoading } = useQuery({
  //   queryKey: ["similarProjects", project?.abstract],
  //   queryFn: () => fetchSimilarProjects(project!.abstract, project!.accession),
  //   enabled: !!project?.abstract,
  // });


  const getCellValue = React.useCallback(
  (e: Experiment, sample: Sample | null, key: string): unknown => {
        switch (key) {
          case "Accession":
            return e.accession;
          case "Title":
            return e.title ?? "-";
          case "Library":
            return e.library_name ?? e.library_strategy ?? "-";
          case "Layout":
            return e.library_layout ?? "-";
          case "Platform":
            return e.platform ?? "-";
          case "Instrument":
            return e.instrument_model ?? "-";
          case "Sample":
            return e.samples?.[0] ?? "-";
          case "Sample Alias":
            return sample?.alias ?? "-";
          case "Sample Title":
            return sample?.title ?? "-";
          case "Description":
            return sample?.description ?? "-";
          case "Scientific Name":
            return sample?.scientific_name ?? "-";
          case "Taxon ID":
            return sample?.taxon_id ?? "-";
          default:
            // dynamic attribute columns (attributeKeys)
            return sample?.attributes_json?.[key] ?? "-";
        }
      },
    [],
  );


     const columns = React.useMemo(() => {
       const base = [
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
       return base.concat(attributeKeys);
     }, [attributeKeys]);



  const sortedExperiments = React.useMemo(() => {
    if (!experiments) return [];
    if (!sort) return experiments;
  
    const { key, direction } = sort;
  
    return stableSort(experiments, (a, b) => {
      const sampleAccA = a.samples?.[0];
      const sampleA =
        sampleAccA && samplesMap ? samplesMap.get(sampleAccA) ?? null : null;
    
      const sampleAccB = b.samples?.[0];
      const sampleB =
        sampleAccB && samplesMap ? samplesMap.get(sampleAccB) ?? null : null;
    
      const va = normalize(getCellValue(a, sampleA, key));
      const vb = normalize(getCellValue(b, sampleB, key));
    
      const base = collator.compare(va, vb);
      return direction === "asc" ? base : -base;
    });
  }, [experiments, sort, samplesMap, getCellValue]);



    function SortMenu({
      label,
      sort,
      onSortChange,
    }: {
      label: string;
      sort: SortState;
      onSortChange: (next: SortState) => void;
      }) {
    const isActive = sort?.key === label;
    const dir = isActive ? sort!.direction : null;

    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
        <IconButton variant="ghost" size="1" aria-label={`Sort ${label}`}>
          <CaretDownIcon />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item
          onSelect={() => onSortChange({ key: label, direction: "asc" })}
        >
          <ArrowUpIcon /> Sort Ascending
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onSelect={() => onSortChange({ key: label, direction: "desc" })}
        >
          <ArrowDownIcon /> Sort Descending
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        <DropdownMenu.Item disabled={!isActive} onSelect={() => onSortChange(null)}>
          Clear sort
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    );
  }


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
              <Badge size={{ initial: "1", md: "3" }} color="brown">
                {accession}
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
                      <a
                        key={`${entry.key}:${value}`}
                        href={`/p/${value}`}
                      >
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
                    style={{
                      width: "100%",
                      overflowX: "auto",
                      WebkitOverflowScrolling: "touch",
                      maxHeight: "500px",
                      overflowY: "auto",
                    }}
                  >
                    <Table.Root
                      style={{
                        width: "100%",
                        minWidth: "800px",
                      }}
                      variant="surface"
                    >

                    
                        <Table.Header
                          style={{
                            overflow: "scroll",
                            maxHeight: "30rem",
                          }}
                        >
                          <Table.Row>
                            {columns.map((label) => {
                              const isActive = sort?.key === label;
                              const dir = isActive ? sort!.direction : null;
                            
                              // give a few columns larger min widths like you had before
                              const minWidth =
                                label === "Title" || label === "Sample Title" || label === "Scientific Name"
                                  ? "200px"
                                  : label.startsWith("Description")
                                    ? "220px"
                                    : "150px";
                            
                              return (
                                <Table.ColumnHeaderCell key={label} style={{ minWidth }}>
                                  <Flex align="center" justify="between" gap="2">
                                    <Flex align="center" gap="1">
                                      <span>{label}</span>
                                      {dir === "asc" ? (
                                        <ArrowUpIcon />
                                      ) : dir === "desc" ? (
                                        <ArrowDownIcon />
                                      ) : null}
                                    </Flex>
                                    
                                    <SortMenu label={label} sort={sort} onSortChange={setSort} />
                                  </Flex>
                                </Table.ColumnHeaderCell>
                              );
                            })}
                          </Table.Row>
                        </Table.Header>
                          
                          
                    <Table.Body>
                      {sortedExperiments.map((e) => {
                        const sampleAcc = e.samples[0];
                        const sample =
                          sampleAcc && samplesMap
                            ? samplesMap.get(sampleAcc)
                            : null;
                        return (
                          <Table.Row key={e.accession}>
                            <Table.RowHeaderCell>
                              <Link
                                href={`https://www.ncbi.nlm.nih.gov/sra/${e.accession}[accn]`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {e.accession}
                              </Link>
                            </Table.RowHeaderCell>
                            <Table.Cell>{e.title ?? "-"}</Table.Cell>
                            <Table.Cell>
                              {e.library_name ?? e.library_strategy ?? "-"}
                            </Table.Cell>
                            <Table.Cell>{e.library_layout ?? "-"}</Table.Cell>
                            <Table.Cell>{e.platform ?? "-"}</Table.Cell>
                            <Table.Cell>{e.instrument_model ?? "-"}</Table.Cell>
                            <Table.Cell>
                              {(sampleAcc &&
                                (sampleAcc.startsWith("SRS") ||
                                  sampleAcc.startsWith("ERS"))) ||
                              sampleAcc.startsWith("DRS") ? (
                                <Link
                                  href={`https://www.ncbi.nlm.nih.gov/sra/${sampleAcc}[accn]`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {sampleAcc}
                                </Link>
                              ) : (
                                <span>{sampleAcc ?? "-"}</span>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              {sample?.alias &&
                              sample.alias.startsWith("GSM") ? (
                                <Link
                                  href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${sample.alias}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {sample.alias}
                                </Link>
                              ) : sample?.alias &&
                                sample.alias.startsWith("SAM") ? (
                                <Link
                                  href={`https://www.ncbi.nlm.nih.gov/biosample/${sample.alias}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {sample.alias}
                                </Link>
                              ) : (
                                <span>{sample?.alias ?? "-"}</span>
                              )}
                            </Table.Cell>
                            <Table.Cell>{sample?.title ?? "-"}</Table.Cell>
                            <Table.Cell>
                              {sample?.description ?? "-"}
                            </Table.Cell>
                            <Table.Cell>
                              {sample?.scientific_name ?? "-"}
                            </Table.Cell>
                            <Table.Cell>{sample?.taxon_id ?? "-"}</Table.Cell>
                            {attributeKeys.map((key) => (
                              <Table.Cell key={key}>
                                {sample?.attributes_json?.[key] ?? "-"}
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                  </div>
                )}
            </Flex>
            <Text weight="medium" size="6">
              Linked publications
            </Text>

            {isPublicationsLoading && (
              <Flex gap="2" align="center">
                <Spinner size="2" />
                <Text size="2">Loading publications...</Text>
              </Flex>
            )}

            {publications && publications.length > 0 && (
              <Flex direction="column" gap="3">
                {publications.map((pub) => (
                  <PublicationCard key={pub.uid} publication={pub} />
                ))}
              </Flex>
            )}

            {!isPublicationsLoading &&
              (!publications || publications.length === 0) && (
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
          </Flex>
        </>
      )}
    </>
  );
}
