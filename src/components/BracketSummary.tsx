import { Show } from "solid-js";
import type { BonusScore } from "../lib/scoring";
import { BONUS_POINTS } from "../lib/scoring";

interface BracketSummaryProps {
  title: string;
  entrant: string;
  points: number;
  bonus?: BonusScore;
}

export function BracketSummary(props: BracketSummaryProps) {
  return (
    <div class="mb-4 rounded-lg border border-gray-300 bg-gray-100 p-3 shadow-sm">
      <h1 class="text-2xl font-['Russo_One']">{props.title}</h1>
      <div class="text-gray-500">by {props.entrant}</div>
      <div class="font-bold text-green-700">
        {props.points} pts
        <Show when={props.bonus?.outcome === "correct"}>
          <span class="ml-1 text-sm" title={`${props.bonus!.team} finish bonus`}>
            (+{BONUS_POINTS})
          </span>
        </Show>
      </div>
    </div>
  );
}
