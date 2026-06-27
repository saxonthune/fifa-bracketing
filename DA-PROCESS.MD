# DA-PROCESS

**Differentiation-first process for a human–agent pair building under a clock.**

You start with a few coarse requirements. The agent's job is *not* to start coding — it is to
**differentiate** those requirements into decisions, tasks, and questions, then keep itself busy on
safe work while you resolve the few choices that everything else hangs off.

---

## The bet

In a human–agent build, the bottleneck is **the human's decision bandwidth**, not typing speed.
So the whole process optimizes one thing:

> **Never let the agent idle waiting on a decision. Never spend a human decision on something the
> agent could have safely assumed.**

Completeness is *not* the goal here (that's for careful, regulated domains). **Throughput is.** You
inventory only deep enough to lock the load-bearing decisions and the MVP spine; everything else is
explicitly punted.

---

## Core principle: decide the *design rules* first

A **design rule** is a choice that *shapes other work* — a stable interface that, once fixed, lets
the work that depends on it proceed independently. Rank every pending decision by:

```
priority  =  fan-out  ×  irreversibility
             (how many tasks      (how expensive
              it blocks)           to change later)
```

Resolve the high-priority ones **first and fast** — even on imperfect information — because the cost
of the agent idling + reworking exceeds the cost of a revisable-but-imperfect rule. Once a design
rule is decided and **written down as a contract**, all the work downstream of it decouples and
parallelizes.

Low-priority decisions are *deferred or assumed*, not asked. Don't spend bandwidth on them.

---

## The toolkit (files)

```
rhidoc/
  01-product.md     # the coarse requirements — HUMAN writes ~10 sentences. The seed.
  decisions.md      # the decision log (the design rules + their status)
  tasks.md          # the work queue (each task tagged with what it waits on)
  questions.md      # the batched questions for the human, ranked by unblock-value
  contracts/        # the design rules, once decided — the stable interfaces
    *.schema.json   #   data formats everything serializes through
    *.md            #   protocol/format decisions
src/                # the actual product
assets/             # safe-to-start asset work (flags, etc.)
```

The artifacts that matter are **`decisions.md` / `tasks.md` / `questions.md`** — together they *are*
the differentiation. Code comes after.

---

## The differentiation pass

**The agent runs this before writing any implementation code.**

1. **Parse** `01-product.md` into candidate work items.
2. **Classify** each item:
   - **decision** — a choice that shapes other work (→ `decisions.md`)
   - **task** — executable work (→ `tasks.md`)
   - **question** — needs human input the agent can't safely assume (→ `questions.md`)
3. **Build the dependency graph** — which tasks wait on which decisions.
4. **Rank decisions** by `fan-out × irreversibility`. For each high-rank decision, **propose a
   sensible default** so the human only has to *confirm*, not author.
5. **Fill the ready-queue:** tasks with no undecided dependency, OR tasks that are reversible + cheap
   to redo. These start *now*.
6. **Assemble the question-batch:** the *minimal* set of questions that, once answered, unblock the
   most tasks. Rank by unblock-value. Deliver in **one batch** — do not drip-feed.
7. **Loop:** human answers the batch → decisions resolve → contracts written → ready-queue refills →
   agent works → agent surfaces the next batch.

---

## Operating rules

**Rule 1 — First deliverable is the differentiation, not code.** No implementation until
`decisions.md` / `tasks.md` / `questions.md` exist. (Coding before the load-bearing choices are made
builds the wrong thing and forces rework.)

**Rule 2 — Decide / Defer / Ask, by `fan-out × irreversibility`:**

| Situation | Action |
|---|---|
| High fan-out **and** irreversible | **Decide now.** Agent proposes a default; human confirms in seconds. |
| Low fan-out **or** cheap to redo | **Defer / assume.** Agent records an `assumed` decision and proceeds. Never spends human bandwidth. |
| Can't safely assume (high stakes, can't guess intent) | **Ask** — and **batch** it. |

**Rule 3 — Parallelize across decision latency.** While the human decides design-rule N+1, the agent
builds against design-rule N and burns down decision-independent work. **The ready-queue must never
be empty.**

**Rule 4 — MVP spine first; polish is a deferred option.** Build the core path end-to-end before any
nicety. Under a clock, don't invest in flexibility you won't use.

**Rule 5 — Triage is ruthless.** The clock is the stop condition, not "done." Anything not on the
critical path goes to an explicit *later* list.

---

## Artifact formats

### `decisions.md`

```yaml
- id: D-bracket-schema
  decision: JSON shape of a filled knockout bracket
  fan_out: high          # generate / share / evaluate all depend on it
  reversible: false
  status: confirmed       # open | assumed | confirmed
  choice: see contracts/bracket.schema.json
  default_proposed_by: agent
  confirmed_by: human

- id: D-scoring-rule
  decision: points per correct pick, by round
  fan_out: low
  reversible: true
  status: assumed         # agent proceeded on a default; revisit if it matters
  choice: "R16=1, QF=2, SF=4, F=8"
```

### `tasks.md`

```yaml
- id: T-scoring-engine
  task: evaluate a list of share-codes against results.json → scores
  deps: [D-bracket-schema, D-results-schema]
  reversible: false
  status: blocked         # ready | blocked | doing | done

- id: T-flags
  task: download + optimize country flag assets
  deps: []                # decision-independent
  reversible: true
  status: ready
```

### `questions.md`

```yaml
- id: Q-scoring
  question: How many points per correct pick, by round? (default proposed: R16=1,QF=2,SF=4,F=8)
  unblocks: [T-scoring-engine, T-leaderboard]
  for: product-owner
  priority: high
```

---

## Anti-patterns (each one is a bandwidth leak)

- **Code before decision** → builds the wrong thing → rework.
- **Ask what you could assume** → wastes the human's scarce decision bandwidth.
- **Human micro-decides low-fan-out work** → the human becomes the bottleneck.
- **Over-modularize a short project** → flexibility you'll never use.
- **Drip-feed questions** → the human context-switches all day instead of clearing a batch.

---

## KPIs to watch

- **Time-to-first-design-rule** — target: minutes.
- **Agent idle time** — target: ~0 (ready-queue always has work).
- **Questions per decision** — low means the agent is assuming well.

---

## Quick start (this repo)

1. Human writes `rhidoc/01-product.md` — the coarse requirements (bracket generation, share codes,
   a pinned-brackets tab that scores a list of codes against an uploaded results JSON).
2. Agent runs the differentiation pass. Expected design rules to lock first:
   `bracket.schema.json` (highest fan-out — generate/share/evaluate all serialize through it), then
   the share-code format and `results.schema.json`.
3. Agent proposes defaults for those, human confirms, agent writes `contracts/`.
4. Agent fans out: build the scoring spine against the schema **while** pulling flags and scaffolding
   the static site; batch the product questions (scoring rule, seeding, tiebreakers) to the human.

---

*Method note: this is differentiation of coarse requirements into a decision/task/question frontier,
ordered by fan-out and reversibility — design rules (stable interfaces) decided first so module work
parallelizes, with the human pricing the few load-bearing decisions and the agent executing
everything downstream.*
