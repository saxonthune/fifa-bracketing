// Contract types — the canonical serialized shapes the whole app shares.
// This file is the single source of truth for field shapes. Names live in the
// glossary (.rhidoc/02-glossary.md); rationale lives in da/decisions.md (D-*).
// Shape lives here; why lives there.

// ─── Atoms ───────────────────────────────────────────────────────────────────

export const ROUND_IDS = ["R32", "R16", "QF", "SF", "TP", "F"] as const;
export type RoundId = (typeof ROUND_IDS)[number];

/** Semantic match id used as the map key everywhere, e.g. "R32-1", "F-1".
 *  The official FIFA match number (73–104) lives in MatchMeta.num, not here. */
export type MatchId = `${RoundId}-${number}`;

/** FIFA three-letter code, e.g. "GER", "NED", "ENG". Deliberately not ISO
 *  (D-team-id). All scoring and cross-references run on this. */
export type TeamCode = string;

export type GroupLetter =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

// ─── TournamentStructure — the static skeleton ──────────────────────────────

/** How a slot's occupant is determined, resolved against results at render. */
export type GroupPositionRef = `${GroupLetter}${1 | 2}`; // A1 = winner, B2 = runner-up
export type BestThirdRef = `3rd:${string}`;              // e.g. "3rd:AIJ"
export type WinnerRef = `W:${MatchId}`;
export type LoserRef = `L:${MatchId}`;
export type SlotRef = GroupPositionRef | BestThirdRef | WinnerRef | LoserRef;

/** The slots reality fills directly at the R32 entry (later slots resolve
 *  from match outcomes). Used as the key set of CurrentStandings.slots. */
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

export interface TournamentStructure {
  v: number;
  rounds: RoundId[];
  matches: Record<MatchId, Match>;
}

// ─── UserBracket — one entrant's prediction ─────────────────────────────────

/** Match id → predicted winning team. A partial fill (Builder in progress) is
 *  valid; missing keys are simply unpicked. */
export type Picks = Record<MatchId, TeamCode>;

export interface UserBracket {
  v: number;
  entrant: string;
  /** Display title shown alongside entrant. Optional: an in-progress Builder
   *  bracket need not have one yet. A decoded share code requires it (D-share-code). */
  title?: string;
  picks: Picks;
}

// ─── CurrentStandings — maintainer-pushed reality ───────────────────────────

/** One thing reality has resolved: a ref and the team now occupying it. The ref
 *  is either an entry slot (group position / best-third, fixing an R32 entrant)
 *  or a match id (the decided winner of that match). The two key spaces are
 *  disjoint, so entrants and winners share one list. */
export type Resolution = [ref: EntrySlotRef | MatchId, team: TeamCode];

export interface CurrentStandings {
  v: number;
  /** Entrants and decided winners as one flat list; a ref's absence = not yet
   *  resolved. Build a `Map(resolved)` for lookup. */
  resolved: Resolution[];
}

// ─── Team registry ──────────────────────────────────────────────────────────

export interface Team {
  name: string;
  flag: string;        // flag-icons key — ISO alpha-2 ("de") or subdivision ("gb-eng")
  group: GroupLetter;
}

export interface TeamRegistry {
  v: number;
  teams: Record<TeamCode, Team>;
}

// ─── Share code ─────────────────────────────────────────────────────────────

/** The "tag~payload" string an entrant copies, e.g. "1~eyJ2Ijox…". Tag selects
 *  the encoding (1 = URL-safe base64 of bracket JSON); see D-share-code. */
export type ShareCode = string;
