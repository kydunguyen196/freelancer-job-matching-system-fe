"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { ApiError } from "@/lib/http-client";
import { pickApiFieldErrors, type LoginFields, validateLoginInput } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/jobs");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginFields, string>>>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawNext = new URLSearchParams(window.location.search).get("next");
    if (rawNext && rawNext.startsWith("/")) {
      setNextPath(rawNext);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { email: email.trim(), password };
    const validation = validateLoginInput(payload);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      await loginWithPassword(payload);
      router.replace(nextPath);
    } catch (error) {
      if (error instanceof ApiError) {
        const apiFieldErrors = pickApiFieldErrors<LoginFields>(error.fieldErrors, ["email", "password"]);
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors);
        }
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unable to login right now.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage jobs, proposals, and contracts.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <div className="field-label">Email</div>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorMessage(null);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              aria-invalid={Boolean(fieldErrors.email)}
              required
            />
            {fieldErrors.email ? <p className="error-text">{fieldErrors.email}</p> : null}
          </label>

          <label>
            <div className="field-label">Password</div>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage(null);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              minLength={8}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              required
            />
            {fieldErrors.password ? <p className="error-text">{fieldErrors.password}</p> : null}
          </label>

          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <p className="auth-footer">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </section>
    </div>
  );
}
