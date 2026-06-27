# PAINPOINTS

A running log of moments where the agent did something that wasn't what I wanted,
or didn't follow my interpretation of `DA-PROCESS.MD`. Each entry names what
happened, what I wanted instead, and which DA principle it cut against — so the
pattern is correctable, not just noted.

**The agent adds an entry only when I explicitly say so** (see the `PAIN:`
shorthand in `CLAUDE.md`). It never logs a painpoint on its own initiative.

---

## 2026-06-27 — Agent authored the contract content instead of surfacing it as decisions

**What happened:** While setting up the rhidoc workspace, the agent wrote the
*content* of the bracket contract directly — match-id scheme, FIFA team-code
choice, the bracket JSON shape — into `doc02.01`. It picked the load-bearing
design rules itself.

**What I wanted:** I price the load-bearing decisions. The contracts are exactly
the high `fan-out × irreversibility` choices I must own.

**DA principle cut against:** "The human prices the few load-bearing decisions and
the agent executes everything downstream." The agent may *propose a default to
confirm*, but it does not get to silently author the contract. Surfacing these as
ranked entries in `decisions.md` (with a proposed default I confirm) is the move —
not writing the schema as settled fact.

---

## 2026-06-27 — Agent named a surface; I had to catch the poor name

**What happened:** The surface for the curated list of friends' codes was named
"Field" by the agent, not by me. The name stuck in `doc01` until I noticed it and
renamed it to "Pinned Brackets."

**What I wanted:** I name the surfaces. Names are user-facing vocabulary that the
whole spec and UI inherit — a load-bearing choice, not a downstream detail. The
agent should have surfaced it as a decision with a proposed name to confirm, not
committed one silently.

**DA principle cut against:** "The human prices the few load-bearing decisions and
the agent executes everything downstream." Naming a product surface is exactly such
a decision. Propose-to-confirm, don't author.

---

## 2026-06-27 — Agent claimed a field belonged in a different contract than the one the human had just named

**What happened:** The human said the share code should carry a `title` field
(shown alongside the submitter name when a code is loaded). The agent replied that
`title` "lives in the bracket schema (doc02.01), not the share-code contract,"
offered to hand it off to another thread, and asked the human to confirm crossing
that boundary — inventing an ownership constraint the human had not invoked and
that contradicted what the human had just said.

**What I wanted:** I raised `title` last turn *in the context of the share-code
contract* — that is where it goes. A loaded code shows the submitter name and the
title. There was nothing to relocate, defer, or hand off. The agent forced me to
re-state a decision I had already made.

**DA principle cut against:** The bet — "Never spend a human decision on something
the agent could have safely assumed." The decision was already made and stated; the
agent re-opened it by manufacturing a boundary rule, costing a correction instead of
executing downstream of the human's call.

---

## 2026-06-27 — Contracts wrote the data shapes verbatim, then collided with the code that owns them

**What happened:** A session authored the contract docs (doc02.01–02.05) with full
concrete shapes — `## Shape` JSON blocks and field-by-field bullet lists that
restated every field. That same shape was then also defined in code
(`src/lib/types.ts`). The duplication immediately bit: `title` was specified in the
share-code doc but absent from the bracket doc, the two docs disagreed, and the
types file had to carry a "these contracts disagree, reconcile later" note. Docs and
types sat at the same level of detail, so they drifted the moment they were written.

**What I wanted:** Docs are **meta-contracts that sit above types and interfaces** —
they carry intent: why a layer exists, the invariants, the non-obvious choices. The
concrete shape lives in code (`src/lib/types.ts`), once. A doc points to the type
for fields and never restates them. Two artifacts at the same valence will conflict;
the doc must be at a higher altitude than the code it describes.

**DA principle cut against:** From `CLAUDE.md` — "say only what the code can't" and
"transduce, don't editorialize." A doc that re-types the fields is restating what the
code already holds, which is cost, not help, and a standing source of drift. The fix
was to delete the duplicated shapes and replace them with pointers to the types — so
the rule going forward: docs hold intent and point to code for shape, never mirror it.

---

## 2026-06-27 — Agent suggested a muddling name and let the vocabulary stay ambiguous

**What happened:** The agent designed the resolver and its output around vague,
overloaded names — "Provider", "render model", and a single "Bracket" doing duty
for both an entrant's picks and the live tournament state. It never pinned down
unambiguous domain terms. The muddle only surfaced when I noticed the Tracker has
no user picks yet was being designed against a "bracket"-shaped input, and that
"Provider" named nothing clearly.

**What I wanted:** The agent should have stopped me and made me commit to a small,
unambiguous glossary (UserBracket vs the composed tournament state, etc.) *before*
designing this deep. When it reaches for a name that blurs two concepts, that's a
signal to halt and force the distinction, not to ship the blur.

**DA principle cut against:** "Decide the *design rules* first." A shared vocabulary
is a high `fan-out × irreversibility` design rule — every doc, type, and component
inherits the names. It must be locked before the work that serializes through it,
not patched after the ambiguity bites.

---

## 2026-06-27 — Agent shipped names too short and generic to be distinct

**What happened:** The core domain types were named with single generic words —
`Structure`, `Results` — short enough to collide with plain English and with
neighbouring concepts (`Results` vs the scoring **standings**; `Structure` vs any
structure). The agent locked these into `types.ts`, the contract docs, and the
glossary without ever flagging that they were weak, undistinctive names. I had to
catch it later and ask for `TournamentStructure` and a renamed reality feed.

**What I wanted:** Domain names must be long and specific enough to be unambiguous
across the *whole* project vocabulary — `TournamentStructure`, not `Structure`.
When the agent reaches for a short generic noun for a load-bearing type, that is a
smell it should stop on and surface alternatives to confirm — the same halt-and-ask
move as a blurred name (the `Provider` painpoint above). This needs a **standing
rule**: before locking a domain name, check it is (a) distinct from every existing
term and (b) specific enough to stand alone out of context; if either fails, flag it
and propose alternatives rather than congealing the weak name.

**DA principle cut against:** "Decide the *design rules* first." A weak name is a
latent collision that every doc, type, and component silently inherits, then has to
be renamed under load. The agent must price names for distinctness up front.

---

## 2026-06-27 — Agent invented a scoring "standings"/leaderboard feature I never asked for

**What happened:** The product doc and task queue describe the app "scoring every
bracket so everyone sees a live standing," the Tracker "scoring a bracket and
showing that bracket's standing," and Pinned Brackets producing "standings via the
scoring engine." I never asked for a leaderboard or any cross-entrant standing. The
agent manufactured the feature, wrote it into `doc01` and `tasks.md`, stood up a
whole scoring engine for it (`T-scoring-engine`), and even let it **corrupt the
Tracker's definition** — the Tracker renders the live tournament state with *no
picks*, it does not score a bracket.

**What I wanted:** Build only what I asked for — Builder, a Tracker of live results,
a read-only Bracket Viewer, and a curated Pinned Brackets dropdown. Ranking entrants
into a standing is a product decision I never priced. Invented scope is worse than a
bad name: it spawns surfaces, tasks, and an engine with no requirement behind them,
and silently redefines the things I *did* ask for.

**DA principle cut against:** "The human prices the load-bearing decisions; the agent
executes downstream." A new feature is the most load-bearing decision there is — the
agent must never author scope. Also "transduce, don't editorialize": rendering my
notes into docs means translating what's there, not bolting on features I didn't
request.

---

## 2026-06-27 — The doc02 contract layer was bloat and a mistake

**What happened:** The agent stood up a whole `02-contracts/` doc tree — one doc per
shape (bracket, results, share-code, structure, team-registry) plus an index. They
first duplicated the field shapes (their own painpoint above), then got slimmed to
"point to the types," at which point they carried almost nothing the types and
glossary didn't already hold. Every rename and scope change since has had to fan out
across these docs *and* the code *and* the glossary — three places to keep in sync
for one fact. They slowed every change down and earned their keep nowhere.

**What I wanted:** A **glossary** (the names + one line of intent each) plus the
**types** (`src/lib/types.ts`, the shapes, once) is the whole contract. The glossary
holds *why a layer exists*; the types hold *what its shape is*. A per-shape contract
doc is a third surface that can only either duplicate those two or restate them — in
both cases it is cost, not help, and a standing source of drift. Don't build a
documentation layer that mirrors the code; let the code be the contract and the
glossary be the intent.

**DA principle cut against:** From `CLAUDE.md` — "say only what the code can't."
A doc layer whose every entry points at a type is saying only what the code already
says. The right structure was glossary + types from the start; the contract docs were
ceremony that taxed every downstream change.
