"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { ProviderCard } from "@/components/models/ProviderCard";
import { ModelTable } from "@/components/models/ModelTable";
import { useModelStore } from "@/store/model-store";
import { modelService } from "@/services/model-service";

export default function ModelsPage() {
  const providers = useModelStore((state) => state.providers);
  const models = useModelStore((state) => state.models);
  const updateProviderConfig = useModelStore((state) => state.updateProviderConfig);
  const updateModelConfig = useModelStore((state) => state.updateModelConfig);
  const [testMessages, setTestMessages] = useState<Record<string, string>>({});

  return (
    <div>
      <GlassCard className="mb-6 border-primary/25 bg-primary/10">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary-soft">
          <ShieldCheck className="h-4 w-4" /> API key safety
        </p>
        <p className="mt-2 text-sm text-slate-300">All keys shown here are fake masked values. Test connection controls are mocked and do not perform network calls.</p>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onToggle={() => updateProviderConfig(provider.id, { enabled: !provider.enabled })}
            testMessage={testMessages[provider.id]}
            onTest={async () => {
              const result = await modelService.testConnection(provider.id);
              setTestMessages((current) => ({ ...current, [provider.id]: result.message }));
            }}
          />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Model Table</h2>
        <ModelTable models={models} onToggle={(model) => updateModelConfig(model.id, { enabled: !model.enabled })} />
      </div>
    </div>
  );
}
