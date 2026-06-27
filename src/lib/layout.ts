import type { TournamentStructure, Match, MatchId, RoundId, SlotRef } from "./types";
import type { GridPos } from "./render-model";

const LEFT_COLS: Partial<Record<RoundId, number>> = {
  R32: 1, R16: 2, QF: 3, SF: 4,
};
const RIGHT_COLS: Partial<Record<RoundId, number>> = {
  SF: 8, QF: 9, R16: 10, R32: 11,
};

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

function childMatchId(ref: SlotRef): MatchId | null {
  return ref.startsWith("W:") ? (ref.slice(2) as MatchId) : null;
}

function layoutSubtree(
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
      ? layoutSubtree(topId, matches, side, cursor, out)
      : { rowStart: cursor.v++, rowSpan: 1 };
    const bot = botId
      ? layoutSubtree(botId, matches, side, cursor, out)
      : { rowStart: cursor.v++, rowSpan: 1 };
    rowStart = top.rowStart;
    rowSpan = top.rowSpan + bot.rowSpan;
  }

  const round = match?.round ?? ("R32" as RoundId);
  const column = side === "left" ? (LEFT_COLS[round] ?? 4) : (RIGHT_COLS[round] ?? 8);
  out.set(id, { side, column, rowStart, rowSpan });
  return { rowStart, rowSpan };
}

export function layoutMatches(structure: TournamentStructure): Map<MatchId, GridPos> {
  const { matches } = structure;
  const result = new Map<MatchId, GridPos>();

  // Lay out the two halves independently
  if (matches["SF-1"]) {
    layoutSubtree("SF-1", matches, "left", { v: 1 }, result);
  }
  if (matches["SF-2"]) {
    layoutSubtree("SF-2", matches, "right", { v: 1 }, result);
  }

  // Center matches: fixed positions
  if (matches["F-1"]) {
    result.set("F-1", { side: "center", column: 6, rowStart: 3, rowSpan: 4 });
  }
  if (matches["TP-1"]) {
    result.set("TP-1", { side: "center", column: 6, rowStart: 7, rowSpan: 2 });
  }

  // Any remaining matches not yet placed (edge case: orphaned matches)
  for (const id of Object.keys(matches) as MatchId[]) {
    if (!result.has(id)) {
      const side = determineSide(id, matches);
      const round = matches[id].round;
      const column =
        side === "center"
          ? 6
          : side === "left"
          ? (LEFT_COLS[round] ?? 4)
          : (RIGHT_COLS[round] ?? 8);
      result.set(id, { side, column, rowStart: 1, rowSpan: 1 });
    }
  }

  return result;
}
