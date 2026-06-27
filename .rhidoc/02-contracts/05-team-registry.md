---
title: Team Registry
summary: The teams every bracket, result, and slot references — keyed by FIFA three-letter code, each carrying name, flag key, and group; flags are self-hosted flag-icons SVGs
tags: [contract, schema, teams, flags]
deps: []
---

# Team Registry

The **team registry** is the static set of teams every other contract references.
A bracket's picks (doc02.01), the results' winners and slots (doc02.02), and the
structure's resolved slots (doc02.04) all name a team by its registry key.

## Identifier

The key is the **FIFA three-letter code** (`GER`, `NED`, `POR`, `ENG`) — the
vocabulary people filling brackets and watching broadcasts already use. It is
deliberately *not* ISO: FIFA codes diverge from ISO 3166 (`GER`≠`DEU`,
`NED`≠`NLD`) and cover non-sovereign teams (England, Scotland, Wales) that have no
ISO country entry. Scoring and all cross-references run on this code.

## Flag

Flags are **self-hosted SVGs from flag-icons** (MIT). The registry's `flag` field
is the flag-icons key — ISO 3166-1 alpha-2 (`de`, `nl`), or a subdivision key for
home nations (`gb-eng`, `gb-sct`, `gb-wls`). The asset is committed as
`<flag>.svg`; the renderer points an `<img>` at it. This decouples the scoring id
(FIFA code) from the asset key (flag-icons), and renders consistently across
platforms — unlike emoji flags, which Windows browsers show as letters.

Only the ~48 teams in the field are pulled and committed, not the full flag-icons
set.

## Shape

A map of FIFA code → team:

```json
{
  "v": 1,
  "teams": {
    "GER": { "name": "Germany",     "flag": "de",     "group": "E" },
    "NED": { "name": "Netherlands", "flag": "nl",     "group": "F" },
    "ENG": { "name": "England",     "flag": "gb-eng", "group": "B" }
  }
}
```

- `name` — display name.
- `flag` — flag-icons key (see above).
- `group` — group letter `A`–`L` (12 groups of 4).

Whether a numeric seed/ranking belongs here is open (`D-team-seed`) — the
knockout structure (doc02.04) already encodes slot wiring, so seed is display-only
and deferred until a surface needs it.
