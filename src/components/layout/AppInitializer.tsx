"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useWorkspaceStore } from "@/store/workspace-store";

export function AppInitializer() {
  const router = useRouter();
  const pathname = usePathname();
  const loadMe = useAuthStore((s) => s.loadMe);
  const hydrateWorkspaces = useWorkspaceStore((s) => s.hydrate);
  const initialized = useRef(false);

  useEffect(() => {
    if (pathname === "/login") return;
    if (initialized.current) return;
    initialized.current = true;
    hydrateWorkspaces();

    loadMe().then(() => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser && pathname !== "/login") {
        router.replace("/login");
      }
    });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
