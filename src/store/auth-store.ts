"use client";
import { create } from "zustand";
import { getToken, isApiMode, setTokens } from "@/lib/api-client";
import { authService, type AuthUser } from "@/services/auth-service";

const mockUser: AuthUser = { userId: "user-demo", email: "demo@alfred.local", name: "Prashant", role: "owner" };

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      set({ user: await authService.login(email, password) });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null });
  },

  loadMe: async () => {
    if (typeof window === "undefined") return;
    if (!getToken() && !isApiMode()) setTokens();
    if (!getToken() && isApiMode()) return;
    try {
      set({ user: await authService.me() });
    } catch {
      set({ user: mockUser });
    }
  }
}));
