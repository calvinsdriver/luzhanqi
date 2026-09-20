# Board authoring notes

`src/lib/rules/board2p.ts` and `board4p.ts` build the board graphs programmatically from
`gridBuilder.ts` rather than hand-listing every node/edge, since a 65- or 129-node adjacency
list is too error-prone to write out by hand. This file records the concrete layout
decisions made while translating the ancientchess.com / Wikipedia rule descriptions (which
describe topology, not exact coordinates) into a graph, so anyone revisiting the board data
knows why it looks the way it does - and so a later pixel-accurate pass against real board
photos has a clear starting point to correct, rather than starting from scratch.

## Per-territory grid (both boards)

Every territory is a 6-row x 5-col grid. Row 0 is the front row (nearest the opposing side
or the shared neutral zone); row 5 is the back row.

- **Camps** sit at the 4 corners + center of the (rows 1-3, cols 1-3) sub-block - the
  classic board's "X"/diamond camp pattern. Camps get extra diagonal road edges to all
  in-bounds diagonal neighbors (post or camp), in addition to normal orthogonal edges.
- **Headquarters** sit at (row 5, col 1) and (row 5, col 3).
- Everything else in the 30-node territory is a plain post (23 of them).

## 2P board (65 nodes)

Two territories (seats 0 and 1) face each other across a 5-node neutral strip.
Columns 1 and 3 of the strip are impassable mountains; columns 0, 2, and 4 are the 3
frontline connectors, each linking straight across to the matching column of both
territories' front rows.

Rails: one vertical rail per outer column (0 and 4) running the entire board length -
back row of territory 0, through its front row, through the neutral connector, through
territory 1's front row, to its back row - plus one horizontal rail along each territory's
own front row. The nodes where a vertical rail meets a front-row rail (each territory's
(row 0, col 0) and (row 0, col 4)) are the corner-turn junctions: non-Engineers continue
straight on whichever rail they started on, only Engineers may turn onto the other.

## 4P board (129 nodes)

Four territories (seats 0-3, north/east/south/west, no mountains) surround a shared 3x3
neutral hub. Opposite seats (0,2) and (1,3) are allied teams.

A 3x3 hub only has 3 cells along each edge, so - mirroring the 2P board's "3 of 5 columns
connect" pattern - each territory's front-row columns 0, 2, and 4 are the ones wired to the
hub: column 2 (the middle) connects to that edge's middle cell, and columns 0/4 connect to
that edge's two corner cells. Hub corners are each shared by two adjacent territories (e.g.
the north territory's column-0 corner is the same hub cell as the west territory's
column-4 corner), which is what makes the ring-shaped rail below meaningful.

Rails: each territory keeps the same two outer-column rails and one front-row rail as the
2P board, except the outer-column rails now continue one extra step into the hub corner
cell they connect to. The hub's own perimeter (all 4 edges) is itself one continuous rail
ring. A piece arriving at a hub corner via its home territory's rail can only continue
straight past that corner if it's an Engineer turning onto the ring; everyone else's rail
move simply ends there (or short of it, if blocked).

## Known simplification / follow-up

Render coordinates (`x`, `y` on each `BoardNode`) are cosmetic placeholders chosen to keep
each territory's orientation sensible around its board, not pixel-measurements from the
source diagrams. If/when a real reference image is available, use the dev-only
`/dev/board-debug` page (renders every node id over the SVG) to correct coordinates node by
node - the *topology* (which nodes connect to which) described above is what the rules
engine actually depends on, and won't need to change.
