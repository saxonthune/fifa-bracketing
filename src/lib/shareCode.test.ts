import { describe, expect, it } from "vitest";
import { decodeBracket, encodeBracket } from "./shareCode";
import type { UserBracket } from "./types";

const sample: UserBracket = {
  v: 1,
  entrant: "Alice",
  title: "Alice's Bracket",
  picks: {
    "R32-1": "GER",
    "F-1": "NED",
  },
};

describe("encodeBracket / decodeBracket", () => {
  it("round-trips a bracket", () => {
    const result = decodeBracket(encodeBracket(sample));
    expect(result).toEqual({ ok: true, bracket: sample });
  });

  it("rejects an empty string", () => {
    expect(decodeBracket("")).toMatchObject({ ok: false });
  });

  it("rejects a code with no ~", () => {
    expect(decodeBracket("1abc")).toMatchObject({ ok: false });
  });

  it("rejects an unknown format tag", () => {
    const r = decodeBracket("9~abc");
    expect(r).toMatchObject({ ok: false, error: "unknown-format" });
  });

  it("rejects a non-base64 payload", () => {
    const r = decodeBracket("1~!!!notbase64!!!");
    expect(r).toMatchObject({ ok: false, error: "bad-base64" });
  });

  it("rejects valid base64 of non-JSON", () => {
    const payload = btoa("not json at all").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const r = decodeBracket(`1~${payload}`);
    expect(r).toMatchObject({ ok: false, error: "bad-json" });
  });

  it("rejects JSON where picks is not an object", () => {
    const bad = { v: 1, entrant: "Bob", title: "T", picks: ["GER", "NED"] };
    const payload = btoa(JSON.stringify(bad)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const r = decodeBracket(`1~${payload}`);
    expect(r).toMatchObject({ ok: false, error: "bad-shape" });
  });

  it("rejects JSON where picks values are not strings", () => {
    const bad = { v: 1, entrant: "Bob", title: "T", picks: { "R32-1": 42 } };
    const payload = btoa(JSON.stringify(bad)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const r = decodeBracket(`1~${payload}`);
    expect(r).toMatchObject({ ok: false, error: "bad-shape" });
  });

  it("rejects JSON missing required fields", () => {
    const bad = { v: 1, picks: {} };
    const payload = btoa(JSON.stringify(bad)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const r = decodeBracket(`1~${payload}`);
    expect(r).toMatchObject({ ok: false, error: "bad-shape" });
  });

  it("rejects an unknown bracket version", () => {
    const bad = { v: 99, entrant: "Bob", title: "T", picks: {} };
    const payload = btoa(JSON.stringify(bad)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const r = decodeBracket(`1~${payload}`);
    expect(r).toMatchObject({ ok: false, error: "unknown-version" });
  });

  const b64url = (s: string) =>
    btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  it("emits the compact v2 tag and round-trips a full bracket much shorter than v1", () => {
    const full: UserBracket = {
      v: 1,
      entrant: "Cheeto",
      title: "BIG CHEETO FC 26 BITCHES",
      picks: {
        "R32-1": "RSA", "R32-2": "GER", "R32-3": "MAR", "R32-4": "BRA",
        "R16-1": "SWE", "QF-1": "SWE", "SF-1": "SWE", "F-1": "BRA",
      },
    };
    const code = encodeBracket(full);
    expect(code.startsWith("2~")).toBe(true);
    expect(code.length).toBeLessThan(100); // v1 of this same bracket was ~690
    expect(decodeBracket(code)).toEqual({ ok: true, bracket: full });
  });

  it("round-trips emoji and non-Latin-1 text in entrant/title", () => {
    const unicode: UserBracket = {
      v: 1,
      entrant: "Renée 🏆⚽",
      title: "大力杯 — Düsseldorf",
      picks: { "R32-1": "GER", "F-1": "NED" },
    };
    expect(decodeBracket(encodeBracket(unicode))).toEqual({
      ok: true,
      bracket: unicode,
    });
  });

  it("does not leak entrant/title as plain text in the code", () => {
    const code = encodeBracket({ v: 1, entrant: "SecretName", title: "Secret Title", picks: {} });
    expect(code).not.toContain("SecretName");
    expect(code).not.toContain("Secret");
  });

  it("rejects a v2 payload without the three fields", () => {
    const r = decodeBracket(`2~${b64url("onlyonefield")}`);
    expect(r).toMatchObject({ ok: false, error: "bad-shape" });
  });

  it("rejects a v2 payload with an unknown team char", () => {
    const r = decodeBracket(`2~${b64url(["Bob", "T", "$"].join("\x1f"))}`);
    expect(r).toMatchObject({ ok: false, error: "bad-shape" });
  });

  it("rejects a v2 picks string longer than the slot set", () => {
    const r = decodeBracket(`2~${b64url(["Bob", "T", "A".repeat(40)].join("\x1f"))}`);
    expect(r).toMatchObject({ ok: false, error: "bad-shape" });
  });
});
