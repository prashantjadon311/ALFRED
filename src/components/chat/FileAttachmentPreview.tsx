import { FileText, X } from "lucide-react";

export function FileAttachmentPreview({ name = "requirements.md" }: { name?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-card border border-surface-darkBorder bg-surface-darkElevated px-3 py-2 text-xs text-slate-300">
      <FileText className="h-4 w-4 text-primary-soft" />
      <span>{name}</span>
      <button aria-label="Remove attachment" className="text-muted transition hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
