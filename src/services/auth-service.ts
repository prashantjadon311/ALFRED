import { api, clearAccessToken, isApiMode, refreshAccessToken, setAccessToken } from "@/lib/api-client";
import { demoWait } from "./mock-latency";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

const mockUser: AuthUser = { userId: "user-demo", email: "demo@alfred.local", name: "Prashant", role: "owner" };

function normalizeUser(user: any): AuthUser {
  return {
    userId: user.userId ?? user.id ?? "user-demo",
    email: user.email ?? "demo@alfred.local",
    name: user.name ?? "Prashant",
    role: user.role ?? "owner"
  };
}

export const authService = {
  register: async (name: string, email: string, password: string): Promise<AuthUser> => {
    if (!isApiMode()) {
      await demoWait(240);
      if (!name.trim() || !email.trim() || !password.trim()) throw new Error("Enter name, email, and password.");
      return { ...mockUser, name, email };
    }
    const result = await api.post<{ user: any; accessToken: string }>("/auth/register", { name, email, password });
    setAccessToken(result.accessToken);
    return normalizeUser(result.user);
  },

  login: async (email: string, password: string): Promise<AuthUser> => {
    if (!isApiMode()) {
      await demoWait(240);
      if (!email.trim() || !password.trim()) throw new Error("Enter the mocked demo credentials.");
      return { ...mockUser, email };
    }
    const result = await api.post<{ user: any; accessToken: string }>("/auth/login", { email, password });
    setAccessToken(result.accessToken);
    return normalizeUser(result.user);
  },

  restoreSession: async (): Promise<AuthUser> => {
    if (!isApiMode()) return mockUser;
    const result = await refreshAccessToken();
    return normalizeUser(result.user);
  },

  me: async (): Promise<AuthUser> => {
    if (!isApiMode()) return mockUser;
    return normalizeUser(await api.get<any>("/auth/me"));
  },

  logout: async () => {
    if (!isApiMode()) return;
    await api.post("/auth/logout");
    clearAccessToken();
  }
};
