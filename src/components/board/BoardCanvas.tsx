"use client";

import { useMemo } from "react";
import type { BoardGraph, NodeId, PublicPiece } from "@/lib/rules/types";
import { PieceToken } from "./PieceToken";

const CELL = 40;
const PADDING = 1;

export function BoardCanvas({
  board,
  pieces,
  seatIndex,
  selectedNode,
  legalDestinations,
  onSelectNode,
  onMove,
}: {
  board: BoardGraph;
  pieces: PublicPiece[];
  seatIndex: number;
  selectedNode: NodeId | null;
  legalDestinations: NodeId[];
  onSelectNode: (nodeId: NodeId | null) => void;
  onMove: (from: NodeId, to: NodeId) => void;
}) {
  const nodes = Object.values(board.nodes);

  const { minX, minY, width, height } = useMemo(() => {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - PADDING;
    const minY = Math.min(...ys) - PADDING;
    const maxX = Math.max(...xs) + PADDING;
    const maxY = Math.max(...ys) + PADDING;
    return { minX, minY, width: (maxX - minX) * CELL, height: (maxY - minY) * CELL };
  }, [nodes]);

  const px = (x: number) => (x - minX) * CELL;
  const py = (y: number) => (y - minY) * CELL;

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

  const legalSet = new Set(legalDestinations);

  function handleNodeClick(nodeId: NodeId) {
    if (selectedNode && legalSet.has(nodeId)) {
      onMove(selectedNode, nodeId);
      return;
    }
    const occupant = pieceByNode.get(nodeId);
    if (occupant && occupant.seatIndex === seatIndex) {
      onSelectNode(selectedNode === nodeId ? null : nodeId);
      return;
    }
    onSelectNode(null);
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full max-w-[720px]"
      role="img"
      aria-label="Luzhanqi board"
    >
      {roadLines.map(([from, to]) => {
        const a = board.nodes[from];
        const b = board.nodes[to];
        return (
          <line
            key={`road-${from}-${to}`}
            x1={px(a.x)}
            y1={py(a.y)}
            x2={px(b.x)}
            y2={py(b.y)}
            stroke="var(--color-border)"
            strokeWidth={1.5}
          />
        );
      })}

      {board.railLines.map((line, i) => (
        <polyline
          key={`rail-${i}`}
          points={line.map((id) => `${px(board.nodes[id].x)},${py(board.nodes[id].y)}`).join(" ")}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={3}
          strokeDasharray="2 4"
          opacity={0.6}
        />
      ))}

      {nodes.map((node) => {
        const isLegal = legalSet.has(node.id);
        const fill =
          node.type === "mountain"
            ? "#000"
            : node.type === "headquarters"
              ? "var(--color-primary)"
              : node.type === "camp"
                ? "rgba(201,162,39,0.25)"
                : "var(--color-surface-raised)";
        return (
          <g key={node.id} onClick={() => handleNodeClick(node.id)} style={{ cursor: "pointer" }}>
            <circle
              cx={px(node.x)}
              cy={py(node.y)}
              r={node.type === "mountain" ? CELL * 0.15 : CELL * 0.22}
              fill={fill}
              stroke={isLegal ? "var(--color-accent)" : "transparent"}
              strokeWidth={isLegal ? 3 : 0}
            />
          </g>
        );
      })}

      {[...pieceByNode.entries()].map(([nodeId, piece]) => {
        const node = board.nodes[nodeId];
        return (
          <PieceToken
            key={piece.id}
            piece={piece}
            cx={px(node.x)}
            cy={py(node.y)}
            isSelected={selectedNode === nodeId}
            isSelectable={piece.seatIndex === seatIndex}
            onClick={() => handleNodeClick(nodeId)}
          />
        );
      })}
    </svg>
  );
}
