const shortcuts = [
  ["Cmd/Ctrl + K", "Open command palette"],
  ["Cmd/Ctrl + N", "New chat"],
  ["Cmd/Ctrl + /", "Prompt library"],
  ["Cmd/Ctrl + Enter", "Send message"],
  ["Esc", "Close drawer or modal"]
];

export function KeyboardShortcutsPanel() {
  return (
    <div className="space-y-2">
      {shortcuts.map(([key, action]) => (
        <div key={key} className="flex items-center justify-between rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 px-4 py-3">
          <span className="text-sm text-slate-300">{action}</span>
          <kbd className="rounded-md border border-surface-darkBorder bg-black/20 px-2 py-1 text-xs font-semibold text-slate-200">{key}</kbd>
        </div>
      ))}
    </div>
  );
}
