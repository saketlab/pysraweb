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
  Checkbox,
  Flex,
  IconButton,
  Link,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";

type DecodedPoint = {
  accession: string;
  x: number;
  y: number;
};

type RenderPoint = DecodedPoint & {
  fillColor: [number, number, number, number];
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

const POINT_COLOR_DARK: [number, number, number, number] = [97, 207, 196, 210];
const POINT_COLOR_LIGHT: [number, number, number, number] = [72, 136, 245, 210];
const CLUSTER_TEXT_COLOR_DARK: [number, number, number, number] = [
  255, 255, 255, 235,
];
const CLUSTER_TEXT_COLOR_LIGHT: [number, number, number, number] = [34, 41, 51, 235];
const MIN_ZOOM = -8;
const MAX_ZOOM = 22;
const CLUSTER_LABEL_MIN_ZOOM = 0.9;
const ZOOM_STEP = 0.45;
const MOBILE_MAX_DEVICE_PIXELS = 1;
const MOBILE_INTERACTION_FPS = 20;
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

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const m = l - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

async function fetchProjectMetadata(
  accession: string,
): Promise<ProjectMetadata> {
  const response = await fetch(
    `${SERVER_URL}/project/${encodeURIComponent(accession)}/metadata`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch project metadata.");
  }

  return response.json() as Promise<ProjectMetadata>;
}

export default function MapGraph() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingViewStateRef = useRef<ViewState | null>(null);
  const viewStateCommitRafRef = useRef<number | null>(null);
  const lastViewStateCommitRef = useRef(0);
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [colorByClusters, setColorByClusters] = useState(false);
  const [highlightedPoint, setHighlightedPoint] = useState<DecodedPoint | null>(
    null,
  );
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
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 900px), (pointer: coarse), (hover: none)",
    );
    const updateIsMobileDevice = () => {
      setIsMobileDevice(mediaQuery.matches);
    };
    updateIsMobileDevice();
    mediaQuery.addEventListener("change", updateIsMobileDevice);
    return () => mediaQuery.removeEventListener("change", updateIsMobileDevice);
  }, []);

  useEffect(() => {
    return () => {
      if (viewStateCommitRafRef.current !== null) {
        cancelAnimationFrame(viewStateCommitRafRef.current);
      }
    };
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

    return {
      minX,
      maxX,
      minY,
      maxY,
      xSpan: maxX - minX || 1,
      ySpan: maxY - minY || 1,
    };
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
          ((cluster.centroid[0] - normalization.minX) / normalization.xSpan -
            0.5) *
          extent,
        y:
          ((cluster.centroid[1] - normalization.minY) / normalization.ySpan -
            0.5) *
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
    const visibleCount = Math.max(
      1,
      Math.ceil(clusters.length * visibleFraction),
    );
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
      const sx =
        (cluster.x - viewState.target[0]) * scale + viewportSize.width / 2;
      const sy =
        viewportSize.height / 2 - (cluster.y - viewState.target[1]) * scale;

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
  }, [
    clusters,
    viewState.zoom,
    viewState.target,
    viewportSize.width,
    viewportSize.height,
  ]);

  const pointsByAccession = useMemo(() => {
    const lookup = new Map<string, DecodedPoint>();
    for (const point of points) {
      lookup.set(point.accession.toLowerCase(), point);
    }
    return lookup;
  }, [points]);

  const pointColor =
    resolvedTheme === "light" ? POINT_COLOR_LIGHT : POINT_COLOR_DARK;
  const clusterTextColor =
    resolvedTheme === "light" ? CLUSTER_TEXT_COLOR_LIGHT : CLUSTER_TEXT_COLOR_DARK;

  const renderPoints = useMemo<RenderPoint[]>(() => {
    if (!colorByClusters || clusters.length === 0) {
      return points.map((point) => ({ ...point, fillColor: pointColor }));
    }

    const topClusters = clusters.slice(0, 32);
    const maxNumPoints = topClusters[0]?.num_points ?? 1;
    const minRadius = 120;
    const maxRadius = 700;

    const clusterStyles = topClusters.map((cluster, idx) => {
      const hue = (idx * 137.5) % 360;
      const [r, g, b] = hslToRgb(hue, 0.8, resolvedTheme === "light" ? 0.52 : 0.58);
      const radiusNorm = Math.sqrt(cluster.num_points / maxNumPoints);
      const radius = minRadius + (maxRadius - minRadius) * radiusNorm;
      return { ...cluster, color: [r, g, b] as [number, number, number], radius };
    });

    return points.map((point) => {
      let bestScore = 0;
      let bestColor: [number, number, number] | null = null;

      for (const cluster of clusterStyles) {
        const dx = point.x - cluster.x;
        const dy = point.y - cluster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > cluster.radius) continue;

        const score = 1 - dist / cluster.radius;
        if (score > bestScore) {
          bestScore = score;
          bestColor = cluster.color;
        }
      }

      if (!bestColor || bestScore <= 0) {
        return { ...point, fillColor: pointColor };
      }

      const blend = clamp(bestScore * 0.9, 0.2, 0.9);
      const base = pointColor;
      const color: [number, number, number, number] = [
        Math.round(base[0] * (1 - blend) + bestColor[0] * blend),
        Math.round(base[1] * (1 - blend) + bestColor[1] * blend),
        Math.round(base[2] * (1 - blend) + bestColor[2] * blend),
        base[3],
      ];

      return { ...point, fillColor: color };
    });
  }, [colorByClusters, clusters, points, pointColor, resolvedTheme]);

  const layers = useMemo(
    () => [
      new ScatterplotLayer<RenderPoint>({
        id: "map-points",
        data: renderPoints,
        pickable: true,
        getPosition: (d) => [d.x, d.y],
        getFillColor: (d) => d.fillColor,
        getRadius: 0.4,
        radiusUnits: "pixels",
        radiusMinPixels: 0.2,
        radiusMaxPixels: 1.4,
        stroked: false,
        onClick: (info: PickingInfo<DecodedPoint>) => {
          if (!info.object) {
            return;
          }
          const srcEvent = (
            info as PickingInfo<DecodedPoint> & { srcEvent?: Event }
          ).srcEvent;
          const clickX =
            srcEvent && "clientX" in srcEvent
              ? (srcEvent as MouseEvent).clientX
              : Number.isFinite(info.x)
                ? info.x
                : windowSize.width / 2;
          const clickY =
            srcEvent && "clientY" in srcEvent
              ? (srcEvent as MouseEvent).clientY
              : Number.isFinite(info.y)
                ? info.y
                : windowSize.height / 2;

          setSelectedPoint({
            accession: info.object.accession,
            x: clickX,
            y: clickY,
          });
          setHighlightedPoint(info.object);
        },
      }),
      new ScatterplotLayer<DecodedPoint>({
        id: "map-highlight-point",
        data: highlightedPoint ? [highlightedPoint] : [],
        pickable: false,
        getPosition: (d) => [d.x, d.y],
        getFillColor: [255, 92, 71, 255],
        getRadius: 0.9,
        radiusUnits: "pixels",
        radiusMinPixels: 1,
        radiusMaxPixels: 1.6,
        stroked: true,
        getLineColor: [255, 255, 255, 220],
        lineWidthMinPixels: 0.5,
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
        getColor: clusterTextColor,
        fontWeight: 700,
        getTextAnchor: "middle",
        getAlignmentBaseline: "bottom",
        getPixelOffset: [0, -8],
      }),
    ],
    [
      renderPoints,
      highlightedPoint,
      visibleClusters,
      windowSize.width,
      windowSize.height,
      clusterTextColor,
    ],
  );

  const orthographicView = useMemo(() => new OrthographicView({ id: "ortho" }), []);
  const deckController = useMemo(
    () => ({ dragPan: true, scrollZoom: true, touchZoom: true }),
    [],
  );

  const metadataCardPosition = useMemo(() => {
    if (!selectedPoint) {
      return null;
    }

    const cardWidth = 360;
    const cardHeight = 220;
    const margin = 12;
    const maxLeft = Math.max(margin, windowSize.width - cardWidth - margin);
    const maxTop = Math.max(margin, windowSize.height - cardHeight - margin);

    return {
      left: clamp(selectedPoint.x + 24, margin, maxLeft),
      top: clamp(selectedPoint.y + 14, margin, maxTop),
      width: cardWidth,
    };
  }, [selectedPoint, windowSize.width, windowSize.height]);

  if (dataQuery.isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%" }}>
        <Text size={{ initial: "2", md: "3" }}>Loading map data...</Text>
      </Flex>
    );
  }

  if (dataQuery.isError) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%" }}>
        <Text size={{ initial: "2", md: "3" }} color="red">
          {(dataQuery.error as Error).message}
        </Text>
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
        <Card size={{ initial: "1", md: "2" }}>
          <form onSubmit={handleSearchSubmit}>
            <Flex direction="column" gap="2">
              <Flex gap="2" align="center">
                <TextField.Root
                  placeholder="Search accession"
                  value={searchInput}
                  size={{ initial: "1", md: "2" }}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    if (searchError) setSearchError(null);
                  }}
                />
                <IconButton
                  type="submit"
                  variant="soft"
                  size={{ initial: "2", md: "2" }}
                  aria-label="Search accession"
                >
                  <MagnifyingGlassIcon />
                </IconButton>
              </Flex>
              {searchError && (
                <Text size={{ initial: "1", md: "2" }} color="red">
                  {searchError}
                </Text>
              )}
            </Flex>
          </form>
        </Card>
      </Box>
      <Box style={{ position: "absolute", top: 12, right: 12, zIndex: 22 }}>
        <Card size={{ initial: "1", md: "2" }}>
          <Flex align="center" gap="2">
            <Checkbox
              id="cluster-color-toggle"
              size={{ initial: "1", md: "2" }}
              checked={colorByClusters}
              onCheckedChange={(checked) => setColorByClusters(Boolean(checked))}
            />
            <Text
              as="label"
              htmlFor="cluster-color-toggle"
              size={{ initial: "1", md: "2" }}
            >
              Color by clusters
            </Text>
          </Flex>
        </Card>
      </Box>
      <Box style={{ position: "absolute", right: 12, bottom: 24, zIndex: 20 }}>
        <Card size={{ initial: "1", md: "2" }}>
          <Flex gap="2" direction="column" align="center">
            <Tooltip content="Zoom in" side="left">
              <IconButton
                variant="soft"
                size={{ initial: "2", md: "2" }}
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
                size={{ initial: "2", md: "2" }}
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
                size={{ initial: "2", md: "2" }}
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
            position: "fixed",
            left: metadataCardPosition.left,
            top: metadataCardPosition.top,
            width: metadataCardPosition.width,
            maxWidth: "min(90vw, 360px)",
            zIndex: 25,
          }}
        >
          <Card size={{ initial: "1", md: "2" }}>
            <Flex direction="column" gap="2">
              <Flex align="center" justify="between" gap="2">
                <Text
                  size={{ initial: "1", md: "2" }}
                  color="gray"
                  style={{ overflowWrap: "anywhere" }}
                >
                  {metadataQuery.data?.accession || selectedPoint.accession}
                </Text>
                <IconButton
                  variant="ghost"
                  size={{ initial: "1", md: "2" }}
                  aria-label="Close metadata card"
                  onClick={() => setSelectedPoint(null)}
                >
                  <Cross1Icon />
                </IconButton>
              </Flex>

              {metadataQuery.isLoading && (
                <Text size={{ initial: "2", md: "3" }} color="gray">
                  Loading metadata...
                </Text>
              )}

              {metadataQuery.isError && (
                <Text size={{ initial: "2", md: "3" }} color="red">
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
                    <Text size={{ initial: "2", md: "3" }} weight="bold">
                      {metadataQuery.data.title || "Untitled"}
                    </Text>
                  </Link>
                  <Text size={{ initial: "1", md: "2" }} color="gray">
                    {metadataQuery.data.description
                      ? truncateText(metadataQuery.data.description, 100)
                      : "No description available."}
                  </Text>
                </>
              )}
            </Flex>
          </Card>
        </Box>
      )}

      <DeckGL
        views={orthographicView}
        controller={deckController}
        useDevicePixels={isMobileDevice ? MOBILE_MAX_DEVICE_PIXELS : true}
        pickingRadius={isMobileDevice ? 5 : 8}
        viewState={{
          ...viewState,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
        }}
        onViewStateChange={({ viewState: nextViewState, interactionState }) => {
          const next: ViewState = {
            target: nextViewState.target as [number, number, number],
            zoom: nextViewState.zoom as number,
          };
          const isInteracting = Boolean(
            interactionState?.isDragging ||
              interactionState?.isPanning ||
              interactionState?.isZooming,
          );

          if (!isMobileDevice || !isInteracting) {
            pendingViewStateRef.current = null;
            if (viewStateCommitRafRef.current !== null) {
              cancelAnimationFrame(viewStateCommitRafRef.current);
              viewStateCommitRafRef.current = null;
            }
            lastViewStateCommitRef.current = performance.now();
            setViewState(next);
            return;
          }

          const now = performance.now();
          const minFrameMs = 1000 / MOBILE_INTERACTION_FPS;
          const elapsed = now - lastViewStateCommitRef.current;

          if (elapsed >= minFrameMs) {
            pendingViewStateRef.current = null;
            lastViewStateCommitRef.current = now;
            setViewState(next);
            return;
          }

          pendingViewStateRef.current = next;
          if (viewStateCommitRafRef.current === null) {
            viewStateCommitRafRef.current = requestAnimationFrame(() => {
              viewStateCommitRafRef.current = null;
              if (!pendingViewStateRef.current) return;
              lastViewStateCommitRef.current = performance.now();
              setViewState(pendingViewStateRef.current);
              pendingViewStateRef.current = null;
            });
          }
        }}
        layers={layers}
      />
    </Box>
  );
}
