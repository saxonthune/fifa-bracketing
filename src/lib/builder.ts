import type {
  TournamentStructure,
  CurrentStandings,
  TeamRegistry,
  Picks,
  RoundId,
  MatchId,
} from "./types";
import { ROUND_IDS } from "./types";
import { resolveBracket } from "./resolve";

/** Round is the MatchId prefix before the first dash (no RoundId contains "-"). */
function roundOf(id: MatchId): RoundId {
  return id.slice(0, id.indexOf("-")) as RoundId;
}

/**
 * Drop any pick whose team is no longer present in its match, cascading.
 *
 * A single forward pass in round order (R32→…→F): each round is resolved against
 * only the picks already accepted from earlier rounds, so an upstream change that
 * strands a downstream pick removes it, and the removal propagates further up the
 * tree on the next round's resolution. Reuses resolveBracket rather than
 * re-deriving W:/L: occupant resolution. Pure.
 */
export function prunePicks(
  structure: TournamentStructure,
  standings: CurrentStandings,
  registry: TeamRegistry,
  picks: Picks
): Picks {
  const out: Picks = {};
  for (const round of ROUND_IDS) {
    const resolved = resolveBracket(structure, standings, registry, out);
    for (const match of resolved) {
      if (roundOf(match.id) !== round) continue;
      const pick = picks[match.id];
      if (pick === undefined) continue;
      const present = match.slots.some((s) => s.kind === "team" && s.code === pick);
      if (present) out[match.id] = pick;
    }
  }
  return out;
}

/**
 * MatchIds whose pick is not a legal occupant of that match — a pick naming a
 * team that neither entered there (per `standings`) nor won its feeding match
 * (per the rest of `picks`). It is exactly the set prunePicks would strip, so an
 * empty result means the bracket is internally consistent and agrees with
 * reality. Reporting variant of prunePicks for validating a finished bracket
 * (e.g. a pinned share code) instead of repairing one mid-edit. Pure.
 */
export function illegalPicks(
  structure: TournamentStructure,
  standings: CurrentStandings,
  registry: TeamRegistry,
  picks: Picks
): MatchId[] {
  const kept = prunePicks(structure, standings, registry, picks);
  return (Object.keys(picks) as MatchId[]).filter((id) => kept[id] !== picks[id]);
}
