"use client";
import ProjectSummary from "@/components/project-summary";
import ResultCard from "@/components/result-card";
import SearchBar from "@/components/search-bar";
import { SERVER_URL } from "@/utils/constants";
import {
  DownloadIcon,
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
  alias: string;
  title: string;
  abstract: string;
  submission: string;
  study_type: string;
  updated_at: Date;
};

type SimilarProject = {
  accession: string;
  title: string | null;
  summary: string | null;
  updated_at: Date | null;
};

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
  const data = await res.json();
  return data as Project;
};

const fetchSimilarProjects = async (
  searchText: string,
  currentAccession: string,
): Promise<SimilarProject[]> => {
  const res = await fetch(
    `${SERVER_URL}/search?q=${encodeURIComponent(searchText)}&db=sra`,
  );
  if (!res.ok) {
    throw new Error("Network error");
  }
  const data = await res.json();
  // Filter out the current project and return top 5
  return (data.results as SimilarProject[])
    .filter((p) => p.accession !== currentAccession)
    .slice(0, 5);
};

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

  const { data: similarProjects, isLoading: isSimilarLoading } = useQuery({
    queryKey: ["similarProjects", project?.abstract],
    queryFn: () => fetchSimilarProjects(project!.abstract, project!.accession),
    enabled: !!project?.abstract,
  });
  return (
    <>
      <SearchBar initialQuery={""} />

      {!accession && (
        <Flex
          gap="4"
          align="center"
          p={"4"}
          ml={{ md: "8rem" }}
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
          ml={{ md: "8rem" }}
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
            src="./controls.svg"
            alt="empty box"
            width={100}
            height={100}
          />
          <Text color="gray" size={"6"} weight={"bold"}>
            Failed to connect
          </Text>
          <Text color="gray" size={"2"}>
            Check your network connection
          </Text>
        </Flex>
      )}

      {/* Data state */}
      {accession && !isLoading && !isError && project && (
        <>
          <Flex
            ml={{ md: "12rem" }}
            mr={{ md: "8rem" }}
            py="3"
            px={{ initial: "3" }}
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
                <a href={`/project/geo/${project.alias}`}>
                  <Badge
                    size={{ initial: "1", md: "3" }}
                    style={{ cursor: "pointer" }}
                  >
                    {project.alias}
                  </Badge>
                </a>
              )}
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
              // mt="3"
              direction="column"
              style={{
                width: "100%",
                maxHeight: "500px",
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
                  <Table.Root
                    style={{
                      width: "100%",
                      tableLayout: "fixed",
                      overflowX: "auto",
                      overflowY: "auto",
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
                        <Table.ColumnHeaderCell>
                          Accession
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ minWidth: "200px" }}>
                          Title
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Library</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Layout</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                          Platform
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                          Instrument
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Sample</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                          Sample Alias
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ minWidth: "200px" }}>
                          Sample Title
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                          Description
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ minWidth: "200px" }}>
                          Scientific Name
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                          Taxon ID
                        </Table.ColumnHeaderCell>
                        {attributeKeys.map((key) => (
                          <Table.ColumnHeaderCell
                            style={{ minWidth: "150px" }}
                            key={key}
                          >
                            {key}
                          </Table.ColumnHeaderCell>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {experiments.map((e) => {
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
                )}
            </Flex>
            {/* Table here */}
            <Flex align="center" gap="2">
              <Text weight="medium" size="6">
                Similar projects
              </Text>
            </Flex>
            {isSimilarLoading && (
              <Flex gap="2" align="center">
                <Spinner size="2" />
                <Text size="2">Finding similar projects...</Text>
              </Flex>
            )}
            {similarProjects && similarProjects.length > 0 && (
              <Flex direction="column" gap="3">
                {similarProjects.map((p) => (
                  <ResultCard
                    key={p.accession}
                    accesssion={p.accession}
                    title={p.title}
                    summary={p.summary}
                    updated_at={p.updated_at}
                  />
                ))}
              </Flex>
            )}
            {similarProjects && similarProjects.length === 0 && (
              <Text size="2" color="gray">
                No similar projects found
              </Text>
            )}
          </Flex>
        </>
      )}
    </>
  );
}
