"use client";

const suggestions = ["Lock requirement", "Compare models", "Run Claude critique", "Generate Codex prompt"];

export function SuggestionChips({ onSelect }: { onSelect?: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          className="rounded-full border border-surface-darkBorder bg-surface-darkElevated/70 px-3 py-1.5 text-xs text-slate-300 transition hover:border-primary/40 hover:text-white"
          onClick={() => onSelect?.(`/${suggestion.toLowerCase().replaceAll(" ", "-")} `)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
