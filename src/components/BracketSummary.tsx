interface BracketSummaryProps {
  title: string;
  entrant: string;
  points: number;
}

export function BracketSummary(props: BracketSummaryProps) {
  return (
    <div class="mb-4 rounded-lg border border-gray-300 bg-gray-100 p-3 shadow-sm">
      <h1 class="text-2xl font-['Russo_One']">{props.title}</h1>
      <div class="text-gray-500">by {props.entrant}</div>
      <div class="font-bold text-green-700">{props.points} pts</div>
    </div>
  );
}
