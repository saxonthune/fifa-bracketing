---
title: Product
summary: FIFA knockout-bracket prediction game — fill a bracket and generate a share code, track the live tournament against pushed results, view a curated set of friends' brackets
tags: [product, requirements, mvp]
deps: [doc02]
---

# Product

A static web app where users fill out a FIFA World Cup knockout bracket, get a
share code, and follow the tournament as the maintainer pushes real results.

## Purpose

Friends predict the knockout bracket and send their picks to the maintainer. The
maintainer curates the set and pushes real results as the tournament unfolds; the
app renders each submitted bracket against those results, showing which picks hit.

## Surfaces

The app is a small set of pages, not a single stateful SPA — each surface owns one
job and shares the vocabulary in doc02 (and the types in `src/lib/types.ts`).

- **Builder** — user fills a knockout bracket and gets a share code. Prior art:
  `wordle-diy`, where the user authors a config and the app encodes it into a
  URL-safe code (D-share-code).
- **Tracker** — fetches the maintainer-pushed CurrentStandings, composes them
  with the TournamentStructure, and renders the live tournament state. No picks, no scoring.
- **Bracket Viewer** — readonly. Decodes one share code and renders
  that bracket as filled. Its bracket-display component is shared with Pinned
  Brackets (the multi-bracket view), so the two render the same picks the same way.
- **Pinned Brackets** — a hand-curated list of friends' share codes. A dropdown
  selects one code; the bracket-display then renders that entrant's bracket graded
  against the results — which picks hit, which missed.

## Roles

- **Entrant** — fills a bracket in the Builder, sends the resulting code to the
  maintainer. Does not need an account.
- **Maintainer** — curates the Pinned Brackets list of codes, and pushes `results.json`
  as matches resolve. Single trusted author of results.

## Data flow

A UserBracket serializes through one share code. CurrentStandings
are authored only by the maintainer and read by every client. Grading a
bracket — which picks match the decided results — is a pure function of one bracket
plus the current results, used by Bracket Viewer and Pinned Brackets. The Tracker
needs no bracket.

## Platform

SolidJS, built static, deployed to Cloudflare Pages. `results.json` lives in a
Cloudflare R2 bucket so the maintainer pushes score updates without rebuilding
the site; the Tracker fetches it at runtime.
