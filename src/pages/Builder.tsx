import { createSignal, Show } from "solid-js";
import { resolveBracket } from "../lib/resolve";
import { prunePicks } from "../lib/builder";
import { encodeBracket, CURRENT_BRACKET_V } from "../lib/shareCode";
import { BracketDisplay } from "../components/BracketDisplay";
import { BackButton } from "../components/BackButton";
import type {
  TournamentStructure,
  CurrentStandings,
  TeamRegistry,
  Picks,
  MatchId,
  TeamCode,
  UserBracket,
} from "../lib/types";
import structureData from "../data/structure.json";
import standingsData from "../data/currentStandings.json";
import teamsData from "../data/teams.json";

const structure = structureData as unknown as TournamentStructure;
// resolveBracket reads only the entry slots from standings (group results); any
// knockout results in the file are ignored, so the Builder always starts empty.
const standings = standingsData as unknown as CurrentStandings;
const registry = teamsData as unknown as TeamRegistry;
const TOTAL_MATCHES = Object.keys(structure.matches).length;

const TITLE_MAX = 64;
const NAME_MAX = 32;

// Control chars (incl. the \x1f field separator encodeBracket forbids) can't be
// typed but can arrive via paste. Strip on input and write the cleaned value
// back to the DOM directly: if it matches the current signal, Solid won't
// re-render the input, so the stray char would otherwise linger on screen.
const stripControlChars = (
  e: InputEvent & { currentTarget: HTMLInputElement },
  set: (v: string) => void,
) => {
  const cleaned = e.currentTarget.value.replace(/[\x00-\x1f]/g, "");
  e.currentTarget.value = cleaned;
  set(cleaned);
};

export function Builder() {
  const [picks, setPicks] = createSignal<Picks>({});
  const matches = () => resolveBracket(structure, standings, registry, picks());
  const isComplete = () => Object.keys(picks()).length === TOTAL_MATCHES;

  const [modalOpen, setModalOpen] = createSignal(false);
  const [name, setName] = createSignal("");
  const [title, setTitle] = createSignal("");
  const [url, setUrl] = createSignal("");
  const [copied, setCopied] = createSignal(false);
  let urlInput: HTMLInputElement | undefined;

  const canGenerate = () => name().trim() !== "" && title().trim() !== "";

  const handlePick = (matchId: MatchId, team: TeamCode) => {
    if (picks()[matchId] === team) return; // re-tapping the current winner: no-op
    setPicks(
      prunePicks(structure, standings, registry, {
        ...picks(),
        [matchId]: team,
      }),
    );
  };

  const openModal = () => {
    setUrl("");
    setCopied(false);
    setModalOpen(true);
  };

  const generate = () => {
    const bracket: UserBracket = {
      v: CURRENT_BRACKET_V,
      entrant: name().trim(),
      title: title().trim(),
      picks: picks(),
    };
    const code = encodeBracket(bracket);
    setUrl(`${window.location.origin}/viewer?code=${encodeURIComponent(code)}`);
    setCopied(false);
  };

  const flashCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // iOS Safari won't let execCommand("copy") select a readOnly/disabled input,
  // and input.select() alone doesn't register a selection there — flip the flags
  // off and select via a Range, then restore. https://stackoverflow.com/a/34046084
  const legacyCopy = () => {
    const input = urlInput;
    if (!input) return false;
    const wasReadOnly = input.readOnly;
    input.readOnly = false;
    input.contentEditable = "true";
    const range = document.createRange();
    range.selectNodeContents(input);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    input.setSelectionRange(0, url().length);
    const ok = document.execCommand("copy");
    selection?.removeAllRanges();
    input.readOnly = wasReadOnly;
    input.contentEditable = "false";
    return ok;
  };

  const copy = () => {
    // ClipboardItem keeps the write call synchronous inside the user gesture,
    // which Safari requires; writeText alone is rejected in some Safari builds.
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      const item = new ClipboardItem({
        "text/plain": new Blob([url()], { type: "text/plain" }),
      });
      navigator.clipboard.write([item]).then(flashCopied, () => {
        if (legacyCopy()) flashCopied();
      });
      return;
    }
    if (legacyCopy()) flashCopied();
  };

  return (
    <main class="flex flex-col">
      <BackButton href="/" label="Home" variant="home" />
      <i class="mb-4 text-justify">
        Instructions: tap a country to advance it to the next round. Pick every
        single game to generate a bracket. Don't forget 3rd place! Send me your
        code and I'll add it to the <a href="/leaderboard">leaderboard</a>.
      </i>
      <BracketDisplay
        matches={matches()}
        structure={structure}
        onPick={handlePick}
      />

      <div class="mt-6 flex justify-center">
        <button
          class="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={!isComplete()}
          onClick={openModal}
        >
          Generate Bracket Code
        </button>
      </div>

      <Show when={modalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            class="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 class="mb-4 text-lg font-bold">Generate Bracket Code</h2>

            <label class="mb-1 block text-sm font-medium">Your Name</label>
            <input
              class="mb-4 w-full rounded border border-gray-300 px-3 py-2"
              maxLength={NAME_MAX}
              value={name()}
              onInput={(e) => stripControlChars(e, setName)}
            />

            <label class="mb-1 block text-sm font-medium">Bracket Title</label>
            <input
              class="mb-4 w-full rounded border border-gray-300 px-3 py-2"
              maxLength={TITLE_MAX}
              value={title()}
              onInput={(e) => stripControlChars(e, setTitle)}
            />

            <button
              class="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={!canGenerate()}
              onClick={generate}
            >
              Generate
            </button>

            <Show when={url() !== ""}>
              <div class="mt-4 flex items-stretch gap-2">
                <input
                  ref={urlInput}
                  class="min-w-0 flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                  readOnly
                  value={url()}
                  onClick={(e) => e.currentTarget.select()}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  class="shrink-0 rounded bg-gray-200 px-3 py-2 text-sm font-medium"
                  onClick={copy}
                >
                  {copied() ? "Copied" : "Copy"}
                </button>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </main>
  );
}
