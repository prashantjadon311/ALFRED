"use client";

export function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-4">
      <div className="mb-3 flex justify-between text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <input className="w-full accent-primary" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
