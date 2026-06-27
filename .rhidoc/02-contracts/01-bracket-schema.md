---
title: Bracket Schema
summary: One entrant's filled prediction — a flat map of match id to predicted winning team code; serialized through the share code
tags: [contract, schema, bracket, prediction]
deps: [doc02.04]
---

# Bracket Schema

A **bracket** is one entrant's prediction. It is the prediction layer that
composites over the structure (doc02.04) and results (doc02.02) at render time.
It is what the share code (doc02.03) encodes.

Representation: a **flat map of match id → predicted winning team code**. The
match ids and the bracket's shape come from the structure; the bracket carries
only picks, nothing it can re-derive from the structure. This keeps the share code
small and scoring a direct per-match comparison.

## Shape

For the mini bracket of doc02.04:

```json
{
  "v": 1,
  "entrant": "Sam",
  "picks": {
    "SF-1": "ARG",
    "SF-2": "ESP",
    "F-1":  "ARG",
    "TP-1": "FRA"
  }
}
```

- `v` — schema version; lets the share code survive format changes.
- `entrant` — display name the maintainer curates into Pinned Brackets.
- `picks` — match id → predicted winning team code (team registry). A pick at a
  later round names a team the bracket also advanced through the feeding
  earlier-round matches; the Builder enforces this consistency, the scorer does
  not assume it.
