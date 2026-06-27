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
