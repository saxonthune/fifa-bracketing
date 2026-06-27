// Render model — the resolved, display-ready shapes the bracket UI consumes.
// Produced by lib/resolve + lib/layout from the contract types (TournamentStructure,
// CurrentStandings, TeamRegistry); consumed by the bracket components. This is the
// seam that lets Tracker (reality) and Builder (predictions) share one renderer:
// same model, different winner source.

import type { MatchId, TeamCode } from "./types";

/** One slot of a match, resolved for display: either a known team, or an
 *  unresolved ref rendered as a human label ("Winner of QF-1", "Group A
 *  runner-up"). */
export type ResolvedSlot =
  | { kind: "team"; code: TeamCode; name: string; flag: string }
  | { kind: "pending"; label: string };

export interface ResolvedMatchMeta {
  num: number;     // official FIFA match number
  venue: string;   // host city
  kickoff: string; // ISO-8601 UTC; formatted client-side at render
}

export interface ResolvedMatch {
  id: MatchId;
  meta: ResolvedMatchMeta;
  slots: [ResolvedSlot, ResolvedSlot];
  /** Winning team code iff this match is decided; absent while unresolved. */
  winner?: TeamCode;
}

/** Where a match sits in the bracket grid. Pure function of the structure —
 *  independent of teams, standings, or picks. */
export interface GridPos {
  side: "left" | "right" | "center";
  column: number;   // 1-based grid column
  rowStart: number; // 1-based grid row
  rowSpan: number;  // doubles each round: R32=1, R16=2, QF=4, SF=8
}
