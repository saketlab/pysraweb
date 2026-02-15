"use client";
import ProjectSummary from "@/components/project-summary";
import PublicationCard, { PubMedArticle } from "@/components/publication-card";
import SearchBar from "@/components/search-bar";
import SimilarProjectsGraph, {
  SimilarNeighbor,
} from "@/components/similar-projects-graph";
import SubmittingOrgPanel, {
  CenterInfo,
} from "@/components/submitting-org-panel";
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
import React, { useState } from "react";

// Component to truncate text in table cells with more/less toggle
function TruncatedCell({
  text,
  wordLimit = 10,
}: {
  text: string | null;
  wordLimit?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text === "-") return <>{text ?? "-"}</>;

  const words = text.split(/\s+/);
  const shouldTruncate = words.length > wordLimit;

  if (!shouldTruncate) return <>{text}</>;

  const display = expanded ? text : words.slice(0, wordLimit).join(" ") + "...";

  return (
    <>
      {display}
      <Link
        ml="1"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "less" : "more"}
      </Link>
    </>
  );
}

type Project = {
  accession: string;
  title: string;
  summary: string;
  overall_design: string;
  organisms?: string[] | string | null;
  coords_2d?: number[] | null;
  coords_3d?: number[] | null;
  neighbors?: SimilarNeighbor[] | null;
  alias?: string | null;
  pubmed_id: string[];
  samples_ref: string | null;
  series_type: string | null;
  relation: string | null;
  supplementary_data: string | null;
  published_at: Date | null;
  updated_at: Date | null;
  center?: CenterInfo[] | null;
};

// type SimilarProject = {
//   accession: string;
//   title: string | null;
//   summary: string | null;
//   updated_at: Date | null;
// };

type Characteristic = {
  "@tag": string;
  "#text": string;
};

type Channel = {
  Label: string | null;
  Source: string | null;
  Molecule: string | null;
  Organism: { "#text": string; "@taxid": string } | null;
  "@position": string | null;
  "Label-Protocol": string | null;
  "Extract-Protocol": string | null;
  Characteristics?: Characteristic[];
};

type GeoSample = {
  accession: string;
  channel_count: number | null;
  channels: Channel[] | null;
  description: string | null;
  platform_ref: string | null;
  published_at: Date | null;
  updated_at: Date | null;
  supplementary_data: unknown[] | null;
  title: string | null;
  sample_type: string | null;
  hybridization_protocol: string | null;
  scan_protocol: string | null;
};

const fetchSamples = async (accession: string): Promise<GeoSample[]> => {
  const res = await fetch(`${SERVER_URL}/geo/series/${accession}/samples`);
  if (!res.ok) {
    throw new Error("Network error");
  }
  return res.json();
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
  return data as Project;
};

// const fetchSimilarProjects = async (
//   searchText: string,
//   currentAccession: string,
// ): Promise<SimilarProject[]> => {
//   const res = await fetch(
//     `${SERVER_URL}/search?q=${encodeURIComponent(searchText)}&db=geo`,
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

const SUMMARY_CHAR_LIMIT = 350;

export default function GeoProjectPage() {
  const params = useParams();
  const accession = params.accession as string | undefined;
  const isArrayExpress = accession?.toUpperCase().startsWith("E-") ?? false;

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["project", accession],
    queryFn: () => fetchProject(accession ?? null),
    enabled: !!accession,
  });

  // const { data: similarProjects, isLoading: isSimilarLoading } = useQuery({
  //   queryKey: ["similarProjects", project?.overall_design],
  //   queryFn: () =>
  //     fetchSimilarProjects(project!.overall_design, project!.accession),
  //   enabled: !!project?.overall_design,
  // });

  const { data: publications, isLoading: isPublicationsLoading } = useQuery({
    queryKey: ["publications", project?.pubmed_id],
    queryFn: () => fetchPubMedData(project!.pubmed_id),
    enabled: !!project?.pubmed_id && project.pubmed_id.length > 0,
  });

  const { data: samples, isLoading: isSamplesLoading } = useQuery({
    queryKey: ["samples", accession],
    queryFn: () => fetchSamples(accession!),
    enabled: !!accession,
  });

  // Collect all unique characteristic tags across all samples and channels
  const characteristicTags = React.useMemo(() => {
    if (!samples) return [];
    const tags = new Set<string>();
    samples.forEach((sample) => {
      sample.channels?.forEach((channel) => {
        if (Array.isArray(channel.Characteristics)) {
          channel.Characteristics.forEach((char) => {
            if (char["@tag"]) tags.add(char["@tag"]);
          });
        } else if (
          channel.Characteristics &&
          typeof channel.Characteristics === "object"
        ) {
          if (channel.Characteristics["@tag"])
            tags.add(channel.Characteristics["@tag"]);
        }
      });
    });
    return Array.from(tags);
  }, [samples]);
  return (
    <>
      <SearchBar initialQuery={""} />

      {!accession && (
        <Flex
          gap="4"
          align="center"
          p={"4"}
          ml={{ initial: "0", md: "8rem" }}
          mr={{ initial: "0", md: "16rem" }}
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
          mr={{ initial: "0", md: "16rem" }}
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
            <Flex justify={"start"} align="center" gap="2" wrap="wrap">
              <Badge size={{ initial: "1", md: "3" }}>{accession}</Badge>
              {samples && samples.length > 0 && (
                <Badge size={{ initial: "1", md: "3" }} color="gray">
                  {samples.length} {samples.length === 1 ? "Sample" : "Samples"}
                </Badge>
              )}
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
              {project.alias?.startsWith("S") && (
                <a href={`/p/${project.alias}`}>
                  <Badge
                    size={{ initial: "1", md: "3" }}
                    color="brown"
                    style={{ cursor: "pointer" }}
                  >
                    {project.alias}
                    <EnterIcon />
                  </Badge>
                </a>
              )}
              {project.relation &&
                (() => {
                  const relations = project.relation as unknown as {
                    "@target": string;
                    "@type": string;
                  }[];
                  const bioProject = relations.find(
                    (r) => r["@type"] === "BioProject",
                  );
                  if (!bioProject) return null;
                  return (
                    <a
                      href={bioProject["@target"]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge
                        size={{ initial: "1", md: "3" }}
                        color="green"
                        style={{ cursor: "pointer" }}
                      >
                        {bioProject["@target"].split("/").pop()}
                        <ExternalLinkIcon />
                      </Badge>
                    </a>
                  );
                })()}
              <a
                href={
                  isArrayExpress
                    ? `https://www.ebi.ac.uk/biostudies/ArrayExpress/studies/${accession}/sdrf`
                    : `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${accession}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge size={{ initial: "1", md: "3" }} color="sky">
                  {isArrayExpress ? "Visit ArrayExpress page" : "Visit GEO page"}{" "}
                  <ExternalLinkIcon />
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
              text={project.summary}
              charLimit={SUMMARY_CHAR_LIMIT}
            />
            {project.relation &&
              (() => {
                const relations = project.relation as unknown as {
                  "@target": string;
                  "@type": string;
                }[];
                const superSeries = relations.filter(
                  (r) => r["@type"] === "SuperSeries of",
                );
                const subSeries = relations.filter(
                  (r) => r["@type"] === "SubSeries of",
                );

                if (superSeries.length === 0 && subSeries.length === 0)
                  return null;

                return (
                  <Flex direction="column" gap="2">
                    {superSeries.length > 0 && (
                      <Flex align="center" gap="2" wrap="wrap">
                        <Text size="2" weight="medium">
                          SuperSeries of:
                        </Text>
                        {superSeries.map((s) => (
                          <a
                            key={s["@target"]}
                            href={`/p/${s["@target"]}`}
                          >
                            <Badge
                              size={{ initial: "1", md: "2" }}
                              style={{ cursor: "pointer" }}
                            >
                              {s["@target"]}
                            </Badge>
                          </a>
                        ))}
                      </Flex>
                    )}
                    {subSeries.length > 0 && (
                      <Flex align="center" gap="2" wrap="wrap">
                        <Text size="2" weight="medium">
                          SubSeries of:
                        </Text>
                        {subSeries.map((s) => (
                          <a
                            key={s["@target"]}
                            href={`/p/${s["@target"]}`}
                          >
                            <Badge
                              size={{ initial: "1", md: "2" }}
                              style={{ cursor: "pointer" }}
                            >
                              {s["@target"]}
                            </Badge>
                          </a>
                        ))}
                      </Flex>
                    )}
                  </Flex>
                );
              })()}
            <Text weight="medium" size="6">
              Overall design
            </Text>
            <Text>{project.overall_design}</Text>

            {/* Samples table */}
            <Flex justify={"between"} align={"center"}>
              <Text weight="medium" size="6">
                Samples
              </Text>
              <Button
                onClick={() => {
                  if (!samples || samples.length === 0) return;
                  // Build CSV headers
                  const headers = [
                    "Sample",
                    "Title",
                    "Description",
                    "Channel Count",
                    "Sample Type",
                    "Platform",
                    "Channel Position",
                    "Label",
                    "Source",
                    "Molecule",
                    "Organism",
                    "Label Protocol",
                    "Extract Protocol",
                    ...characteristicTags,
                    "Hybridization Protocol",
                    "Scan Protocol",
                  ];

                  // Build CSV rows
                  const rows = samples.flatMap((sample) => {
                    const channels = sample.channels ?? [];
                    if (channels.length === 0) {
                      return [
                        [
                          sample.accession,
                          sample.title ?? "-",
                          sample.description ?? "-",
                          sample.channel_count ?? "-",
                          sample.sample_type ?? "-",
                          sample.platform_ref ?? "-",
                          "-",
                          "-",
                          "-",
                          "-",
                          "-",
                          "-",
                          "-",
                          ...characteristicTags.map(() => "-"),
                          sample.hybridization_protocol ?? "-",
                          sample.scan_protocol ?? "-",
                        ],
                      ];
                    }
                    return channels.map((channel, channelIdx) => {
                      const charMap = new Map();
                      if (Array.isArray(channel.Characteristics)) {
                        channel.Characteristics.forEach((char) => {
                          if (char["@tag"])
                            charMap.set(char["@tag"], char["#text"] ?? "-");
                        });
                      } else if (
                        channel.Characteristics &&
                        typeof channel.Characteristics === "object"
                      ) {
                        if (channel.Characteristics["@tag"])
                          charMap.set(
                            channel.Characteristics["@tag"],
                            channel.Characteristics["#text"] ?? "-",
                          );
                      }
                      return [
                        sample.accession,
                        sample.title ?? "-",
                        sample.description ?? "-",
                        sample.channel_count ?? "-",
                        sample.sample_type ?? "-",
                        sample.platform_ref ?? "-",
                        channel["@position"] ?? channelIdx + 1,
                        channel.Label ?? "-",
                        channel.Source ?? "-",
                        channel.Molecule ?? "-",
                        channel.Organism?.["#text"] ?? "-",
                        channel["Label-Protocol"] ?? "-",
                        channel["Extract-Protocol"] ?? "-",
                        ...characteristicTags.map(
                          (tag) => charMap.get(tag) ?? "-",
                        ),
                        sample.hybridization_protocol ?? "-",
                        sample.scan_protocol ?? "-",
                      ];
                    });
                  });

                  // Use exportCsv utility
                  import("@/utils/exportCsv").then((mod) => {
                    // Convert rows to array of objects for exportExperimentsToCsv
                    const experiments = rows.map((row) => {
                      const obj: Record<string, unknown> = {};
                      headers.forEach((header, idx) => {
                        obj[header] = row[idx];
                      });
                      return obj;
                    });
                    mod.default(experiments, `${accession}_samples.csv`);
                  });
                }}
              >
                <DownloadIcon /> CSV
              </Button>
            </Flex>
            <Flex
              align="start"
              gap="2"
              direction="column"
              style={{
                width: "100%",
                maxHeight: "500px",
              }}
            >
              {isSamplesLoading && (
                <Flex gap="2" align="center">
                  <Spinner size="2" />
                  <Text size="2">Loading samples...</Text>
                </Flex>
              )}
              {!isSamplesLoading && samples && samples.length === 0 && (
                <Text size="2" color="gray">
                  No samples found
                </Text>
              )}
              {!isSamplesLoading && samples && samples.length > 0 && (
                <Table.Root
                  style={{
                    width: "100%",
                    tableLayout: "fixed",
                    overflowX: "auto",
                    overflowY: "auto",
                  }}
                  variant="surface"
                  size={"1"}
                >
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell style={{ minWidth: "120px" }}>
                        Sample
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "200px" }}>
                        Title
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "250px" }}>
                        Description
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "120px" }}>
                        Channel Count
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "120px" }}>
                        Sample Type
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "120px" }}>
                        Platform
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "130px" }}>
                        Channel Position
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "80px" }}>
                        Label
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "200px" }}>
                        Source
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "120px" }}>
                        Molecule
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "120px" }}>
                        Organism
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "300px" }}>
                        Label Protocol
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "300px" }}>
                        Extract Protocol
                      </Table.ColumnHeaderCell>
                      {characteristicTags.map((tag) => (
                        <Table.ColumnHeaderCell
                          key={tag}
                          style={{ minWidth: "120px" }}
                        >
                          {tag}
                        </Table.ColumnHeaderCell>
                      ))}
                      <Table.ColumnHeaderCell style={{ minWidth: "300px" }}>
                        Hybridization Protocol
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell style={{ minWidth: "300px" }}>
                        Scan Protocol
                      </Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {samples.flatMap((sample) => {
                      const channels = sample.channels ?? [];
                      if (channels.length === 0) {
                        // Show sample with no channel data
                        return (
                          <Table.Row key={sample.accession}>
                            <Table.RowHeaderCell>
                              <Link
                                href={
                                  isArrayExpress
                                    ? `https://www.ebi.ac.uk/biostudies/ArrayExpress/studies/${accession}/sdrf`
                                    : `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${sample.accession}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {sample.accession}
                              </Link>
                            </Table.RowHeaderCell>
                            <Table.Cell>
                              <TruncatedCell text={sample.title} />
                            </Table.Cell>
                            <Table.Cell>
                              <TruncatedCell text={sample.description} />
                            </Table.Cell>
                            <Table.Cell>
                              {sample.channel_count ?? "-"}
                            </Table.Cell>
                            <Table.Cell>{sample.sample_type ?? "-"}</Table.Cell>
                            <Table.Cell>
                              <Link
                                href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${sample.platform_ref}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {sample.platform_ref ?? "-"}
                              </Link>
                            </Table.Cell>
                            <Table.Cell>-</Table.Cell>
                            <Table.Cell>-</Table.Cell>
                            <Table.Cell>-</Table.Cell>
                            <Table.Cell>-</Table.Cell>
                            <Table.Cell>-</Table.Cell>
                            <Table.Cell>-</Table.Cell>
                            <Table.Cell>-</Table.Cell>
                            {characteristicTags.map((tag) => (
                              <Table.Cell key={tag}>-</Table.Cell>
                            ))}
                            <Table.Cell>
                              <TruncatedCell
                                text={sample.hybridization_protocol}
                              />
                            </Table.Cell>
                            <Table.Cell>
                              <TruncatedCell text={sample.scan_protocol} />
                            </Table.Cell>
                          </Table.Row>
                        );
                      }
                      return channels.map((channel, channelIdx) => {
                        // Build a map of characteristic tag -> value for this channel
                        const charMap = new Map<string, string>();

                        if (Array.isArray(channel.Characteristics)) {
                          channel.Characteristics.forEach((char) => {
                            if (char["@tag"])
                              charMap.set(char["@tag"], char["#text"] ?? "-");
                          });
                        } else if (
                          channel.Characteristics &&
                          typeof channel.Characteristics === "object"
                        ) {
                          if (channel.Characteristics["@tag"])
                            charMap.set(
                              channel.Characteristics["@tag"],
                              channel.Characteristics["#text"] ?? "-",
                            );
                        }
                        return (
                          <Table.Row
                            key={`${sample.accession}-ch${channelIdx}`}
                          >
                            <Table.RowHeaderCell>
                              <Link
                                href={
                                  isArrayExpress
                                    ? `https://www.ebi.ac.uk/biostudies/ArrayExpress/studies/${accession}/sdrf`
                                    : `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${sample.accession}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {sample.accession}
                              </Link>
                            </Table.RowHeaderCell>
                            <Table.Cell>
                              <TruncatedCell text={sample.title} />
                            </Table.Cell>
                            <Table.Cell>
                              <TruncatedCell text={sample.description} />
                            </Table.Cell>
                            <Table.Cell>
                              {sample.channel_count ?? "-"}
                            </Table.Cell>
                            <Table.Cell>{sample.sample_type ?? "-"}</Table.Cell>
                            <Table.Cell>
                              <Link
                                href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${sample.platform_ref}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {sample.platform_ref ?? "-"}
                              </Link>
                            </Table.Cell>
                            <Table.Cell>
                              {channel["@position"] ?? channelIdx + 1}
                            </Table.Cell>
                            <Table.Cell>{channel.Label ?? "-"}</Table.Cell>
                            <Table.Cell>
                              <TruncatedCell text={channel.Source} />
                            </Table.Cell>
                            <Table.Cell>{channel.Molecule ?? "-"}</Table.Cell>
                            <Table.Cell>
                              {channel.Organism?.["#text"] ?? "-"}
                            </Table.Cell>
                            <Table.Cell>
                              <TruncatedCell text={channel["Label-Protocol"]} />
                            </Table.Cell>
                            <Table.Cell>
                              <TruncatedCell
                                text={channel["Extract-Protocol"]}
                              />
                            </Table.Cell>
                            {characteristicTags.map((tag) => (
                              <Table.Cell key={tag}>
                                {charMap.get(tag) ?? "-"}
                              </Table.Cell>
                            ))}
                            <Table.Cell>
                              <TruncatedCell
                                text={sample.hybridization_protocol}
                              />
                            </Table.Cell>
                            <Table.Cell>
                              <TruncatedCell text={sample.scan_protocol} />
                            </Table.Cell>
                          </Table.Row>
                        );
                      });
                    })}
                  </Table.Body>
                </Table.Root>
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
              source="geo"
              title={project.title}
              description={project.summary}
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
