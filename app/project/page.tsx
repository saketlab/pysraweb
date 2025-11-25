"use client";
import SearchBar from "@/components/search-bar";
import SimilarCard from "@/components/similar-card";
import TableHeaders from "@/components/table-headers";
import TableRow from "@/components/table-row";
import { SERVER_URL } from "@/utils/constants";
import exportExperimentsToCsv from "@/utils/exportCsv";
import { Experiment } from "@/utils/types";
import {
  CaretSortIcon,
  DownloadIcon,
  InfoCircledIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  Badge,
  Button,
  Flex,
  Grid,
  IconButton,
  Link,
  Popover,
  Separator,
  Spinner,
  Table,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

const fetchExperiments = async (studyAcc: string | null) => {
  if (!studyAcc) {
    return null;
  }

  const res = await fetch(`${SERVER_URL}/experiments?srp=${studyAcc}`);
  if (!res.ok) {
    throw new Error("Network error");
  }
  const data = await res.json();
  console.log(data[studyAcc]);

  return data[studyAcc] as Experiment[];
};

export default function ProjectPage() {
  const searchParams = useSearchParams();
  const studyAcc = searchParams.get("srp");
  const {
    data: experiments,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["study", studyAcc],
    queryFn: () => fetchExperiments(studyAcc), // fallback if cache empty
    enabled: !!studyAcc,
  });
  return (
    <>
      <SearchBar searchQuery={""} />

      {/* No studyAcc in URL */}
      {!studyAcc && (
        <Flex
          gap="2"
          align="center"
          style={{ width: "65%", marginLeft: "8.2rem", marginTop: "1rem" }}
          justify="center"
        >
          <Text color="gray">
            No project selected. Please go back and choose a project.
          </Text>
        </Flex>
      )}

      {/* Loading state */}
      {studyAcc && isLoading && (
        <Flex
          gap="2"
          align="center"
          style={{ width: "65%", marginLeft: "8.2rem", marginTop: "1rem" }}
          justify="center"
        >
          <Spinner size="3" />
          <Text>Search in progress</Text>
        </Flex>
      )}

      {/* Error state */}
      {studyAcc && isError && (
        <Flex
          gap="2"
          align="center"
          style={{ width: "65%", marginLeft: "8.2rem", marginTop: "1rem" }}
          justify="center"
        >
          <Text color="red">
            {error instanceof Error
              ? error.message
              : "An error occurred while loading the project"}
          </Text>
        </Flex>
      )}

      {/* Data state */}
      {studyAcc &&
        !isLoading &&
        !isError &&
        experiments &&
        experiments.length > 0 && (
          <>
            <Flex
              style={{ marginLeft: "8.2rem", width: "80%" }}
              py="3"
              direction="column"
              gap="2"
            >
              <Flex justify="between" style={{ width: "100%" }} align="center">
                <Text size="8" weight="bold">
                  {experiments[0].study_title}
                </Text>
                <Flex gap="2">
                  <IconButton variant="outline">
                    <MixerHorizontalIcon />
                  </IconButton>
                  <IconButton variant="outline">
                    <CaretSortIcon />
                  </IconButton>
                  <Button
                    onClick={() =>
                      exportExperimentsToCsv(
                        experiments,
                        `${studyAcc ?? "project"}-experiments.csv`
                      )
                    }
                  >
                    <DownloadIcon /> Download
                  </Button>
                </Flex>
              </Flex>
              <Flex align="center" gap="2">
                <Badge size="3" style={{ alignSelf: "flex-start" }}>
                  {studyAcc}
                </Badge>
                <Separator orientation="vertical" />
                <Text>Published on 20th October, 2020</Text>
              </Flex>
            </Flex>

            <Table.Root
              variant="surface"
              style={{
                marginLeft: "8.2rem",
                width: "80%",
                overflow: "scroll",
                marginTop: "1rem",
                maxHeight: "30rem",
              }}
            >
              <TableHeaders
                tableHeaders={Object.keys(experiments[0]).filter(
                  (k) => k !== "study_title"
                )}
              />
              <Table.Body>
                {experiments.map((exp, idx) => (
                  <TableRow
                    key={idx}
                    rowValues={Object.entries(exp)
                      .filter(([k]) => k !== "study_title")
                      .map(([, v]) =>
                        v === null || v === undefined ? "" : String(v)
                      )}
                  />
                ))}
              </Table.Body>
            </Table.Root>

            <Flex
              style={{ marginLeft: "8.2rem", width: "80%", marginTop: "1rem" }}
              py="3"
              direction="column"
              gap="4"
            >
              <Flex align="center" gap="2">
                <Text weight="medium" size="6">
                  Similar projects
                </Text>
                <Popover.Root>
                  <Popover.Trigger>
                    <InfoCircledIcon />
                  </Popover.Trigger>
                  <Popover.Content width="360px">
                    <Text size="2">
                      Project similarity is measured based on metadata and other
                      attributes. Read <Link href="#">our paper</Link> to learn
                      more.
                    </Text>
                  </Popover.Content>
                </Popover.Root>
              </Flex>
              <Grid columns="4" gap="4">
                <SimilarCard />
              </Grid>
            </Flex>
          </>
        )}

      {/* Empty state */}
      {studyAcc &&
        !isLoading &&
        !isError &&
        (!experiments || experiments.length === 0) && (
          <div style={{ paddingTop: "1rem" }}>
            <Text color="gray" style={{ marginLeft: "8.2rem" }}>
              No experiments found for project {studyAcc}
            </Text>
          </div>
        )}
    </>
  );
}
