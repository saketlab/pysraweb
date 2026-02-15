"use client";

import { Badge, Flex, Table, Text } from "@radix-ui/themes";
import dynamic from "next/dynamic";
import React from "react";

export type CenterInfo = {
  organization: string | null;
  department: string | null;
  place_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  country_code: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string | null;
};

type Props = {
  center: CenterInfo | CenterInfo[] | null | undefined;
};

const LeafletMap = dynamic(() => import("./submitting-org-map"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "300px",
        width: "100%",
        borderRadius: "8px",
        background: "var(--gray-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text size="2" color="gray">
        Loading map...
      </Text>
    </div>
  ),
});

type DetailRow = { label: string; value: string };

function buildDetails(c: CenterInfo): DetailRow[] {
  const rows: DetailRow[] = [];
  if (c.organization) rows.push({ label: "Organization", value: c.organization });
  if (c.department) rows.push({ label: "Department", value: c.department });
  if (c.place_name) rows.push({ label: "Place", value: c.place_name });
  if (c.city) rows.push({ label: "City", value: c.city });
  if (c.state) rows.push({ label: "State", value: c.state });
  if (c.country) rows.push({ label: "Country", value: c.country });
  if (c.country_code && c.country_code !== c.country)
    rows.push({ label: "Country code", value: c.country_code });
  if (c.postcode) rows.push({ label: "Postal code", value: c.postcode });
  if (c.formatted_address)
    rows.push({ label: "Address", value: c.formatted_address });
  return rows;
}

export default function SubmittingOrgPanel({ center }: Props) {
  const entries = React.useMemo(() => {
    if (!center) return [];
    const arr = Array.isArray(center) ? center : [center];
    return arr.filter((c) => c.organization && c.organization !== "GEO");
  }, [center]);

  const markersWithCoords = React.useMemo(
    () => entries.filter((c) => c.latitude != null && c.longitude != null),
    [entries],
  );

  if (entries.length === 0) return null;

  return (
    <>
      <Text weight="medium" size="6">
        Submitting organization
      </Text>
      <Flex direction="column" gap="4">
        {entries.map((c, i) => {
          const details = buildDetails(c);
          const hasCoords = c.latitude != null && c.longitude != null;
          return (
            <Flex key={i} direction="column" gap="2">
              <Table.Root variant="surface" size="1">
                <Table.Body>
                  {details.map((row) => (
                    <Table.Row key={row.label}>
                      <Table.RowHeaderCell
                        style={{ width: "140px", whiteSpace: "nowrap" }}
                      >
                        <Text size="2" weight="medium">
                          {row.label}
                        </Text>
                      </Table.RowHeaderCell>
                      <Table.Cell>
                        <Text size="2">{row.value}</Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
              {hasCoords && (
                <Badge size="2" color="cyan" variant="soft">
                  {c.latitude!.toFixed(6)}, {c.longitude!.toFixed(6)}
                </Badge>
              )}
            </Flex>
          );
        })}
        {markersWithCoords.length > 0 && (
          <LeafletMap markers={markersWithCoords} />
        )}
      </Flex>
    </>
  );
}
