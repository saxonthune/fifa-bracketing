import { For } from "solid-js";
import type { GridPos } from "../lib/render-model";
import type { MatchId } from "../lib/types";

// Simplified layout-derived connectors rather than DOM measurement.
// Positions are computed from the same fixed cell dimensions the grid uses.
export const CELL_W = 160;
export const CELL_H = 80;
const COLS = 11;
const ROWS = 8;
const TICK = 12; // horizontal tick length extending into each card column

function cellCenterY(pos: GridPos): number {
  return (pos.rowStart - 1 + pos.rowSpan / 2) * CELL_H;
}

function buildPaths(layout: Map<MatchId, GridPos>): string[] {
  const entries = Array.from(layout.values());
  const paths: string[] = [];

  for (const pos of entries) {
    const { column, rowStart, rowSpan } = pos;
    const childMidRow = rowStart + rowSpan / 2;
    const cy = cellCenterY(pos);

    // Left side (cols 1–3): parent is one column to the right
    if (column >= 1 && column <= 3) {
      const parentCol = column + 1;
      const parent = entries.find(
        (p) =>
          p.column === parentCol &&
          childMidRow >= p.rowStart &&
          childMidRow < p.rowStart + p.rowSpan,
      );
      if (parent) {
        const spineX = column * CELL_W;
        const py = cellCenterY(parent);
        paths.push(
          `M ${spineX - TICK} ${cy} H ${spineX} V ${py} H ${spineX + TICK}`,
        );
      }
    }

    // Right side (cols 9–11): parent is one column to the left
    if (column >= 9 && column <= 11) {
      const parentCol = column - 1;
      const parent = entries.find(
        (p) =>
          p.column === parentCol &&
          childMidRow >= p.rowStart &&
          childMidRow < p.rowStart + p.rowSpan,
      );
      if (parent) {
        const spineX = (column - 1) * CELL_W;
        const py = cellCenterY(parent);
        paths.push(
          `M ${spineX + TICK} ${cy} H ${spineX} V ${py} H ${spineX - TICK}`,
        );
      }
    }
  }

  return paths;
}

interface BracketConnectorsProps {
  layout: Map<MatchId, GridPos>;
}

export function BracketConnectors(props: BracketConnectorsProps) {
  const paths = () => buildPaths(props.layout);

  return (
    <svg
      style={{
        position: "absolute",
        inset: "0",
        "pointer-events": "none",
        "z-index": "0",
      }}
      width={COLS * CELL_W}
      height={ROWS * CELL_H}
      viewBox={`0 0 ${COLS * CELL_W} ${ROWS * CELL_H}`}
    >
      <For each={paths()}>
        {(d) => <path d={d} fill="none" stroke="#d1d5db" stroke-width="2" />}
      </For>
    </svg>
  );
}
