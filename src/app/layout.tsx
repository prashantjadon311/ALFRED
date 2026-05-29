import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AppInitializer } from "@/components/layout/AppInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "A.L.F.R.E.D. Command Center",
  description: "Agentic Logic Framework for Real-time Execution and Deployment"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <AppInitializer />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
