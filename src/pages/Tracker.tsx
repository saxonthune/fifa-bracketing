import { resolveMatches } from "../lib/resolve";
import { BracketDisplay } from "../components/BracketDisplay";
import { BackButton } from "../components/BackButton";
import type {
  TournamentStructure,
  CurrentStandings,
  TeamRegistry,
} from "../lib/types";
import structureData from "../data/structure.json";
import standingsData from "../data/currentStandings.json";
import teamsData from "../data/teams.json";

const structure = structureData as unknown as TournamentStructure;
const standings = standingsData as unknown as CurrentStandings;
const registry = teamsData as unknown as TeamRegistry;

export function Tracker() {
  const matches = resolveMatches(structure, standings, registry);

  return (
    <main class="flex flex-col">
      <BackButton href="/" label="Home" variant="home" />
      <h1 class="text-2xl font-['Russo_One'] mb-4">Live Standings</h1>
      <BracketDisplay matches={matches} structure={structure} />
    </main>
  );
}
