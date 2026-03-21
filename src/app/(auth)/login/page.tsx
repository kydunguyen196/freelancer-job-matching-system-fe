"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/http/api-error";
import { loginSchema } from "@/lib/validation";
import type { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithPassword } = useAuth();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const nextPath = (() => {
    const raw = searchParams.get("next");
    return raw && raw.startsWith("/") ? raw : "/dashboard";
  })();

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await loginWithPassword(values);
      toast.success("Signed in successfully.");
      router.replace(nextPath);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([name, message]) => {
            if (name === "email" || name === "password") {
              form.setError(name as keyof LoginValues, { type: "server", message });
            }
          });
        }
        toast.error(error.message);
        return;
      }
      toast.error("Unable to sign in right now.");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-slate-200/80 bg-white/95 p-6 shadow-xl">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">SkillBridge</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in to your workspace</h1>
          <p className="text-sm text-slate-600">Use your account to manage jobs, proposals, and contracts.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...form.register("email")}
            />
          </Field>

          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="At least 8 characters"
              {...form.register("password")}
            />
          </Field>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          New here?{" "}
          <Link href="/register" className="font-semibold text-blue-700 hover:text-blue-800">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
