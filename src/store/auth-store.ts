"use client";
import { create } from "zustand";
import { clearAccessToken, isApiMode } from "@/lib/api-client";
import { authService, type AuthUser } from "@/services/auth-service";

const mockUser: AuthUser = { userId: "user-demo", email: "demo@alfred.local", name: "Prashant", role: "owner" };

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      set({ user: await authService.register(name, email, password), initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      set({ user: await authService.login(email, password), initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, initialized: true });
  },

  loadMe: async () => {
    if (typeof window === "undefined") return;
    set({ loading: true });
    try {
      set({ user: isApiMode() ? await authService.restoreSession() : mockUser });
    } catch {
      clearAccessToken();
      set({ user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  clearSession: () => {
    clearAccessToken();
    set({ user: null, initialized: true });
  }
}));
