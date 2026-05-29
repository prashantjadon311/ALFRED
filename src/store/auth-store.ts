"use client";
import { create } from "zustand";
import { clearTokens, getToken, setTokens } from "@/lib/api-client";

interface AuthUser { userId: string; email: string; name: string; role: string; }
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
      await new Promise((resolve) => setTimeout(resolve, 240));
      if (!email.trim() || !password.trim()) throw new Error("Enter the mocked demo credentials.");
      setTokens();
      set({ user: { ...mockUser, email } });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    clearTokens();
    set({ user: null });
  },

  loadMe: async () => {
    if (typeof window === "undefined") return;
    if (!getToken()) setTokens();
    set({ user: mockUser });
  }
}));
