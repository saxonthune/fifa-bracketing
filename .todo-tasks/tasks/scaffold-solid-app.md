# Scaffold the SolidJS app

## Motivation

The product is specified (`doc01`: four surfaces — Builder, Tracker, Bracket
Viewer, Pinned Brackets) but no application code exists. Stand up the project
skeleton so feature work has somewhere to land. Scaffolding does not depend on
the contracts (`doc02.01` bracket schema, `doc02.02` results schema, `doc02.03`
share code) being finalized — it produces the shell, routing, and mobile-first
base, with placeholder page components only.

Stack and conventions are chosen to match the sibling Solid repos
(`agent-chain-solid-migration`, `tinyForum`): Vite + `vite-plugin-solid` +
SolidJS + `@solidjs/router` + Tailwind 4 via `@tailwindcss/vite`, TS strict.

## Do NOT

- Do NOT implement any real feature logic. No bracket data model, no share-code
  encode/decode, no scoring, no `results.json` fetch. Page components are
  placeholders that render their name + a `TODO`.
- Do NOT author or invent the contracts (`doc02.01/02/03`). They are owned by the
  maintainer and are out of scope.
- Do NOT add Cloudflare deploy CI, wrangler config, or R2 wiring. Only the static
  build + the SPA `_redirects` fallback file are in scope.
- Do NOT rename the surfaces. Use exactly: Builder, Tracker, Bracket Viewer,
  Pinned Brackets.
- Do NOT pin exotic versions — use the same major versions the sibling Solid repos
  use (SolidJS 1.9.x, `@solidjs/router` 0.15.x, Vite 6.x, Tailwind 4.x).

## Plan

### 1. Initialize the Vite + Solid + TS project at the repo root

Create the project in-place at the repo root (the repo already exists; do not
create a subfolder). Use the `solid-ts` Vite template layout:

- `package.json` with deps: `solid-js@^1.9`, `@solidjs/router@^0.15`; devDeps:
  `vite@^6`, `vite-plugin-solid`, `typescript`, `tailwindcss@^4`,
  `@tailwindcss/vite`.
- Scripts: `dev` (`vite`), `build` (`vite build`), `preview` (`vite preview`).
- `vite.config.ts` with `plugins: [solid(), tailwindcss()]`.
- `tsconfig.json` strict, `jsx: "preserve"`, `jsxImportSource: "solid-js"`,
  `moduleResolution: "bundler"`, matching `agent-chain-solid-migration`'s tsconfig.
- `index.html` with `<meta name="viewport" content="width=device-width, initial-scale=1">`
  and a `#root` div, loading `/src/main.tsx`.

### 2. Tailwind 4 base + mobile-first stylesheet

- `src/index.css` (or `theme.css`) with `@import "tailwindcss";`.
- Mobile-first baseline: a single-column body that reads on a phone. Use only
  unprefixed (mobile) utilities for the base; any wider-screen rules use `sm:`/
  `md:` (min-width), never desktop-first.
- Import the stylesheet from `src/main.tsx`.

### 3. Router + four routes + Home

In `src/App.tsx`, declare routes with `@solidjs/router` in the `<Router>`/`<Route>`
component style (match `agent-chain-solid-migration/src/App.tsx`):

- `/` → `Home` — a small landing page that links to all four surfaces.
- `/builder` → `Builder`
- `/tracker` → `Tracker`
- `/viewer` → `BracketViewer` (readonly)
- `/pinned` → `PinnedBrackets`

`src/main.tsx` renders `<App />` into `#root` via `render()`.

### 4. Placeholder page components

Create `src/pages/` with one component file per route: `Home.tsx`, `Builder.tsx`,
`Tracker.tsx`, `BracketViewer.tsx`, `PinnedBrackets.tsx`. Each renders its surface
name as a heading and a short `TODO` line. `Home.tsx` additionally renders
`<A>` links (from `@solidjs/router`) to the other four routes — this doubles as
the nav.

### 5. Reserve shared locations (stubs)

- `src/components/BracketDisplay.tsx` — stub component (renders a `TODO`
  placeholder). Documented as the readonly bracket-display shared by Bracket
  Viewer, Pinned Brackets, and Tracker.
- `src/lib/scoring.ts` — stub exporting a `scoreBracket` function signature that
  throws `new Error("not implemented")`. No real logic.

### 6. SPA fallback for Cloudflare Pages

- `public/_redirects` containing `/*    /index.html    200` so client-routed deep
  links resolve when statically served.

## Files to Modify

- `package.json` — new, deps/scripts above
- `vite.config.ts` — new, solid + tailwind plugins
- `tsconfig.json`, `tsconfig.node.json` — new, strict Solid config
- `index.html` — new, viewport meta + `#root`
- `src/main.tsx` — new, render `<App/>`, import css
- `src/App.tsx` — new, router + 5 routes
- `src/index.css` — new, tailwind import + mobile-first base
- `src/pages/{Home,Builder,Tracker,BracketViewer,PinnedBrackets}.tsx` — new placeholders
- `src/components/BracketDisplay.tsx` — new stub
- `src/lib/scoring.ts` — new stub
- `public/_redirects` — new SPA fallback
- `.gitignore` — ensure `node_modules/` and `dist/` are ignored

## Verification

```bash
npm install --prefix /home/saxon/code/github/saxonthune/fifa-bracketing
npm run --prefix /home/saxon/code/github/saxonthune/fifa-bracketing build
test -f /home/saxon/code/github/saxonthune/fifa-bracketing/dist/index.html
test -f /home/saxon/code/github/saxonthune/fifa-bracketing/dist/_redirects
```

## Out of Scope

- Bracket schema, results schema, share-code encode/decode (the contracts).
- Real Builder form, real scoring, R2 fetch, Cloudflare Pages CI/deploy config.
- Styling beyond a clean mobile-first baseline and the Tailwind setup.
- The bracket connector-line rendering (a later, custom-CSS/SVG concern).

## Notes

- A full bracket will not fit a phone width; the eventual mobile pattern
  (horizontal scroll or round-by-round) is a later task — out of scope here.
- Tailwind covers bracket layout; connector lines will be a small custom-CSS/SVG
  island later. Not relevant to this scaffold.
- Match the sibling Solid repos' exact router idiom and tsconfig to keep the repos
  consistent.
