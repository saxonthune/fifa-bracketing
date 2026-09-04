import { For, createSignal, onMount, onCleanup } from "solid-js";
import type { ResolvedMatch } from "../lib/render-model";
import type { MatchScore, BonusScore } from "../lib/scoring";
import type { MatchId, TeamCode, TournamentStructure } from "../lib/types";
import { bracketLayout, type BracketMode } from "../lib/layout";
import { MatchCard } from "./MatchCard";
import { BracketConnectors, CELL_W, STUB, rowHeights } from "./BracketConnectors";

// Minimum viewport width a tier wants, widest → narrowest. These are intent, not
// a derived threshold: symmetric wants a real laptop, linear a tablet, and
// sectioned is the floor (always wins). The chosen tier then scales to fit the
// actual width with no lower clamp, so horizontal overflow is impossible — what
// bounds text size is the tier's column count, not a magic scale floor.
const MODE_MIN_WIDTH: Record<BracketMode, number> = {
  symmetric: 1300,
  linear: 720,
  sectioned: 0,
};
const MODES: BracketMode[] = ["symmetric", "linear", "sectioned"];

function pickMode(avail: number): BracketMode {
  for (const m of MODES) {
    if (avail >= MODE_MIN_WIDTH[m]) return m;
  }
  return "sectioned";
}

interface BracketDisplayProps {
  matches: ResolvedMatch[];
  structure: TournamentStructure;
  /** Per-match scores (Viewer); when present a card shows a "+N" on a correct pick. */
  scores?: Record<MatchId, MatchScore>;
  /** Host-nation bonus (Viewer); when earned, marks "+N" on USA's slot at its exit match. */
  bonus?: BonusScore;
  onPick?: (matchId: MatchId, team: TeamCode) => void;
}

export function BracketDisplay(props: BracketDisplayProps) {
  // Measure the viewport directly rather than a ref + ResizeObserver: the
  // full-bleed wrapper is exactly 100vw, so window width is the same number, and
  // seeding it synchronously means the first paint already picks the right tier
  // (no avail=0 → symmetric-overflow fallback that depends on observer timing).
  const [avail, setAvail] = createSignal(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  onMount(() => {
    const update = () => setAvail(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    onCleanup(() => window.removeEventListener("resize", update));
  });

  const layout = () => bracketLayout(props.structure, pickMode(avail()));
  const heights = () => rowHeights(layout());
  const gridW = () => layout().cols * CELL_W + (layout().continues.length ? STUB : 0);
  const gridH = () => heights().reduce((a, b) => a + b, 0);
  // Scale-to-fit with no lower clamp: the grid always shrinks to the width it's
  // given, so it can never overflow. Leave a few px so the right column doesn't
  // clip against the edge.
  const scale = () => Math.min(1, (avail() - 8) / gridW());

  return (
    // Full-bleed: break out of the max-w-screen-sm #root column to the full
    // viewport width (body clips the 100vw overflow — see index.css) so the
    // tree measures real width and can pick the widest tier that fits.
    <div
      style={{ width: "100vw", position: "relative", left: "50%", "margin-left": "-50vw" }}
    >
      <div style={{ width: "100%", "overflow-x": "auto", "overflow-y": "hidden" }}>
        {/* Reserves the post-scale footprint so the scroll container sees the
            scaled width (transform alone doesn't shrink the layout box).
            margin auto centers it once the grid is narrower than the viewport. */}
        <div style={{ width: `${gridW() * scale()}px`, height: `${gridH() * scale()}px`, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              "grid-template-columns": `repeat(${layout().cols}, ${CELL_W}px)`,
              "grid-template-rows": heights().map((h) => `${h}px`).join(" "),
              width: `${gridW()}px`,
              height: `${gridH()}px`,
              position: "relative",
              transform: `scale(${scale()})`,
              "transform-origin": "top left",
            }}
          >
            <BracketConnectors layout={layout()} />
            <For each={layout().sections}>
              {(section) => (
                <div
                  style={{
                    "grid-column": `1 / span ${layout().cols}`,
                    "grid-row": String(section.rowStart),
                    "z-index": "1",
                    padding: "0 8px",
                    display: "flex",
                    "align-items": "flex-end",
                  }}
                >
                  <span class="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {section.label}
                  </span>
                </div>
              )}
            </For>
            <For each={props.matches}>
              {(match) => {
                const pos = layout().positions.get(match.id);
                if (!pos) return null;
                return (
                  <div
                    style={{
                      "grid-column": String(pos.column),
                      "grid-row": `${pos.rowStart} / span ${pos.rowSpan}`,
                      position: "relative",
                      "z-index": "1",
                      padding: "4px 8px",
                      display: "flex",
                      "align-items": "center",
                    }}
                  >
                    <MatchCard
                      match={match}
                      score={props.scores?.[match.id]}
                      bonus={props.bonus}
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
      </div>
    </div>
  );
}
