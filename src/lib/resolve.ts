import type {
  TournamentStructure,
  CurrentStandings,
  TeamRegistry,
  TeamCode,
  SlotRef,
  MatchId,
  Picks,
} from "./types";
import type { ResolvedMatch, ResolvedSlot } from "./render-model";
import { slotLabel } from "./slotLabel";

/** Resolve every match against a prebuilt `placed` map (ref/matchId → team).
 *  The winner source is whatever populated `placed`: reality (CurrentStandings)
 *  for the Tracker, or a UserBracket's picks for the Viewer/Builder. */
function resolveWith(
  structure: TournamentStructure,
  registry: TeamRegistry,
  placed: Map<string, TeamCode>
): ResolvedMatch[] {
  function whoIs(ref: SlotRef): TeamCode | undefined {
    if (ref.startsWith("W:")) {
      const id = ref.slice(2) as MatchId;
      return placed.get(id);
    }
    if (ref.startsWith("L:")) {
      const id = ref.slice(2) as MatchId;
      const winner = placed.get(id);
      if (winner === undefined) return undefined;
      const match = structure.matches[id];
      if (!match) return undefined;
      const [slotA, slotB] = match.slots;
      const teamA = whoIs(slotA);
      const teamB = whoIs(slotB);
      if (teamA === undefined || teamB === undefined) return undefined;
      return teamA === winner ? teamB : teamA;
    }
    // entry ref: GroupPositionRef or BestThirdRef
    return placed.get(ref);
  }

  function resolveSlot(ref: SlotRef): ResolvedSlot {
    const code = whoIs(ref);
    if (code !== undefined && registry.teams[code]) {
      const { name, short, flag } = registry.teams[code];
      return { kind: "team", code, name, short, flag };
    }
    return { kind: "pending", label: slotLabel(ref) };
  }

  return Object.entries(structure.matches).map(([id, match]) => {
    const matchId = id as MatchId;
    const [slotRef0, slotRef1] = match.slots;
    const result: ResolvedMatch = {
      id: matchId,
      meta: { num: match.meta.num, venue: match.meta.venue, kickoff: match.meta.kickoff },
      slots: [resolveSlot(slotRef0), resolveSlot(slotRef1)],
    };
    const winner = placed.get(id);
    if (winner !== undefined) result.winner = winner;
    return result;
  });
}

/** Tracker path: winners come from maintainer-pushed reality. */
export function resolveMatches(
  structure: TournamentStructure,
  standings: CurrentStandings,
  registry: TeamRegistry
): ResolvedMatch[] {
  return resolveWith(structure, registry, new Map(standings.resolved));
}

/** Viewer/Builder path: R32 entry slots come from reality (group results), but
 *  every knockout winner comes from the entrant's predicted `picks`. Reality's
 *  decided matches are deliberately ignored so the view shows the prediction. */
export function resolveBracket(
  structure: TournamentStructure,
  standings: CurrentStandings,
  registry: TeamRegistry,
  picks: Picks
): ResolvedMatch[] {
  const placed = new Map<string, TeamCode>();
  for (const [ref, team] of standings.resolved) {
    if (!(ref in structure.matches)) placed.set(ref, team);
  }
  for (const [matchId, team] of Object.entries(picks)) {
    placed.set(matchId, team);
  }
  return resolveWith(structure, registry, placed);
}
