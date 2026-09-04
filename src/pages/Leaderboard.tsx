import { createResource, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { parsePinnedList } from "../lib/pinned";
import { scoreBracket } from "../lib/scoring";
import { BackButton } from "../components/BackButton";
import type {
  CurrentStandings,
  TournamentStructure,
  TeamRegistry,
} from "../lib/types";
import standingsData from "../data/currentStandings.json";
import structureData from "../data/structure.json";
import teamsData from "../data/teams.json";

const standings = standingsData as unknown as CurrentStandings;
const structure = structureData as unknown as TournamentStructure;
const registry = teamsData as unknown as TeamRegistry;

// Unset → the bundled /pinned.json; set to the R2 URL in prod (see .env.example).
const PINNED_URL = import.meta.env.VITE_PINNED_URL ?? "/pinned.json";

interface Row {
  code: string;
  entrant: string;
  title: string;
  total: number;
}

async function fetchLeaderboard(): Promise<Row[]> {
  const res = await fetch(PINNED_URL);
  if (!res.ok) throw new Error(`couldn't load pinned brackets (${res.status})`);
  const entries = parsePinnedList(await res.json());
  return entries
    .filter((e) => e.ok)
    .map((e) => ({
      code: e.code,
      entrant: e.bracket.entrant,
      title: e.bracket.title ?? "",
      total: scoreBracket(e.bracket, standings, structure, registry).total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function Leaderboard() {
  const [rows] = createResource(fetchLeaderboard);
  const navigate = useNavigate();
  const open = (code: string) =>
    navigate(`/viewer?code=${encodeURIComponent(code)}`);

  return (
    <main class="flex flex-col">
      <BackButton href="/" label="Home" variant="home" />
      <h1 class="text-2xl font-['Russo_One'] mb-4">Bracket Leaderboard</h1>
      <i class="mb-4 text-justify">
        To submit a bracket, generate a bracket code on the{" "}
        <a href="/builder" class="text-blue-600 underline">
          builder page
        </a>
        , and send the code to me.
      </i>
      <i class="mb-4 text-justify">
        Scoring: one point earned for every correct ro32 pick; points double
        every round; one bonus point if you correctly guess USA final position.
      </i>

      <Show when={rows.error}>
        <p class="text-red-600">{String(rows.error)}</p>
      </Show>

      <Show when={rows()} fallback={<p class="text-gray-500">Loading…</p>}>
        <Show
          when={rows()!.length > 0}
          fallback={<p class="text-gray-500">No pinned brackets yet.</p>}
        >
          <table class="w-full table-fixed border-collapse text-left">
            <thead>
              <tr class="border-b border-gray-200 text-sm text-gray-500">
                <th class="w-8 py-2 pr-3 font-medium">#</th>
                <th class="w-2/5 py-2 pr-3 font-medium">Entrant</th>
                <th class="py-2 pr-3 font-medium">Bracket</th>
                <th class="w-12 py-2 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              <For each={rows()}>
                {(row, i) => (
                  <tr
                    class="h-14 cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                    role="link"
                    tabindex={0}
                    onClick={() => open(row.code)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        open(row.code);
                      }
                    }}
                  >
                    <td class="pr-3 tabular-nums text-gray-400">{i() + 1}</td>
                    <td class="truncate pr-3 font-medium text-blue-600">
                      {row.entrant}
                    </td>
                    <td class="truncate pr-3 text-gray-600" title={row.title}>
                      {row.title}
                    </td>
                    <td class="text-right font-semibold tabular-nums">
                      {row.total}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </Show>
    </main>
  );
}
