import { describe, expect, it } from "vitest";
import { BOARD_2P } from "../board2p";
import { BOARD_4P } from "../board4p";

describe("BOARD_2P", () => {
  const nodes = Object.values(BOARD_2P.nodes);

  it("has 65 nodes", () => {
    expect(nodes.length).toBe(65);
  });

  it("has 10 camps, 4 headquarters, 2 mountains", () => {
    expect(nodes.filter((n) => n.type === "camp").length).toBe(10);
    expect(nodes.filter((n) => n.type === "headquarters").length).toBe(4);
    expect(nodes.filter((n) => n.type === "mountain").length).toBe(2);
  });

  it("has exactly 3 frontline connectors between the two territories", () => {
    let connectorCount = 0;
    for (const neutral of nodes.filter((n) => n.type === "neutral")) {
      const linksBothSides =
        BOARD_2P.roadEdges[neutral.id].some((n) => BOARD_2P.nodes[n].territory === 0) &&
        BOARD_2P.roadEdges[neutral.id].some((n) => BOARD_2P.nodes[n].territory === 1);
      if (linksBothSides) connectorCount++;
    }
    expect(connectorCount).toBe(3);
  });

  it("mountains have no edges at all", () => {
    for (const mountain of nodes.filter((n) => n.type === "mountain")) {
      expect(BOARD_2P.roadEdges[mountain.id]).toEqual([]);
    }
  });
});

describe("BOARD_4P", () => {
  const nodes = Object.values(BOARD_4P.nodes);

  it("has 129 nodes (4x30 territories + 9 hub)", () => {
    expect(nodes.length).toBe(129);
  });

  it("has 20 camps and 8 headquarters", () => {
    expect(nodes.filter((n) => n.type === "camp").length).toBe(20);
    expect(nodes.filter((n) => n.type === "headquarters").length).toBe(8);
  });

  it("has a 9-node neutral hub with no mountains", () => {
    expect(nodes.filter((n) => n.territory === "neutral").length).toBe(9);
    expect(nodes.filter((n) => n.type === "mountain").length).toBe(0);
  });

  it("each territory has exactly 3 frontline connectors into the hub", () => {
    for (const seat of [0, 1, 2, 3]) {
      let connectorCount = 0;
      for (const node of nodes.filter((n) => n.territory === seat)) {
        const linksToHub = BOARD_4P.roadEdges[node.id].some(
          (n) => BOARD_4P.nodes[n].territory === "neutral",
        );
        if (linksToHub) connectorCount++;
      }
      expect(connectorCount).toBe(3);
    }
  });

  it("the hub's center connects diagonally to all 4 corners, like a camp", () => {
    for (const corner of ["H-0-0", "H-0-2", "H-2-0", "H-2-2"]) {
      expect(BOARD_4P.roadEdges["H-1-1"]).toContain(corner);
      expect(BOARD_4P.roadEdges[corner]).toContain("H-1-1");
    }
  });

  it("has rail lines running straight through the hub's center in both directions and both diagonals", () => {
    const throughCenterLines = BOARD_4P.railLines.filter((line) => line.includes("H-1-1"));
    // middle row, middle column, and both corner-to-corner diagonals
    expect(throughCenterLines.length).toBe(4);
    for (const line of throughCenterLines) {
      expect(line[Math.floor(line.length / 2)]).toBe("H-1-1"); // center sits mid-line, not at an end
    }
  });
});
