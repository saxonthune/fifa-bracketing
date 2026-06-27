# .rhidoc/ Manifest

Machine-readable index for AI navigation. Read this file first, then open only the docs relevant to your query.

**Retrieval strategy:** See doc00.00 (codex index) for how to find and read docs efficiently.

## Column Definitions

- **Ref**: Cross-reference ID (`docXX.YY.ZZ`)
- **File**: Path relative to title directory
- **Summary**: One-line description for semantic matching
- **Tags**: Keywords for file-path→doc mapping
- **Deps**: Doc refs to check when this doc changes
- **Refs**: Reverse deps — docs that list this one in their Deps (computed automatically)
- **Attachments**: Non-md files sharing the doc's numeric prefix. Sidecar artifacts that travel with the doc during structural operations. Purely filesystem-derived; not a frontmatter field.

Orphaned attachments (non-md files with no corresponding root .md) are reported as warnings on stderr during regeneration and do not appear in this table.

## 00-codex — fifa-bracketing

| Ref | File | Summary | Tags | Deps | Refs | Attachments |
|-----|------|---------|------|------|------|-------------|

| doc00.00 | `00-index.md` |  |  | — | — | — |
| doc00.01 | `01-about.md` | Why this workspace exists, how to read it, two-sources-of-truth theory | docs, meta, theory | — | — | — |
| doc00.02 | `02-maintenance.md` | Doc philosophy — docs convert volatile source signals into stable intent; declarative intent, banned patterns, prefer facts to prose (purposed terms, splits with criteria, directional facts), author freely then structure separately, when to grow detail | docs, maintenance, philosophy, relational-facts | — | — | — |
| doc00.03 | `03-conventions.md` | Cross-reference syntax, frontmatter schema, file naming, writing style | docs, conventions | — | — | — |

## 02-contracts — Contracts

| Ref | File | Summary | Tags | Deps | Refs | Attachments |
|-----|------|---------|------|------|------|-------------|

| doc02.00 | `00-index.md` |  |  | — | — | — |
| doc02.01 | `01-bracket-schema.md` | One entrant's filled prediction — a flat map of match id to predicted winning team code; serialized through the share code | contract, schema, bracket, prediction | doc02.04 | doc02.03 | — |
| doc02.02 | `02-results-schema.md` | Maintainer-pushed reality — which teams filled the entry slots and which team won each decided match; absence means not yet played | contract, schema, results | doc02.04 | — | — |
| doc02.03 | `03-share-code-format.md` | How a bracket serializes into the code an entrant sends the maintainer — a format-tagged, URL-safe base64 of the bracket JSON, carrying submitter name, title, and picks | contract, share-code, serialization, encoding | doc02.01 | — | — |
| doc02.04 | `04-structure-schema.md` | Static tournament skeleton — rounds, matches keyed by stable id, slot wiring, and per-match metadata (FIFA match number, UTC kickoff, host city) | contract, schema, structure, bracket | — | doc02.01, doc02.02 | — |
| doc02.05 | `05-team-registry.md` | The teams every bracket, result, and slot references — keyed by FIFA three-letter code, each carrying name, flag key, and group; flags are self-hosted flag-icons SVGs | contract, schema, teams, flags | — | — | — |

## Tag Index

Quick lookup for file-path→doc mapping:

| Tag | Relevant Docs |
|-----|---------------|
| `bracket` | doc02.01, doc02.04 |
| `contract` | doc02.01, doc02.02, doc02.03, doc02.04, doc02.05 |
| `conventions` | doc00.03 |
| `docs` | doc00.01, doc00.02, doc00.03 |
| `encoding` | doc02.03 |
| `flags` | doc02.05 |
| `maintenance` | doc00.02 |
| `meta` | doc00.01 |
| `philosophy` | doc00.02 |
| `prediction` | doc02.01 |
| `relational-facts` | doc00.02 |
| `results` | doc02.02 |
| `schema` | doc02.01, doc02.02, doc02.04, doc02.05 |
| `serialization` | doc02.03 |
| `share-code` | doc02.03 |
| `structure` | doc02.04 |
| `teams` | doc02.05 |
| `theory` | doc00.01 |
