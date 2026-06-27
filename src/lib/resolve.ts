import type {
  TournamentStructure,
  CurrentStandings,
  TeamRegistry,
  TeamCode,
  SlotRef,
  MatchId,
} from "./types";
import type { ResolvedMatch, ResolvedSlot } from "./render-model";
import { slotLabel } from "./slotLabel";

export function resolveMatches(
  structure: TournamentStructure,
  standings: CurrentStandings,
  registry: TeamRegistry
): ResolvedMatch[] {
  const placed = new Map<string, TeamCode>(standings.resolved);

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
      const { name, flag } = registry.teams[code];
      return { kind: "team", code, name, flag };
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
