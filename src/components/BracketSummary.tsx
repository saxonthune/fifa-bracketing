import { For, Show, createSignal } from "solid-js";
import type { BracketScore } from "../lib/scoring";
import type { RoundId } from "../lib/types";

interface BracketSummaryProps {
  title: string;
  entrant: string;
  score: BracketScore;
}

// Display order and labels. TP (third-place match) sits before the final.
const ROUND_ROWS: { round: RoundId; label: string }[] = [
  { round: "R32", label: "32" },
  { round: "R16", label: "16" },
  { round: "QF", label: "8" },
  { round: "SF", label: "Semi" },
  { round: "TP", label: "3rd" },
  { round: "F", label: "Final" },
];

interface BreakdownRow {
  label: string;
  correct: string; // "N/M" over matches played so far, or "–" before the round starts
  points: string; // points total, or "–" before the round starts
}

const DASH = "–";

function breakdown(score: BracketScore): BreakdownRow[] {
  const rows = ROUND_ROWS.map(({ round, label }) => {
    const inRound = Object.values(score.matches).filter((m) => m.round === round);
    const played = inRound.filter((m) => m.outcome !== "pending");
    if (played.length === 0) return { label, correct: DASH, points: DASH };
    const correct = played.filter((m) => m.outcome === "correct");
    return {
      label,
      correct: `${correct.length}/${played.length}`,
      points: String(correct.reduce((sum, m) => sum + m.points, 0)),
    };
  });

  const bonus = score.bonus;
  rows.push({
    label: "USA bonus",
    correct:
      bonus.outcome === "pending" ? DASH : bonus.outcome === "correct" ? "1/1" : "0/1",
    points: bonus.outcome === "pending" ? DASH : String(bonus.points),
  });
  return rows;
}

export function BracketSummary(props: BracketSummaryProps) {
  const rows = () => breakdown(props.score);
  const [expanded, setExpanded] = createSignal(false);

  return (
    <div
      class="mb-4 cursor-pointer select-none rounded-lg border border-gray-300 bg-gray-100 p-3 shadow-sm"
      role="button"
      tabindex={0}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
    >
      <h1 class="text-2xl font-['Russo_One']">{props.title}</h1>
      <div class="text-gray-500">by {props.entrant}</div>

      <div class="flex items-baseline gap-2">
        <span class="font-bold text-green-700">{props.score.total} pts</span>
        <span class="text-sm italic text-gray-400">
          {expanded() ? "tap to hide" : "tap to see score breakdown"}
        </span>
      </div>

      <Show when={expanded()}>
        <table class="mt-2 w-full text-sm tabular-nums">
          <thead>
            <tr class="border-b border-gray-300 text-left text-gray-500">
              <th class="py-0.5 font-medium">Round</th>
              <th class="py-0.5 font-medium">Correct</th>
              <th class="py-0.5 font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            <For each={rows()}>
              {(row) => (
                <tr>
                  <td class="py-0.5">{row.label}</td>
                  <td class="py-0.5 text-gray-600">{row.correct}</td>
                  <td
                    class="py-0.5"
                    classList={{
                      "font-bold text-green-700": row.points !== DASH,
                      "text-gray-400": row.points === DASH,
                    }}
                  >
                    {row.points}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
