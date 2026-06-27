# Tasks

The work queue. `status`: `ready` (no undecided dep — a headless agent can start
now) | `blocked` (waits on a decision/task) | `doing` | `done`. `deps` name the
decisions (D-*) or tasks (T-*) a task waits on.

Each `ready` task is sized to roughly one headless session (~5-8 file edits, one
cohesive unit). Launch via `/todo-task`.

```yaml
# --- READY: contract-complete, decision-independent ---

- id: T-structure-data
  task: >
    Author the real tournament structure as a static JSON data file conforming to
    doc02.04 — all 32 knockout matches (R32-1..F-1), slot wiring (group-position
    and best-third for R32 entries, winner/loser-of for later rounds), and
    meta { num 73-104, kickoff as UTC ISO, venue city }. Source from the official
    FIFA 2026 knockout schedule.
  deps: []          # doc02.04 done
  reversible: true
  status: ready

- id: T-team-registry-data
  task: >
    Author teams.json conforming to doc02.05 for the field — FIFA code key, name,
    flag-icons key, group letter (A-L). Source the qualified teams + groups.
  deps: []          # doc02.05 done
  reversible: true
  status: ready

- id: T-flag-assets
  task: >
    Pull the SVGs for the field's teams from flag-icons (MIT) and commit them
    under the static flags dir, named by flag-icons key (de.svg, gb-eng.svg).
    Include home-nation subdivision flags if present in the field.
  deps: [T-team-registry-data]   # needs the flag-key list
  reversible: true
  status: ready

- id: T-bracket-renderer
  task: >
    The shared bracket-display component (SolidJS): given structure + results +
    one prediction, render the rounds/columns, match cells, team slots with flags,
    and per-cell state (placeholder / concrete / predicted / correct / wrong /
    eliminated). Read-only. Reused by Bracket Viewer and Pinned Brackets.
  deps: []          # doc02.01, 02.02, 02.04, 02.05 done
  reversible: false
  status: ready
  note: large; may split into layout vs cell if it overflows one session

- id: T-scoring-engine
  task: >
    Pure function: (one bracket, current results) -> per-match correctness +
    total score. Scoring per D-scoring-rule: R32=1, R16=2, QF=3, SF=5, F=8,
    TP=3. Drives Tracker and Pinned Brackets standings.
  deps: []          # D-scoring-rule confirmed; doc02.01, 02.02 done
  reversible: false
  status: ready

- id: T-results-fetch
  task: >
    Client module that fetches results.json from the R2 bucket at runtime and
    parses it per doc02.02. Handle not-yet-published / network failure gracefully.
  deps: []
  reversible: true
  status: blocked
  note: needs the R2 bucket URL (Q-r2-url). Stub the URL to unblock as `ready` if needed.

# --- BLOCKED: waiting on a decision ---

- id: T-share-decode
  task: decode a share code into a bracket (doc02.01); validate malformed input
  deps: [D-share-code]      # thread-A / doc02.03
  reversible: false
  status: blocked

- id: T-builder
  task: >
    The Builder surface — fill the bracket by advancing teams, enforce
    feeder-consistency (D-builder-consistency), then emit a share code.
  deps: [D-share-code, T-bracket-renderer]
  reversible: false
  status: blocked

- id: T-pinned-brackets
  task: >
    the Pinned Brackets surface — fetch pinned.json (array of code strings) from
    R2, decode each, dropdown over entrants -> standings via the scoring engine
  deps: [T-share-decode, T-bracket-renderer, T-scoring-engine]   # D-pinned-format confirmed
  reversible: false
  status: blocked
```
