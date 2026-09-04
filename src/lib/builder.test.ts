import { describe, expect, it } from "vitest";
import { prunePicks, illegalPicks, randomizePicks } from "./builder";
import { parsePinnedList } from "./pinned";
import type {
  TournamentStructure,
  CurrentStandings,
  TeamRegistry,
  Picks,
} from "./types";
import structureData from "../data/structure.json";
import standingsData from "../data/currentStandings.json";
import teamsData from "../data/teams.json";
import pinnedData from "../../public/pinned.json";

const structure = structureData as unknown as TournamentStructure;

// Only the entry slots feeding R32-1 (A2/B2) and R32-3 (F1/C2) are resolved;
// every other R32 slot stays pending, which is irrelevant to these cases.
const standings: CurrentStandings = {
  v: 1,
  resolved: [
    ["A2", "RSA"],
    ["B2", "CAN"],
    ["F1", "NED"],
    ["C2", "MAR"],
  ],
};

// prunePicks reads names/flags only for present-team checks via resolveBracket,
// which tolerates an unknown code (renders pending) — but supplying them keeps
// the slots resolved as teams so the presence check is exercised for real.
const registry: TeamRegistry = {
  v: 1,
  teams: {
    RSA: { name: "South Africa", flag: "za", group: "A" },
    CAN: { name: "Canada", flag: "ca", group: "B" },
    NED: { name: "Netherlands", flag: "nl", group: "F" },
    MAR: { name: "Morocco", flag: "ma", group: "C" },
  },
};

describe("prunePicks", () => {
  it("keeps a legal pick chain untouched", () => {
    const picks: Picks = { "R32-1": "CAN", "R16-2": "CAN" }; // CAN wins R32-1, advances, wins R16-2
    expect(prunePicks(structure, standings, registry, picks)).toEqual(picks);
  });

  it("drops a pick stranded by an upstream change", () => {
    // Flip R32-1 to RSA; CAN no longer reaches R16-2, so the R16-2 pick is invalid.
    const picks: Picks = { "R32-1": "RSA", "R16-2": "CAN" };
    expect(prunePicks(structure, standings, registry, picks)).toEqual({ "R32-1": "RSA" });
  });

  it("cascades through multiple rounds", () => {
    // CAN carried R32-1 → R16-2 → QF-1. Flipping R32-1 strands both upper picks.
    const picks: Picks = { "R32-1": "RSA", "R16-2": "CAN", "QF-1": "CAN" };
    expect(prunePicks(structure, standings, registry, picks)).toEqual({ "R32-1": "RSA" });
  });
});

describe("illegalPicks", () => {
  it("reports nothing for a legal pick chain", () => {
    const picks: Picks = { "R32-1": "CAN", "R16-2": "CAN" };
    expect(illegalPicks(structure, standings, registry, picks)).toEqual([]);
  });

  it("flags a pick whose team never entered the match", () => {
    // GER is not an entrant of R32-1 (slots resolve to RSA/CAN).
    expect(illegalPicks(structure, standings, registry, { "R32-1": "GER" })).toEqual(["R32-1"]);
  });

  it("flags a downstream pick stranded by its upstream", () => {
    const picks: Picks = { "R32-1": "RSA", "R16-2": "CAN" };
    expect(illegalPicks(structure, standings, registry, picks)).toEqual(["R16-2"]);
  });
});

describe("randomizePicks", () => {
  it("fills every match with a legal pick", () => {
    const realStandings = standingsData as unknown as CurrentStandings;
    const realRegistry = teamsData as unknown as TeamRegistry;
    const picks = randomizePicks(structure, realStandings, realRegistry, () => 0);

    expect(Object.keys(picks)).toHaveLength(Object.keys(structure.matches).length);
    expect(illegalPicks(structure, realStandings, realRegistry, picks)).toEqual([]);
  });

  it("can choose either side of each match", () => {
    const realStandings = standingsData as unknown as CurrentStandings;
    const realRegistry = teamsData as unknown as TeamRegistry;
    const first = randomizePicks(structure, realStandings, realRegistry, () => 0);
    const second = randomizePicks(structure, realStandings, realRegistry, () => 0.99);

    expect(first["R32-1"]).not.toBe(second["R32-1"]);
  });
});

// Guard: a sloppy or stale pinned bracket must never ship. Every share code in
// public/pinned.json has to agree with the real group-stage standings — each
// pick a team that actually reached that match.
describe("pinned brackets agree with the standings", () => {
  const realStandings = standingsData as unknown as CurrentStandings;
  const realRegistry = teamsData as unknown as TeamRegistry;
  const entries = parsePinnedList(pinnedData);

  it("decodes every pinned entry", () => {
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.ok)).toBe(true);
  });

  for (const entry of entries) {
    if (!entry.ok) continue;
    it(`"${entry.bracket.title ?? entry.bracket.entrant}" has no illegal picks`, () => {
      expect(illegalPicks(structure, realStandings, realRegistry, entry.bracket.picks)).toEqual([]);
    });
  }
});
