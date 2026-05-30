"use client";

export function AiPageLoader({ visible }: { visible: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[110] h-1 overflow-hidden bg-primary/10 transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}
      aria-live="polite"
      aria-label="Loading route"
    >
      <div className="h-full w-[46%] animate-[route-progress_900ms_ease-in-out_infinite] rounded-r-full bg-gradient-to-r from-primary via-success to-warning shadow-glow" />
    </div>
  );
}
