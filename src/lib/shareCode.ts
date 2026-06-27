import type { Bracket } from "./types";

export const CURRENT_BRACKET_V = 1;

export type DecodeResult =
  | { ok: true; bracket: Bracket }
  | { ok: false; error: string };

function b64Encode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64Decode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const rem = padded.length % 4;
  const repadded = rem ? padded + "=".repeat(4 - rem) : padded;
  return atob(repadded);
}

export function encodeBracket(bracket: Bracket): string {
  return `1~${b64Encode(JSON.stringify(bracket))}`;
}

export function decodeBracket(code: string): DecodeResult {
  const sep = code.indexOf("~");
  if (sep === -1) return { ok: false, error: "unknown-format" };

  const tag = code.slice(0, sep);
  const payload = code.slice(sep + 1);

  if (tag !== "1") return { ok: false, error: "unknown-format" };

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

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
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

  // Structure-validation (picks keys vs tournament structure) is the caller's job.
  return { ok: true, bracket: parsed as Bracket };
}
