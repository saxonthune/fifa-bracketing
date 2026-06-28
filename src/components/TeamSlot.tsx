import { Show } from "solid-js";
import type { ResolvedSlot } from "../lib/render-model";

interface TeamSlotProps {
  slot: ResolvedSlot;
  isWinner: boolean;
  isLoser: boolean;
  /** Points earned for this pick, shown as a bold "+N"; absent unless the
   *  pick actually won (Viewer scoring). */
  points?: number;
  onPick?: () => void;
}

export function TeamSlot(props: TeamSlotProps) {
  const content = () => {
    const slot = props.slot;
    if (slot.kind === "team") {
      const stateClass = props.isWinner
        ? "rounded bg-green-50 px-1 font-bold text-green-700 ring-1 ring-green-600/20"
        : props.isLoser
        ? "opacity-40"
        : "";
      return (
        <span class={`flex items-center gap-2 min-w-0 ${stateClass}`}>
          <img
            src={`/flags/${slot.flag}.svg`}
            alt={slot.name}
            class="w-6 h-4 shrink-0 object-cover ring-1 ring-black/10"
          />
          <span class="min-w-0 truncate">{slot.short ?? slot.name}</span>
          <Show when={props.points != null}>
            <span class="ml-auto shrink-0 rounded-full bg-green-100 px-1.5 text-sm font-bold text-green-700">
              +{props.points}
            </span>
          </Show>
        </span>
      );
    }
    return <span class="text-gray-400 italic text-base">{slot.label}</span>;
  };

  return (
    <Show
      when={props.onPick}
      fallback={<div class="px-2 py-1">{content()}</div>}
    >
      <button
        type="button"
        class="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
        onClick={() => props.onPick?.()}
      >
        {content()}
      </button>
    </Show>
  );
}
