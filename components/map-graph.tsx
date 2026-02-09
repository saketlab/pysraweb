"use client";

import { SERVER_URL } from "@/utils/constants";
import { type PickingInfo, OrthographicView } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import {
  CornersIcon,
  Cross1Icon,
  MagnifyingGlassIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@radix-ui/react-icons";
import {
  Box,
  Card,
  Flex,
  IconButton,
  Link,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

type DecodedPoint = {
  accession: string;
  x: number;
  y: number;
};

type ClusterRaw = {
  title: string;
  centroid: number[];
  num_points: number;
};

type ClusterPoint = {
  title: string;
  num_points: number;
  x: number;
  y: number;
};

type ProjectMetadata = {
  accession: string;
  title: string;
  description: string;
};

type ViewState = {
  target: [number, number, number];
  zoom: number;
};

const POINT_COLOR: [number, number, number, number] = [97, 207, 196, 210];
const CLUSTER_TEXT_COLOR: [number, number, number, number] = [255, 255, 255, 235];
const MIN_ZOOM = -8;
const MAX_ZOOM = 22;
const CLUSTER_LABEL_MIN_ZOOM = 0.9;
const ZOOM_STEP = 0.45;
const INITIAL_VIEW_STATE: ViewState = {
  target: [0, 0, 0],
  zoom: 0,
};

function decodePoints(buffer: ArrayBuffer): Array<{ x: number; y: number }> {
  if (buffer.byteLength % 8 !== 0) {
    throw new Error("Invalid points.bin size. Expected 8 bytes per point.");
  }

  const view = new DataView(buffer);
  const count = buffer.byteLength / 8;
  const points = new Array<{ x: number; y: number }>(count);

  for (let i = 0; i < count; i += 1) {
    const offset = i * 8;
    points[i] = {
      x: view.getFloat32(offset, true),
      y: view.getFloat32(offset + 4, true),
    };
  }

  return points;
}

function decodeAccessions(buffer: ArrayBuffer): string[] {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  const accessions: string[] = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    if (offset + 4 > buffer.byteLength) {
      throw new Error("Invalid accessions.bin record header.");
    }

    const length = view.getUint32(offset, true);
    offset += 4;

    if (offset + length > buffer.byteLength) {
      throw new Error("Invalid accessions.bin record payload.");
    }

    const bytes = new Uint8Array(buffer, offset, length);
    accessions.push(decoder.decode(bytes));
    offset += length;
  }

  return accessions;
}

async function fetchMapData(): Promise<DecodedPoint[]> {
  const [pointsRes, accessionsRes] = await Promise.all([
    fetch(`${SERVER_URL}/points.bin`),
    fetch(`${SERVER_URL}/accessions.bin`),
  ]);

  if (!pointsRes.ok || !accessionsRes.ok) {
    throw new Error("Failed to fetch map binaries.");
  }

  const [pointsBuffer, accessionsBuffer] = await Promise.all([
    pointsRes.arrayBuffer(),
    accessionsRes.arrayBuffer(),
  ]);

  const points = decodePoints(pointsBuffer);
  const accessions = decodeAccessions(accessionsBuffer);

  if (points.length !== accessions.length) {
    throw new Error(
      `Data mismatch: points=${points.length}, accessions=${accessions.length}`,
    );
  }

  return points.map((point, index) => ({
    accession: accessions[index],
    x: point.x,
    y: point.y,
  }));
}

async function fetchClusters(): Promise<ClusterRaw[]> {
  const response = await fetch(`${SERVER_URL}/clusters.json`);
  if (!response.ok) {
    throw new Error("Failed to fetch clusters.");
  }

  return response.json() as Promise<ClusterRaw[]>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

async function fetchProjectMetadata(accession: string): Promise<ProjectMetadata> {
  const response = await fetch(
    `${SERVER_URL}/project/${encodeURIComponent(accession)}/metadata`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch project metadata.");
  }

  return response.json() as Promise<ProjectMetadata>;
}

export default function MapGraph() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [containerOffset, setContainerOffset] = useState({ left: 0, top: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightedPoint, setHighlightedPoint] = useState<DecodedPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{
    accession: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const { clientWidth, clientHeight } = container;
      setViewportSize({ width: clientWidth, height: clientHeight });
      const rect = container.getBoundingClientRect();
      setContainerOffset({ left: rect.left, top: rect.top });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const dataQuery = useQuery({
    queryKey: ["map-binaries"],
    queryFn: fetchMapData,
    retry: 2,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const clusterQuery = useQuery({
    queryKey: ["map-clusters"],
    queryFn: fetchClusters,
    retry: 2,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const metadataQuery = useQuery({
    queryKey: ["point-metadata", selectedPoint?.accession],
    enabled: Boolean(selectedPoint?.accession),
    queryFn: () => fetchProjectMetadata(selectedPoint!.accession),
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const normalization = useMemo(() => {
    const raw = dataQuery.data;
    if (!raw || raw.length === 0) {
      return null;
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const point of raw) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }

    return { minX, maxX, minY, maxY, xSpan: maxX - minX || 1, ySpan: maxY - minY || 1 };
  }, [dataQuery.data]);

  const points = useMemo<DecodedPoint[]>(() => {
    const raw = dataQuery.data;
    if (!raw || !normalization) {
      return [];
    }

    const extent = 2200;
    return raw.map((point) => ({
      accession: point.accession,
      x: ((point.x - normalization.minX) / normalization.xSpan - 0.5) * extent,
      y: ((point.y - normalization.minY) / normalization.ySpan - 0.5) * extent,
    }));
  }, [dataQuery.data, normalization]);

  const clusters = useMemo<ClusterPoint[]>(() => {
    const rawClusters = clusterQuery.data;
    if (!rawClusters || !normalization) {
      return [];
    }

    const extent = 2200;
    return rawClusters
      .filter(
        (cluster) =>
          Array.isArray(cluster.centroid) &&
          cluster.centroid.length >= 2 &&
          typeof cluster.centroid[0] === "number" &&
          typeof cluster.centroid[1] === "number" &&
          Number.isFinite(cluster.centroid[0]) &&
          Number.isFinite(cluster.centroid[1]) &&
          typeof cluster.num_points === "number" &&
          Number.isFinite(cluster.num_points) &&
          cluster.num_points > 0 &&
          typeof cluster.title === "string" &&
          cluster.title.length > 0,
      )
      .map((cluster) => ({
        title: cluster.title,
        num_points: cluster.num_points,
        x:
          ((cluster.centroid[0] - normalization.minX) / normalization.xSpan - 0.5) *
          extent,
        y:
          ((cluster.centroid[1] - normalization.minY) / normalization.ySpan - 0.5) *
          extent,
      }))
      .sort((a, b) => b.num_points - a.num_points);
  }, [clusterQuery.data, normalization]);

  const visibleClusters = useMemo(() => {
    if (viewState.zoom < CLUSTER_LABEL_MIN_ZOOM) {
      return [];
    }

    if (clusters.length === 0) {
      return [];
    }

    const zoomProgress = clamp(
      (viewState.zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM),
      0,
      1,
    );
    const visibleFraction = 0.02 + 0.98 * Math.pow(zoomProgress, 1.7);
    const visibleCount = Math.max(1, Math.ceil(clusters.length * visibleFraction));
    const candidates = clusters.slice(0, visibleCount);

    if (viewportSize.width <= 0 || viewportSize.height <= 0) {
      return candidates;
    }

    const scale = 2 ** viewState.zoom;
    const baseCellSize = 150;
    const cellSize = clamp(baseCellSize - viewState.zoom * 6, 48, 170);
    const chosenByCell = new Map<string, ClusterPoint>();

    // candidates are pre-sorted by descending num_points, so first in each cell wins
    for (const cluster of candidates) {
      const sx = (cluster.x - viewState.target[0]) * scale + viewportSize.width / 2;
      const sy = viewportSize.height / 2 - (cluster.y - viewState.target[1]) * scale;

      if (sx < -24 || sx > viewportSize.width + 24) continue;
      if (sy < -24 || sy > viewportSize.height + 24) continue;

      const cellX = Math.floor(sx / cellSize);
      const cellY = Math.floor(sy / cellSize);
      const key = `${cellX}:${cellY}`;

      if (!chosenByCell.has(key)) {
        chosenByCell.set(key, cluster);
      }
    }

    return Array.from(chosenByCell.values())
      .sort((a, b) => b.num_points - a.num_points)
      .slice(0, 10);
  }, [clusters, viewState.zoom, viewState.target, viewportSize.width, viewportSize.height]);

  const pointsByAccession = useMemo(() => {
    const lookup = new Map<string, DecodedPoint>();
    for (const point of points) {
      lookup.set(point.accession.toLowerCase(), point);
    }
    return lookup;
  }, [points]);

  const layers = useMemo(
    () => [
      new ScatterplotLayer<DecodedPoint>({
        id: "map-points",
        data: points,
        pickable: true,
        getPosition: (d) => [d.x, d.y],
        getFillColor: POINT_COLOR,
        getRadius: 0.4,
        radiusUnits: "pixels",
        radiusMinPixels: 0.2,
        radiusMaxPixels: 1.4,
        stroked: false,
        onClick: (info: PickingInfo<DecodedPoint>) => {
          if (!info.object) {
            return;
          }
          const srcEvent = info.srcEvent;
          const clickX =
            srcEvent && "clientX" in srcEvent
              ? (srcEvent as MouseEvent).clientX - containerOffset.left
              : info.x;
          const clickY =
            srcEvent && "clientY" in srcEvent
              ? (srcEvent as MouseEvent).clientY - containerOffset.top
              : info.y;

          setSelectedPoint({
            accession: info.object.accession,
            x: clickX,
            y: clickY,
          });
        },
      }),
      new ScatterplotLayer<DecodedPoint>({
        id: "map-highlight-point",
        data: highlightedPoint ? [highlightedPoint] : [],
        pickable: false,
        getPosition: (d) => [d.x, d.y],
        getFillColor: [255, 92, 71, 255],
        getRadius: 1.4,
        radiusUnits: "pixels",
        radiusMinPixels: 1.6,
        radiusMaxPixels: 2.8,
        stroked: true,
        getLineColor: [255, 255, 255, 220],
        lineWidthMinPixels: 0.8,
      }),
      new TextLayer<ClusterPoint>({
        id: "map-cluster-labels",
        data: visibleClusters,
        pickable: false,
        getPosition: (d) => [d.x, d.y],
        getText: (d) => d.title,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        getSize: 12,
        getColor: CLUSTER_TEXT_COLOR,
        fontWeight: 700,
        getTextAnchor: "middle",
        getAlignmentBaseline: "bottom",
        getPixelOffset: [0, -8],
      }),
    ],
    [
      points,
      highlightedPoint,
      visibleClusters,
      containerOffset.left,
      containerOffset.top,
    ],
  );

  const metadataCardPosition = useMemo(() => {
    if (!selectedPoint) {
      return null;
    }
    const cardWidth = 360;
    const cardHeight = 220;
    const margin = 12;

    const maxLeft = Math.max(margin, viewportSize.width - cardWidth - margin);
    const maxTop = Math.max(margin, viewportSize.height - cardHeight - margin);

    return {
      left: clamp(selectedPoint.x + 14, margin, maxLeft),
      top: clamp(selectedPoint.y + 14, margin, maxTop),
      width: cardWidth,
    };
  }, [selectedPoint, viewportSize.width, viewportSize.height]);

  if (dataQuery.isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%" }}>
        <Text>Loading map data...</Text>
      </Flex>
    );
  }

  if (dataQuery.isError) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%" }}>
        <Text color="red">{(dataQuery.error as Error).message}</Text>
      </Flex>
    );
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim().toLowerCase();
    if (!query) {
      return;
    }

    const targetPoint = pointsByAccession.get(query);
    if (!targetPoint) {
      setSearchError("Accession not found.");
      return;
    }

    setSearchError(null);
    setHighlightedPoint(targetPoint);
    setViewState((prev) => ({
      ...prev,
      target: [targetPoint.x, targetPoint.y, 0],
      zoom: Math.max(prev.zoom, 6),
    }));
  };

  return (
    <Box ref={containerRef} style={{ height: "100%", position: "relative" }}>
      <Box style={{ position: "absolute", top: 12, left: 12, zIndex: 22 }}>
        <Card>
          <form onSubmit={handleSearchSubmit}>
            <Flex direction="column" gap="2" >
              <Flex gap="2" align="center">
                <TextField.Root
                  placeholder="Search accession"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    if (searchError) setSearchError(null);
                  }}
                />
                <IconButton type="submit" variant="soft" aria-label="Search accession">
                  <MagnifyingGlassIcon />
                </IconButton>
              </Flex>
              {searchError && (
                <Text size="1" color="red">
                  {searchError}
                </Text>
              )}
            </Flex>
          </form>
        </Card>
      </Box>
      <Box style={{ position: "absolute", right: 12, bottom: 24, zIndex: 20 }}>
        <Card>
          <Flex gap="2" direction="column" align="center">
            <Tooltip content="Zoom in" side="left">
              <IconButton
                variant="soft"
                aria-label="Zoom in"
                onClick={() =>
                  setViewState((prev) => ({
                    ...prev,
                    zoom: Math.min(prev.zoom + ZOOM_STEP, MAX_ZOOM),
                  }))
                }
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Zoom out" side="left">
              <IconButton
                variant="soft"
                aria-label="Zoom out"
                onClick={() =>
                  setViewState((prev) => ({
                    ...prev,
                    zoom: Math.max(prev.zoom - ZOOM_STEP, MIN_ZOOM),
                  }))
                }
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Reset view" side="left">
              <IconButton
                variant="soft"
                aria-label="Reset zoom"
                onClick={() => setViewState(INITIAL_VIEW_STATE)}
              >
                <CornersIcon />
              </IconButton>
            </Tooltip>
          </Flex>
        </Card>
      </Box>
      {selectedPoint && metadataCardPosition && (
        <Box
          style={{
            position: "absolute",
            left: metadataCardPosition.left,
            top: metadataCardPosition.top,
            width: metadataCardPosition.width,
            maxWidth: "min(90vw, 360px)",
            zIndex: 25,
          }}
        >
          <Card>
            <Flex direction="column" gap="2">
              <Flex align="center" justify="between" gap="2">
                <Text size="1" color="gray" style={{ overflowWrap: "anywhere" }}>
                  {metadataQuery.data?.accession || selectedPoint.accession}
                </Text>
                <IconButton
                  variant="ghost"
                  size="1"
                  aria-label="Close metadata card"
                  onClick={() => setSelectedPoint(null)}
                >
                  <Cross1Icon />
                </IconButton>
              </Flex>

              {metadataQuery.isLoading && (
                <Text size="2" color="gray">
                  Loading metadata...
                </Text>
              )}

              {metadataQuery.isError && (
                <Text size="2" color="red">
                  {(metadataQuery.error as Error).message}
                </Text>
              )}

              {metadataQuery.data && (
                <>
                  <Link
                    href={`/p/${encodeURIComponent(
                      metadataQuery.data.accession || selectedPoint.accession,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <Text size="3" weight="bold">
                      {metadataQuery.data.title || "Untitled"}
                    </Text>
                  </Link>
                  <Text size="2" color="gray">
                    {metadataQuery.data.description || "No description available."}
                  </Text>
                </>
              )}
            </Flex>
          </Card>
        </Box>
      )}

      <DeckGL
        views={new OrthographicView({ id: "ortho" })}
        controller={{ dragPan: true, scrollZoom: true, touchZoom: true }}
        viewState={{
          ...viewState,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
        }}
        onViewStateChange={({ viewState: nextViewState }) => {
          setViewState({
            target: nextViewState.target as [number, number, number],
            zoom: nextViewState.zoom as number,
          });
        }}
        layers={layers}
      />
    </Box>
  );
}
