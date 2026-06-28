import { describe, expect, it } from "vitest";
import { extractShareCode, parsePinnedList } from "./pinned";

const CODE = "2~WW8fTmljZR9CS1FHWVpBYU5DaWNWWGVPWUJHQWlDT2VCQ0dPQk9HQg";

describe("extractShareCode", () => {
  it("returns a bare code unchanged", () => {
    expect(extractShareCode(CODE)).toBe(CODE);
  });

  it("strips a full viewer URL down to the code", () => {
    expect(extractShareCode(`http://localhost:5173/viewer?code=${CODE}`)).toBe(CODE);
  });

  it("ignores trailing query params after the code", () => {
    expect(extractShareCode(`https://x.app/viewer?code=${CODE}&ref=tweet`)).toBe(CODE);
  });

  it("trims surrounding whitespace", () => {
    expect(extractShareCode(`  ${CODE}  `)).toBe(CODE);
  });

  it("decodes a percent-encoded ~ in the URL", () => {
    expect(extractShareCode(`https://x.app/viewer?code=2%7Eabc`)).toBe("2~abc");
  });
});

describe("parsePinnedList", () => {
  it("returns [] for a non-array", () => {
    expect(parsePinnedList({ nope: true })).toEqual([]);
  });

  it("skips non-string and empty entries", () => {
    expect(parsePinnedList([1, "", null, "   "])).toEqual([]);
  });

  it("decodes a mix of raw codes and URLs", () => {
    const list = parsePinnedList([CODE, `http://localhost:5173/viewer?code=${CODE}`]);
    expect(list).toHaveLength(2);
    expect(list.every((e) => e.ok)).toBe(true);
  });

  it("keeps an undecodable entry as an error row", () => {
    const [row] = parsePinnedList(["9~garbage"]);
    expect(row.ok).toBe(false);
  });
});
