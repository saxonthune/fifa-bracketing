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
});
