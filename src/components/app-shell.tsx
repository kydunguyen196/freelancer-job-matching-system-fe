"use client";

import { AuthGuard } from "@/components/auth-guard";
import { TopNav } from "@/components/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="app-shell">
        <TopNav />
        <main className="app-content">{children}</main>
      </div>
    </AuthGuard>
  );
}
