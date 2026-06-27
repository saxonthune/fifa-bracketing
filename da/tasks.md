# Tasks

The work queue. `status`: `ready` (no undecided dep — a headless agent can start
now) | `blocked` (waits on a decision/task) | `doing` | `done`. `deps` name the
decisions (D-*) or tasks (T-*) a task waits on.

Each `ready` task is sized to roughly one headless session (~5-8 file edits, one
cohesive unit). Launch via `/todo-task`.

```yaml
# --- DONE: foundation ---

- id: T-types
  task: contract types in TypeScript (src/lib/types.ts); canonical per D-types-canonical
  deps: []
  reversible: true
  status: done

# --- READY: contract-complete, decision-independent ---

- id: T-resolver
  task: >
    Pure lib src/lib/resolver.ts. resolve(TournamentStructure, CurrentStandings) -> TournamentStatus;
    resolve(TournamentStructure, CurrentStandings, UserBracket) -> GradedBracket (per glossary doc02).
    Each match cell gets its two resolved slots (concrete | predicted | placeholder
    with label) and, when a UserBracket is given, a pick outcome
    (correct | wrong | pending | eliminated). Resolver OWNS the per-match
    reality comparison; scoring consumes a shared helper (D resolver-owns). Returns
    team codes + slot labels only — registry/flag lookup is the renderer's job.
    TournamentStatus + GradedBracket are resolver-local types (not in types.ts).
    Unit-tested with an inline mini-bracket fixture.
  deps: []          # rename landed; render-model TYPES locked in resolver.ts
  reversible: false
  status: ready
  note: >
    The render-model types (TournamentStatus, GradedBracket, SlotFill, StatusMatch,
    GradedMatch, PickOutcome) are already locked in src/lib/resolver.ts. This task
    implements resolve() against them: content-only (D-render-model-shape),
    resolver owns the reality comparison, optional UserBracket.

- id: T-rename-userbracket
  task: rename Bracket -> UserBracket across src/lib (per D-vocabulary / doc02)
  deps: []
  reversible: true
  status: done
  note: done by sonnet agent — 5 files, 13 type refs; tsc clean, 13 tests pass.

- id: T-tracker
  task: >
    The Tracker surface — render the live TournamentStatus via BracketDisplay.
    Can scaffold against the locked resolver.ts types now; wires to resolve() +
    results-fetch + structure data as those land.
  deps: [T-resolver, T-bracket-renderer, T-results-fetch]
  reversible: false
  status: blocked
  note: type-unblocked — component buildable against TournamentStatus immediately.

- id: T-structure-data
  task: >
    Author the real tournament structure as a static JSON data file conforming to
    the TournamentStructure type (src/lib/types.ts) — all 32 knockout matches
    (R32-1..F-1), slot wiring (group-position and best-third for R32 entries,
    winner/loser-of for later rounds), and meta { num 73-104, kickoff as UTC ISO,
    venue city }. Source from the official FIFA 2026 knockout schedule.
  deps: []          # TournamentStructure type done
  reversible: true
  status: ready

- id: T-team-registry-data
  task: >
    Author teams.json conforming to the TeamRegistry type (src/lib/types.ts) for
    the field — FIFA code key, name, flag-icons key, group letter (A-L). Source the
    qualified teams + groups.
  deps: []          # TeamRegistry type done
  reversible: true
  status: ready

- id: T-flag-assets
  task: >
    Pull the SVGs for the field's teams from flag-icons (MIT) and commit them
    under the static flags dir, named by flag-icons key (de.svg, gb-eng.svg).
    Include home-nation subdivision flags if present in the field.
  deps: [T-team-registry-data]   # needs the flag-key list
  reversible: true
  status: done
  note: >
    Done directly, not via T-team-registry-data — field (48 nations) sourced from
    the web. scripts/pull-flags.mjs vendors flag-icons SVGs into public/flags/ and
    generates public/flags.json (the asset registry, see D-flags, separate from
    teams.json). gb-eng + gb-sct subdivisions included.

- id: T-bracket-renderer
  task: >
    The shared bracket-display component (SolidJS): given structure + results +
    one prediction, render the rounds/columns, match cells, team slots with flags,
    and per-cell state (placeholder / concrete / predicted / correct / wrong /
    eliminated). Read-only. Reused by Bracket Viewer and Pinned Brackets.
  deps: [T-resolver]   # consumes the resolver's render model; visual only
  reversible: false
  status: ready
  note: large; may split into layout vs cell if it overflows one session

- id: T-scoring-engine
  task: >
    Pure function: (one bracket, current results) -> per-match correctness +
    total score. Scoring per D-scoring-rule: R32=1, R16=2, QF=3, SF=5, F=8, TP=3.
  deps: []          # D-scoring-rule confirmed; types done
  reversible: false
  status: done
  note: >
    ORPHANED — its only stated consumer was the invented "standings"/leaderboard,
    now killed (see PAINPOINTS.MD 2026-06-27). Per-pick correctness is already
    produced by the resolver (GradedBracket.outcome); a numeric TOTAL score has no
    requirement behind it. Code stays but is unwired. Open: does any surface show a
    bracket's total score? Human to price (Q-scoring-needed) before re-wiring.

- id: T-results-fetch
  task: >
    Client module that fetches results.json from the R2 bucket at runtime and
    parses it per the CurrentStandings type. Handle not-yet-published / network failure gracefully.
  deps: []
  reversible: true
  status: blocked
  note: needs the R2 bucket URL (Q-r2-url). Stub the URL to unblock as `ready` if needed.

- id: T-share-codec
  task: >
    encode a bracket -> share code and decode back per D-share-code (tag~payload,
    URL-safe base64); fail-safe decode of malformed/truncated input. Pure,
    unit-testable. Used by Builder (encode) and Viewer/Pinned (decode).
  deps: []          # D-share-code confirmed; T-types done
  reversible: false
  status: done
  note: src/lib/shareCode.ts (encode/decode + DecodeResult) merged with vitest round-trip/rejection tests; via todo-task share-code-service.

# --- BLOCKED: waiting on a task or decision ---

- id: T-builder
  task: >
    The Builder surface — fill the bracket by advancing teams, enforce
    feeder-consistency (D-builder-consistency), then emit a share code.
  deps: [T-share-codec, T-bracket-renderer]
  reversible: false
  status: blocked

- id: T-pinned-brackets
  task: >
    the Pinned Brackets surface — fetch pinned.json (array of code strings) from
    R2, decode each, dropdown over entrants -> render the selected entrant's
    graded bracket (which picks hit / missed) via the bracket-display
  deps: [T-share-codec, T-bracket-renderer]   # D-pinned-format confirmed
  reversible: false
  status: blocked
```
