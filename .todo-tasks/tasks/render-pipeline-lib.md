# Render pipeline (lib) — resolve + layout + slot labels

## Motivation

The bracket UI consumes a resolved render model (`src/lib/render-model.ts`:
`ResolvedMatch`, `ResolvedSlot`, `GridPos`). This task implements the three pure
functions that produce it from the contract types, so the Tracker (and later the
Builder) can render reality. The render-model type seam is already locked; this
task only implements the functions + tests against it.

## Do NOT

- Do NOT touch `src/components/**` or `src/pages/**` — a parallel task owns those.
  This task is confined to `src/lib/`.
- Do NOT edit `src/lib/render-model.ts` or `src/lib/types.ts` — they are the locked
  contracts you build against. Import from them; do not change them.
- Do NOT do registry/flag asset lookup beyond reading `name`/`flag` off the passed
  `TeamRegistry` — these functions take typed args, they do NOT import JSON.
- Do NOT add a numeric total-score or any scoring logic — that's `scoring.ts`.
- Do NOT add component/render tests. Only pure-function unit tests.

## Plan

### 1. `src/lib/slotLabel.ts` — `slotLabel(ref: SlotRef): string`

Human label for an unresolved slot. Cases (see `SlotRef` union in `types.ts`):

- `GroupPositionRef`: `"A1"` → `"Group A winner"`, `"B2"` → `"Group B runner-up"`
  (the digit `1`=winner, `2`=runner-up).
- `BestThirdRef` `"3rd:XYZ"`:
  - multi-letter set → `"3rd from Groups X, Y or Z"` (comma-separate, `" or "`
    before the last; two letters → `"3rd from Groups X or Y"`).
  - single-letter placeholder (e.g. `"3rd:D"`) → `"Group D third place"`.
- `WinnerRef` `"W:QF-1"` → `"Winner of QF-1"`.
- `LoserRef` `"L:SF-1"` → `"Loser of SF-1"`.

### 2. `src/lib/resolve.ts` — `resolveMatches(structure, standings, registry): ResolvedMatch[]`

Signature: `(structure: TournamentStructure, standings: CurrentStandings,
registry: TeamRegistry) => ResolvedMatch[]`.

- Build `const placed = new Map(standings.resolved)` once (a `Resolution` is
  `[ref, team]`; entry-slot refs and match ids are disjoint key spaces).
- `whoIs(ref: SlotRef): TeamCode | undefined`:
  - `W:<id>` → `placed.get(<id>)` (that match's decided winner).
  - `L:<id>` → if `placed.get(<id>)` is undefined return undefined; else resolve
    the two slots of `structure.matches[<id>]` to teams via `whoIs`; the loser is
    the resolved participant that isn't the winner (undefined if either
    participant is still unresolved).
  - otherwise (entry ref `A1`/`B2`/`3rd:..`) → `placed.get(ref)`.
- For each `[id, match]` of `structure.matches`, produce a `ResolvedMatch`:
  - `slots`: map each `SlotRef` to a `ResolvedSlot` — if `whoIs(ref)` yields a
    code present in `registry.teams`, `{ kind:"team", code, name, flag }` from the
    registry entry; else `{ kind:"pending", label: slotLabel(ref) }`.
  - `winner`: `placed.get(id)` if present (the match's own decided winner), else omit.
  - `meta`: `{ num, venue, kickoff }` copied from `match.meta`.
  - `id`: the match id.
- Preserve `Object.entries(structure.matches)` order in the returned array.

### 3. `src/lib/layout.ts` — `layoutMatches(structure): Map<MatchId, GridPos>`

Pure function of structure only. Mirror the NYT bracket: left half flows right
(R32 col 1 → SF col 4), right half flows left (R32 col 11 → SF col 8), final/TP
center (col 6).

- **side**: `SF-1`→left, `SF-2`→right, `F-1`/`TP-1`→center. Any other match:
  walk `feedsWinner` until you reach `SF-1`/`SF-2`, take that side.
- **column** by (side, round): left R32=1,R16=2,QF=3,SF=4; center F=6,TP=6;
  right SF=8,QF=9,R16=10,R32=11.
- **rows** per half via recursion from the root SF. `children(m)` = the matches
  whose `feedsWinner === m`, ordered by `m.slots` (`slots[0]`=top → its
  `W:<child>` id, `slots[1]`=bottom). Assign with a cursor starting at 1:
  - leaf (R32): `rowStart = cursor; rowSpan = 1; cursor++`.
  - internal: layout top child then bottom child; `rowStart = topChild.rowStart`,
    `rowSpan = topChild.rowSpan + bottomChild.rowSpan`.
  Run once per side with an independent cursor (each side spans rows 1..8). This
  yields R32 span 1, R16 span 2, QF span 4, SF span 8, each cell's row range
  covering its children.
- **center**: place `F-1` at `{ rowStart: 3, rowSpan: 4 }` and `TP-1` at
  `{ rowStart: 7, rowSpan: 2 }` (centered-ish across the 8-row field; exact
  visual centering is the renderer's polish, not this task's).

### 4. `src/lib/resolve.test.ts` — unit tests (vitest)

Build a small inline fixture (a mini `TournamentStructure` of ~3 matches: two R32
feeding one R16, plus a tiny `TeamRegistry` and `CurrentStandings`). Cover:

- an entry slot resolves to `{ kind:"team" }` with `name`/`flag` from the registry;
- an unresolved `W:` slot resolves to `{ kind:"pending" }` with label `"Winner of …"`;
- a decided match sets `ResolvedMatch.winner`;
- `L:` resolves to the non-winner participant when the match is decided;
- `slotLabel`: `A1`→`"Group A winner"`, `B2`→`"Group B runner-up"`,
  `"3rd:CE"`→`"3rd from Groups C or E"`, `"3rd:IJK"`→`"3rd from Groups I, J or K"`,
  `"3rd:D"`→`"Group D third place"`, `"W:QF-1"`→`"Winner of QF-1"`.

## Files to Modify

- `src/lib/slotLabel.ts` — new; `slotLabel`.
- `src/lib/resolve.ts` — new; `resolveMatches` + internal `whoIs`.
- `src/lib/layout.ts` — new; `layoutMatches`.
- `src/lib/resolve.test.ts` — new; covers `resolveMatches` + `slotLabel`.

## Verification

```bash
npx tsc -p tsconfig.json --noEmit
npm test
```

## Out of Scope

- Components, pages, Tracker wiring, connector geometry — parallel/later tasks.
- Loading the real JSON data files (integration does that).

## Surface after this phase

- `src/lib/slotLabel.ts` exports `slotLabel(ref: SlotRef): string`.
- `src/lib/resolve.ts` exports `resolveMatches(structure: TournamentStructure,
  standings: CurrentStandings, registry: TeamRegistry): ResolvedMatch[]`.
- `src/lib/layout.ts` exports `layoutMatches(structure: TournamentStructure):
  Map<MatchId, GridPos>`.
- `src/lib/render-model.ts` and `src/lib/types.ts` are unchanged.
