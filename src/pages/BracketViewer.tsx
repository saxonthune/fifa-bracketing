import { Show, createSignal } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { resolveBracket } from "../lib/resolve";
import { scoreBracket } from "../lib/scoring";
import { decodeBracket } from "../lib/shareCode";
import { extractShareCode } from "../lib/pinned";
import { BracketDisplay } from "../components/BracketDisplay";
import { BracketSummary } from "../components/BracketSummary";
import { BackButton } from "../components/BackButton";
import type {
  TournamentStructure,
  CurrentStandings,
  TeamRegistry,
  UserBracket,
} from "../lib/types";
import structureData from "../data/structure.json";
import standingsData from "../data/currentStandings.json";
import teamsData from "../data/teams.json";

const structure = structureData as unknown as TournamentStructure;
const standings = standingsData as unknown as CurrentStandings;
const registry = teamsData as unknown as TeamRegistry;

type Loaded =
  | { ok: true; bracket: UserBracket }
  | { ok: false; error: string };

function load(code: string): Loaded {
  const result = decodeBracket(code);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, bracket: result.bracket };
}

function BackToHome() {
  return <BackButton href="/" label="Home" variant="home" />;
}

function BackToLeaderboard() {
  return <BackButton href="/leaderboard" label="Leaderboard" variant="leaderboard" />;
}

/** No code in the URL: prompt for one. Accepts a raw share code or a full
 *  viewer URL (the query param is stripped). Valid input navigates to
 *  /viewer?code=… so the bracket has a shareable address. */
function PasteBox() {
  const [, setParams] = useSearchParams();
  const [input, setInput] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  const submit = (e: Event) => {
    e.preventDefault();
    const code = extractShareCode(input());
    if (code === "") {
      setError("Paste a bracket code or share link.");
      return;
    }
    const result = decodeBracket(code);
    if (!result.ok) {
      setError(`That doesn't look like a valid bracket code (${result.error}).`);
      return;
    }
    setError(null);
    setParams({ code });
  };

  return (
    <main class="flex flex-col">
      <BackToHome />
      <h1 class="text-2xl font-['Russo_One'] mb-2">View a bracket</h1>
      <p class="text-gray-500 mb-4">
        Paste a bracket code or share link to view it.
      </p>
      <form class="flex flex-col gap-3" onSubmit={submit}>
        <input
          type="text"
          class="rounded border border-gray-300 px-3 py-2"
          placeholder="2~… or https://…/viewer?code=…"
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
        />
        <button
          type="submit"
          class="self-start rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={input().trim() === ""}
        >
          View Bracket
        </button>
        <Show when={error()}>
          <p class="text-red-600">{error()}</p>
        </Show>
      </form>
    </main>
  );
}

export function BracketViewer() {
  const [params] = useSearchParams();
  const code = () => (typeof params.code === "string" ? params.code : "");

  return (
    <Show when={code() !== ""} fallback={<PasteBox />}>
      <Show
        when={(() => {
          const l = load(code());
          return l.ok && l.bracket;
        })()}
        keyed
        fallback={
          <main class="flex flex-col">
            <BackToLeaderboard />
            <h1 class="text-2xl font-['Russo_One']">Invalid bracket code</h1>
            <p class="text-gray-500">
              This share link couldn't be read ({(load(code()) as { error: string }).error}).
            </p>
          </main>
        }
      >
        {(bracket) => {
          const matches = resolveBracket(structure, standings, registry, bracket.picks);
          const score = scoreBracket(bracket, standings, structure, registry);
          return (
            <main class="flex flex-col">
              <BackToLeaderboard />
              <BracketSummary
                title={bracket.title ?? "Bracket"}
                entrant={bracket.entrant}
                score={score}
              />
              <BracketDisplay
                matches={matches}
                structure={structure}
                scores={score.matches}
                bonus={score.bonus}
              />
            </main>
          );
        }}
      </Show>
    </Show>
  );
}
