"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      const destination = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${destination}`);
    }
  }, [ready, isAuthenticated, pathname, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="loading-wrap">
        <div className="loading-dot" />
        <p className="loading-text">Securing your workspace...</p>
      </div>
    );
  }

  return <>{children}</>;
}
