"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { ApiError } from "@/lib/http-client";
import type { UserRole } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { registerAccount } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FREELANCER");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setErrorMessage(null);

    try {
      await registerAccount({ email: email.trim(), password, role });
      router.replace("/jobs");
    } catch (error) {
      if (error instanceof ApiError) {
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <div className="field-label">Password</div>
            <input
              className="input-field"
              type="password"
              value={password}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </label>

          <label>
            <div className="field-label">Role</div>
            <select
              className="select-field"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="FREELANCER">Freelancer</option>
              <option value="CLIENT">Client</option>
            </select>
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
