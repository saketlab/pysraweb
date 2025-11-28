"use client";
import InfoPopOver from "@/components/info-popover";
import SearchBar from "@/components/search-bar";
import SimilarCard from "@/components/similar-card";
import TableHeaders from "@/components/table-headers";
import TableRow from "@/components/table-row";
import { SERVER_URL } from "@/utils/constants";
import exportExperimentsToCsv from "@/utils/exportCsv";
import { Experiment } from "@/utils/types";
import { DownloadIcon } from "@radix-ui/react-icons";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Link,
  Separator,
  Spinner,
  Table,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
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
    queryKey: ["experiments", studyAcc],
    queryFn: () => fetchExperiments(studyAcc),
    enabled: !!studyAcc,
  });
  return (
    <>
      <SearchBar searchQuery={""} />
      {/* LLM-generated Summary */}
      {/* No studyAcc in URL */}
      {!studyAcc && (
        <Flex
          gap="2"
          align="center"
          pt={"3"}
          ml={{ md: "8rem" }}
          mr={{ md: "16rem" }}
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
      {studyAcc && isError && (
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
            width={"100"}
            height={"100"}
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
      {studyAcc &&
        !isLoading &&
        !isError &&
        experiments &&
        experiments.length > 0 && (
          <>
            <Flex
              ml={{ md: "8rem" }}
              mr={{ md: "8rem" }}
              py="3"
              px={{ initial: "3" }}
              direction="column"
              gap="2"
            >
              <Flex justify="between" style={{ width: "100%" }} align="center">
                <Text size={{ initial: "5", md: "8" }} weight="bold">
                  {experiments[0].study_title}
                </Text>
                <Flex gap="2" display={{ initial: "none", md: "flex" }}>
                  {/* TODO: Maybe move these buttons beside the table? */}
                  {/* <IconButton variant="outline">
                    <MixerHorizontalIcon />
                  </IconButton>
                  <IconButton variant="outline">
                    <CaretSortIcon />
                  </IconButton> */}
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
                <Badge
                  size={{ initial: "1", md: "3" }}
                  style={{ alignSelf: "flex-start" }}
                >
                  {studyAcc}
                </Badge>
                <Separator orientation="vertical" />
                <Text>
                  {experiments && experiments.length === 1
                    ? "1 Experiment"
                    : `${experiments?.length ?? 0} Experiments`}
                </Text>
                <Box display={{ initial: "none", md: "block" }}>
                  <Separator orientation="vertical" />
                  <Text>Published on 20th October, 2020</Text>
                </Box>
              </Flex>
              <Box display={{ initial: "block", md: "none" }}>
                <Text>Published on 20th October, 2020</Text>
              </Box>

              {/* <Flex>
                <Text weight={"medium"} size={"4"}>
                  Summary
                </Text>
              </Flex> */}
              <Text color="gray">
                <strong style={{ color: "black" }}>Summary</strong>{" "}
                <InfoPopOver infoText="Summary generated by LLM based on available metadata" />
                Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                Officiis modi, sapiente ut voluptatum aliquam quae. Suscipit
                alias sapiente autem iste.
              </Text>
            </Flex>
            <Table.Root
              variant="surface"
              ml={{ md: "8rem" }}
              mr={{ md: "8rem" }}
              style={{
                // width: "80%",
                overflow: "scroll",
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
              pt={"3"}
              px={{ initial: "3" }}
              ml={{ md: "8rem" }}
              mr={{ md: "8rem" }}
              direction="column"
              gap="4"
            >
              <Flex align="center" gap="2">
                <Text weight="medium" size="6">
                  Linked publications
                </Text>
              </Flex>
              <Grid columns={{ initial: "2", md: "4" }} gap="4">
                <SimilarCard />
                <SimilarCard />
                <SimilarCard />
              </Grid>
            </Flex>

            <Flex
              px={{ initial: "3" }}
              ml={{ md: "8rem" }}
              mr={{ md: "8rem" }}
              py="3"
              direction="column"
              gap="4"
            >
              <Flex align="center" gap="2">
                <Text weight="medium" size="6">
                  Similar projects
                </Text>
                <InfoPopOver infoText="Project similarity is measured based on metadata and other attributes" />
              </Flex>
              <Grid columns={{ initial: "2", md: "4" }} gap="4">
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
          <Flex
            align="center"
            justify="center"
            direction={"column"}
            height={"20rem"}
          >
            {/* Credits: https://www.svgrepo.com/svg/489659/empty-box */}
            <Image
              src="./empty-box.svg"
              alt="empty box"
              width={"100"}
              height={"100"}
            />
            <Text color="gray" size={"6"} weight={"bold"}>
              No metadata found
            </Text>
            <Text color="gray" size={"2"} style={{ textAlign: "center" }}>
              If you think this shouldn&apos;t have <br /> happened mail us at{" "}
              <Link href="mailto:labmail@mail.com">labmail@mail.com</Link>
            </Text>
          </Flex>
        )}
    </>
  );
}
