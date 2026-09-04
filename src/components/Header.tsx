import { A } from "@solidjs/router";
import type { JSX } from "solid-js";

export function Header(props: { children?: JSX.Element }) {
  return (
    <>
      <header class="mb-6 pb-3">
        <A href="/" class="block no-underline">
          <span class="flex items-end gap-2 font-['Russo_One'] text-2xl text-gray-900">
            <span>
              FIFA<sup class="align-[0.35em] text-[0.6em]">®</sup> World Cup
              <sup class="align-[0.35em] text-[0.6em]">™</sup> Bracket Challenge
            </span>
            <span aria-hidden="true">👉</span>
            <img src="/wc-logo.png" alt="" class="h-12 w-auto translate-y-px" />
          </span>
          <span class="mt-0.5 mb-0 block pl-2 text-sm font-light italic text-gray-400">
            presented by saxon.zone
          </span>
        </A>
      </header>
      {props.children}
    </>
  );
}
