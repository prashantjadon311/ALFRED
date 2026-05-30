"use client";

import { Bot, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [name, setName] = useState("Prashant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Signup failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-900/40">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Create A.L.F.R.E.D. Account</h1>
          <p className="mt-1 text-sm text-slate-400">Start a mock or API-backed workspace.</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Name</label>
              <input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none ring-violet-500/50 transition focus:border-violet-500/50 focus:ring-1" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none ring-violet-500/50 transition focus:border-violet-500/50 focus:ring-1" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none ring-violet-500/50 transition focus:border-violet-500/50 focus:ring-1" />
            </div>
            {error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p> : null}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500 disabled:opacity-50">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-500">
            Already registered? <Link href="/login" className="font-semibold text-violet-300 hover:text-violet-200">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
