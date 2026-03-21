"use client";

import { AuthGuard } from "@/components/auth-guard";
import { TopNav } from "@/components/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
