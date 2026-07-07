import { Show } from "solid-js";
import type { BonusScore } from "../lib/scoring";
import { BONUS_POINTS, RESULT_LABEL } from "../lib/scoring";

interface BracketSummaryProps {
  title: string;
  entrant: string;
  points: number;
  bonus?: BonusScore;
}

function bonusText(bonus: BonusScore): string {
  const guess = bonus.predicted
    ? `${bonus.team} ${RESULT_LABEL[bonus.predicted]}`
    : `no ${bonus.team} result`;
  if (bonus.outcome === "pending") return `Bonus: predicted ${guess} — pending`;
  if (bonus.outcome === "correct") return `Bonus: ${guess} — correct (+${BONUS_POINTS})`;
  const landed = bonus.actual
    ? `${bonus.team} went ${RESULT_LABEL[bonus.actual]}`
    : `${bonus.team} result unknown`;
  return `Bonus: predicted ${guess} — ${landed}`;
}

export function BracketSummary(props: BracketSummaryProps) {
  return (
    <div class="mb-4 rounded-lg border border-gray-300 bg-gray-100 p-3 shadow-sm">
      <h1 class="text-2xl font-['Russo_One']">{props.title}</h1>
      <div class="text-gray-500">by {props.entrant}</div>
      <div class="font-bold text-green-700">{props.points} pts</div>
      <Show when={props.bonus}>
        {(bonus) => (
          <div
            class="text-sm"
            classList={{
              "text-green-700": bonus().outcome === "correct",
              "text-gray-500": bonus().outcome !== "correct",
            }}
          >
            {bonusText(bonus())}
          </div>
        )}
      </Show>
    </div>
  );
}
