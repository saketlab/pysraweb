"use client";
import SearchBar from "@/components/search-bar";
import SimilarCard from "@/components/similar-card";
import TableRow from "@/components/table-row";
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
  Table,
  Text,
} from "@radix-ui/themes";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ProjectPage() {
  const searchParams = useSearchParams();
  const [srp, setSrp] = useState(searchParams.get("srp"));
  return (
    <>
      <SearchBar searchQuery={""} />
      <Flex
        style={{ marginLeft: "8.2rem", width: "80%" }}
        py="3"
        direction={"column"}
        gap={"2"}
      >
        <Flex justify={"between"} style={{ width: "100%" }} align={"center"}>
          <Text size={"8"} weight={"bold"}>
            Severe acute respiratory syndrome coronavirus 2
          </Text>
          <Flex gap={"2"}>
            <IconButton variant="outline">
              <MixerHorizontalIcon />
            </IconButton>
            <IconButton variant="outline">
              <CaretSortIcon />
            </IconButton>
            <Button>
              <DownloadIcon /> Download
            </Button>
          </Flex>
        </Flex>
        <Flex align={"center"} gap={"2"}>
          <Badge size={"3"} style={{ alignSelf: "flex-start" }}>
            {srp}
          </Badge>
          <Separator orientation={"vertical"} />
          <Text>Published on 20th October, 2020</Text>
        </Flex>
      </Flex>

      {/* The metadata table */}
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
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>
              Experiment Accession
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              Organism Taxonomy ID
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Organism Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Library Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Library Strategy</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Library Source</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Library Selection</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Library Layout</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Sample Accession</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Sample Title</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Instrument</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Instrument Model</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          <TableRow />
          <TableRow />
          <TableRow />
          <TableRow />
          <TableRow />
          <TableRow />
          <TableRow />
          <TableRow />
        </Table.Body>
      </Table.Root>
      <Flex
        style={{ marginLeft: "8.2rem", width: "80%", marginTop: "1rem" }}
        py="3"
        direction={"column"}
        gap={"4"}
      >
        <Flex align={"center"} gap={"2"}>
          <Text weight={"medium"} size={"6"}>
            Similar projects
          </Text>
          <Popover.Root>
            <Popover.Trigger>
              <InfoCircledIcon />
            </Popover.Trigger>
            <Popover.Content width="360px">
              <Text size={"2"}>
                Project similarity is measured based on metadata and other
                attributes. Read <Link href="#">our paper</Link> to learn more.
              </Text>
            </Popover.Content>
          </Popover.Root>
        </Flex>
        <Grid columns={"4"} gap={"4"}>
          <SimilarCard />
          <SimilarCard />
          <SimilarCard />
          <SimilarCard />
          <SimilarCard />
          <SimilarCard />
          <SimilarCard />
          <SimilarCard />
        </Grid>
      </Flex>
    </>
  );
}
