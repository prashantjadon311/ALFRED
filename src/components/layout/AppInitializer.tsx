"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useWorkspaceStore } from "@/store/workspace-store";

export function AppInitializer() {
  const router = useRouter();
  const pathname = usePathname();
  const loadMe = useAuthStore((s) => s.loadMe);
  const clearSession = useAuthStore((s) => s.clearSession);
  const hydrateWorkspaces = useWorkspaceStore((s) => s.hydrate);
  const initialized = useRef(false);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearSession();
      router.replace("/login");
    };
    window.addEventListener("alfred:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("alfred:auth-expired", handleAuthExpired);
  }, [clearSession, router]);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/signup") {
      initialized.current = false;
      return;
    }
    if (initialized.current) return;
    initialized.current = true;
    let cancelled = false;

    void (async () => {
      const authState = useAuthStore.getState();

      if (authState.initialized && authState.user) {
        await hydrateWorkspaces();
        return;
      }

      await loadMe();

      if (cancelled) return;

      if (useAuthStore.getState().user) {
        await hydrateWorkspaces();
      } else if (!cancelled) {
        router.replace("/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateWorkspaces, loadMe, pathname, router]);

  return null;
}
