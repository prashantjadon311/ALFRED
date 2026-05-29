"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useProjectStore } from "@/store/project-store";
import { useWorkflowStore } from "@/store/workflow-store";
import { useModelStore } from "@/store/model-store";
import { useWorkspaceStore } from "@/store/workspace-store";

export function AppInitializer() {
  const router = useRouter();
  const pathname = usePathname();
  const loadMe = useAuthStore((s) => s.loadMe);
  const loadProjects = useProjectStore((s) => s.loadFromApi);
  const loadWorkflows = useWorkflowStore((s) => s.loadFromApi);
  const loadModels = useModelStore((s) => s.loadFromApi);
  const hydrateWorkspaces = useWorkspaceStore((s) => s.hydrate);

  useEffect(() => {
    if (pathname === "/login") return;
    hydrateWorkspaces();

    // Check auth then load data
    loadMe().then(() => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser && pathname !== "/login") {
        router.replace("/login");
        return;
      }
      // Kick off data loads in parallel (non-blocking — stores fall back to mock on error)
      Promise.allSettled([loadProjects(), loadWorkflows(), loadModels()]);
    });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
