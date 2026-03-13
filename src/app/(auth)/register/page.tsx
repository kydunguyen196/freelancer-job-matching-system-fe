"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { ApiError } from "@/lib/http-client";
import type { UserRole } from "@/lib/types";
import { pickApiFieldErrors, type RegisterFields, validateRegisterInput } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const { registerAccount } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FREELANCER");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterFields, string>>>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { email: email.trim(), password, confirmPassword, role };
    const validation = validateRegisterInput(payload);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      await registerAccount({ email: payload.email, password: payload.password, role });
      router.replace("/jobs");
    } catch (error) {
      if (error instanceof ApiError) {
        const apiFieldErrors = pickApiFieldErrors<RegisterFields>(error.fieldErrors, ["email", "password", "role"]);
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors);
        }
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unable to register right now.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <h1 className="auth-title">Create your SkillBridge account</h1>
        <p className="auth-subtitle">Choose your role and start collaborating with confidence.</p>

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
              minLength={8}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage(null);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="At least 8 chars, letters + numbers"
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              required
            />
            {fieldErrors.password ? <p className="error-text">{fieldErrors.password}</p> : null}
          </label>

          <label>
            <div className="field-label">Confirm password</div>
            <input
              className="input-field"
              type="password"
              value={confirmPassword}
              minLength={8}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setErrorMessage(null);
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              required
            />
            {fieldErrors.confirmPassword ? <p className="error-text">{fieldErrors.confirmPassword}</p> : null}
          </label>

          <label>
            <div className="field-label">Role</div>
            <select
              className="select-field"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as UserRole);
                setErrorMessage(null);
                setFieldErrors((prev) => ({ ...prev, role: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.role)}
            >
              <option value="FREELANCER">Freelancer</option>
              <option value="CLIENT">Client</option>
            </select>
            {fieldErrors.role ? <p className="error-text">{fieldErrors.role}</p> : null}
          </label>

          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Creating account..." : "Register"}
          </button>
        </form>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
