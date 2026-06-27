import type { SlotRef } from "./types";

const POSITION_LABEL: Record<string, string> = {
  "1": "winner",
  "2": "runner-up",
};

function formatGroupList(letters: string[]): string {
  if (letters.length === 1) return `Group ${letters[0]} third place`;
  const body =
    letters.length === 2
      ? `${letters[0]} or ${letters[1]}`
      : `${letters.slice(0, -1).join(", ")} or ${letters[letters.length - 1]}`;
  return `3rd from Groups ${body}`;
}

export function slotLabel(ref: SlotRef): string {
  if (ref.startsWith("W:")) {
    return `Winner of ${ref.slice(2)}`;
  }
  if (ref.startsWith("L:")) {
    return `Loser of ${ref.slice(2)}`;
  }
  if (ref.startsWith("3rd:")) {
    const letters = ref.slice(4).split("");
    return formatGroupList(letters);
  }
  // GroupPositionRef: e.g. "A1", "B2"
  const group = ref[0];
  const pos = ref[1];
  const label = POSITION_LABEL[pos] ?? `position ${pos}`;
  return `Group ${group} ${label}`;
}
