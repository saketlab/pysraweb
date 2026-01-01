"use client";
import ResultCard from "@/components/result-card";
import SearchBar from "@/components/search-bar";
import { SERVER_URL } from "@/utils/constants";
import { HomeIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Badge, Button, Flex, Spinner, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Project = {
  accession: string;
  alias: string;
  title: string;
  abstract: string;
  submission: string;
  study_type: string;
};

type SimilarProject = {
  accession: string;
  title: string | null;
  summary: string | null;
  updated_at: Date | null;
};

const fetchProject = async (
  accession: string | null
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
  title: string,
  currentAccession: string
): Promise<SimilarProject[]> => {
  const res = await fetch(
    `${SERVER_URL}/search-similar?q=${encodeURIComponent(
      title
    )}&limit=6&offset=0`
  );
  if (!res.ok) {
    throw new Error("Network error");
  }
  const data = await res.json();
  // Filter out the current project and return top 5
  return (data as SimilarProject[])
    .filter((p) => p.accession !== currentAccession)
    .slice(0, 5);
};

const ABSTRACT_CHAR_LIMIT = 350;

export default function ProjectPage() {
  const searchParams = useSearchParams();
  const accession = searchParams.get("srp");
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["project", accession],
    queryFn: () => fetchProject(accession),
    enabled: !!accession,
  });

  const { data: similarProjects, isLoading: isSimilarLoading } = useQuery({
    queryKey: ["similarProjects", project?.title],
    queryFn: () => fetchSimilarProjects(project!.title, project!.accession),
    enabled: !!project?.title,
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
            <Flex align="start" gap="2">
              <Badge size={{ initial: "1", md: "3" }} color="brown">
                {accession}
              </Badge>
              <Badge size={{ initial: "1", md: "3" }} color="gray">
                20 Experiments
              </Badge>
            </Flex>
            <Flex align={"center"} gap={"2"}>
              <InfoCircledIcon />
              <Text>Last updated on 20 Mar 2025</Text>
            </Flex>
            <Text>
              {isAbstractExpanded ||
              project.abstract.length <= ABSTRACT_CHAR_LIMIT
                ? project.abstract
                : `${project.abstract.slice(0, ABSTRACT_CHAR_LIMIT)}...`}
              {project.abstract.length > ABSTRACT_CHAR_LIMIT && (
                <Button
                  variant="ghost"
                  size="3"
                  ml="1"
                  onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
                >
                  {isAbstractExpanded ? "less" : "more"}
                </Button>
              )}
            </Text>
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
