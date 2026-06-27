# Share Code Encode/Decode Service

## Motivation

The share-code format is now a contract (doc02.03, `.rhidoc/02-contracts/03-share-code-format.md`)
and `D-share-code` is resolved. The Builder must turn a filled bracket into a code
an entrant copies; the Bracket Viewer and Pinned Brackets must decode a code back
into a bracket. This task implements the one service both sides import, so the wire
format lives in exactly one place. Covers `T-share-decode` plus the encode half
`T-builder` depends on.

## Do NOT

- Do NOT wire decode/encode into any page or component (`BracketViewer.tsx`,
  `Builder.tsx`, `PinnedBrackets.tsx`). This task is the pure service module + its
  type + its tests, nothing UI.
- Do NOT touch `src/lib/scoring.ts`, the renderer, or any `.rhidoc/` / `da/` file.
- Do NOT invent a second encoding now. Implement format tag `1` only; the format
  is structured so tag `2` can be added later — leave that door open, don't build it.
- Do NOT throw from `decodeBracket` on bad input. It must return a typed
  failure (see Plan), never crash the caller.
- Do NOT add tests beyond the pure functions in this module (see CLAUDE.md
  "Testing — sparse, pure functions only"). No component/page tests.

## Plan

### 1. Add vitest

Add `vitest` as a devDependency and a `"test": "vitest run"` script to
`package.json`. No config file needed if defaults suffice; add a minimal
`vitest.config.ts` only if the Solid/Vite setup requires it for a plain `.ts`
test to run. Keep it minimal — this is the project's first test.

### 2. Use the existing shared types — `src/lib/types.ts`

`src/lib/types.ts` ALREADY EXISTS and is the source of truth for contract shapes.
Do NOT recreate or restructure it. Import what you need:

- `Bracket` — `{ v, entrant, title?, picks: Picks }`
- `Picks` — `Record<MatchId, TeamCode>`
- `ShareCode` — the `"tag~payload"` string alias

Known contract tension (already noted in `types.ts`): `Bracket.title` is typed
optional because doc02.01 and doc02.03 disagree on whether `title` is mandatory.
Do NOT try to reconcile the contracts in this task. The decoder validates per
doc02.03 — i.e. require `title` to be a string on a decoded code — even though the
type permits its absence at compile time. If `types.ts` needs no change, leave it
untouched.

### 3. The service — `src/lib/shareCode.ts`

Implement per doc02.03. Read that contract before writing.

- **URL-safe base64 helpers** — port from `../wordle-diy/src/services/urlService.ts`:
  encode = `btoa` then `+`→`-`, `/`→`_`, strip trailing `=`; decode = reverse the
  swap, re-pad to a multiple of 4, `atob`.
- **`encodeBracket(bracket: Bracket): string`** — `JSON.stringify` the bracket,
  url-safe-base64 it, prefix the format tag and separator → `` `1~${payload}` ``.
- **`decodeBracket(code: string): DecodeResult`** — split on the first `~`,
  inspect the format tag:
  - unknown/missing tag → failure
  - tag `1`: url-safe-base64-decode, `JSON.parse`; any throw → failure
  - validate the parsed object: `picks` is a plain object whose keys and values
    are all strings; `entrant` and `title` are strings; `v` is a number. Reject
    an unknown `v` (anything other than the current bracket version, `1`).
  - on success return the `Bracket`.
- **Result type** — define a discriminated union so the caller branches without
  try/catch, e.g.:

```ts
export type DecodeResult =
  | { ok: true; bracket: Bracket }
  | { ok: false; error: string };
```

  `error` is a short machine/log string (e.g. `"unknown-format"`, `"bad-base64"`,
  `"bad-json"`, `"bad-shape"`, `"unknown-version"`); the UI maps it to the
  "invalid or corrupt code" state later. Use a single exported `const`
  `CURRENT_BRACKET_V = 1` rather than a magic literal.

Note: this task does not yet validate `picks` keys against the structure
(doc02.04) — that needs the structure data (`T-structure-data`) and belongs to
whoever wires decode into a page. Validate shape only here; leave a one-line
comment noting structure-validation is the caller's job.

### 4. Tests — `src/lib/shareCode.test.ts`

Limited, pure-function coverage only:

- round-trip: `decodeBracket(encodeBracket(b))` returns `ok` with a bracket deep-equal to `b`.
- rejects: empty string, missing `~`, unknown tag (`"9~abc"`), non-base64 payload,
  valid base64 of non-JSON, valid JSON of wrong shape (`picks` not an object /
  non-string values), unknown `v`.
- each failure case asserts `ok: false` (optionally the specific `error`).

## Files to Modify

- `package.json` — add `vitest` devDep + `test` script.
- `vitest.config.ts` — only if required to run a plain `.ts` test (NEW, optional).
- `src/lib/types.ts` — ALREADY EXISTS; import `Bracket`/`Picks`/`ShareCode`, do not recreate.
- `src/lib/shareCode.ts` — encode/decode + base64 helpers + `DecodeResult` (NEW).
- `src/lib/shareCode.test.ts` — round-trip + rejection tests (NEW).

## Verification

```bash
npm install
npx tsc --noEmit
npm test
npm run build
```

## Out of Scope

- Wiring the service into Builder / Bracket Viewer / Pinned Brackets pages.
- Validating `picks` against the real structure (doc02.04) — needs structure data.
- Any second encoding (format tag `2` / positional packing).

## Notes

- `btoa`/`atob` are browser globals; vitest runs on Node where they exist in
  modern versions — if a test environment lacks them, that's the one config wrinkle
  to handle (jsdom env or Node 18+).
- Reviewer watch: confirm `decodeBracket` never throws on adversarial input — the
  whole point of the failure union.

## Surface after this phase

- `src/lib/types.ts` is unchanged; `Bracket`/`Picks`/`ShareCode` come from there.
- `src/lib/shareCode.ts` exports `encodeBracket(bracket: Bracket): string`,
  `decodeBracket(code: string): DecodeResult`, the `DecodeResult` discriminated
  union (`{ok:true,bracket}` | `{ok:false,error}`), and `CURRENT_BRACKET_V`.
- Codes are `` `1~<urlsafe-base64-of-JSON>` ``; `decodeBracket` never throws.
- `picks`-vs-structure validation is deliberately NOT done here — callers own it.
- `package.json` has a `test` script (`vitest run`); vitest is the project test runner.
