// Vendors the field's flag SVGs from the flag-icons npm package into
// public/flags/ and writes the flag asset registry (public/flags.json) per
// doc02.05. Re-run after `npm install` or when the field changes.
//
// KEYS is the source of truth for the field until teams.json drives it. Each is
// a flag-icons key: ISO 3166-1 alpha-2, or a gb-subdivision for home nations.

import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'node_modules/flag-icons/flags/4x3');
const OUT_DIR = join(ROOT, 'public/flags');
const REGISTRY = join(ROOT, 'public/flags.json');

// 2026 FIFA World Cup — 48 qualified nations.
const KEYS = [
  // hosts
  'ca', 'mx', 'us',
  // AFC
  'au', 'iq', 'ir', 'jo', 'jp', 'kr', 'qa', 'sa', 'uz',
  // CAF
  'cd', 'ci', 'cv', 'dz', 'eg', 'gh', 'ma', 'sn', 'tn', 'za',
  // CONCACAF (beyond hosts)
  'cw', 'ht', 'pa',
  // CONMEBOL
  'ar', 'br', 'co', 'ec', 'py', 'uy',
  // OFC
  'nz',
  // UEFA
  'at', 'ba', 'be', 'ch', 'cz', 'de', 'es', 'fr', 'gb-eng', 'gb-sct',
  'hr', 'nl', 'no', 'pt', 'se', 'tr',
].sort();

mkdirSync(OUT_DIR, { recursive: true });

const flags = {};
const missing = [];
for (const key of KEYS) {
  const src = join(SRC, `${key}.svg`);
  if (!existsSync(src)) {
    missing.push(key);
    continue;
  }
  copyFileSync(src, join(OUT_DIR, `${key}.svg`));
  flags[key] = `flags/${key}.svg`;
}

if (missing.length) {
  console.error('Missing flag-icons keys (not in node_modules):', missing.join(', '));
  process.exit(1);
}

writeFileSync(REGISTRY, `${JSON.stringify({ v: 1, flags }, null, 2)}\n`);
console.log(`Vendored ${Object.keys(flags).length} flags into public/flags/ and wrote public/flags.json`);
