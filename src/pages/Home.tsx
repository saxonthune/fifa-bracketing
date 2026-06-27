import { A } from "@solidjs/router";

export function Home() {
  return (
    <main>
      <h1 class="text-2xl font-bold mb-6">FIFA Bracketing</h1>
      <nav class="flex flex-col gap-3">
        <A href="/builder" class="text-blue-600 underline">Builder</A>
        <A href="/tracker" class="text-blue-600 underline">Tracker</A>
        <A href="/viewer" class="text-blue-600 underline">Bracket Viewer</A>
        <A href="/pinned" class="text-blue-600 underline">Pinned Brackets</A>
      </nav>
    </main>
  );
}
