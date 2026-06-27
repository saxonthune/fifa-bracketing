---
title: Contracts
summary: 
tags: []
deps: []
---

# Contracts


| Ref | Item | Kind | Summary | Tags |
|-----|------|------|---------|------|

| doc02.01 | Bracket Schema | doc | One entrant's filled prediction — a flat map of match id to predicted winning team code; serialized through the share code | contract, schema, bracket, prediction |
| doc02.02 | Results Schema | doc | Maintainer-pushed reality — which teams filled the entry slots and which team won each decided match; absence means not yet played | contract, schema, results |
| doc02.03 | Share Code Format | doc | How a bracket serializes into the code an entrant sends the maintainer — a format-tagged, URL-safe base64 of the bracket JSON, carrying submitter name, title, and picks | contract, share-code, serialization, encoding |
| doc02.04 | Structure Schema | doc | Static tournament skeleton — rounds, matches keyed by stable id, slot wiring, and per-match metadata (FIFA match number, UTC kickoff, host city) | contract, schema, structure, bracket |
| doc02.05 | Team Registry | doc | The teams every bracket, result, and slot references — keyed by FIFA three-letter code, each carrying name, flag key, and group; flags are self-hosted flag-icons SVGs | contract, schema, teams, flags |

Topics: bracket, contract, encoding, flags, prediction, results, schema, serialization, share-code, structure, teams
