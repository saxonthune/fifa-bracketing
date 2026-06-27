# Decisions

Design rules, ranked by `fan-out × irreversibility`. Status: `open` (needs a call)
| `assumed` (agent proceeded on a default; revisit if it matters) | `confirmed`
(human priced it). Durable contracts live in `.rhidoc/02-contracts/`; this log
records the choice and its status.

```yaml
- id: D-layer-model
  decision: separate a bracket render into three layers — structure / results / prediction
  fan_out: high
  reversible: false
  status: confirmed
  choice: "structure (doc02.04) + results (doc02.02) + prediction (doc02.01), composited at render"
  confirmed_by: human

- id: D-bracket-representation
  decision: how a bracket/result serializes
  fan_out: high
  reversible: false
  status: confirmed
  choice: "representation A — flat map of match id -> winning team code; structure re-derives the tree"

- id: D-bracket-scope
  decision: do entrants predict the group stage or only the knockouts
  fan_out: high
  reversible: false
  status: confirmed
  choice: "knockouts only — the R32 field is reality (results.slots); group stage not predicted, so the best-third combination table is never resolved by the app"

- id: D-match-id
  decision: identifier for a knockout match
  fan_out: high
  reversible: false
  status: confirmed
  choice: "semantic id (R32-1 .. F-1) as the map key; official FIFA match number (73-104) in meta.num"

- id: D-team-id
  decision: identifier for a team
  fan_out: high
  reversible: false
  status: confirmed
  choice: "FIFA three-letter code (GER, NED, ENG). Deliberately not ISO. Flag asset keyed separately (see D-flags)."

- id: D-flags
  decision: where flags come from and how rendered
  fan_out: medium
  reversible: true
  status: confirmed
  choice: "self-hosted flag-icons SVGs (MIT), committed; registry `flag` field is the flag-icons key (de, gb-eng). Not emoji (Windows renders as letters)."

- id: D-results-delivery
  decision: how results.json reaches clients without a rebuild
  fan_out: high
  reversible: true
  status: confirmed
  choice: "Cloudflare R2 bucket, fetched at runtime by the Tracker"

- id: D-platform
  decision: framework + host
  fan_out: high
  reversible: false
  status: confirmed
  choice: "SolidJS, built static, Cloudflare Pages"

- id: D-app-shape
  decision: one SPA vs multiple pages
  fan_out: high
  reversible: true
  status: confirmed
  choice: "multi-page surfaces — Builder, Tracker, Bracket Viewer, Pinned Brackets (doc01). Bracket-display component shared across viewer + pinned."

- id: D-build-tool
  decision: task runner
  fan_out: low
  reversible: true
  status: confirmed
  choice: "justfile, not make"
  confirmed_by: human

- id: D-kickoff-format
  decision: how match kickoff time is stored
  fan_out: medium
  reversible: true
  status: confirmed
  choice: "single absolute UTC instant (ISO-8601 Z) in meta.kickoff; formatted client-side per viewer locale"

- id: D-venue-granularity
  decision: venue detail in match metadata
  fan_out: low
  reversible: true
  status: confirmed
  choice: "host city only; no stadium"

- id: D-share-code
  decision: how a bracket serializes into a shareable code
  fan_out: high
  reversible: false
  status: open
  owner: thread-A (da/handoff-share-code.md -> doc02.03)

- id: D-scoring-rule
  decision: points per correct pick by round; third place; tiebreakers
  fan_out: medium
  reversible: true
  status: confirmed
  choice: "R32=1, R16=2, QF=3, SF=5, F=8 (Fibonacci). No tiebreaker beyond total points."
  note: "TP-1 (third place) point value not set by human; assumed = 3 (QF level). Revisit."

- id: D-third-place-included
  decision: include the third-place match (TP-1) in brackets and scoring
  fan_out: medium
  reversible: true
  status: confirmed
  choice: "included in structure/bracket/results and scored (see D-scoring-rule)"

- id: D-builder-consistency
  decision: who enforces that a later-round pick won its feeding matches
  fan_out: medium
  reversible: true
  status: assumed
  choice: "Builder enforces; scorer does not assume consistency"

- id: D-team-seed
  decision: store a numeric seed/ranking per team
  fan_out: low
  reversible: true
  status: open
  choice: "deferred — structure already wires slots; seed would be display-only"
  note: "agent lean = no. Awaiting human call after tradeoff brief."

- id: D-pinned-format
  decision: how the curated list of friends' share codes is stored and loaded
  fan_out: medium
  reversible: true
  status: confirmed
  choice: "pinned.json in the R2 bucket = a flat array of code strings. Entrant name is carried inside each code (doc02.01 `entrant`), so no wrapper object. Decode each to get name + picks."
```
