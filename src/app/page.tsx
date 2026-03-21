import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px] items-center px-4 py-8 md:px-6">
      <Card className="w-full border-slate-200/80 bg-white/90 p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-5">
            <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Freelancer Job Platform
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Match faster, hire smarter, deliver consistently.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              SkillBridge is a role-based marketplace with advanced job search, proposal lifecycle, contract milestones,
              interview scheduling, notifications, and CV management.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Create account
                </Button>
              </Link>
              <Link href="/jobs">
                <Button size="lg" variant="secondary">
                  Browse jobs
                </Button>
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <Card className="border-slate-200 bg-slate-50 p-5">
              <h2 className="font-display text-lg font-semibold">Core flows ready</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Advanced search, save jobs, follow companies</li>
                <li>Proposal review, reject, interview, accept</li>
                <li>CV upload/download with permission checks</li>
                <li>Dashboard metrics for client and freelancer</li>
              </ul>
            </Card>
            <Card className="border-slate-200 bg-slate-50 p-5">
              <h2 className="font-display text-lg font-semibold">Tech stack</h2>
              <p className="mt-3 text-sm text-slate-600">
                Next.js, TypeScript, React Query, React Hook Form + Zod, Zustand, Axios interceptors, and reusable UI
                primitives.
              </p>
            </Card>
          </section>
        </div>
      </Card>
    </div>
  );
}
