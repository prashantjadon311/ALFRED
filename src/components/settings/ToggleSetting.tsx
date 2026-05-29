"use client";

export function ToggleSetting({
  label,
  description,
  enabled = true,
  onChange
}: {
  label: string;
  description?: string;
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-4">
      <div>
        <p className="font-medium text-white">{label}</p>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        aria-label={`Toggle ${label}`}
        className={`h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-success" : "bg-surface-darkBorder"}`}
        onClick={() => onChange?.(!enabled)}
      >
        <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
