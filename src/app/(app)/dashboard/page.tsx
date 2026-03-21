"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (session?.role === "CLIENT") {
      router.replace("/dashboard/client");
      return;
    }
    if (session?.role === "FREELANCER") {
      router.replace("/dashboard/freelancer");
    }
  }, [session, router]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-6">
      <h1 className="font-display text-xl font-semibold">Redirecting dashboard...</h1>
    </section>
  );
}
