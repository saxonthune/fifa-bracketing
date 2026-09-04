import type { ResolvedMatch, GridPos } from "../lib/render-model";
import type { MatchId } from "../lib/types";

export const mockMatches: ResolvedMatch[] = [
  // Two resolved teams, undecided
  {
    id: "R32-1",
    meta: { num: 73, venue: "New York / New Jersey", kickoff: "2026-06-28T15:00:00Z" },
    slots: [
      { kind: "team", code: "GER", name: "Germany", flag: "de" },
      { kind: "team", code: "FRA", name: "France", flag: "fr" },
    ],
  },
  // Two resolved teams, decided (ENG wins)
  {
    id: "R32-2",
    meta: { num: 74, venue: "Los Angeles", kickoff: "2026-06-28T18:00:00Z" },
    slots: [
      { kind: "team", code: "ENG", name: "England", flag: "gb-eng" },
      { kind: "team", code: "BRA", name: "Brazil", flag: "br" },
    ],
    winner: "ENG",
  },
  // One team + one pending
  {
    id: "R16-1",
    meta: { num: 85, venue: "Chicago", kickoff: "2026-07-02T15:00:00Z" },
    slots: [
      { kind: "team", code: "GER", name: "Germany", flag: "de" },
      { kind: "pending", label: "Winner of R32-2" },
    ],
  },
  // Two pending
  {
    id: "QF-1",
    meta: { num: 93, venue: "Dallas", kickoff: "2026-07-05T18:00:00Z" },
    slots: [
      { kind: "pending", label: "Winner of R16-1" },
      { kind: "pending", label: "Winner of R16-2" },
    ],
  },
];

export const mockLayout: Map<MatchId, GridPos> = new Map([
  ["R32-1", { side: "left", column: 1, rowStart: 1, rowSpan: 1 }],
  ["R32-2", { side: "left", column: 1, rowStart: 2, rowSpan: 1 }],
  ["R16-1", { side: "left", column: 2, rowStart: 1, rowSpan: 2 }],
  ["QF-1",  { side: "left", column: 3, rowStart: 1, rowSpan: 4 }],
]);
