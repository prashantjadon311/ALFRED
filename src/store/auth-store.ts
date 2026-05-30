"use client";
import { create } from "zustand";
import { clearTokens, getToken, isApiMode, setTokens } from "@/lib/api-client";
import { authService, type AuthUser } from "@/services/auth-service";

const mockUser: AuthUser = { userId: "user-demo", email: "demo@alfred.local", name: "Prashant", role: "owner" };

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      set({ user: await authService.register(name, email, password) });
    } finally {
      set({ loading: false });
    }
  },

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
    if (!getToken() && isApiMode()) {
      set({ user: null });
      return;
    }
    try {
      set({ user: await authService.me() });
    } catch {
      if (isApiMode()) {
        clearTokens();
        set({ user: null });
        return;
      }
      set({ user: mockUser });
    }
  }
}));
