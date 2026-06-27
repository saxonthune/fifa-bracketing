---
title: Structure Schema
summary: Static tournament skeleton — rounds, matches keyed by stable id, slot wiring, and per-match metadata (FIFA match number, UTC kickoff, host city)
tags: [contract, schema, structure, bracket]
deps: []
---

# Structure Schema

The **structure** is the fixed knockout skeleton, identical for every entrant and
untouched by results or predictions. It is the layer the renderer reads to lay out
the bracket before anyone has played or picked. A bracket (doc02.01) and the
results (doc02.02) reference it slot-for-slot.

## Rounds and match ids

The real tournament has 32 teams across six rounds. Each match has a stable
semantic id used as the key everywhere; its official FIFA match number lives in
`meta.num`, not in the key.

| Round id | Matches | FIFA match numbers |
|---|---|---|
| `R32` | 16 | 73–88 |
| `R16` | 8 | 89–96 |
| `QF` | 4 | 97–100 |
| `SF` | 2 | 101–102 |
| `TP` | 1 (third place) | 103 |
| `F` | 1 | 104 |

## Slot references

Each match has two slots. A slot is filled by a `SlotRef` — how the occupant is
determined, resolved against results at render time:

- **group-position** — `A1` (Group A winner), `B2` (Group B runner-up). Fills the
  `R32` entry slots.
- **best-third** — a conditional third-placed entry, e.g. `3rd:AIJ` ("3rd from
  Groups A, I or J"). FIFA assigns these via a combination table once the group
  stage resolves; the structure carries the label, results carry the resolution.
- **winner-of** — `W:SF-1`, the winner of an earlier match.
- **loser-of** — `L:SF-1`, the loser (feeds `TP-1`).

## Per-match metadata

`meta` carries display data, all static and schedule-derived:

- `num` — official FIFA match number.
- `kickoff` — a single absolute instant in ISO-8601 UTC (`2026-07-14T21:00:00Z`).
  Stored as one UTC instant, not local time, so a viewer in any timezone formats
  it correctly client-side. Date is derived from it; no separate date field.
- `venue` — host city only (no stadium).

Team codes that slots resolve to come from the team registry (team identifier
contract, authored alongside this one).

## Shape

Illustrated on a 4-team mini bracket (two semifinals → final + third place):

```json
{
  "v": 1,
  "rounds": ["SF", "F", "TP"],
  "matches": {
    "SF-1": {
      "round": "SF",
      "slots": ["A1", "B2"],
      "feedsWinner": "F-1",
      "feedsLoser": "TP-1",
      "meta": { "num": 101, "kickoff": "2026-07-14T21:00:00Z", "venue": "Dallas" }
    },
    "SF-2": {
      "round": "SF",
      "slots": ["B1", "A2"],
      "feedsWinner": "F-1",
      "feedsLoser": "TP-1",
      "meta": { "num": 102, "kickoff": "2026-07-15T21:00:00Z", "venue": "Atlanta" }
    },
    "F-1": {
      "round": "F",
      "slots": ["W:SF-1", "W:SF-2"],
      "meta": { "num": 104, "kickoff": "2026-07-19T19:00:00Z", "venue": "East Rutherford" }
    },
    "TP-1": {
      "round": "TP",
      "slots": ["L:SF-1", "L:SF-2"],
      "meta": { "num": 103, "kickoff": "2026-07-18T19:00:00Z", "venue": "Miami" }
    }
  }
}
```
