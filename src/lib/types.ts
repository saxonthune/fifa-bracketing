// Contract types — the serialized shapes the whole app shares.
// Source of truth: .rhidoc/02-contracts (doc02.01 bracket, 02.02 results,
// 02.03 share-code, 02.04 structure, 02.05 teams). Change the doc, then this.

// ─── Atoms ───────────────────────────────────────────────────────────────────

export const ROUND_IDS = ["R32", "R16", "QF", "SF", "TP", "F"] as const;
export type RoundId = (typeof ROUND_IDS)[number];

/** Semantic match id used as the map key everywhere, e.g. "R32-1", "F-1".
 *  The official FIFA match number (73–104) lives in MatchMeta.num, not here. */
export type MatchId = `${RoundId}-${number}`;

/** FIFA three-letter code, e.g. "GER", "NED", "ENG". Deliberately not ISO
 *  (doc02.05). All scoring and cross-references run on this. */
export type TeamCode = string;

export type GroupLetter =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

// ─── Structure (doc02.04) — the static skeleton ──────────────────────────────

/** How a slot's occupant is determined, resolved against results at render. */
export type GroupPositionRef = `${GroupLetter}${1 | 2}`; // A1 = winner, B2 = runner-up
export type BestThirdRef = `3rd:${string}`;              // e.g. "3rd:AIJ"
export type WinnerRef = `W:${MatchId}`;
export type LoserRef = `L:${MatchId}`;
export type SlotRef = GroupPositionRef | BestThirdRef | WinnerRef | LoserRef;

/** The slots reality fills directly at the R32 entry (later slots resolve
 *  from match outcomes). Used as the key set of Results.slots. */
export type EntrySlotRef = GroupPositionRef | BestThirdRef;

export interface MatchMeta {
  num: number;       // official FIFA match number (73–104)
  kickoff: string;   // single absolute instant, ISO-8601 UTC ("…Z"); formatted client-side
  venue: string;     // host city only
}

export interface Match {
  round: RoundId;
  slots: [SlotRef, SlotRef];
  feedsWinner?: MatchId; // absent on F-1
  feedsLoser?: MatchId;  // present only where a loser advances (SF → TP-1)
  meta: MatchMeta;
}

export interface Structure {
  v: number;
  rounds: RoundId[];
  matches: Record<MatchId, Match>;
}

// ─── Bracket (doc02.01) — one entrant's prediction ───────────────────────────

/** Match id → predicted winning team. A partial fill (Builder in progress) is
 *  valid; missing keys are simply unpicked. */
export type Picks = Record<MatchId, TeamCode>;

export interface Bracket {
  v: number;
  entrant: string;
  /** Display title. Present in the share-code payload (doc02.03) but not yet in
   *  doc02.01 — the two contracts disagree and need reconciling. Optional here
   *  until that's resolved. */
  title?: string;
  picks: Picks;
}

// ─── Results (doc02.02) — maintainer-pushed reality ──────────────────────────

export interface Results {
  v: number;
  /** Entry SlotRef → the team reality placed there (group positions and
   *  best-third conditionals resolved). */
  slots: Record<EntrySlotRef, TeamCode>;
  /** Match id → actual winner, decided matches only. Absence = not yet played. */
  winners: Record<MatchId, TeamCode>;
}

// ─── Team registry (doc02.05) ────────────────────────────────────────────────

export interface Team {
  name: string;
  flag: string;        // flag-icons key — ISO alpha-2 ("de") or subdivision ("gb-eng")
  group: GroupLetter;
}

export interface TeamRegistry {
  v: number;
  teams: Record<TeamCode, Team>;
}

// ─── Share code (doc02.03) ───────────────────────────────────────────────────

/** The "tag~payload" string an entrant copies, e.g. "1~eyJ2Ijox…". Tag selects
 *  the encoding (1 = URL-safe base64 of bracket JSON); see doc02.03. */
export type ShareCode = string;
