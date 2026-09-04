import { describe, it, expect } from "vitest";
import { resolveMatches } from "./resolve";
import { slotLabel } from "./slotLabel";
import type { TournamentStructure, CurrentStandings, TeamRegistry } from "./types";

// Mini fixture: R32-1, R32-2 feed R16-1
const structure: TournamentStructure = {
  v: 1,
  rounds: ["R32", "R16"],
  matches: {
    "R32-1": {
      round: "R32",
      slots: ["A1", "B2"],
      feedsWinner: "R16-1",
      meta: { num: 73, venue: "City A", kickoff: "2026-06-29T16:00:00Z" },
    },
    "R32-2": {
      round: "R32",
      slots: ["C1", "D2"],
      feedsWinner: "R16-1",
      meta: { num: 74, venue: "City B", kickoff: "2026-06-29T20:00:00Z" },
    },
    "R16-1": {
      round: "R16",
      slots: ["W:R32-1", "W:R32-2"],
      meta: { num: 85, venue: "City C", kickoff: "2026-07-05T16:00:00Z" },
    },
  },
};

const registry: TeamRegistry = {
  v: 1,
  teams: {
    GER: { name: "Germany", flag: "de", group: "A" },
    NED: { name: "Netherlands", flag: "nl", group: "B" },
    FRA: { name: "France", flag: "fr", group: "C" },
    POR: { name: "Portugal", flag: "pt", group: "D" },
  },
};

describe("resolveMatches", () => {
  it("resolves entry slots to team when standings has the ref", () => {
    const standings: CurrentStandings = {
      v: 1,
      resolved: [
        ["A1", "GER"],
        ["B2", "NED"],
      ],
    };
    const matches = resolveMatches(structure, standings, registry);
    const r32_1 = matches.find((m) => m.id === "R32-1")!;
    expect(r32_1.slots[0]).toEqual({ kind: "team", code: "GER", name: "Germany", flag: "de" });
    expect(r32_1.slots[1]).toEqual({ kind: "team", code: "NED", name: "Netherlands", flag: "nl" });
  });

  it("leaves unresolved W: slot as pending with correct label", () => {
    const standings: CurrentStandings = { v: 1, resolved: [] };
    const matches = resolveMatches(structure, standings, registry);
    const r16 = matches.find((m) => m.id === "R16-1")!;
    expect(r16.slots[0]).toEqual({ kind: "pending", label: "Winner of R32-1" });
    expect(r16.slots[1]).toEqual({ kind: "pending", label: "Winner of R32-2" });
  });

  it("sets winner on a decided match", () => {
    const standings: CurrentStandings = {
      v: 1,
      resolved: [
        ["A1", "GER"],
        ["B2", "NED"],
        ["R32-1", "GER"],
      ],
    };
    const matches = resolveMatches(structure, standings, registry);
    const r32_1 = matches.find((m) => m.id === "R32-1")!;
    expect(r32_1.winner).toBe("GER");
  });

  it("resolves L: ref to the non-winner participant when match is decided", () => {
    // Add a loser slot to R16-1 for test purposes — build a one-off structure
    const structureWithLoser: TournamentStructure = {
      v: 1,
      rounds: ["R32", "R16"],
      matches: {
        "R32-1": {
          round: "R32",
          slots: ["A1", "B2"],
          feedsWinner: "R16-1",
          feedsLoser: "TP-1",
          meta: { num: 73, venue: "City A", kickoff: "2026-06-29T16:00:00Z" },
        },
        "R32-2": {
          round: "R32",
          slots: ["C1", "D2"],
          feedsWinner: "R16-1",
          meta: { num: 74, venue: "City B", kickoff: "2026-06-29T20:00:00Z" },
        },
        "R16-1": {
          round: "R16",
          slots: ["W:R32-1", "W:R32-2"],
          meta: { num: 85, venue: "City C", kickoff: "2026-07-05T16:00:00Z" },
        },
        "TP-1": {
          round: "TP",
          slots: ["L:R32-1", "C1"],
          meta: { num: 99, venue: "City D", kickoff: "2026-07-18T15:00:00Z" },
        },
      },
    };
    const standings: CurrentStandings = {
      v: 1,
      resolved: [
        ["A1", "GER"],
        ["B2", "NED"],
        ["C1", "FRA"],
        ["R32-1", "GER"], // GER wins, NED loses
      ],
    };
    const matches = resolveMatches(structureWithLoser, standings, registry);
    const tp = matches.find((m) => m.id === "TP-1")!;
    // L:R32-1 should resolve to NED (the loser)
    expect(tp.slots[0]).toEqual({ kind: "team", code: "NED", name: "Netherlands", flag: "nl" });
  });
});

describe("slotLabel", () => {
  it("A1 → Group A winner", () => {
    expect(slotLabel("A1")).toBe("Group A winner");
  });

  it("B2 → Group B runner-up", () => {
    expect(slotLabel("B2")).toBe("Group B runner-up");
  });

  it("3rd:CE → 3rd from Groups C or E", () => {
    expect(slotLabel("3rd:CE")).toBe("3rd from Groups C or E");
  });

  it("3rd:IJK → 3rd from Groups I, J or K", () => {
    expect(slotLabel("3rd:IJK")).toBe("3rd from Groups I, J or K");
  });

  it("3rd:D → Group D third place (single letter)", () => {
    expect(slotLabel("3rd:D")).toBe("Group D third place");
  });

  it("W:QF-1 → Winner of QF-1", () => {
    expect(slotLabel("W:QF-1")).toBe("Winner of QF-1");
  });
});
