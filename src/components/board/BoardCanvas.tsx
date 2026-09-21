"use client";

import { useMemo } from "react";
import type { BoardGraph, NodeId, PublicPiece } from "@/lib/rules/types";
import { rotatePoint, viewerRotationDegrees } from "@/lib/client/boardOrientation";
import { PieceToken } from "./PieceToken";

const CELL = 40;
const PADDING = 1;

/**
 * Pure board renderer, shared by the live game screen and the placement screen. It only
 * renders the board + pieces and reports clicks - it has no opinion on what a click means
 * (move a piece, place a piece, etc.), so each caller supplies its own `onNodeClick`.
 */
export function BoardCanvas({
  board,
  pieces,
  seatIndex,
  selectedNode,
  highlightedNodes,
  onNodeClick,
}: {
  board: BoardGraph;
  pieces: PublicPiece[];
  seatIndex: number;
  selectedNode: NodeId | null;
  highlightedNodes: NodeId[];
  onNodeClick: (nodeId: NodeId) => void;
}) {
  const nodes = useMemo(() => Object.values(board.nodes), [board]);

  // Board data is authored in a fixed absolute layout (seat 0 always "north", etc.) - rotate
  // it per viewer here, purely for rendering, so your own seat always ends up at the bottom.
  const rotationDeg = viewerRotationDegrees(board.mode, seatIndex);
  const rotated = useMemo(() => {
    const map = new Map<NodeId, { x: number; y: number }>();
    for (const node of nodes) map.set(node.id, rotatePoint(node.x, node.y, rotationDeg));
    return map;
  }, [nodes, rotationDeg]);

  const { minX, minY, width, height } = useMemo(() => {
    const points = [...rotated.values()];
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs) - PADDING;
    const minY = Math.min(...ys) - PADDING;
    const maxX = Math.max(...xs) + PADDING;
    const maxY = Math.max(...ys) + PADDING;
    return { minX, minY, width: (maxX - minX) * CELL, height: (maxY - minY) * CELL };
  }, [rotated]);

  const px = (nodeId: NodeId) => (rotated.get(nodeId)!.x - minX) * CELL;
  const py = (nodeId: NodeId) => (rotated.get(nodeId)!.y - minY) * CELL;

  const pieceByNode = useMemo(() => {
    const map = new Map<NodeId, PublicPiece>();
    for (const p of pieces) if (p.status === "in_play" && p.nodeId) map.set(p.nodeId, p);
    return map;
  }, [pieces]);

  const roadLines = useMemo(() => {
    const seen = new Set<string>();
    const lines: [NodeId, NodeId][] = [];
    for (const [from, neighbors] of Object.entries(board.roadEdges)) {
      for (const to of neighbors) {
        const key = [from, to].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push([from, to]);
      }
    }
    return lines;
  }, [board]);

  const highlightSet = useMemo(() => new Set(highlightedNodes), [highlightedNodes]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="max-h-full max-w-full"
      style={{ width: "auto", height: "auto", aspectRatio: `${width} / ${height}` }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Luzhanqi board"
    >
      {roadLines.map(([from, to]) => (
        <line
          key={`road-${from}-${to}`}
          x1={px(from)}
          y1={py(from)}
          x2={px(to)}
          y2={py(to)}
          stroke="var(--color-border)"
          strokeWidth={1.5}
        />
      ))}

      {board.railLines.map((line, i) => (
        <polyline
          key={`rail-${i}`}
          points={line.map((id) => `${px(id)},${py(id)}`).join(" ")}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={3}
          strokeDasharray="2 4"
          opacity={0.6}
        />
      ))}

      {nodes.map((node) => {
        const isHighlighted = highlightSet.has(node.id);
        const fill =
          node.type === "mountain"
            ? "#000"
            : node.type === "headquarters"
              ? "var(--color-primary)"
              : node.type === "camp"
                ? "rgba(201,162,39,0.25)"
                : "var(--color-surface-raised)";
        return (
          <g key={node.id} onClick={() => onNodeClick(node.id)} style={{ cursor: "pointer" }}>
            <circle
              cx={px(node.id)}
              cy={py(node.id)}
              r={node.type === "mountain" ? CELL * 0.15 : CELL * 0.22}
              fill={fill}
              stroke={isHighlighted ? "var(--color-accent)" : "transparent"}
              strokeWidth={isHighlighted ? 3 : 0}
            />
          </g>
        );
      })}

      {[...pieceByNode.entries()].map(([nodeId, piece]) => (
        <PieceToken
          key={piece.id}
          piece={piece}
          cx={px(nodeId)}
          cy={py(nodeId)}
          isSelected={selectedNode === nodeId}
          isSelectable={piece.seatIndex === seatIndex}
          onClick={() => onNodeClick(nodeId)}
        />
      ))}
    </svg>
  );
}
