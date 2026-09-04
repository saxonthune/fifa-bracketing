import { decodeBracket } from "./shareCode";
import type { UserBracket } from "./types";

/** One entry of the R2 pinned list, decoded. A malformed entry is kept as an
 *  { ok:false } row rather than dropped, so the page can report it instead of
 *  silently shrinking the leaderboard. */
export type PinnedEntry =
  | { ok: true; code: string; bracket: UserBracket }
  | { ok: false; code: string; error: string };

/** Reduce one pinned-list string to its bare share code. Entries may be a raw
 *  code ("2~…") or a full viewer URL someone pasted
 *  ("https://host/viewer?code=2~…&x=1") — we keep only the code. Safe because a
 *  share code's own chars are base64url (`A-Za-z0-9-_`) plus the "~" separator,
 *  so it never contains "code=", "&", or "#" to confuse the split. */
export function extractShareCode(entry: string): string {
  const trimmed = entry.trim();
  const at = trimmed.indexOf("code=");
  const raw = at === -1 ? trimmed : trimmed.slice(at + "code=".length).split(/[&#]/)[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw; // a stray "%" that isn't valid escaping — take the code verbatim
  }
}

/** Parse the fetched R2 payload (expected: an array of code/URL strings) into
 *  decoded brackets. Tolerant of junk: a non-array yields [], and non-string or
 *  empty entries are skipped. */
export function parsePinnedList(input: unknown): PinnedEntry[] {
  if (!Array.isArray(input)) return [];
  const out: PinnedEntry[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const code = extractShareCode(raw);
    if (code === "") continue;
    const decoded = decodeBracket(code);
    out.push(
      decoded.ok
        ? { ok: true, code, bracket: decoded.bracket }
        : { ok: false, code, error: decoded.error },
    );
  }
  return out;
}
