"use client";

import type { ForceGraph3DInstance } from "3d-force-graph";
import { SERVER_URL } from "@/utils/constants";
import { Flex, Select, Spinner, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

export type SimilarNeighbor = {
  accession: string;
  source?: string | null;
  organisms?: unknown;
  x_2d?: number | null;
  y_2d?: number | null;
  x_3d?: number | null;
  y_3d?: number | null;
  z_3d?: number | null;
  title?: string | null;
  description?: string | null;
};

type SimilarProjectsGraphProps = {
  accession: string;
  source: "geo" | "sra";
  title: string;
  description: string | null | undefined;
  organisms?: unknown;
  coords2d?: number[] | null;
  coords3d?: number[] | null;
  neighbors?: SimilarNeighbor[] | null;
};

type GraphNode = {
  id: string;
  source: "geo" | "sra";
  x: number;
  y: number;
  z: number;
  fx: number;
  fy: number;
  fz: number;
  title?: string | null;
  description?: string | null;
  organisms: string[];
  isCenter: boolean;
};

type GraphLink = {
  source: string | { id?: string };
  target: string | { id?: string };
};

type NeighborDetails = {
  title?: string | null;
  description?: string | null;
  organisms: string[];
};

const safeNum = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clampText = (value: string, maxChars = 300) =>
  value.length > maxChars ? `${value.slice(0, maxChars)}...` : value;

const escHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toSource = (value: string | null | undefined, fallback: "geo" | "sra") =>
  value?.toLowerCase() === "geo" || value?.toLowerCase() === "sra"
    ? (value.toLowerCase() as "geo" | "sra")
    : fallback;

const MIN_RADIUS = 45;
const TARGET_MEDIAN_RADIUS = 170;
const ALL_ORGANISMS = "__all__";

const normalizeOrganisms = (value: unknown): string[] => {
  if (!value) return [];
  let parsed: unknown = value;

  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (!trimmed) return [];
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      return trimmed
        .split(/[;,|]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : item && typeof item === "object" && "name" in item
            ? String((item as { name: unknown }).name).trim()
            : "",
      )
      .filter((item) => item.length > 0);
  }

  return [];
};

const linkEndpointId = (endpoint: GraphLink["source"]): string | null => {
  if (typeof endpoint === "string") return endpoint;
  if (endpoint && typeof endpoint === "object" && "id" in endpoint) {
    const id = endpoint.id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

function nodeLabel(node: GraphNode) {
  const title = node.title ? escHtml(node.title) : "Untitled project";
  const accession = escHtml(node.id);
  const description = node.description
    ? escHtml(clampText(node.description))
    : "Description unavailable.";

  return `
    <div style="max-width: 420px; white-space: normal; line-height: 1.35; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; background: var(--gray-2); color: var(--gray-12); border: 1px solid var(--gray-a6); border-radius: 10px; padding: 10px 12px; box-shadow: 0 8px 22px rgba(0,0,0,0.18); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">
      <div style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">${title}</div>
      <div style="font-size: 12px; margin-bottom: 6px;">${accession}</div>
      <div style="font-size: 12px;">${description}</div>
    </div>
  `;
}

export default function SimilarProjectsGraph({
  accession,
  source,
  title,
  description,
  organisms,
  coords2d,
  coords3d,
  neighbors,
}: SimilarProjectsGraphProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraph3DInstance | null>(null);
  const [organismFilter, setOrganismFilter] = useState<string>(ALL_ORGANISMS);

  const normalizedNeighbors = useMemo(() => {
    if (!neighbors || !Array.isArray(neighbors)) return [];
    return neighbors.filter(
      (n): n is SimilarNeighbor =>
        !!n && typeof n.accession === "string" && n.accession.length > 0,
    );
  }, [neighbors]);

  const uniqueNeighborAccessions = useMemo(
    () => Array.from(new Set(normalizedNeighbors.map((n) => n.accession))),
    [normalizedNeighbors],
  );

  const { data: neighborDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["neighbor-project-details", uniqueNeighborAccessions.join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueNeighborAccessions.map(async (neighborAccession) => {
          try {
            const res = await fetch(
              `${SERVER_URL}/project/${neighborAccession}`,
            );
            if (!res.ok) return null;
            const payload = (await res.json()) as Record<string, unknown>;
            const neighborTitle =
              typeof payload.title === "string" ? payload.title : null;
            const neighborDescription =
              typeof payload.summary === "string"
                ? payload.summary
                : typeof payload.abstract === "string"
                  ? payload.abstract
                  : null;
            return [
              neighborAccession,
              {
                title: neighborTitle,
                description: neighborDescription,
                organisms: normalizeOrganisms(payload.organisms),
              } as NeighborDetails,
            ] as const;
          } catch {
            return null;
          }
        }),
      );

      return new Map(
        results.filter(
          (item): item is readonly [string, NeighborDetails] => item !== null,
        ),
      );
    },
    enabled: uniqueNeighborAccessions.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const centerOrganisms = useMemo(() => normalizeOrganisms(organisms), [organisms]);

  const graphData = useMemo(() => {
    const centerX2d = safeNum(coords2d?.[0], 0);
    const centerY2d = safeNum(coords2d?.[1], 0);
    const centerX3d = safeNum(coords3d?.[0], centerX2d);
    const centerY3d = safeNum(coords3d?.[1], centerY2d);
    const centerZ3d = safeNum(coords3d?.[2], 0);

    const centerNode: GraphNode = {
      id: accession,
      source,
      title,
      description: description ?? null,
      organisms: centerOrganisms,
      isCenter: true,
      x: 0,
      y: 0,
      z: 0,
      fx: 0,
      fy: 0,
      fz: 0,
    };

    const rawNeighbors = normalizedNeighbors.map((n, idx) => {
      const x2d = safeNum(n.x_2d, 0);
      const y2d = safeNum(n.y_2d, 0);
      const x3d = safeNum(n.x_3d, x2d);
      const y3d = safeNum(n.y_3d, y2d);
      const z3d = safeNum(n.z_3d, 0);

      const rawX = x3d - centerX3d;
      const rawY = y3d - centerY3d;
      const rawZ = z3d - centerZ3d;

      return { n, idx, rawX, rawY, rawZ };
    });

    const radii = rawNeighbors
      .map((item) =>
        Math.sqrt(
          item.rawX * item.rawX + item.rawY * item.rawY + item.rawZ * item.rawZ,
        ),
      )
      .filter((r) => r > 0);
    const medianRadius = radii.length
      ? [...radii].sort((a, b) => a - b)[Math.floor(radii.length / 2)]
      : 1;
    const scale = medianRadius > 0 ? TARGET_MEDIAN_RADIUS / medianRadius : 1;

    const neighborNodes: GraphNode[] = rawNeighbors.map(
      ({ n, idx, rawX, rawY, rawZ }) => {
        const detail = neighborDetails?.get(n.accession);
        const inferredSource = toSource(n.source, source);

        let x = rawX * scale;
        let y = rawY * scale;
        let z = rawZ * scale;
        const r = Math.sqrt(x * x + y * y + z * z);

        if (r === 0) {
          const angle = (idx / Math.max(1, rawNeighbors.length)) * Math.PI * 2;
          x = Math.cos(angle) * MIN_RADIUS;
          y = Math.sin(angle) * MIN_RADIUS;
          z = Math.sin(angle * 1.7) * (MIN_RADIUS * 0.5);
        } else if (r < MIN_RADIUS) {
          const stretch = MIN_RADIUS / r;
          x *= stretch;
          y *= stretch;
          z *= stretch;
        }

        return {
          id: n.accession,
          source: inferredSource,
          title: n.title ?? detail?.title ?? null,
          description: n.description ?? detail?.description ?? null,
          organisms: normalizeOrganisms(n.organisms).length
            ? normalizeOrganisms(n.organisms)
            : (detail?.organisms ?? []),
          isCenter: false,
          x,
          y,
          z,
          fx: x,
          fy: y,
          fz: z,
        };
      },
    );

    const links: GraphLink[] = neighborNodes.map((n) => ({
      source: accession,
      target: n.id,
    }));

    return {
      nodes: [centerNode, ...neighborNodes],
      links,
    };
  }, [
    accession,
    source,
    title,
    description,
    coords2d,
    coords3d,
    normalizedNeighbors,
    neighborDetails,
    centerOrganisms,
  ]);

  const organismOptions = useMemo(() => {
    const values = new Set<string>();
    graphData.nodes.forEach((node) =>
      node.organisms.forEach((item) => values.add(item)),
    );
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [graphData]);

  const filteredGraphData = useMemo(() => {
    if (organismFilter === ALL_ORGANISMS) return graphData;
    const centerNode = graphData.nodes.find((node) => node.isCenter);
    if (!centerNode) return graphData;

    const allowedNeighbors = graphData.nodes.filter(
      (node) =>
        !node.isCenter && node.organisms.some((item) => item === organismFilter),
    );

    const allowedIds = new Set([centerNode.id, ...allowedNeighbors.map((n) => n.id)]);
    return {
      nodes: [centerNode, ...allowedNeighbors],
      links: graphData.links.filter(
        (link) => {
          const sourceId = linkEndpointId(link.source);
          const targetId = linkEndpointId(link.target);
          return (
            sourceId !== null &&
            targetId !== null &&
            allowedIds.has(sourceId) &&
            allowedIds.has(targetId)
          );
        },
      ),
    };
  }, [graphData, organismFilter]);

  useEffect(() => {
    if (organismFilter === ALL_ORGANISMS) return;
    if (!organismOptions.includes(organismFilter)) {
      setOrganismFilter(ALL_ORGANISMS);
    }
  }, [organismFilter, organismOptions]);

  useEffect(() => {
    let isActive = true;

    const mountGraph = async () => {
      if (!mountRef.current) return;
      const ForceGraph3D = (await import("3d-force-graph")).default;
      if (!isActive || !mountRef.current) return;

      const graph = new ForceGraph3D(mountRef.current, {
        controlType: "orbit",
      });

      graphRef.current = graph;
      graph
        .backgroundColor("rgba(0,0,0,0)")
        .showNavInfo(false)
        .enableNodeDrag(false)
        .cooldownTicks(0)
        .linkOpacity(0.85)
        .linkColor(() => "#9ca3af")
        .linkWidth(0.9)
        .nodeRelSize(5)
        .nodeLabel((node) => nodeLabel(node as GraphNode))
        .nodeColor((node) => {
          const graphNode = node as GraphNode;
          if (graphNode.isCenter) return "#d97706";
          return graphNode.source === "geo" ? "#2563eb" : "#8b4513";
        })
        .onNodeClick((node) => {
          const graphNode = node as GraphNode;
          if (graphNode.id === accession) return;
          window.open(
            `/project/${graphNode.source}/${graphNode.id}`,
            "_blank",
            "noopener,noreferrer",
          );
        });

      const rect = mountRef.current.getBoundingClientRect();
      graph.width(Math.max(320, rect.width)).height(420);
      graph.graphData({ nodes: [], links: [] });
      graph.zoomToFit(450, 48);
    };

    mountGraph();

    return () => {
      isActive = false;
      graphRef.current?._destructor();
      graphRef.current = null;
    };
  }, [accession]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.graphData(filteredGraphData);
    graph.nodeLabel((node) => nodeLabel(node as GraphNode));
    graph.zoomToFit(450, 48);
  }, [filteredGraphData]);

  useEffect(() => {
    if (!mountRef.current) return;
    const graph = graphRef.current;
    if (!graph) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      graph.width(Math.max(320, entry.contentRect.width)).height(420);
    });

    observer.observe(mountRef.current);
    return () => observer.disconnect();
  }, []);

  if (normalizedNeighbors.length === 0) {
    return (
      <Text size="2" color="gray">
        No similar projects found
      </Text>
    );
  }

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" gap="2" wrap="wrap">
        {isDetailsLoading ? (
          <Flex align="center" gap="1">
            <Spinner size="1" />
            <Text size="2" color="gray">
              Loading...
            </Text>
          </Flex>
        ) : (
          <Text size="2" color="gray">
            Hover a node to view title and description. Click a neighbor to open
            it.
          </Text>
        )}
        <Flex align="center" gap="2" wrap="wrap">
          <Select.Root
            value={organismFilter}
            onValueChange={(value) => setOrganismFilter(value)}
          >
            <Select.Trigger style={{ minWidth: "220px" }} />
            <Select.Content position="popper">
              <Select.Item value={ALL_ORGANISMS}>All organisms</Select.Item>
              {organismOptions.map((item) => (
                <Select.Item key={item} value={item}>
                  {item}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      <div
        ref={mountRef}
        style={{
          width: "100%",
          minHeight: "420px",
          border: "1px solid var(--gray-a6)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      />
      {organismFilter !== ALL_ORGANISMS && filteredGraphData.nodes.length <= 1 && (
        <Text size="2" color="gray">
          No neighbors found for the selected organism.
        </Text>
      )}
    </Flex>
  );
}
