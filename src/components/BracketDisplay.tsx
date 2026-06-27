import { For } from "solid-js";
import type { ResolvedMatch, GridPos } from "../lib/render-model";
import type { MatchId, TeamCode } from "../lib/types";
import { MatchCard } from "./MatchCard";
import { BracketConnectors, CELL_W, CELL_H } from "./BracketConnectors";

interface BracketDisplayProps {
  matches: ResolvedMatch[];
  layout: Map<MatchId, GridPos>;
  onPick?: (matchId: MatchId, team: TeamCode) => void;
}

export function BracketDisplay(props: BracketDisplayProps) {
  return (
    <div class="overflow-x-auto">
      <div
        style={{
          display: "grid",
          "grid-template-columns": `repeat(11, ${CELL_W}px)`,
          "grid-template-rows": `repeat(8, ${CELL_H}px)`,
          position: "relative",
          width: "fit-content",
        }}
      >
        <BracketConnectors layout={props.layout} />
        <For each={props.matches}>
          {(match) => {
            const pos = props.layout.get(match.id);
            if (!pos) return null;
            return (
              <div
                style={{
                  "grid-column": String(pos.column),
                  "grid-row": `${pos.rowStart} / span ${pos.rowSpan}`,
                  position: "relative",
                  "z-index": "1",
                  padding: "4px",
                }}
              >
                <MatchCard
                  match={match}
                  onPick={
                    props.onPick != null
                      ? (team) => props.onPick!(match.id, team)
                      : undefined
                  }
                />
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
