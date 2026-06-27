import { Show } from "solid-js";
import type { ResolvedSlot } from "../lib/render-model";

interface TeamSlotProps {
  slot: ResolvedSlot;
  isWinner: boolean;
  isLoser: boolean;
  onPick?: () => void;
}

export function TeamSlot(props: TeamSlotProps) {
  const content = () => {
    const slot = props.slot;
    if (slot.kind === "team") {
      return (
        <span
          class={
            props.isWinner
              ? "flex items-center gap-2 font-bold text-green-700"
              : props.isLoser
              ? "flex items-center gap-2 opacity-40"
              : "flex items-center gap-2"
          }
        >
          <img
            src={`/flags/${slot.flag}.svg`}
            alt={slot.name}
            class="w-6 h-4 object-cover"
          />
          <span>{slot.name}</span>
        </span>
      );
    }
    return <span class="text-gray-400 italic text-sm">{slot.label}</span>;
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
