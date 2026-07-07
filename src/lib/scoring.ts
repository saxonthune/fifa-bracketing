import type {
  UserBracket,
  MatchId,
  CurrentStandings,
  RoundId,
  TeamCode,
  TournamentStructure,
  TeamRegistry,
} from "./types";
import type { ResolvedMatch } from "./render-model";
import { resolveBracket, resolveMatches } from "./resolve";

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

/** The host-nation bonus: one point for correctly predicting how far USA goes —
 *  the round it is knocked out in (ro32 / ro16 / ro8) or, for a semifinalist, its
 *  exact finishing place (4th / 3rd / runner-up / champion). */
export const BONUS_TEAM: TeamCode = "USA";
export const BONUS_POINTS = 1;

export type UsaResult =
  | "ro32"
  | "ro16"
  | "ro8"
  | "fourth"
  | "third"
  | "runner-up"
  | "champion";

export type MatchOutcome = "correct" | "wrong" | "pending";

export interface MatchScore {
  round: RoundId;
  pick?: TeamCode; // what the bracket predicted, if anything
  actual?: TeamCode; // the decided winner, if the match has resolved
  outcome: MatchOutcome;
  points: number; // earned points, 0 unless correct
}

export interface BonusScore {
  team: TeamCode;
  predicted?: UsaResult; // how far the bracket sends the team, if determinable
  actual?: UsaResult; // how far the team really went, once its run has ended
  outcome: MatchOutcome;
  points: number; // BONUS_POINTS when correct, else 0
}

export interface BracketScore {
  total: number; // per-match points plus the bonus
  matches: Record<MatchId, MatchScore>;
  bonus: BonusScore;
}

/** A MatchId is `${RoundId}-${number}` and no RoundId contains "-", so the
 *  round is the prefix before the first dash. */
function roundOf(matchId: string): RoundId | undefined {
  const round = matchId.slice(0, matchId.indexOf("-"));
  return round in ROUND_POINTS ? (round as RoundId) : undefined;
}

/** How far the team goes in a resolved bracket grid, and whether that is yet
 *  settled. A semifinalist gets an exact place: F-1's winner is champion and its
 *  other side runner-up; TP-1's winner is third and its other side fourth. A team
 *  knocked out earlier gets the round it lost in (ro8 / ro16 / ro32). The run is
 *  settled the moment the team loses a decided match (or wins the final); an SF
 *  loss still routes to TP-1, so it stays pending until TP-1 decides. */
function usaResult(
  matches: ResolvedMatch[],
  team: TeamCode,
): { settled: boolean; result?: UsaResult } {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const contains = (m: ResolvedMatch | undefined) =>
    m?.slots.some((s) => s.kind === "team" && s.code === team) ?? false;

  const final = byId.get("F-1" as MatchId);
  if (final?.winner !== undefined && contains(final)) {
    return { settled: true, result: final.winner === team ? "champion" : "runner-up" };
  }
  const third = byId.get("TP-1" as MatchId);
  if (third?.winner !== undefined && contains(third)) {
    return { settled: true, result: third.winner === team ? "third" : "fourth" };
  }

  const lostIn = (round: RoundId): boolean =>
    matches.some(
      (m) => roundOf(m.id) === round && m.winner !== undefined && m.winner !== team && contains(m),
    );
  if (lostIn("QF")) return { settled: true, result: "ro8" };
  if (lostIn("R16")) return { settled: true, result: "ro16" };
  if (lostIn("R32")) return { settled: true, result: "ro32" };

  return { settled: false };
}

/** Score the host-nation bonus: how far the bracket sends USA against how far
 *  USA really goes. Pending until USA's run ends; correct only when the bracket's
 *  predicted result and reality's are the same. */
function scoreBonus(
  bracket: UserBracket,
  results: CurrentStandings,
  structure: TournamentStructure,
  registry: TeamRegistry,
): BonusScore {
  const predicted = usaResult(
    resolveBracket(structure, results, registry, bracket.picks),
    BONUS_TEAM,
  ).result;
  const { settled, result: actual } = usaResult(
    resolveMatches(structure, results, registry),
    BONUS_TEAM,
  );

  if (!settled) {
    return { team: BONUS_TEAM, predicted, outcome: "pending", points: 0 };
  }
  const correct = predicted !== undefined && predicted === actual;
  return {
    team: BONUS_TEAM,
    predicted,
    actual,
    outcome: correct ? "correct" : "wrong",
    points: correct ? BONUS_POINTS : 0,
  };
}

/**
 * Score one bracket against current results: per-match outcome, the host-nation
 * bonus, and the total. The per-match half is pure and structure-free — the round
 * (hence point value) is read off each MatchId (D-bracket-representation), and it
 * does not assume feeder consistency (D-builder-consistency). The bonus needs the
 * structure/registry because a podium slot depends on the SF→F/TP wiring.
 */
export function scoreBracket(
  bracket: UserBracket,
  results: CurrentStandings,
  structure: TournamentStructure,
  registry: TeamRegistry,
): BracketScore {
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

  const bonus = scoreBonus(bracket, results, structure, registry);
  total += bonus.points;

  return { total, matches, bonus };
}
