---
title: Glossary
summary: The shared vocabulary — one line per domain term. Names are load-bearing; every doc, type, and component uses these and only these.
tags: [glossary, vocabulary, conventions]
deps: [doc01]
---

# Glossary

One line per term. Use these names exactly; do not coin synonyms. The contract is
just two surfaces: field **shapes** live in `src/lib/types.ts`, design **rationale**
lives in `da/decisions.md`. This glossary is naming only — not schema, not why.

## Data layers

- **TournamentStructure** — the static knockout skeleton: matches, slot wiring, per-match metadata. Identical for everyone.
- **CurrentStandings** — maintainer-pushed reality: which teams filled the entry slots and who won each *decided* match. Absence = not yet played.
- **UserBracket** — one entrant's set of picks (a predicted winning team per match). Serialized by the share code.

## Composed views (resolver output)

(MISMATCH) - **TournamentStatus** — TournamentStructure composed with CurrentStandings: the live, actual bracket state, *no picks*. What the **Tracker** renders, and the base layer of every view. — No such type in code; the merged render model is `ResolvedMatch[]` (`src/lib/render-model.ts`), each `ResolvedMatch` carrying its own meta, not a content-only map keyed by MatchId.
(MISMATCH) - **GradedBracket** — a UserBracket overlaid on the TournamentStatus, each pick graded against reality (correct / wrong / pending / eliminated). What **Bracket Viewer** and **Pinned Brackets** render. — No such type in code; grading is unbuilt, and the outcome set (5 values incl. unpicked/eliminated) is unsettled.

## Mechanisms

(MISMATCH) - **resolver** — the pure function producing a TournamentStatus (no bracket given) or a GradedBracket (a UserBracket given). The rendering *logic*, separate from the visual component. — Actual code is `resolveMatches(structure, standings, registry) => ResolvedMatch[]` in `src/lib/resolve.ts`; no `TournamentStatus`/`GradedBracket` output. Also "resolve/resolver" is rejected vocabulary (to be renamed), and `CurrentStandings.resolved`/`Resolution` carry the same word.
- **SlotRef** — how a match slot's occupant is determined: a group position (`A1`), a best-third conditional (`3rd:AIJ`), or the winner/loser of an earlier match (`W:SF-1`, `L:SF-1`).
- **share code** — the `tag~payload` string that encodes a UserBracket for an entrant to send the maintainer (D-share-code).

## Roles

- **Entrant** — fills a UserBracket in the Builder and sends its share code to the maintainer. No account.
- **Maintainer** — curates the Pinned Brackets list and pushes CurrentStandings. Single trusted author of reality.
