---
title: Product
summary: FIFA knockout-bracket prediction game — generate a share code, track standings against pushed results, compare a curated set of friends' brackets
tags: [product, requirements, mvp]
deps: [doc02.01, doc02.02, doc02.03]
---

# Product

A static web app where users fill out a FIFA World Cup knockout bracket, get a
share code, and track how their picks score against real tournament results.

## Purpose

Friends predict the knockout bracket and send their picks to the maintainer. The
maintainer curates the set, pushes real results as the tournament unfolds, and
the app scores every bracket so everyone sees a live standing.

## Surfaces

The app is a small set of pages, not a single stateful SPA — each surface owns one
job and shares the contracts in doc02.

- **Builder** — user fills a knockout bracket and gets a share code. Prior art:
  `wordle-diy`, where the user authors a config and the app encodes it into a
  URL-safe code (doc02.03).
- **Tracker** — fetches the maintainer-pushed results (doc02.02), scores a
  bracket against them, and shows that bracket's standing.
- **Bracket Viewer** — readonly. Decodes one share code (doc02.03) and renders
  that bracket as filled. Its bracket-display component is shared with Pinned
  Brackets (the multi-bracket view), so the two render the same picks the same way.
- **Pinned Brackets** — a hand-curated list of friends' share codes. A dropdown
  selects one code; the Tracker view then shows how that entrant is doing.

## Roles

- **Entrant** — fills a bracket in the Builder, sends the resulting code to the
  maintainer. Does not need an account.
- **Maintainer** — curates the Pinned Brackets list of codes, and pushes `results.json`
  (doc02.02) as matches resolve. Single trusted author of results.

## Data flow

A bracket (doc02.01) serializes through one share code (doc02.03). Results
(doc02.02) are authored only by the maintainer and read by every client. Scoring
is a pure function of one bracket plus the current results — the same comparison
drives both the Tracker and the Pinned Brackets standings.

## Platform

SolidJS, built static, deployed to Cloudflare Pages. `results.json` lives in a
Cloudflare R2 bucket so the maintainer pushes score updates without rebuilding
the site; the Tracker fetches it at runtime.
