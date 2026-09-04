import { A } from "@solidjs/router";

const cards = [
  {
    href: "/builder",
    label: "Build a Bracket",
    class: "from-blue-500 to-blue-700",
  },
  {
    href: "/tracker",
    label: "Tournament Standings",
    class: "from-emerald-500 to-emerald-700",
  },
  {
    href: "/leaderboard",
    label: "View Bracket Leaderboard",
    class: "from-amber-400 to-amber-600",
  },
];

export function Home() {
  return (
    <main class="flex flex-col gap-4">
      <div class="rounded-lg border border-gray-300 bg-gray-100 p-4 text-gray-700">
        <div class="font-semibold">Site Archived</div>
        <div class="mt-1">
          The FIFA™ World Cup has ended. This site is now archived; the names of
          bracket authors have been anonymized (besides myself and the AI). Thank you
          for playing.
        </div>
      </div>
      {cards.map((card) => (
        <A
          href={card.href}
          class={`group relative block overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white no-underline shadow-md ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${card.class}`}
        >
          <div class="flex items-center justify-between gap-4">
            <div class="font-['Russo_One'] text-2xl tracking-tight">
              {card.label}
            </div>
            <span
              aria-hidden="true"
              class="text-3xl transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </div>
        </A>
      ))}
      <A href="/viewer" class="mt-2 self-start text-blue-600 underline">
        View a bracket
      </A>
    </main>
  );
}
