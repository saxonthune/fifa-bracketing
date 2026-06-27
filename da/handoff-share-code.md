# Handoff: share-code-format contract (doc02.03)

You are the **share-code design thread**. Your job is to price and write ONE
contract: how a bracket serializes into the code an entrant sends the maintainer.

## Read first

- `DA-PROCESS.MD` — how we work (you price load-bearing decisions; propose a
  default to confirm, don't author silently).
- `PAINPOINTS.MD` — what's gone wrong before. Don't repeat it.
- `.rhidoc/02-contracts/01-bracket-schema.md` (doc02.01) — the thing you serialize.
  A bracket is `{ v, entrant, picks }` where `picks` is a flat map of match id →
  FIFA team code (~31 entries for the full bracket).
- `.rhidoc/01-product.md` (doc01) — Builder generates the code; Bracket Viewer
  decodes it; the maintainer curates codes into Pinned Brackets.

## Prior art

`../wordle-diy/src/services/urlService.ts` — URL-safe base64 of a JSON string
(`btoa` then `+/=` → `-_` stripped). Our likely starting point.

## Decisions to price (the contract is your call)

1. **Encoding** — URL-safe base64 of the bracket JSON (simple, matches wordle) vs
   a tighter custom packing (picks are just short team codes, so a positional
   encoding could be much shorter). Trade length against simplicity.
2. **Carrier** — bare string the user copies, vs a URL with the code in a query
   param (`?b=...`) so a link opens the Bracket Viewer directly.
3. **Versioning** — how `v` rides along so codes survive a format change.
4. **Validation** — what a decoder does with a malformed/truncated code.

## Deliverable

- Write the contract into `doc02.03` (`.rhidoc/02-contracts/03-share-code-format.md`).
  It's an empty skeleton now. Edit prose with Write/Edit, then `rhidoc regenerate`.
- Match the style of the sibling contracts (doc02.01, 02.02, 02.04, 02.05):
  declarative intent, a concrete JSON/string example, fields explained.

## Ownership / collision rules

- Touch ONLY `doc02.03`. Do NOT edit other contracts, `doc01`, or anything under
  `da/` (decisions/tasks/questions are owned by the other thread).
- When done, report your decisions back in chat as a short list so the other
  thread folds them into `da/decisions.md`. Don't write that file yourself.
