"use client";

import AccessionLink from "@/components/accession-link";
import { humanize } from "@/utils/format";
import type { DiseaseFacetValue } from "@/utils/useStats";
import {
  useDiseaseFacets,
  useDiseaseProjects,
  useDiseaseSummary,
} from "@/utils/useStats";
import { Badge, Flex, Select, Table, Text } from "@radix-ui/themes";
import { useState } from "react";

const ALL = "__all__";
const NO_OPTIONS: DiseaseFacetValue[] = [];

function SexCell({
  male,
  female,
  missing,
}: {
  male: number;
  female: number;
  missing?: number;
}) {
  if (!male && !female && !missing) {
    return (
      <Text size="1" color="gray">
        —
      </Text>
    );
  }
  return (
    <Text size="1">
      {male}M / {female}F
      {missing ? (
        <Text size="1" color="gray">
          {" "}
          ({missing} unstated)
        </Text>
      ) : null}
    </Text>
  );
}

function FacetSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: DiseaseFacetValue[];
}) {
  return (
    <Flex align="center" gap="2">
      <Text size="1" color="gray">
        {label}
      </Text>
      <Select.Root
        value={value ?? ALL}
        onValueChange={(v) => onChange(v === ALL ? null : v)}
        size="1"
      >
        <Select.Trigger />
        <Select.Content>
          <Select.Item value={ALL}>All</Select.Item>
          {options.map((o) => (
            <Select.Item key={o.value} value={o.value}>
              {o.value} ({humanize(o.studies)})
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Flex direction="column">
      <Text size="6" weight="bold">
        {humanize(value)}
      </Text>
      <Text size="1" color="gray">
        {label}
      </Text>
    </Flex>
  );
}

export default function DiseaseCollectionCard({
  collection,
}: {
  collection: string;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [assay, setAssay] = useState<string | null>(null);

  const summary = useDiseaseSummary(collection);
  const facets = useDiseaseFacets(collection);
  const projects = useDiseaseProjects(collection, category, assay);

  const rows = projects.data?.results ?? [];
  const total = projects.data?.count ?? 0;

  return (
    <Flex direction="column" gap="3" py="5">
      {summary.data ? (
        <Flex gap="4" wrap="wrap" py="2">
          <Stat label="Studies" value={summary.data.studies} />
          <Stat label="Samples" value={summary.data.samples} />
          <Stat label="Cells" value={summary.data.cells} />
          <Stat
            label="With single-cell reads"
            value={summary.data.studies_single_cell}
          />
        </Flex>
      ) : null}

      <Flex gap="4" wrap="wrap" align="center">
        <FacetSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={facets.data?.category ?? NO_OPTIONS}
        />
        <FacetSelect
          label="Assay"
          value={assay}
          onChange={setAssay}
          options={facets.data?.assay_category ?? NO_OPTIONS}
        />
      </Flex>

      <Table.Root size="1" variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Study</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Disease</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="right">
              Samples
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="right">Cells</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Assay</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Sex (stated)</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Sex (reads)</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((r) => (
            <Table.Row key={r.study_accession}>
              <Table.Cell>
                <AccessionLink accession={r.study_accession} hideExternal />
              </Table.Cell>
              <Table.Cell>
                <Text size="1">
                  {r.diseases?.slice(0, 2).join(", ") || "—"}
                </Text>
                {r.n_diseases > 2 ? (
                  <Badge size="1" color="gray" ml="1">
                    +{r.n_diseases - 2}
                  </Badge>
                ) : null}
              </Table.Cell>
              <Table.Cell align="right">{humanize(r.n_samples)}</Table.Cell>
              <Table.Cell align="right">
                {r.cells ? humanize(r.cells) : "—"}
              </Table.Cell>
              <Table.Cell>
                <Text size="1">{r.assay_category ?? "—"}</Text>
              </Table.Cell>
              <Table.Cell>
                <SexCell
                  male={r.stated_male}
                  female={r.stated_female}
                  missing={r.stated_missing}
                />
              </Table.Cell>
              <Table.Cell>
                <SexCell male={r.reads_male} female={r.reads_female} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Text size="1" color="gray">
        {projects.isFetching
          ? "Loading…"
          : total > rows.length
            ? `Showing ${humanize(rows.length)} of ${humanize(total)} studies`
            : null}
      </Text>
    </Flex>
  );
}
