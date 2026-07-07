import { describe, expect, it } from "vitest";
import { ROUND_POINTS, BONUS_POINTS, scoreBracket } from "./scoring";
import type {
  UserBracket,
  CurrentStandings,
  TournamentStructure,
  TeamRegistry,
  Picks,
} from "./types";
import structureData from "../data/structure.json";
import teamsData from "../data/teams.json";

const structure = structureData as unknown as TournamentStructure;
const registry = teamsData as unknown as TeamRegistry;

const bracketWith = (picks: Picks): UserBracket => ({
  v: 1,
  entrant: "Alice",
  title: "Alice's Bracket",
  picks,
});

const bracket = bracketWith({
  "R32-1": "GER", // correct
  "R32-2": "NED", // wrong (actual BRA)
  "R16-1": "GER", // pending (not yet played)
  "F-1": "GER", // pending
});

const results: CurrentStandings = {
  v: 1,
  resolved: [
    ["R32-1", "GER"],
    ["R32-2", "BRA"],
    // R16-1, F-1 not yet played
  ],
};

const score = (b: UserBracket, r: CurrentStandings) =>
  scoreBracket(b, r, structure, registry);

describe("scoreBracket", () => {
  it("scores per-match outcome and totals only correct picks", () => {
    const s = score(bracket, results);

    expect(s.matches["R32-1"]).toMatchObject({
      outcome: "correct",
      points: ROUND_POINTS.R32,
      actual: "GER",
    });
    expect(s.matches["R32-2"]).toMatchObject({
      outcome: "wrong",
      points: 0,
      actual: "BRA",
    });
    expect(s.matches["R16-1"]).toMatchObject({ outcome: "pending", points: 0 });
    expect(s.matches["R16-1"].actual).toBeUndefined();

    expect(s.total).toBe(ROUND_POINTS.R32);
  });

  it("weights later rounds more — a correct final outscores a correct R32", () => {
    const onlyFinal = bracketWith({ "F-1": "ARG" });
    const finalWon: CurrentStandings = { v: 1, resolved: [["F-1", "ARG"]] };
    expect(score(onlyFinal, finalWon).total).toBe(ROUND_POINTS.F);
    expect(ROUND_POINTS.F).toBeGreaterThan(ROUND_POINTS.R32);
  });

  it("an empty bracket scores zero", () => {
    const empty = bracketWith({});
    const s = score(empty, results);
    expect(s.total).toBe(0);
    expect(s.matches).toEqual({});
  });
});

// A semifinal spine: USA into SF-1 (via QF-1), GER into SF-2 (via QF-3). Reused
// for both the prediction (bracket picks) and reality (standings.resolved).
const usaSemiPicks: Picks = {
  "QF-1": "USA",
  "QF-3": "GER",
  "SF-1": "USA",
  "SF-2": "GER",
};

describe("USA host-nation bonus", () => {
  it("awards the bonus when the predicted finish matches reality (champion)", () => {
    const b = bracketWith({ ...usaSemiPicks, "F-1": "USA" }); // predicts champion
    const r: CurrentStandings = {
      v: 1,
      resolved: [
        ["QF-1", "USA"],
        ["QF-3", "GER"],
        ["SF-1", "USA"],
        ["SF-2", "GER"],
        ["F-1", "USA"], // USA really wins it
      ],
    };
    expect(score(b, r).bonus).toMatchObject({
      predicted: "champion",
      actual: "champion",
      outcome: "correct",
      points: BONUS_POINTS,
    });
  });

  it("denies the bonus when USA finishes in a different place", () => {
    const b = bracketWith({ ...usaSemiPicks, "F-1": "USA" }); // predicts champion
    const r: CurrentStandings = {
      v: 1,
      resolved: [
        ["QF-1", "USA"],
        ["QF-3", "GER"],
        ["SF-1", "USA"],
        ["SF-2", "GER"],
        ["F-1", "GER"], // USA is actually runner-up
      ],
    };
    expect(score(b, r).bonus).toMatchObject({
      predicted: "champion",
      actual: "runner-up",
      outcome: "wrong",
      points: 0,
    });
  });

  it("awards the bonus for correctly calling an early exit (Round of 16)", () => {
    // USA enters R32-9 at D1, wins it, then loses R16-6.
    const entry: CurrentStandings["resolved"] = [["D1", "USA"]];
    const b = bracketWith({ "R32-9": "USA", "R16-6": "GER" }); // USA out in R16
    const r: CurrentStandings = {
      v: 1,
      resolved: [...entry, ["R32-9", "USA"], ["R16-6", "GER"]],
    };
    expect(score(b, r).bonus).toMatchObject({
      predicted: "ro16",
      actual: "ro16",
      outcome: "correct",
      points: BONUS_POINTS,
    });
  });

  it("awards the bonus for correctly calling a Round of 32 exit", () => {
    const entry: CurrentStandings["resolved"] = [["D1", "USA"]];
    const b = bracketWith({ "R32-9": "GER" }); // USA loses its opener
    const r: CurrentStandings = { v: 1, resolved: [...entry, ["R32-9", "GER"]] };
    expect(score(b, r).bonus).toMatchObject({
      predicted: "ro32",
      actual: "ro32",
      outcome: "correct",
      points: BONUS_POINTS,
    });
  });

  it("stays pending until USA's run ends", () => {
    const b = bracketWith({ ...usaSemiPicks, "F-1": "USA" });
    const r: CurrentStandings = {
      v: 1,
      resolved: [
        ["D1", "USA"],
        ["R32-9", "USA"], // USA still advancing, not yet knocked out
      ],
    };
    const s = score(b, r);
    expect(s.bonus.outcome).toBe("pending");
    expect(s.bonus.points).toBe(0);
  });

  it("adds the bonus point into the total", () => {
    const b = bracketWith({ ...usaSemiPicks, "F-1": "USA" });
    const r: CurrentStandings = {
      v: 1,
      resolved: [
        ["QF-1", "USA"],
        ["QF-3", "GER"],
        ["SF-1", "USA"],
        ["SF-2", "GER"],
        ["F-1", "USA"],
      ],
    };
    const s = score(b, r);
    const matchPoints = ROUND_POINTS.QF * 2 + ROUND_POINTS.SF * 2 + ROUND_POINTS.F;
    expect(s.total).toBe(matchPoints + BONUS_POINTS);
  });
});
