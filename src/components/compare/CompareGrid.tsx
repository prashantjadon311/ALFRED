import { compareResponses } from "@/lib/mock-data";
import { ModelResponsePane } from "./ModelResponsePane";

type CompareResponse = (typeof compareResponses)[number];

export function CompareGrid({
  responses = compareResponses,
  selectedKey,
  onPick,
  onRegenerate
}: {
  responses?: CompareResponse[];
  selectedKey?: string;
  onPick?: (item: CompareResponse) => void;
  onRegenerate?: (item: CompareResponse) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {responses.map((item) => (
        <ModelResponsePane
          key={`${item.provider}-${item.model}`}
          item={item}
          selected={selectedKey === `${item.provider}-${item.model}`}
          onPick={() => onPick?.(item)}
          onRegenerate={() => onRegenerate?.(item)}
        />
      ))}
    </div>
  );
}
