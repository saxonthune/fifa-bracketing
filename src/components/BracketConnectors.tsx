import { For } from "solid-js";
import type { GridPos } from "../lib/render-model";
import type { BracketLayout } from "../lib/layout";

export const CELL_W = 200;
// An R32 card (1-line meta + two team rows) is ~90px tall; the cell must clear
// that or the smallest (rowSpan-1) cells overlap their neighbours.
export const CELL_H = 120;
// Height of an inter-section spacer row — a fraction of a cell, not a whole one.
export const SECTION_GAP_H = 15;
// Sectioned mode only: a section-header row holds just a one-line label, so it
// gets a short row of its own rather than a full CELL_H (which left ~100px of
// dead space above every header on the narrow tier).
export const SECTION_HEADER_H = 28;

const TICK = 12; // horizontal tick length extending into each card column
export const STUB = 24; // dotted continuation stub length (section handoff)

/** Pixel height of every 1-based grid row, indexed [0]=row 1. The single source
 *  of truth for row heights — both the grid template and the connector geometry
 *  read it, so they can't drift. */
export function rowHeights(layout: BracketLayout): number[] {
  const gaps = new Set(layout.gapRows);
  const headers = new Set(layout.sections.map((s) => s.rowStart));
  return Array.from({ length: layout.rows }, (_, i) => {
    const r = i + 1;
    if (gaps.has(r)) return SECTION_GAP_H;
    if (headers.has(r)) return SECTION_HEADER_H;
    return CELL_H;
  });
}
/** Pixel top edge of 1-based grid row `i`. */
function rowTop(i: number, heights: number[]): number {
  let y = 0;
  for (let r = 1; r < i; r++) y += heights[r - 1] ?? CELL_H;
  return y;
}
function centerY(p: GridPos, heights: number[]): number {
  let h = 0;
  for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++) h += heights[r - 1] ?? CELL_H;
  return rowTop(p.rowStart, heights) + h / 2;
}

/** Path from a child cell to its feedee parent. Direction follows the column
 *  order: a parent to the right (linear/left-half) routes off the child's right
 *  edge, a parent to the left (symmetric right-half) off its left edge. */
function linkPath(child: GridPos, parent: GridPos, heights: number[]): string {
  const cy = centerY(child, heights);
  const py = centerY(parent, heights);
  if (parent.column > child.column) {
    const spineX = child.column * CELL_W; // right boundary of the child cell
    return `M ${spineX - TICK} ${cy} H ${spineX} V ${py} H ${spineX + TICK}`;
  }
  const spineX = (child.column - 1) * CELL_W; // left boundary of the child cell
  return `M ${spineX + TICK} ${cy} H ${spineX} V ${py} H ${spineX - TICK}`;
}

function stubPath(cell: GridPos, heights: number[]): string {
  const x = cell.column * CELL_W;
  const y = centerY(cell, heights);
  return `M ${x - TICK} ${y} H ${x + STUB}`;
}

interface BracketConnectorsProps {
  layout: BracketLayout;
}

export function BracketConnectors(props: BracketConnectorsProps) {
  const heights = () => rowHeights(props.layout);
  const links = () =>
    props.layout.links
      .map(({ child, parent }) => {
        const c = props.layout.positions.get(child);
        const p = props.layout.positions.get(parent);
        return c && p ? linkPath(c, p, heights()) : null;
      })
      .filter((d): d is string => d !== null);

  const stubs = () =>
    props.layout.continues
      .map((id) => {
        const c = props.layout.positions.get(id);
        return c ? stubPath(c, heights()) : null;
      })
      .filter((d): d is string => d !== null);

  // Reserve room past the last column for the continuation stubs' dotted tips.
  const w = () => props.layout.cols * CELL_W + (props.layout.continues.length ? STUB : 0);
  const h = () => rowTop(props.layout.rows + 1, heights());

  return (
    <svg
      style={{ position: "absolute", inset: "0", "pointer-events": "none", "z-index": "0" }}
      width={w()}
      height={h()}
      viewBox={`0 0 ${w()} ${h()}`}
    >
      <For each={links()}>
        {(d) => <path d={d} fill="none" stroke="#d1d5db" stroke-width="2" />}
      </For>
      <For each={stubs()}>
        {(d) => (
          <path
            d={d}
            fill="none"
            stroke="#d1d5db"
            stroke-width="2"
            stroke-dasharray="3 3"
          />
        )}
      </For>
    </svg>
  );
}
