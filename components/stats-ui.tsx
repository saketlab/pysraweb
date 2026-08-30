"use client";

import { humanize } from "@/utils/format";
import { Box, Flex, Text } from "@radix-ui/themes";

export type Segment = { label: string; color: string; n: number };
export type BarRow = {
  label: string;
  value: number;
  color?: string;
  display?: string;
};

export function toSegments(
  defs: readonly { keys: readonly string[]; label: string; color: string }[],
  counts: Record<string, number> | Map<string, number>,
): Segment[] {
  const get = (k: string) =>
    (counts instanceof Map ? counts.get(k) : counts[k]) ?? 0;
  return defs.map((d) => ({
    label: d.label,
    color: d.color,
    n: d.keys.reduce((n, k) => n + get(k), 0),
  }));
}

export function StatTiles({
  stats,
}: {
  stats: { label: string; value: number }[];
}) {
  return (
    <Flex gap="5" wrap="wrap">
      {stats.map((s) => (
        <Box key={s.label}>
          <Text size="6" weight="bold" as="div">
            {humanize(s.value)}
          </Text>
          <Text size="1" color="gray">
            {s.label}
          </Text>
        </Box>
      ))}
    </Flex>
  );
}

export function ShareBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + x.n, 0);
  if (!total) return null;
  return (
    <Flex direction="column" gap="2">
      <Flex
        style={{ height: 14, borderRadius: 4, overflow: "hidden" }}
        gap="2px"
      >
        {segments.map((seg) =>
          seg.n ? (
            <Box
              key={seg.label}
              style={{
                width: `${(seg.n / total) * 100}%`,
                background: seg.color,
                borderRadius: 2,
              }}
              title={`${seg.label}: ${seg.n.toLocaleString()}`}
            />
          ) : null,
        )}
      </Flex>
      <Flex gap="4" wrap="wrap">
        {segments.map((seg) => (
          <Flex key={seg.label} align="center" gap="2">
            <Swatch color={seg.color} />
            <Text size="1">
              {seg.label}{" "}
              <Text size="1" weight="bold" style={NUM}>
                {seg.n.toLocaleString()}
              </Text>{" "}
              <Text size="1" color="gray">
                {((seg.n / total) * 100).toFixed(0)}%
              </Text>
            </Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}

export function BarList({
  rows,
  title,
  labelWidth = 150,
}: {
  rows: BarRow[];
  title?: string;
  labelWidth?: number;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <Box style={{ flex: "1 1 280px", minWidth: 0 }}>
      {title ? (
        <Text size="2" weight="bold">
          {title}
        </Text>
      ) : null}
      <Flex direction="column" gap="1" mt={title ? "2" : "0"}>
        {rows.map((r) => (
          <Flex key={r.label} align="center" gap="2">
            <Text
              size="1"
              style={{ ...CLIP, width: labelWidth }}
              title={r.label}
            >
              {r.label}
            </Text>
            <Box style={{ flex: 1, minWidth: 0, height: 10 }}>
              <Box
                style={{
                  height: 10,
                  borderRadius: 3,
                  background: r.color ?? "var(--accent-9)",
                  width: `${(r.value / max) * 100}%`,
                  minWidth: 2,
                }}
              />
            </Box>
            <Text size="1" color="gray" style={{ ...NUM, ...COUNT_COL }}>
              {r.display ?? humanize(r.value)}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <Box
      style={{
        width: 10,
        height: 10,
        borderRadius: 2,
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

const NUM = { fontVariantNumeric: "tabular-nums" } as const;
const COUNT_COL = { flexShrink: 0, width: 96, textAlign: "right" } as const;
const CLIP = {
  flexShrink: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;
