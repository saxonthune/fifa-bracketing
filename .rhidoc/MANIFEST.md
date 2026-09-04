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

## Tag Index

Quick lookup for file-path→doc mapping:

| Tag | Relevant Docs |
|-----|---------------|
| `conventions` | doc00.03 |
| `docs` | doc00.01, doc00.02, doc00.03 |
| `maintenance` | doc00.02 |
| `meta` | doc00.01 |
| `philosophy` | doc00.02 |
| `relational-facts` | doc00.02 |
| `theory` | doc00.01 |
