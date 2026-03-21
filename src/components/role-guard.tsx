"use client";

import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/types";

export function RoleGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const { session } = useAuth();

  if (!session || !allow.includes(session.role)) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center">
        <h1 className="text-xl font-semibold text-red-800">Access denied</h1>
        <p className="mt-2 text-sm text-red-700">You do not have permission to access this page.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Back to dashboard
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
