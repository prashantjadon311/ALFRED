import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ModelConfig } from "@/lib/types";
import { formatCurrency, formatTokens } from "@/lib/utils";

export function ModelTable({ models, onToggle }: { models: ModelConfig[]; onToggle?: (model: ModelConfig) => void }) {
  return (
    <div>
      <div className="grid gap-3 md:hidden">
        {models.map((model) => (
          <div key={model.id} className="rounded-card border border-surface-darkBorder bg-surface-darkCard/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{model.name}</p>
                <p className="mt-1 text-xs text-muted">{model.provider} · {model.defaultRole}</p>
              </div>
              <StatusBadge status={model.enabled ? "Enabled" : "Disabled"} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
              <span>{formatTokens(model.contextWindow)}</span>
              <span>{formatCurrency(model.inputCost)}/M in</span>
              <span>{formatCurrency(model.outputCost)}/M out</span>
            </div>
            <Button className="mt-4 w-full" size="sm" variant="secondary" onClick={() => onToggle?.(model)}>
              {model.enabled ? "Disable" : "Enable"}
            </Button>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-panel border border-surface-darkBorder md:block">
        <div className="custom-scrollbar overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-surface-darkElevated/80 text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Model name</th>
              <th className="px-4 py-3">Context window</th>
              <th className="px-4 py-3">Input cost</th>
              <th className="px-4 py-3">Output cost</th>
              <th className="px-4 py-3">Default role</th>
              <th className="px-4 py-3">Enabled</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-darkBorder bg-surface-darkCard/70">
            {models.map((model) => (
              <tr key={model.id} className="hover:bg-white/5">
                <td className="px-4 py-4 text-slate-300">{model.provider}</td>
                <td className="px-4 py-4 font-semibold text-white">{model.name}</td>
                <td className="px-4 py-4 text-slate-300">{formatTokens(model.contextWindow)}</td>
                <td className="px-4 py-4 text-slate-300">{formatCurrency(model.inputCost)}/M</td>
                <td className="px-4 py-4 text-slate-300">{formatCurrency(model.outputCost)}/M</td>
                <td className="px-4 py-4 text-slate-300">{model.defaultRole}</td>
                <td className="px-4 py-4"><StatusBadge status={model.enabled ? "Enabled" : "Disabled"} /></td>
                <td className="px-4 py-4"><Button size="sm" variant="secondary" onClick={() => onToggle?.(model)}>{model.enabled ? "Disable" : "Enable"}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
