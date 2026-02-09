"use client";

import { SERVER_URL } from "@/utils/constants";
import { CornersIcon, ZoomInIcon, ZoomOutIcon } from "@radix-ui/react-icons";
import { Box, Card, Flex, IconButton, Text, Tooltip } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { OrthographicView } from "@deck.gl/core";
import { ScatterplotLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { useMemo, useState } from "react";

type DecodedPoint = {
  accession: string;
  x: number;
  y: number;
};

type ViewState = {
  target: [number, number, number];
  zoom: number;
};

const POINT_COLOR: [number, number, number, number] = [97, 207, 196, 210];
const MIN_ZOOM = -8;
const MAX_ZOOM = 22;
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
      `Data mismatch: points=${points.length}, accessions=${accessions.length}`
    );
  }

  return points.map((point, index) => ({
    accession: accessions[index],
    x: point.x,
    y: point.y,
  }));
}

export default function MapGraph() {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);

  const dataQuery = useQuery({
    queryKey: ["map-binaries"],
    queryFn: fetchMapData,
    retry: 2,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const points = useMemo<DecodedPoint[]>(() => {
    const raw = dataQuery.data;
    if (!raw || raw.length === 0) {
      return [];
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

    const xSpan = maxX - minX || 1;
    const ySpan = maxY - minY || 1;
    const extent = 2200;

    return raw.map((point) => ({
      accession: point.accession,
      x: ((point.x - minX) / xSpan - 0.5) * extent,
      y: ((point.y - minY) / ySpan - 0.5) * extent,
    }));
  }, [dataQuery.data]);

  const layers = useMemo(
    () => [
      new ScatterplotLayer<DecodedPoint>({
        id: "map-points",
        data: points,
        pickable: false,
        getPosition: (d) => [d.x, d.y],
        getFillColor: POINT_COLOR,
        getRadius: 0.4,
        radiusUnits: "pixels",
        radiusMinPixels: 0.2,
        radiusMaxPixels: 1.4,
        stroked: false,
      }),
    ],
    [points]
  );

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

  return (
    <Box style={{ height: "100%", position: "relative" }}>
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
            zoom: nextViewState.zoom,
          });
        }}
        layers={layers}
      />
    </Box>
  );
}
