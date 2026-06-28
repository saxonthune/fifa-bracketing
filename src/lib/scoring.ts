import type {
  UserBracket,
  MatchId,
  CurrentStandings,
  RoundId,
  TeamCode,
} from "./types";

/** Points per correct pick by round (D-scoring-rule, doubling: each round worth
 *  2× the previous, the de-facto standard). TP (third place) assumed = QF level
 *  pending a human call (D-scoring-rule note). */
export const ROUND_POINTS: Record<RoundId, number> = {
  R32: 1,
  R16: 2,
  QF: 4,
  SF: 8,
  F: 16,
  TP: 4,
};

export type MatchOutcome = "correct" | "wrong" | "pending";

export interface MatchScore {
  round: RoundId;
  pick?: TeamCode; // what the bracket predicted, if anything
  actual?: TeamCode; // the decided winner, if the match has resolved
  outcome: MatchOutcome;
  points: number; // earned points, 0 unless correct
}

export interface BracketScore {
  total: number;
  matches: Record<MatchId, MatchScore>;
}

/** A MatchId is `${RoundId}-${number}` and no RoundId contains "-", so the
 *  round is the prefix before the first dash. */
function roundOf(matchId: string): RoundId | undefined {
  const round = matchId.slice(0, matchId.indexOf("-"));
  return round in ROUND_POINTS ? (round as RoundId) : undefined;
}

/**
 * Score one bracket against current results: per-match outcome plus the total.
 * Pure, structure-free — the round (hence point value) is read off each MatchId.
 * A direct per-match comparison (D-bracket-representation); it does not assume feeder
 * consistency (D-builder-consistency), and busted/eliminated rendering is the
 * resolver's concern, not the scorer's.
 */
export function scoreBracket(bracket: UserBracket, results: CurrentStandings): BracketScore {
  const matches: Record<string, MatchScore> = {};
  let total = 0;

  // resolved mixes entry-slot refs and match ids in one list; a match id key
  // only ever appears as that match's decided winner.
  const winners = new Map(results.resolved);

  for (const [matchId, pick] of Object.entries(bracket.picks)) {
    const round = roundOf(matchId);
    if (round === undefined) continue;

    const actual = winners.get(matchId as MatchId);
    let outcome: MatchOutcome;
    let points = 0;

    if (actual === undefined) {
      outcome = "pending";
    } else if (actual === pick) {
      outcome = "correct";
      points = ROUND_POINTS[round];
      total += points;
    } else {
      outcome = "wrong";
    }

    matches[matchId] = { round, pick, actual, outcome, points };
  }

  return { total, matches };
}
