"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/http/api-error";
import { registerSchema } from "@/lib/validation";
import type { z } from "zod";

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { registerAccount } = useAuth();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: "FREELANCER",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        role: values.role,
      });
      toast.success("Account created.");
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([name, message]) => {
            if (name === "email" || name === "password" || name === "role") {
              form.setError(name as keyof RegisterValues, { type: "server", message });
            }
          });
        }
        toast.error(error.message);
        return;
      }
      toast.error("Unable to register right now.");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-slate-200/80 bg-white/95 p-6 shadow-xl">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">SkillBridge</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-600">Start as freelancer or client and access full workflow.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
          </Field>

          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...form.register("password")}
            />
          </Field>

          <Field label="Confirm Password" error={form.formState.errors.confirmPassword?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              {...form.register("confirmPassword")}
            />
          </Field>

          <Field label="Role" error={form.formState.errors.role?.message}>
            <Select {...form.register("role")}>
              <option value="FREELANCER">Freelancer</option>
              <option value="CLIENT">Client</option>
            </Select>
          </Field>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
