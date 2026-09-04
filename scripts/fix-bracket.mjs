// Decode a share code, edit its picks, validate the result against the current
// structure + standings, and re-encode. For repairing brackets built against a
// since-corrected R32 (e.g. a third-place slot that changed teams).
//
// Usage:
//   node scripts/fix-bracket.mjs <code>                       # decode + show picks
//   node scripts/fix-bracket.mjs <code> --set R32-13=SUI      # set one winner
//   node scripts/fix-bracket.mjs <code> --swap IRN=SUI        # replace a team everywhere
// --set and --swap repeat and compose; swaps apply first, then sets. Team values
// are FIFA codes (SUI, ALG). Prints the new code + viewer URL; writes nothing.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const teams = load('src/data/teams.json');
const structure = load('src/data/structure.json');
const standings = load('src/data/currentStandings.json');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const SENTINEL = '.';
const FS = '\x1f';
const ROUND_IDS = ['R32', 'R16', 'QF', 'SF', 'TP', 'F'];

const TEAM_CODES = Object.keys(teams.teams);
const charByTeam = new Map(TEAM_CODES.map((c, i) => [c, ALPHABET[i]]));
const teamByChar = new Map(TEAM_CODES.map((c, i) => [ALPHABET[i], c]));

const CANONICAL_SLOTS = Object.keys(structure.matches).sort((a, b) => {
  const [ra, na] = a.split('-');
  const [rb, nb] = b.split('-');
  const ri = ROUND_IDS.indexOf(ra);
  const rj = ROUND_IDS.indexOf(rb);
  return ri !== rj ? ri - rj : Number(na) - Number(nb);
});

function b64Decode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const rem = padded.length % 4;
  return Buffer.from(rem ? padded + '='.repeat(4 - rem) : padded, 'base64').toString('utf8');
}

function b64Encode(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decode(code) {
  const sep = code.indexOf('~');
  if (sep === -1 || code.slice(0, sep) !== '2') {
    throw new Error('only v2 ("2~…") codes are supported');
  }
  const [entrant, title, p] = b64Decode(code.slice(sep + 1)).split(FS);
  const picks = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i] === SENTINEL) continue;
    const team = teamByChar.get(p[i]);
    if (!team) throw new Error(`bad pick char "${p[i]}" at position ${i}`);
    picks[CANONICAL_SLOTS[i]] = team;
  }
  return { entrant, title, picks };
}

function encode({ entrant, title, picks }) {
  let s = '';
  for (const slot of CANONICAL_SLOTS) {
    const team = picks[slot];
    if (team === undefined) { s += SENTINEL; continue; }
    const ch = charByTeam.get(team);
    if (!ch) throw new Error(`unknown team "${team}" at ${slot}`);
    s += ch;
  }
  s = s.replace(/\.+$/, '');
  return `2~${b64Encode([entrant, title, s].join(FS))}`;
}

// ── Resolver: the two teams that actually reach each match, given the current
// entry slots (group results) plus these picks. Mirrors lib/resolve.ts so the
// validation can't disagree with what the app renders.
function buildResolver(picks) {
  const placed = new Map();
  for (const [ref, team] of standings.resolved) {
    if (!(ref in structure.matches)) placed.set(ref, team);
  }
  for (const [id, team] of Object.entries(picks)) placed.set(id, team);

  function whoIs(ref) {
    if (ref.startsWith('W:')) return placed.get(ref.slice(2));
    if (ref.startsWith('L:')) {
      const id = ref.slice(2);
      const winner = placed.get(id);
      const match = structure.matches[id];
      if (winner === undefined || !match) return undefined;
      const a = whoIs(match.slots[0]);
      const b = whoIs(match.slots[1]);
      if (a === undefined || b === undefined) return undefined;
      return a === winner ? b : a;
    }
    return placed.get(ref);
  }
  return (matchId) => structure.matches[matchId].slots.map(whoIs);
}

/** Every picked winner must be one of the two teams that reach that match. */
function validate(picks) {
  const teamsAt = buildResolver(picks);
  const errors = [];
  for (const [matchId, winner] of Object.entries(picks)) {
    const [a, b] = teamsAt(matchId);
    if (winner !== a && winner !== b) {
      errors.push(`${matchId}: picked ${winner}, but the match is ${a ?? '?'} vs ${b ?? '?'}`);
    }
  }
  return errors;
}

function main() {
  const [code, ...rest] = process.argv.slice(2);
  if (!code) throw new Error('usage: node scripts/fix-bracket.mjs <code> [--set SLOT=TEAM] [--swap OLD=NEW]');

  const swaps = [];
  const sets = [];
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    const arg = rest[++i];
    if (flag === '--swap') swaps.push(arg);
    else if (flag === '--set') sets.push(arg);
    else throw new Error(`unexpected argument "${flag}" (expected --set or --swap)`);
  }

  const original = decode(code);
  const picks = { ...original.picks };

  const knownTeam = (c) => {
    if (!teams.teams[c]) throw new Error(`unknown team code "${c}" (not in teams.json)`);
    return c;
  };

  for (const swap of swaps) {
    const [oldT, newT] = swap.split('=').map((s) => s.trim());
    knownTeam(oldT); knownTeam(newT);
    let hits = 0;
    for (const [slot, team] of Object.entries(picks)) {
      if (team === oldT) { picks[slot] = newT; hits++; }
    }
    console.log(`swap ${oldT}→${newT}: ${hits} pick(s)`);
  }
  for (const set of sets) {
    const [slot, team] = set.split('=').map((s) => s.trim());
    if (!structure.matches[slot]) throw new Error(`unknown match id "${slot}"`);
    knownTeam(team);
    console.log(`set ${slot}: ${picks[slot] ?? '(unpicked)'}→${team}`);
    picks[slot] = team;
  }

  // Diff
  const changed = CANONICAL_SLOTS.filter((s) => original.picks[s] !== picks[s]);
  console.log(`\nentrant: ${original.entrant}`);
  console.log(`title:   ${original.title}`);
  if (changed.length === 0) {
    console.log('\nNo pick changes — code unchanged.');
  } else {
    console.log('\nchanges:');
    for (const s of changed) console.log(`  ${s}: ${original.picks[s] ?? '—'} → ${picks[s] ?? '—'}`);
  }

  const errors = validate(picks);
  if (errors.length) {
    console.error('\n⚠ invalid bracket — picks that no longer match the structure:');
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  const newCode = encode({ entrant: original.entrant, title: original.title, picks });
  console.log('\nnew code:');
  console.log(newCode);
  console.log('\nviewer url:');
  console.log(`https://fifa.saxon.zone/viewer?code=${encodeURIComponent(newCode)}`);
}

main();
