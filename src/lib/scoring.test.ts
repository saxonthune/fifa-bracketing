import { describe, expect, it } from "vitest";
import { ROUND_POINTS, scoreBracket } from "./scoring";
import type { UserBracket, CurrentStandings } from "./types";

const bracket: UserBracket = {
  v: 1,
  entrant: "Alice",
  title: "Alice's Bracket",
  picks: {
    "R32-1": "GER", // correct
    "R32-2": "NED", // wrong (actual BRA)
    "R16-1": "GER", // pending (not yet played)
    "F-1": "GER", // pending
  },
};

const results: CurrentStandings = {
  v: 1,
  resolved: [
    ["R32-1", "GER"],
    ["R32-2", "BRA"],
    // R16-1, F-1 not yet played
  ],
};

describe("scoreBracket", () => {
  it("scores per-match outcome and totals only correct picks", () => {
    const score = scoreBracket(bracket, results);

    expect(score.matches["R32-1"]).toMatchObject({
      outcome: "correct",
      points: ROUND_POINTS.R32,
      actual: "GER",
    });
    expect(score.matches["R32-2"]).toMatchObject({
      outcome: "wrong",
      points: 0,
      actual: "BRA",
    });
    expect(score.matches["R16-1"]).toMatchObject({
      outcome: "pending",
      points: 0,
    });
    expect(score.matches["R16-1"].actual).toBeUndefined();

    expect(score.total).toBe(ROUND_POINTS.R32);
  });

  it("weights later rounds more — a correct final outscores a correct R32", () => {
    const onlyFinal: UserBracket = { ...bracket, picks: { "F-1": "ARG" } };
    const finalWon: CurrentStandings = { v: 1, resolved: [["F-1", "ARG"]] };
    expect(scoreBracket(onlyFinal, finalWon).total).toBe(ROUND_POINTS.F);
    expect(ROUND_POINTS.F).toBeGreaterThan(ROUND_POINTS.R32);
  });

  it("an empty bracket scores zero", () => {
    const empty: UserBracket = { ...bracket, picks: {} };
    const score = scoreBracket(empty, results);
    expect(score.total).toBe(0);
    expect(score.matches).toEqual({});
  });
});
