import { cn, statusTone } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(status), className)}>
      {status}
    </span>
  );
}
