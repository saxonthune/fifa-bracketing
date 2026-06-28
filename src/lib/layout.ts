import type { TournamentStructure, Match, MatchId, RoundId, SlotRef } from "./types";
import type { GridPos } from "./render-model";

export type BracketMode = "symmetric" | "linear" | "sectioned";

/** A computed placement of every match plus the connector graph and any
 *  section-handoff markers. Grid units (column/row counts); the renderer maps
 *  them to pixels. */
export interface BracketLayout {
  mode: BracketMode;
  positions: Map<MatchId, GridPos>;
  cols: number;
  rows: number;
  /** Adjacent feeder→feedee pairs to draw a connector for. */
  links: Array<{ child: MatchId; parent: MatchId }>;
  /** Last-round cells of a non-final section: get a dotted right-stub meaning
   *  "this winner continues in the section below." */
  continues: MatchId[];
  /** Sectioned mode only: a header per stacked block naming its rounds, placed at
   *  `rowStart`. Empty for symmetric/linear (their column order reads the rounds). */
  sections: Array<{ label: string; rowStart: number }>;
  /** 1-based grid rows that are inter-section spacers, rendered at a small fixed
   *  height instead of CELL_H so the block gap is decoupled from cell size. */
  gapRows: number[];
}

/** Display names for the round-id prefixes; used to label sectioned blocks. */
const ROUND_NAMES: Record<RoundId, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  TP: "Third place",
  F: "Final",
};

/** Round is the MatchId prefix before the first dash (no RoundId contains "-"). */
function roundOf(id: MatchId): RoundId {
  return id.slice(0, id.indexOf("-")) as RoundId;
}

function childMatchId(ref: SlotRef): MatchId | null {
  return ref.startsWith("W:") ? (ref.slice(2) as MatchId) : null;
}

const midRow = (p: GridPos) => p.rowStart - 1 + p.rowSpan / 2;

/** A connector is drawn between a match and its feedsWinner parent only when
 *  they sit in adjacent columns AND the parent's row band contains the child's
 *  mid-row. The row test is what keeps a sectioned layout's cross-section feeds
 *  (parent offset far down) from drawing a spurious diagonal. */
function adjacentLinks(
  structure: TournamentStructure,
  positions: Map<MatchId, GridPos>
): BracketLayout["links"] {
  const links: BracketLayout["links"] = [];
  for (const [id, match] of Object.entries(structure.matches)) {
    const parentId = match.feedsWinner;
    if (!parentId) continue;
    const child = positions.get(id as MatchId);
    const parent = positions.get(parentId);
    if (!child || !parent) continue;
    if (Math.abs(parent.column - child.column) !== 1) continue;
    const m = midRow(child);
    if (m >= parent.rowStart - 1 && m < parent.rowStart - 1 + parent.rowSpan) {
      links.push({ child: id as MatchId, parent: parentId });
    }
  }
  return links;
}

/** Single-direction (rightward) recursive packer. Lays out the subtree rooted at
 *  `id`, treating any child not accepted by `inScope` as a leaf (so a section can
 *  stop at a round boundary). `colOf` maps a round to its 1-based column. */
function packLinear(
  id: MatchId,
  matches: Record<MatchId, Match>,
  colOf: (round: RoundId) => number,
  inScope: (id: MatchId) => boolean,
  cursor: { v: number },
  out: Map<MatchId, GridPos>
): { rowStart: number; rowSpan: number } {
  const match = matches[id];
  const c0 = match ? childMatchId(match.slots[0]) : null;
  const c1 = match ? childMatchId(match.slots[1]) : null;
  const topId = c0 && inScope(c0) ? c0 : null;
  const botId = c1 && inScope(c1) ? c1 : null;

  let rowStart: number;
  let rowSpan: number;
  if (!topId && !botId) {
    rowStart = cursor.v++;
    rowSpan = 1;
  } else {
    const top = topId
      ? packLinear(topId, matches, colOf, inScope, cursor, out)
      : { rowStart: cursor.v++, rowSpan: 1 };
    const bot = botId
      ? packLinear(botId, matches, colOf, inScope, cursor, out)
      : { rowStart: cursor.v++, rowSpan: 1 };
    rowStart = top.rowStart;
    rowSpan = top.rowSpan + bot.rowSpan;
  }

  out.set(id, { side: "right", column: colOf(roundOf(id)), rowStart, rowSpan });
  return { rowStart, rowSpan };
}

// ─── Symmetric: the two-sided tournament (widest) ───────────────────────────

const SYM_LEFT: Partial<Record<RoundId, number>> = { R32: 1, R16: 2, QF: 3, SF: 4 };
const SYM_RIGHT: Partial<Record<RoundId, number>> = { SF: 6, QF: 7, R16: 8, R32: 9 };
const SYM_CENTER_COL = 5;
const SYM_ROWS = 8;

function determineSide(
  id: MatchId,
  matches: Record<MatchId, Match>
): "left" | "right" | "center" {
  if (id === "F-1" || id === "TP-1") return "center";
  if (id === "SF-1") return "left";
  if (id === "SF-2") return "right";
  const match = matches[id];
  if (!match?.feedsWinner) return "center";
  return determineSide(match.feedsWinner as MatchId, matches);
}

function symSubtree(
  id: MatchId,
  matches: Record<MatchId, Match>,
  side: "left" | "right",
  cursor: { v: number },
  out: Map<MatchId, GridPos>
): { rowStart: number; rowSpan: number } {
  const match = matches[id];
  const topId = match ? childMatchId(match.slots[0]) : null;
  const botId = match ? childMatchId(match.slots[1]) : null;

  let rowStart: number;
  let rowSpan: number;
  if (topId === null && botId === null) {
    rowStart = cursor.v++;
    rowSpan = 1;
  } else {
    const top = topId
      ? symSubtree(topId, matches, side, cursor, out)
      : { rowStart: cursor.v++, rowSpan: 1 };
    const bot = botId
      ? symSubtree(botId, matches, side, cursor, out)
      : { rowStart: cursor.v++, rowSpan: 1 };
    rowStart = top.rowStart;
    rowSpan = top.rowSpan + bot.rowSpan;
  }

  const round = match?.round ?? ("R32" as RoundId);
  const cols = side === "left" ? SYM_LEFT : SYM_RIGHT;
  out.set(id, { side, column: cols[round] ?? SYM_CENTER_COL, rowStart, rowSpan });
  return { rowStart, rowSpan };
}

function layoutSymmetric(structure: TournamentStructure): BracketLayout {
  const { matches } = structure;
  const positions = new Map<MatchId, GridPos>();

  if (matches["SF-1"]) symSubtree("SF-1", matches, "left", { v: 1 }, positions);
  if (matches["SF-2"]) symSubtree("SF-2", matches, "right", { v: 1 }, positions);
  if (matches["F-1"])
    positions.set("F-1", { side: "center", column: SYM_CENTER_COL, rowStart: 3, rowSpan: 4 });
  if (matches["TP-1"])
    positions.set("TP-1", { side: "center", column: SYM_CENTER_COL, rowStart: 7, rowSpan: 2 });

  for (const id of Object.keys(matches) as MatchId[]) {
    if (positions.has(id)) continue;
    const side = determineSide(id, matches);
    const round = matches[id].round;
    const cols = side === "left" ? SYM_LEFT : SYM_RIGHT;
    const column = side === "center" ? SYM_CENTER_COL : cols[round] ?? SYM_CENTER_COL;
    positions.set(id, { side, column, rowStart: 1, rowSpan: 1 });
  }

  return {
    mode: "symmetric",
    positions,
    cols: 9,
    rows: SYM_ROWS,
    links: adjacentLinks(structure, positions),
    continues: [],
    sections: [],
    gapRows: [],
  };
}

// ─── Linear: single-direction, R32→F left-to-right (medium) ──────────────────

const LINEAR_ROUNDS: RoundId[] = ["R32", "R16", "QF", "SF", "F"];

/** Places the main rounds left-to-right; TP is dropped a row below the final and
 *  left disconnected (it isn't part of the winner tree). */
function layoutLinear(structure: TournamentStructure): BracketLayout {
  const { matches } = structure;
  const colOf = (r: RoundId) => LINEAR_ROUNDS.indexOf(r) + 1;
  const inScope = (id: MatchId) => LINEAR_ROUNDS.includes(roundOf(id));
  const positions = new Map<MatchId, GridPos>();
  const cursor = { v: 1 };
  if (matches["F-1"]) packLinear("F-1", matches, colOf, inScope, cursor, positions);
  const treeRows = cursor.v - 1;

  let rows = treeRows;
  const f = positions.get("F-1");
  if (matches["TP-1"] && f) {
    positions.set("TP-1", { side: "right", column: f.column, rowStart: treeRows + 2, rowSpan: 1 });
    rows = treeRows + 2;
  }

  return {
    mode: "linear",
    positions,
    cols: LINEAR_ROUNDS.length,
    rows,
    links: adjacentLinks(structure, positions),
    continues: [],
    sections: [],
    gapRows: [],
  };
}

// ─── Sectioned: linear split into vertically stacked blocks (narrowest) ──────

const SECTION_GAP = 1;
// One reserved grid row sits between stacked blocks; the renderer draws that row
// at a small fixed pixel height (see SECTION_GAP_H) rather than a full CELL_H, so
// the visual block gap is decoupled from cell size.
// Each block is at most 2 columns wide so the narrowest tier fits a phone at
// scale ~1. The last round of every non-final block hands off to the next.
const SECTIONS: RoundId[][] = [["R32", "R16"], ["QF", "SF"], ["F"]];
const SECTIONED_COLS = Math.max(...SECTIONS.map((s) => s.length));

/** Packs one block's rounds from its own left edge, offset down by `rowOffset`.
 *  Roots are the block's last-round matches, ordered by the linear packing so the
 *  vertical order stays consistent with the other blocks. Returns the row count. */
function packSection(
  structure: TournamentStructure,
  rounds: RoundId[],
  linear: Map<MatchId, GridPos>,
  rowOffset: number,
  out: Map<MatchId, GridPos>
): number {
  const colOf = (r: RoundId) => rounds.indexOf(r) + 1;
  const inScope = (id: MatchId) => rounds.includes(roundOf(id));
  const lastRound = rounds[rounds.length - 1];
  const roots = (Object.keys(structure.matches) as MatchId[])
    .filter((id) => roundOf(id) === lastRound)
    .sort((a, b) => (linear.get(a)?.rowStart ?? 0) - (linear.get(b)?.rowStart ?? 0));
  const tmp = new Map<MatchId, GridPos>();
  const cursor = { v: 1 };
  for (const root of roots) packLinear(root, structure.matches, colOf, inScope, cursor, tmp);
  for (const [id, pos] of tmp) out.set(id, { ...pos, rowStart: pos.rowStart + rowOffset });
  return cursor.v - 1;
}

/** Vertically stacked 2-column blocks: R32→R16, then QF→SF, then F. Each block's
 *  last-round cells are marked `continues` (dotted stub → "winner flows to the
 *  block below"). TP sits under the final, disconnected. */
function layoutSectioned(structure: TournamentStructure): BracketLayout {
  const { matches } = structure;
  const positions = new Map<MatchId, GridPos>();
  const linear = layoutLinear(structure).positions;

  // Each block gets a header row at its top; matches pack one row below it.
  let offset = 0;
  const sections: BracketLayout["sections"] = [];
  const gapRows: number[] = [];
  for (const rounds of SECTIONS) {
    sections.push({ label: rounds.map((r) => ROUND_NAMES[r]).join(" · "), rowStart: offset + 1 });
    const count = packSection(structure, rounds, linear, offset + 1, positions);
    offset += 1 + count;
    for (let g = 0; g < SECTION_GAP; g++) gapRows.push(offset + 1 + g);
    offset += SECTION_GAP;
  }
  let rows = offset - SECTION_GAP;

  // TP sits disconnected below the final as its own titled block: gap row, then a
  // "Third place" header, then the card — same shape (and header styling) as the
  // round sections above it.
  const f = positions.get("F-1");
  if (matches["TP-1"] && f) {
    const gap = f.rowStart + f.rowSpan;
    gapRows.push(gap);
    sections.push({ label: ROUND_NAMES.TP, rowStart: gap + 1 });
    positions.set("TP-1", { side: "right", column: f.column, rowStart: gap + 2, rowSpan: 1 });
    rows = Math.max(rows, gap + 2);
  }

  const continuingRounds = SECTIONS.slice(0, -1).map((s) => s[s.length - 1]);
  const continues = (Object.keys(matches) as MatchId[]).filter((id) =>
    continuingRounds.includes(roundOf(id))
  );

  return {
    mode: "sectioned",
    positions,
    cols: SECTIONED_COLS,
    rows,
    links: adjacentLinks(structure, positions),
    continues,
    sections,
    gapRows: gapRows.filter((r) => r <= rows),
  };
}

export function bracketLayout(structure: TournamentStructure, mode: BracketMode): BracketLayout {
  switch (mode) {
    case "symmetric":
      return layoutSymmetric(structure);
    case "linear":
      return layoutLinear(structure);
    case "sectioned":
      return layoutSectioned(structure);
  }
}

/** Column count per mode — used to pick a mode against available width without
 *  computing the full layout. Must match what bracketLayout() returns. */
export const MODE_COLS: Record<BracketMode, number> = {
  symmetric: 9,
  linear: LINEAR_ROUNDS.length,
  sectioned: SECTIONED_COLS,
};
