import type { ResolvedMatch, ResolvedSlot } from "../lib/render-model";
import type { TeamCode } from "../lib/types";
import type { MatchScore, BonusScore } from "../lib/scoring";
import { MatchMeta } from "./MatchMeta";
import { TeamSlot } from "./TeamSlot";

interface MatchCardProps {
  match: ResolvedMatch;
  score?: MatchScore;
  bonus?: BonusScore;
  onPick?: (team: TeamCode) => void;
}

export function MatchCard(props: MatchCardProps) {
  const isWinner = (slot: ResolvedSlot) =>
    slot.kind === "team" && props.match.winner === slot.code;

  const isLoser = (slot: ResolvedSlot) =>
    props.match.winner != null &&
    slot.kind === "team" &&
    slot.code !== props.match.winner;

  // Points land on the slot whose pick actually won — in the Viewer the shown
  // winner IS the pick, so `score.pick` and `match.winner` coincide here.
  const pointsFor = (slot: ResolvedSlot): number | undefined =>
    props.score?.outcome === "correct" &&
    slot.kind === "team" &&
    slot.code === props.score.pick
      ? props.score.points
      : undefined;

  // The USA-finish bonus lands on USA's slot at the match where its run ends,
  // and only once the bonus is actually earned.
  const bonusFor = (slot: ResolvedSlot): number | undefined =>
    props.bonus?.outcome === "correct" &&
    props.bonus.atMatch === props.match.id &&
    slot.kind === "team" &&
    slot.code === props.bonus.team
      ? props.bonus.points
      : undefined;

  const pickFor = (slot: ResolvedSlot): (() => void) | undefined =>
    props.onPick != null && slot.kind === "team"
      ? () => props.onPick!(slot.code)
      : undefined;

  // The pick was busted: the match resolved and the predicted winner lost.
  const busted = () => props.score?.outcome === "wrong";

  return (
    <div
      class="border rounded-lg shadow-sm p-1 text-base w-full flex flex-col transition-shadow hover:shadow-md"
      classList={{
        "bg-white border-gray-200": !busted(),
        "bg-gray-200 border-gray-300": busted(),
      }}
    >
      <MatchMeta meta={props.match.meta} />
      <TeamSlot
        slot={props.match.slots[0]}
        isWinner={isWinner(props.match.slots[0])}
        isLoser={isLoser(props.match.slots[0])}
        points={pointsFor(props.match.slots[0])}
        bonus={bonusFor(props.match.slots[0])}
        onPick={pickFor(props.match.slots[0])}
      />
      <TeamSlot
        slot={props.match.slots[1]}
        isWinner={isWinner(props.match.slots[1])}
        isLoser={isLoser(props.match.slots[1])}
        points={pointsFor(props.match.slots[1])}
        bonus={bonusFor(props.match.slots[1])}
        onPick={pickFor(props.match.slots[1])}
      />
    </div>
  );
}
