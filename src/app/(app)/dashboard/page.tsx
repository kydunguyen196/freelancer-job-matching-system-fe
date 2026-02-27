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
    <section className="surface-card">
      <h1 className="section-title">Redirecting dashboard...</h1>
    </section>
  );
}
