import type { MatchId, TeamCode, UserBracket } from "./types";
import { ROUND_IDS } from "./types";
import structure from "../data/structure.json";
import teams from "../data/teams.json";

export const CURRENT_BRACKET_V = 1;

export type DecodeResult =
  | { ok: true; bracket: UserBracket }
  | { ok: false; error: string };

// ─── Compact-encoding tables ────────────────────────────────────────────────
// The "2" share code drops everything reality already knows: the 32 match
// slots are a fixed, ordered set (CANONICAL_SLOTS) and every team is a single
// char index into the registry (TEAM_BY_CHAR). A code carries only the picked
// teams, positionally — no keys, no 3-letter codes.

// One char per team, indexed by registry order. URL-safe set, SENTINEL excluded.
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const SENTINEL = "."; // an unpicked slot

const TEAM_CODES = Object.keys(teams.teams) as TeamCode[];
if (TEAM_CODES.length > ALPHABET.length) {
  throw new Error(
    `share code v2 supports ${ALPHABET.length} teams, registry has ${TEAM_CODES.length}`,
  );
}
const CHAR_BY_TEAM = new Map<TeamCode, string>(
  TEAM_CODES.map((code, i) => [code, ALPHABET[i]]),
);
const TEAM_BY_CHAR = new Map<string, TeamCode>(
  TEAM_CODES.map((code, i) => [ALPHABET[i], code]),
);

// Slots in a frozen order: round order (ROUND_IDS) then numeric suffix. Both
// encoder and decoder walk this same list, so positions line up. Derived from
// the structure rather than its JSON key order so it can't drift silently.
const CANONICAL_SLOTS: MatchId[] = (
  Object.keys(structure.matches) as MatchId[]
).sort((a, b) => {
  const [ra, na] = a.split("-");
  const [rb, nb] = b.split("-");
  const ri = ROUND_IDS.indexOf(ra as (typeof ROUND_IDS)[number]);
  const rj = ROUND_IDS.indexOf(rb as (typeof ROUND_IDS)[number]);
  return ri !== rj ? ri - rj : Number(na) - Number(nb);
});

// btoa/atob operate on bytes, not Unicode — feed them UTF-8 so emoji and any
// non-Latin-1 text in entrant/title survive the round-trip instead of throwing
// (code points > U+00FF) or mangling (U+0080–U+00FF).
function b64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64Decode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const rem = padded.length % 4;
  const repadded = rem ? padded + "=".repeat(4 - rem) : padded;
  const bin = atob(repadded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// The "2" payload is three fields joined by FS, then base64'd — no JSON keys,
// no quotes. Order is fixed: entrant, title, picks. The "2" tag is the encoding
// version; the bracket schema version is implicit (CURRENT_BRACKET_V), bumped by
// a new tag if the shape ever changes. base64 keeps entrant/title out of plain
// sight in the URL, same as v1.
const FS = "\x1f"; // ASCII unit separator — never present in form text or picks

export function encodeBracket(bracket: UserBracket): string {
  let picks = "";
  for (const slot of CANONICAL_SLOTS) {
    const team = bracket.picks[slot];
    if (team === undefined) {
      picks += SENTINEL;
      continue;
    }
    const ch = CHAR_BY_TEAM.get(team);
    if (ch === undefined) {
      throw new Error(`cannot encode unknown team "${team}" at ${slot}`);
    }
    picks += ch;
  }
  picks = picks.replace(/\.+$/, ""); // trailing unpicked slots are implied

  const entrant = bracket.entrant;
  const title = bracket.title ?? "";
  if (entrant.includes(FS) || title.includes(FS)) {
    throw new Error("entrant/title cannot contain the field separator");
  }
  return `2~${b64Encode([entrant, title, picks].join(FS))}`;
}

function decodeV2(payload: string): DecodeResult {
  let raw: string;
  try {
    raw = b64Decode(payload);
  } catch {
    return { ok: false, error: "bad-base64" };
  }

  const parts = raw.split(FS);
  if (parts.length !== 3) {
    return { ok: false, error: "bad-shape" };
  }
  const [entrant, title, p] = parts;

  if (p.length > CANONICAL_SLOTS.length) {
    return { ok: false, error: "bad-shape" };
  }

  const picks: Record<MatchId, TeamCode> = {};
  for (let i = 0; i < p.length; i++) {
    const ch = p[i];
    if (ch === SENTINEL) continue;
    const team = TEAM_BY_CHAR.get(ch);
    if (team === undefined) {
      return { ok: false, error: "bad-shape" };
    }
    picks[CANONICAL_SLOTS[i]] = team;
  }

  return {
    ok: true,
    bracket: { v: CURRENT_BRACKET_V, entrant, title, picks },
  };
}

function decodeV1(payload: string): DecodeResult {
  let json: string;
  try {
    json = b64Decode(payload);
  } catch {
    return { ok: false, error: "bad-base64" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "bad-json" };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "bad-shape" };
  }

  const obj = parsed as Record<string, unknown>;

  if (
    typeof obj["v"] !== "number" ||
    typeof obj["entrant"] !== "string" ||
    typeof obj["title"] !== "string" ||
    obj["picks"] === null ||
    typeof obj["picks"] !== "object" ||
    Array.isArray(obj["picks"])
  ) {
    return { ok: false, error: "bad-shape" };
  }

  const picks = obj["picks"] as Record<string, unknown>;
  for (const [k, v] of Object.entries(picks)) {
    if (typeof k !== "string" || typeof v !== "string") {
      return { ok: false, error: "bad-shape" };
    }
  }

  if (obj["v"] !== CURRENT_BRACKET_V) {
    return { ok: false, error: "unknown-version" };
  }

  // TournamentStructure-validation (picks keys vs tournament structure) is the caller's job.
  return { ok: true, bracket: parsed as UserBracket };
}

export function decodeBracket(code: string): DecodeResult {
  const sep = code.indexOf("~");
  if (sep === -1) return { ok: false, error: "unknown-format" };

  const tag = code.slice(0, sep);
  const payload = code.slice(sep + 1);

  if (tag === "2") return decodeV2(payload);
  if (tag === "1") return decodeV1(payload);
  return { ok: false, error: "unknown-format" };
}
