---
title: Share Code Format
summary: How a bracket serializes into the code an entrant sends the maintainer — a format-tagged, URL-safe base64 of the bracket JSON, carrying submitter name, title, and picks
tags: [contract, share-code, serialization, encoding]
deps: [doc02.01]
---

# Share Code Format

A **share code** is the single string an entrant copies out of the Builder and
sends the maintainer. It serializes one bracket (doc02.01); the Bracket Viewer
decodes it and renders that entrant's picks. The code carries only what cannot be
re-derived from the structure (doc02.04): the submitter name, the bracket title,
and the picks.

## Format

A code is a **format tag, a separator, and a payload**:

```
1~eyJ2IjoxLCJlbnRyYW50IjoiU2FtIiwidGl0bGUiOiJTYW0ncyBjaGFvcyBydW4iLi4u
└┬┘│└──────────────────────── payload ─────────────────────────────────
 │ └ separator (~)
 └ format tag
```

- **format tag** — which encoding the payload uses. `1` = URL-safe base64 of the
  bracket JSON (below). The tag is read *before* the payload so a future tighter
  encoding (`2` = positional packing of picks) can be added without breaking codes
  already in circulation — old codes keep their tag and keep decoding.
- **separator** — `~`, a character untouched by URL-safe base64 so it cannot occur
  in the payload.
- **payload** — the format-`1` encoding of the bracket.

### Format `1` — URL-safe base64 of bracket JSON

The bracket object is `JSON.stringify`'d, then base64-encoded with `+/=` mapped to
`-_` and trailing `=` padding stripped (the wordle-diy `urlService` convention).
Decoding reverses it: restore `+/`, re-pad to a multiple of 4, base64-decode,
`JSON.parse`.

The encoded bracket:

```json
{
  "v": 1,
  "entrant": "Sam",
  "title": "Sam's chaos run",
  "picks": { "SF-1": "ARG", "SF-2": "ESP", "F-1": "ARG", "TP-1": "FRA" }
}
```

- `v` — bracket *field-shape* version (doc02.01). Distinct from the format tag: the
  tag governs how bytes are encoded, `v` governs which fields the JSON holds. They
  evolve independently.
- `entrant` — submitter name, shown when the code is loaded.
- `title` — the bracket's display title, shown alongside the submitter name.
- `picks` — match id → predicted winning team code (doc02.01).

## Carrier

The code travels two equivalent ways from one value:

- **Bare string** — the entrant copies `1~…` and pastes it to the maintainer.
- **Link** — the same value as a query param, `…/viewer?b=1~…`, opens the Bracket
  Viewer with the bracket already decoded.

The query-param value *is* the bare code; neither form is canonical.

## Validation

Decoding is fail-safe — a malformed or truncated code never crashes the Viewer:

- Unknown or missing format tag → reject as invalid.
- Payload that fails base64-decode or `JSON.parse` → reject as invalid.
- `picks` not a string→string map, or referencing match ids absent from the
  structure (doc02.04) → reject as invalid.
- An unknown future `v` → reject as invalid (a later version may distinguish "code
  from a newer app version" specifically; not required for the MVP).

On any rejection the Viewer shows an "invalid or corrupt code" state rather than a
partial render.
