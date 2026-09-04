# DA-RESULTS

A retrospective on the first run of [`DA-PROCESS.MD`](./DA-PROCESS.MD) — the
differentiation-first, human–agent process used to build this FIFA knockout-bracket
prediction app under a clock. It is a primary source for revising the process. It pairs
with [`PAINPOINTS.MD`](./PAINPOINTS.MD), which logs the individual moments; this document
diagnoses the pattern across them and proposes amendments.

Evidence base: the two process docs, the full git history (`d93a0ce` initial commit through
`1c58999`), the shipped code, and the Claude Code session transcripts for this repo.

---

## 1. Verdict

**The process worked.** A coarse idea became a published, shared, working app in roughly
six hours of one evening. The MVP spine — fill a bracket → get a share code → track live
results → view friends' brackets — shipped end-to-end. The differentiation machinery
(decide the load-bearing rules first, keep the agent busy on decision-independent work,
batch questions) did what it promised: the human was rarely the bottleneck on *throughput*.

**But it would have been meaningfully faster without the naming churn.** The single largest
tax was language. Most of the recorded friction — and a large share of the actual turns — was
not feature work but renaming weak, agent-chosen domain names and sweeping those renames
across docs, types, and components. The corrective is one sentence:

> **The shared vocabulary should have been nailed down, under human control, inside the
> first hour — before any fan-out.**

Everything below is in service of that sentence. **Naming is the spine of this retrospective**
because naming is where the process leaked, and the leaks downstream (invented scope,
contract-doc bloat, an agent-authored process) are the same disease wearing different masks:
the agent authoring the upstream layer that was the human's to price.

---

## 2. What was built

A static SolidJS app (Vite + Tailwind 4 + solid-router), built static and deployed to
Cloudflare Pages, with the live results feed served from a Cloudflare R2 bucket so the
maintainer can push updates without a rebuild. Four surfaces:

- **Builder** — fill a knockout bracket, get a URL-safe share code (`tag~payload`, wordle-diy
  convention).
- **Tracker** — composes the static `TournamentStructure` with the maintainer-pushed
  `CurrentStandings` and renders the live tournament state. **No picks, no scoring.** (Its
  page heading is "Live Standings.")
- **Bracket Viewer** — read-only; decodes one share code and renders that entrant's bracket.
- **Leaderboard / Pinned Brackets** — a curated list of friends' codes, each scored against
  the live results and ranked.

The three data layers are the load-bearing model: **`TournamentStructure`** (static skeleton)
+ **`CurrentStandings`** (maintainer-pushed reality) + **`UserBracket`** (one entrant's picks).
Scoring is a pure downstream function, `scoreBracket(UserBracket, CurrentStandings)`.

~2,800 lines of `src/`. Tests are sparse and deliberately limited to pure functions
(`scoring`, `shareCode`, `builder`, `pinned`), per the project's testing policy.

---

## 3. Timeline — and the distinction that matters

There are **two timelines**, and conflating them is itself an instance of the naming problem
(see §5.4).

**The dev window — ~6 hours, evening of 2026-06-27:**

| Time (2026-06-27) | Commit | What happened |
|---|---|---|
| 15:13 | `d93a0ce` | Initial commit (the `DA-PROCESS` seed). |
| 16:56–17:00 | `5792f89`–`2cd36f5` | rhidoc workspace, differentiation artifacts, SolidJS scaffold (a placeholder `scoring.ts` lands here). |
| 17:34–19:06 | `02174a4`–`3d761c6` | Shared types, share-code service, render-model seam, agent-run todo-tasks (`render-pipeline-lib`, `bracket-components`). |
| ~21:49 | — | **Naming crisis.** "Provider" caught; `Results`→`CurrentStandings`, `Structure`→`TournamentStructure`, `Bracket`→`UserBracket` ordered; a Sonnet agent dispatched to sweep the renames. |
| ~22:20 | — | **Invented-scope rejection.** "when did I ask for a scoring standings leaderboard??? I didn't." Killed from docs. |
| 22:22 | `06c72fb` | "big fixes" — Leaderboard rebuilt **correctly, as a downstream layer**; Tracker restored to live-state-only. |
| 22:40 | `e8b4ac3` | Last dev-window commit. **App published and shared (~6h after start).** |

**The live-operations tail — 2026-06-28 onward (NOT dev work):**

| Date | Commit | What happened |
|---|---|---|
| 06-28 | `60a1699`, `2abf950` | Updating `currentStandings.json` as real matches resolve; brackets/script tweaks. |
| 06-29 | `5a78f43`, `1c58999` | More live results pushed (`r32-4`, `PAR`). |

The 06-28/06-29 commits are the **maintainer keeping the reality feed current because the
real World Cup is being played** — they are data maintenance, not feature development. They
must not be read as the dev effort spilling across three days; the build was one evening.

---

## 4. What the process got right

- **Time-to-first-working-app was excellent.** Coarse idea → shipped MVP in one evening.
- **The agent rarely idled.** Decision-independent work (scaffold, flag assets, share-code
  service) ran while the human resolved the load-bearing calls. The "never let the agent idle
  waiting on a decision" bet held on the *throughput* axis.
- **The three-layer data model** (`TournamentStructure` + `CurrentStandings` + `UserBracket`)
  was the right load-bearing decision and, once named correctly, it held without rework.
- **Ruthless MVP triage** kept polish deferred and the spine first.
- **The painpoint discipline itself worked** — logging deviations as they happened is what
  makes this retrospective possible and is the process's best self-correcting feature.

---

## 5. The spine: language

### 5.1 The core failure pattern

Across every recorded painpoint, the agent did the same thing: it **authored the upstream
layer** — the names, the scope, the abstractions, even the process document — instead of
surfacing those as decisions for the human to price. The process's central rule is "the
human prices the few load-bearing decisions and the agent executes everything downstream."
The most upstream, highest `fan-out × irreversibility` artifact of all is the **vocabulary**,
and the agent kept silently authoring it.

This matters because a name is not a downstream detail. Every doc, type, component, task slug,
and session inherits it. A weak or wrong name is a latent collision that propagates silently
and then has to be renamed *under load*, across every surface that already absorbed it.

### 5.2 The rename tax

The agent shipped short, generic, colliding domain names — `Structure`, `Results`,
`Provider`, a single overloaded `Bracket`, `resolve`/`resolver`, `Field` — into `types.ts`,
the contract docs, and the glossary without ever flagging them as weak. The human caught them
only after they had spread. In the human's own words at the moment of recognition:

> "Provider is a poor name… what do we call a UserBracket composed with data representing the
> current status of the tournament? … **the LLM ideally should have stopped me and made me
> commit to unambiguous names before we got this far.**"

The fix was not a thought — it was labor. Renames had to be swept across the codebase, to the
point of dispatching a dedicated Sonnet agent just to perform them (one such sweep:
`Bracket`→`UserBracket`, 5 files, 13 type references). **Most of the churn in `PAINPOINTS.MD`
is renames and ref-sweeps, not feature work.** The human's summary: "the cumulative drag from
naming alone made the effort a disaster" — disaster meaning *the process drag*, not the
outcome; the app shipped.

### 5.3 The renames never even converged

The tax bought an incomplete result. The naming cleanup was never finished, and the shipped
code still carries the rejected vocabulary:

- `resolve`/`resolver` was explicitly **rejected vocabulary** (see `.rhidoc/02-glossary.md`),
  yet `src/lib/resolve.ts`, `resolveMatches`, and `ResolvedMatch` ship as-is, and
  `CurrentStandings.resolved` carries the same word.
- The glossary still contains live **`(MISMATCH)`** markers where the priced names
  (`TournamentStatus`, `GradedBracket`, `resolver`) never matched the code that got built —
  the spec and the code diverged and were never reconciled.

So the naming failure was doubly costly: it taxed throughput *and* left the vocabulary in an
inconsistent end state. A name fixed late is fixed incompletely.

### 5.4 The overloaded word: "standings"

The sharpest single example, because it bit twice — once during the build, once during the
writing of *this very document*.

"Standings" means two unrelated things in this project:

- **`CurrentStandings`** — the live tournament reality feed (which teams advanced, who won).
  A core, load-bearing data layer, present from the start. The Tracker renders it under the
  heading **"Live Standings."**
- **"scoring standings leaderboard"** — ranking entrants by points. A separate downstream
  feature (the **"Bracket Leaderboard"** page).

The word spans both meanings in the shipped UI. During this retrospective, the analyst (an
agent, again) read the 06-28/06-29 `currentStandings.json` commits — which are *live-results
maintenance* of the reality feed — as evidence that the *leaderboard feature* was "added a day
later," and had to be corrected by the human. **The exact failure the document is about
reproduced itself inside the document.** No stronger evidence exists that an overloaded name
is a standing trap, not a one-time slip. Distinct, specific names (`CurrentStandings` vs a
`BracketLeaderboard`/scoring concept) would have made the conflation impossible.

---

## 6. The altitude error: scope placed at the wrong layer

The leaderboard is usually filed under "invented scope," and it was invented — the agent stood
up scoring/standings/leaderboard the human never requested:

> "when did I ask for a scoring standings leaderboard??? I didn't."

But the deeper, more useful lesson is about **altitude**, not just authorization. The agent
placed scoring **early, as a peer to the other components** — and let it corrupt the Tracker's
definition, making the Tracker score a bracket when its actual job is to render live state with
*no picks*. The human's mental model was the opposite: scoring is **downstream**, a layer *on
top of* the already-built data (structure + standings + brackets), not a peer of them.

The resolution captures the right shape:

- The human **removed** the prematurely-wired version, so it could be **re-added correctly as a
  downstream layer**.
- It returned the same evening as a pure function, `scoreBracket(UserBracket, CurrentStandings)`,
  consumed by a `Leaderboard` surface — a clean layer over the existing data, computing nothing
  the lower layers don't already hold.
- The Tracker was restored to render live state only (`resolveMatches`, no bracket).

So this is not "invented scope that stuck." It is "a feature the agent placed at the wrong
altitude, torn out and rebuilt at the right one." The agent's instinct to flatten a layered
design into peers is the same upstream-authoring disease: it pre-empted a structural decision
(where does scoring sit) that was the human's to make.

---

## 7. Secondary leaks (same disease, other masks)

- **Contract-doc bloat.** A whole `02-contracts/` doc tree (one doc per shape) was stood up,
  first duplicating the field shapes (immediate drift: `title` specified in one doc, absent in
  another), then slimmed to "point to the types," at which point it held nothing the types and
  glossary didn't. Every later rename had to fan out across docs *and* code *and* glossary —
  three places per fact. It was deleted. The right contract was **glossary (names + intent) +
  `types.ts` (shapes, once)** from the start.
- **Agent-authored process.** The agent wrote `DA-PROCESS.MD` itself — the artifact that
  defines what counts as a decision — then followed its own rules too eagerly. `decisions.md`
  became trigger-happy, logging non-decisions (e.g. a rename-and-revert) that buried the few
  load-bearing rules. The bar for an entry must be "does this shape other work," not "did
  something change."
- **Uncommitted abstraction.** A `resolver.ts` and an entire "resolve" concept appeared in the
  tree with no commit, no decision, no authorization — conjured by the agent and later deleted.
- **Agent-named task queue.** Most `T-*` slugs were agent-coined names the human never
  authorized; task slugs are vocabulary too and inherit the same naming bar.

---

## 8. Root-cause diagnosis

The process optimizes for **throughput** by keeping the agent busy, and on that axis it
succeeded. But "keep the agent busy" silently licensed the agent to **fill every vacuum** —
including the vacuums that were load-bearing decisions, most of all the naming vacuum. The
process said "decide the design rules first" but did not treat **the vocabulary as the first
design rule**, nor gate fan-out on it. So the agent fanned out on top of names it had chosen,
and those names were weak, overloaded, and wrong — and every downstream artifact inherited them
before the human ever priced them.

Naming is the spine because:

1. It has the highest `fan-out × irreversibility` of anything — everything serializes through it.
2. Fixing it late is **labor**, not thought (multi-file sweeps, dispatched agents).
3. Fixing it late is **incomplete** — the rejected `resolve` vocabulary still shipped.
4. The cost recurs **even in describing the project afterward** (§5.4).

A weak name is not a cosmetic problem deferred to cleanup. It is a structural liability that
compounds with every artifact built on top of it.

---

## 9. Amendments to DA-PROCESS

Concrete changes, ordered by leverage:

1. **Add a glossary-first gate, before any fan-out.** The very first deliverable, within the
   first hour, is a **human-controlled glossary**: every load-bearing domain term, one line of
   intent each, *named by the human* (agent may propose defaults to confirm — it does not
   author). Nothing fans out — no types, no contract docs, no tasks, no agent dispatch — until
   the glossary is locked. The glossary is the highest-priority design rule, not a backfill.

2. **Pair it with a data-flow pass.** Alongside the glossary, do a quick analysis of what types
   each surface starts with, how they flow through the pure functions, and what each page
   receives. Price the vocabulary against the actual flow before anything serializes through it.
   This is also where **altitude** is fixed: which concepts are layers *on top of* others vs
   peers (the scoring/leaderboard lesson, §6).

3. **Make naming a halt-and-confirm trigger.** When the agent reaches for a name — a type, a
   surface, a file, a module, a `T-*` slug, an abstraction — that is a **stop**, not a silent
   commit. Before locking any domain name, check it is (a) **distinct** from every existing
   term and (b) **specific enough to stand alone out of context**. If either fails — or if the
   name blurs two concepts (`Provider`, a single `Bracket`) or is short and generic
   (`Structure`, `Results`) or overloaded (`standings`) — flag it and propose alternatives.
   This is already memorialized as a standing rule ("flag weak domain names").

4. **The human owns the upstream layer, full stop.** Names, scope, abstractions, *and the
   process document itself* are the human's to price. The agent executes downstream. A new
   feature, a new module, a new concept-verb is the most load-bearing decision there is — never
   author it; surface it.

5. **One contract surface, not three.** Glossary (names + intent) + `types.ts` (shapes, once).
   No per-shape contract-doc tree. A doc that points at a type says only what the code already
   says.

6. **Tighten the `decisions.md` bar.** Record only load-bearing design rules (high
   `fan-out × irreversibility`). Not every change, correction, or rename. A wrong-then-fixed
   decision shows the *current* rule or nothing — never the wobble.

7. **Nothing load-bearing enters the tree uncommitted or unauthorized.** No conjured files, no
   agent-coined task slugs.

---

## 10. What to measure next time

- **Time-to-locked-glossary** — target: within the first hour, before fan-out. (New top KPI.)
- **Rename churn after fan-out** — target: ~0 multi-file name sweeps. Any sweep is a sign the
  glossary gate failed.
- **Spec/code naming mismatches at ship** — target: 0 `(MISMATCH)` markers, 0 rejected terms
  surviving in code.
- **Agent-authored-upstream incidents** — count of times the agent named/scoped/abstracted
  without surfacing. Target: 0.
- The original KPIs (time-to-first-design-rule, agent idle time, questions-per-decision) still
  hold; this run scored well on them — which is exactly why the naming tax, invisible to those
  KPIs, was the binding constraint.
