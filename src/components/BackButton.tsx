import { A } from "@solidjs/router";

const variants = {
  home: "bg-purple-600 hover:bg-purple-700",
  leaderboard: "bg-amber-500 hover:bg-amber-600",
} as const;

export function BackButton(props: {
  href: string;
  label: string;
  variant: keyof typeof variants;
}) {
  return (
    <A
      href={props.href}
      class={`mb-4 inline-flex w-fit items-center gap-1 self-start rounded-xl px-3 py-1.5 text-sm font-bold text-white no-underline transition-colors ${variants[props.variant]}`}
    >
      ← {props.label}
    </A>
  );
}
