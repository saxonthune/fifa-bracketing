import type { ResolvedMatchMeta } from "../lib/render-model";

const fmt = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

interface MatchMetaProps {
  meta: ResolvedMatchMeta;
}

export function MatchMeta(props: MatchMetaProps) {
  return (
    <div class="text-sm text-gray-400 mb-1 leading-tight">
      {props.meta.venue} · {fmt.format(new Date(props.meta.kickoff))} ({props.meta.num})
    </div>
  );
}
