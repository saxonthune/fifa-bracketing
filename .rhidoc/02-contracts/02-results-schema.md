---
title: Results Schema
summary: Maintainer-pushed reality — which teams filled the entry slots and which team won each decided match; absence means not yet played
tags: [contract, schema, results]
deps: [doc02.04]
---

# Results Schema

**Results** are the reality layer: what has actually happened so far. The
maintainer is the single trusted author; every client reads it. The state of
progress lives entirely here — the structure (doc02.04) and brackets (doc02.01)
are static once authored.

It is fetched at runtime from the Cloudflare R2 bucket (doc01) so the maintainer
pushes updates without rebuilding the site.

## Shape

For the mini bracket of doc02.04, with semifinals decided and the final and
third-place not yet played:

```json
{
  "v": 1,
  "slots": { "A1": "ARG", "B2": "FRA", "B1": "BRA", "A2": "ESP" },
  "winners": {
    "SF-1": "ARG",
    "SF-2": "BRA"
  }
}
```

- `slots` — the concrete team that reality placed in each entry `SlotRef`
  (resolving group positions and best-third conditionals from doc02.04).
- `winners` — match id → actual winning team code, for decided matches only. **A
  match absent from `winners` is not yet played.** This is how an arbitrary state
  of progress is represented: results grow as matches resolve.

Scoring is a pure function of one bracket (doc02.01) plus current results,
compared per match id. A predicted winner whose team is absent from the `winners`
of its feeding match is already busted, even before its own match is played.
