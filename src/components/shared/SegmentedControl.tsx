"use client";

import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  optionClassName,
  ariaLabel
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  optionClassName?: string;
  ariaLabel: string;
}) {
  return (
    <div className={cn("inline-flex rounded-button border border-surface-darkBorder bg-surface-darkElevated/70 p-0.5", className)} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={value === option}
          className={cn(
            "h-7 rounded-[6px] px-2.5 text-xs font-medium text-muted transition hover:text-white",
            value === option && "bg-primary text-white shadow-glow",
            optionClassName
          )}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
