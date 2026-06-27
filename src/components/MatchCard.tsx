import type { ResolvedMatch, ResolvedSlot } from "../lib/render-model";
import type { TeamCode } from "../lib/types";
import { MatchMeta } from "./MatchMeta";
import { TeamSlot } from "./TeamSlot";

interface MatchCardProps {
  match: ResolvedMatch;
  onPick?: (team: TeamCode) => void;
}

export function MatchCard(props: MatchCardProps) {
  const isWinner = (slot: ResolvedSlot) =>
    slot.kind === "team" && props.match.winner === slot.code;

  const isLoser = (slot: ResolvedSlot) =>
    props.match.winner != null &&
    slot.kind === "team" &&
    slot.code !== props.match.winner;

  const pickFor = (slot: ResolvedSlot): (() => void) | undefined =>
    props.onPick != null && slot.kind === "team"
      ? () => props.onPick!(slot.code)
      : undefined;

  return (
    <div class="bg-white border border-gray-200 rounded shadow-sm p-1 text-sm h-full flex flex-col justify-center">
      <MatchMeta meta={props.match.meta} />
      <TeamSlot
        slot={props.match.slots[0]}
        isWinner={isWinner(props.match.slots[0])}
        isLoser={isLoser(props.match.slots[0])}
        onPick={pickFor(props.match.slots[0])}
      />
      <div class="text-center text-xs text-gray-300 py-0.5">vs</div>
      <TeamSlot
        slot={props.match.slots[1]}
        isWinner={isWinner(props.match.slots[1])}
        isLoser={isLoser(props.match.slots[1])}
        onPick={pickFor(props.match.slots[1])}
      />
    </div>
  );
}
