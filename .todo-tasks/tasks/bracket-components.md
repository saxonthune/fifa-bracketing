# Bracket components — MatchCard family + BracketDisplay

## Motivation

The reusable read-only bracket UI: a grid of match cards rendered from the locked
render model (`src/lib/render-model.ts`). The Tracker shows live reality; the same
components later back the Builder (via `onPick`) and Viewer. This task builds the
components against MOCK render-model data so it is independent of the parallel
`render-pipeline-lib` task — no resolver/layout import, no real JSON.

Stack: SolidJS + Tailwind v4 (see `src/pages/*.tsx` for component style, and
`src/index.css` for Tailwind setup). Flags are self-hosted SVGs at
`/flags/<key>.svg` (the `flag` field on a `team` slot is exactly that key).

## Do NOT

- Do NOT touch `src/lib/**` or `src/pages/**` (especially not `Tracker.tsx`) — a
  parallel task owns lib; Tracker wiring is a later integration step. Confine all
  work to `src/components/`.
- Do NOT import from `src/lib/resolve.ts` / `src/lib/layout.ts` / `src/lib/slotLabel.ts`
  — those do not exist on your branch yet. Import ONLY types from
  `src/lib/render-model.ts` and `src/lib/types.ts`.
- Do NOT add component/render/snapshot tests (repo policy: no tests for components).
- Do NOT fetch data or wire routing. Drive everything from the mock fixture.
- Do NOT use probability bars or candidate lists (NYT-specific) — our slots are
  either a team or a single pending label.

## Plan

All components take render-model props (`ResolvedMatch`, `ResolvedSlot`, `GridPos`
from `src/lib/render-model.ts`; `MatchId`, `TeamCode` from `src/lib/types.ts`).

### 1. `src/components/TeamSlot.tsx`

Props: `{ slot: ResolvedSlot; isWinner: boolean; isLoser: boolean; onPick?: () => void }`.
- `slot.kind === "team"`: render `<img src={`/flags/${slot.flag}.svg`}>` + `slot.name`.
  `isWinner` → emphasized (e.g. bold + a subtle accent); `isLoser` → dimmed/muted.
- `slot.kind === "pending"`: render `slot.label` in a muted style, no flag.
- If `onPick` is provided, the row is an accessible button (`role`/keyboard) that
  calls `onPick()` on click; when absent the row is plain static markup (Tracker).

### 2. `src/components/MatchMeta.tsx`

Props: `{ meta: ResolvedMatchMeta }`. Render a small header line:
`<venue> · <formatted date>` and `Match <num>`. Format the date inline from
`meta.kickoff` (ISO-8601 UTC) with `Intl.DateTimeFormat` to e.g. `"June 28"`
(month + day). Keep this formatting local to this file.

### 3. `src/components/MatchCard.tsx`

Props: `{ match: ResolvedMatch; onPick?: (team: TeamCode) => void }`.
- Render `<MatchMeta meta={match.meta} />`, then slot 0, a `"vs"` divider, slot 1.
- Per slot compute: `isWinner = slot.kind==="team" && match.winner===slot.code`;
  `isLoser = match.winner!=null && slot.kind==="team" && slot.code!==match.winner`.
- Pass each slot an `onPick` only when the card's `onPick` is set AND the slot is a
  team: `() => onPick(slot.code)`.
- The four node states fall out of the data (both-teams/undecided,
  both-teams/decided, partial, both-pending) — no explicit mode flag.

### 4. `src/components/BracketDisplay.tsx`  (replace the existing stub)

Props: `{ matches: ResolvedMatch[]; layout: Map<MatchId, GridPos>; onPick?: (matchId: MatchId, team: TeamCode) => void }`.
- A horizontally-scrollable container holding a CSS grid. The grid has 11 columns
  (1–4 left rounds, 6 center, 8–11 right rounds; columns 5 and 7 are spacing gaps)
  and 8 base rows. Place each card with inline style
  `grid-column: <col>; grid-row: <rowStart> / span <rowSpan>` from
  `layout.get(match.id)` (skip a match if it has no layout entry).
- Render `<MatchCard>` for each, forwarding `onPick` as
  `(team) => props.onPick?.(match.id, team)`.
- Render `<BracketConnectors>` (below) as an overlay behind the cards.

### 5. `src/components/BracketConnectors.tsx`

Draws the elbow connector lines as one absolutely-positioned `<svg>` behind the
grid. Derive parent→children purely from geometry (no topology import): a parent
cell's row range `[rowStart, rowStart+rowSpan)` exactly covers its ≤2 children in
the adjacent inner column (left side: `column-1`; right side: `column+1`). For
each parent/child pair draw an elbow from the parent's inner edge to the child's
outer edge.
- Implementation: keep a `Map<MatchId, HTMLElement>` of card refs (populated by
  `BracketDisplay`), measure rects after mount (and on resize) with a Solid effect,
  and emit `<path>` elbows. If exact DOM measuring proves fiddly, a simpler
  layout-number-derived version is acceptable — connectors are visual polish; the
  cards + placement are the priority. Leave a short comment if you take the simpler
  route.

### 6. `src/components/bracketMocks.ts`

Export a small `mockMatches: ResolvedMatch[]` (cover all four node states: two
resolved teams undecided; two resolved teams with a `winner`; one team + one
pending; two pending) and a matching `mockLayout: Map<MatchId, GridPos>` so
`BracketDisplay` renders standalone. This is the build/verify driver and a usage
example; do not wire it into any page.

## Files to Modify

- `src/components/TeamSlot.tsx` — new
- `src/components/MatchMeta.tsx` — new
- `src/components/MatchCard.tsx` — new
- `src/components/BracketDisplay.tsx` — replace stub
- `src/components/BracketConnectors.tsx` — new
- `src/components/bracketMocks.ts` — new

## Verification

```bash
npx tsc -p tsconfig.json --noEmit
npm run build
```

## Out of Scope

- `Tracker.tsx` wiring, data fetching, routing — later integration.
- The resolver/layout/slotLabel functions — parallel `render-pipeline-lib` task.
- Builder interactivity beyond accepting the `onPick` prop (no pick state here).

## Surface after this phase

- `src/components/BracketDisplay.tsx` exports `BracketDisplay` taking
  `{ matches: ResolvedMatch[]; layout: Map<MatchId, GridPos>; onPick? }`.
- `src/components/MatchCard.tsx`, `TeamSlot.tsx`, `MatchMeta.tsx`,
  `BracketConnectors.tsx` export their named components.
- `src/components/bracketMocks.ts` exports `mockMatches` + `mockLayout`.
- No `src/lib/**` or `src/pages/**` files changed.
