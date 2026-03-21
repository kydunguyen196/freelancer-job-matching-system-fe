"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!isAuthenticated) {
      const destination = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${destination}`);
    }
  }, [ready, isAuthenticated, pathname, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          <p className="text-sm text-slate-600">Securing your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
