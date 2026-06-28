// Pulls knockout-round results from openfootball's public-domain WC2026 JSON and
// merges the decided winners into src/data/currentStandings.json. Group-stage
// rows (entry slots A1/A2/3rd:* ...) are left untouched — those encode group
// placings, which this script does not compute.
//
// Join key is the official FIFA match number: openfootball's `num` (73–104 for
// knockouts) is the same number structure.json carries as meta.num, so a match
// maps to our id (R32-1 …) unambiguously without guessing on team pairs.
//
// Dry-run by default: prints the diff. Pass --write to update the file.
//   node scripts/pull-results.mjs            # show what would change
//   node scripts/pull-results.mjs --write    # apply, then `just deploy`

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STANDINGS = join(ROOT, 'src/data/currentStandings.json');
const STRUCTURE = join(ROOT, 'src/data/structure.json');
const TEAMS = join(ROOT, 'src/data/teams.json');
// WC_SOURCE overrides the source for testing or pinning to a known-good commit;
// a value with no "://" is read from disk instead of fetched.
const SOURCE = process.env.WC_SOURCE ?? 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

const KNOCKOUT_ROUNDS = ['R32', 'R16', 'QF', 'SF', 'TP', 'F'];

// openfootball spellings that differ from teams.json `name`. The validation pass
// names any team that lands here-but-missing, so this grows ~once per round.
const ALIASES = {
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'Czech Republic': 'Czechia',
  'DR Congo': 'D.R. Congo',
  Turkey: 'Türkiye',
  USA: 'United States',
};

const write = process.argv.includes('--write');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** name (or alias) → our team code, from teams.json. */
function buildNameToCode(teams) {
  const byName = new Map();
  for (const [code, t] of Object.entries(teams.teams)) byName.set(t.name, code);
  const resolve = (rawName) => byName.get(ALIASES[rawName] ?? rawName);
  return resolve;
}

/** FIFA match number → our match id, for knockout matches only. */
function buildNumToId(structure) {
  const numToId = new Map();
  for (const [id, m] of Object.entries(structure.matches)) {
    if (KNOCKOUT_ROUNDS.includes(m.round)) numToId.set(m.meta.num, id);
  }
  return numToId;
}

/** Decided winner of an openfootball knockout match, or null if not yet
 *  resolved. Knockouts can't end level, so a tied ft with no shootout means the
 *  match isn't finished — not a draw. */
function winnerOf(match) {
  const s = match.score;
  if (!s) return null;
  const pick = (a, b) => (a > b ? match.team1 : b > a ? match.team2 : null);
  if (Array.isArray(s.p)) {
    const w = pick(s.p[0], s.p[1]);
    if (w) return w;
  }
  if (Array.isArray(s.ft)) return pick(s.ft[0], s.ft[1]);
  return null;
}

async function main() {
  const source = SOURCE.includes('://')
    ? await fetch(SOURCE).then((r) => {
        if (!r.ok) throw new Error(`fetch ${SOURCE} → HTTP ${r.status}`);
        return r.json();
      })
    : loadJson(SOURCE);

  const standings = loadJson(STANDINGS);
  const structure = loadJson(STRUCTURE);
  const teams = loadJson(TEAMS);

  const nameToCode = buildNameToCode(teams);
  const numToId = buildNumToId(structure);

  const knockoutIds = new Set(numToId.values());
  const groupRows = standings.resolved.filter(([slot]) => !knockoutIds.has(slot));

  const koRows = [];
  const problems = [];
  for (const m of source.matches) {
    const id = numToId.get(m.num);
    if (!id) continue; // group match, or a num we don't track

    const winnerName = winnerOf(m);
    if (winnerName == null) continue; // not yet decided

    const code = nameToCode(winnerName);
    if (!code) {
      problems.push(`match ${m.num} (${id}): winner "${winnerName}" has no team code — add to ALIASES`);
      continue;
    }
    if (winnerName !== m.team1 && winnerName !== m.team2) {
      problems.push(`match ${m.num} (${id}): derived winner "${winnerName}" is neither team — score parse bug`);
      continue;
    }
    koRows.push([id, code]);
  }
  koRows.sort((a, b) => structIndex(structure, a[0]) - structIndex(structure, b[0]));

  // Diff against what's currently in the file.
  const prev = new Map(standings.resolved.filter(([s]) => knockoutIds.has(s)));
  const changes = [];
  for (const [id, code] of koRows) {
    if (prev.get(id) !== code) changes.push(`${prev.has(id) ? 'update' : 'add'} ${id} → ${code}${prev.has(id) ? ` (was ${prev.get(id)})` : ''}`);
  }

  for (const p of problems) console.error(`⚠ ${p}`);
  if (changes.length === 0) {
    console.log(`No knockout changes (${koRows.length} decided, all already current).`);
  } else {
    console.log(`${changes.length} change(s):`);
    for (const c of changes) console.log(`  ${c}`);
  }

  if (!write) {
    console.log(changes.length ? '\nDry run — re-run with --write to apply, then `just deploy`.' : '');
    if (problems.length) process.exit(1);
    return;
  }

  standings.resolved = [...groupRows, ...koRows];
  writeFileSync(STANDINGS, `${JSON.stringify(standings, null, 2)}\n`);
  console.log(`\nWrote ${koRows.length} knockout row(s) to ${STANDINGS}.`);
  if (problems.length) process.exit(1);
}

/** Position of a match in structure.json's declaration order — gives a stable
 *  R32→F ordering for the written rows. */
function structIndex(structure, id) {
  return Object.keys(structure.matches).indexOf(id);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
