// Decode, edit, and re-encode the site's bracket share codes. Share codes are
// reversible encodings, not secure encryption; the encrypt/decrypt command
// names describe their maintenance workflow.
//
// Usage:
//   npm run bracket-data -- decrypt '<code-or-viewer-url>' > bracket.json
//   npm run bracket-data -- encrypt bracket.json
//   npm run bracket-data -- anonymize [public/pinned.json]

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const teams = JSON.parse(readFileSync(join(ROOT, "src/data/teams.json"), "utf8"));
const structure = JSON.parse(readFileSync(join(ROOT, "src/data/structure.json"), "utf8"));

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const SENTINEL = ".";
const FIELD_SEPARATOR = "\x1f";
const ROUND_IDS = ["R32", "R16", "QF", "SF", "TP", "F"];
const TEAM_CODES = Object.keys(teams.teams);
const CHAR_BY_TEAM = new Map(TEAM_CODES.map((code, index) => [code, ALPHABET[index]]));
const TEAM_BY_CHAR = new Map(TEAM_CODES.map((code, index) => [ALPHABET[index], code]));
const CANONICAL_SLOTS = Object.keys(structure.matches).sort((a, b) => {
  const [roundA, numberA] = a.split("-");
  const [roundB, numberB] = b.split("-");
  const roundDifference = ROUND_IDS.indexOf(roundA) - ROUND_IDS.indexOf(roundB);
  return roundDifference || Number(numberA) - Number(numberB);
});

const ADJECTIVES = [
  "amber", "brisk", "calm", "clever", "cobalt", "cosmic", "crisp", "daring",
  "gentle", "golden", "lucky", "merry", "nimble", "quiet", "rapid", "silver",
];
const NOUNS = [
  "badger", "comet", "falcon", "fox", "heron", "jaguar", "lynx", "otter",
  "panda", "puma", "raven", "shark", "sparrow", "tiger", "whale", "wolf",
];

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function extractCode(value) {
  const trimmed = value.trim();
  const marker = trimmed.indexOf("code=");
  const encoded = marker === -1
    ? trimmed
    : trimmed.slice(marker + "code=".length).split(/[&#]/)[0];
  return decodeURIComponent(encoded);
}

function decrypt(value) {
  const code = extractCode(value);
  const separator = code.indexOf("~");
  if (separator === -1) throw new Error("share code has no format separator");
  const tag = code.slice(0, separator);
  const raw = base64UrlDecode(code.slice(separator + 1));

  if (tag === "1") return JSON.parse(raw);
  if (tag !== "2") throw new Error(`unsupported share-code format ${JSON.stringify(tag)}`);

  const parts = raw.split(FIELD_SEPARATOR);
  if (parts.length !== 3) throw new Error("v2 share code has an invalid payload");
  const [entrant, title, compactPicks] = parts;
  if (compactPicks.length > CANONICAL_SLOTS.length) {
    throw new Error("v2 share code contains too many picks");
  }

  const picks = {};
  for (let index = 0; index < compactPicks.length; index++) {
    const character = compactPicks[index];
    if (character === SENTINEL) continue;
    const team = TEAM_BY_CHAR.get(character);
    if (!team) throw new Error(`unknown pick character ${JSON.stringify(character)}`);
    picks[CANONICAL_SLOTS[index]] = team;
  }
  return { v: 1, entrant, title, picks };
}

function encrypt(bracket) {
  if (
    !bracket || typeof bracket !== "object" || Array.isArray(bracket) ||
    typeof bracket.entrant !== "string" || typeof bracket.title !== "string" ||
    !bracket.picks || typeof bracket.picks !== "object" || Array.isArray(bracket.picks)
  ) {
    throw new Error("bracket JSON must contain string entrant/title fields and a picks object");
  }
  if (bracket.entrant.includes(FIELD_SEPARATOR) || bracket.title.includes(FIELD_SEPARATOR)) {
    throw new Error("entrant/title cannot contain the field separator");
  }

  let compactPicks = "";
  for (const slot of CANONICAL_SLOTS) {
    const team = bracket.picks[slot];
    if (team === undefined) {
      compactPicks += SENTINEL;
      continue;
    }
    const character = CHAR_BY_TEAM.get(team);
    if (!character) throw new Error(`unknown team ${JSON.stringify(team)} at ${slot}`);
    compactPicks += character;
  }
  compactPicks = compactPicks.replace(/\.+$/, "");
  return `2~${base64UrlEncode([bracket.entrant, bracket.title, compactPicks].join(FIELD_SEPARATOR))}`;
}

function hash(value) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function anonymousName(bracket, used) {
  const identityFreeBracket = JSON.stringify(bracket.picks);
  let index = hash(identityFreeBracket) % (ADJECTIVES.length * NOUNS.length);
  while (used.has(index)) index = (index + 1) % (ADJECTIVES.length * NOUNS.length);
  used.add(index);
  return `${ADJECTIVES[Math.floor(index / NOUNS.length)]}-${NOUNS[index % NOUNS.length]}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function anonymizeTitle(title, entrant, alias) {
  let result = title.replace(new RegExp(escapeRegExp(entrant), "gi"), alias);
  const firstName = entrant.trim().split(/\s+/)[0];
  if (firstName.length >= 3 && firstName !== entrant) {
    result = result.replace(new RegExp(`\\b${escapeRegExp(firstName)}\\b`, "gi"), alias);
  }
  return result;
}

function anonymize(fileArgument) {
  const path = resolve(ROOT, fileArgument ?? "public/pinned.json");
  const entries = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(entries) || entries.some((entry) => typeof entry !== "string")) {
    throw new Error("pinned data must be an array of share-code strings");
  }

  const used = new Set();
  const changed = [];
  const anonymized = entries.map((entry) => {
    const bracket = decrypt(entry);
    if (/saxon|opus/i.test(bracket.entrant)) return encrypt(bracket);
    const previous = bracket.entrant;
    const alias = anonymousName(bracket, used);
    bracket.title = anonymizeTitle(bracket.title, previous, alias);
    bracket.entrant = alias;
    changed.push(`${previous} -> ${bracket.entrant}`);
    return encrypt(bracket);
  });

  writeFileSync(path, `${JSON.stringify(anonymized, null, 2)}\n`);
  for (const change of changed) console.log(change);
  console.log(`Updated ${path}`);
}

function readJsonInput(argument) {
  if (!argument || argument === "-") return JSON.parse(readFileSync(0, "utf8"));
  return JSON.parse(readFileSync(resolve(process.cwd(), argument), "utf8"));
}

function usage() {
  console.error("usage: bracket-data.mjs decrypt <code-or-url> | encrypt <json-file|-> | anonymize [pinned-file]");
  process.exitCode = 1;
}

const [command, argument] = process.argv.slice(2);
try {
  if (command === "decrypt" && argument) {
    console.log(JSON.stringify(decrypt(argument), null, 2));
  } else if (command === "encrypt") {
    console.log(encrypt(readJsonInput(argument)));
  } else if (command === "anonymize") {
    anonymize(argument);
  } else {
    usage();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
