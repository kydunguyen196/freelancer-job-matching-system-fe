"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { createProposal, getJobById } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http-client";
import type { JobResponse } from "@/lib/types";

type ProposalFormState = {
  coverLetter: string;
  price: string;
  durationDays: string;
};

const defaultProposalForm: ProposalFormState = {
  coverLetter: "",
  price: "",
  durationDays: "",
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = Number(params.id);

  const { session } = useAuth();
  const isFreelancer = session?.role === "FREELANCER";
  const isClientOwner = session?.role === "CLIENT";

  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [proposalForm, setProposalForm] = useState<ProposalFormState>(defaultProposalForm);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(jobId) || jobId < 1) {
      setErrorMessage("Invalid job id.");
      return;
    }

    let cancelled = false;
    const loadJob = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await getJobById(jobId);
        if (!cancelled) {
          setJob(data);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiError ? error.message : "Could not load job details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadJob();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const canApply = useMemo(() => isFreelancer && job?.status === "OPEN", [isFreelancer, job]);

  const handleApply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!job) {
      return;
    }
    setApplying(true);
    setApplyError(null);
    setApplySuccess(null);
    try {
      await createProposal({
        jobId: job.id,
        coverLetter: proposalForm.coverLetter.trim(),
        price: Number(proposalForm.price),
        durationDays: Number(proposalForm.durationDays),
      });
      setApplySuccess("Proposal submitted.");
      setProposalForm(defaultProposalForm);
    } catch (error) {
      if (error instanceof ApiError) {
        setApplyError(error.message);
      } else {
        setApplyError("Could not submit proposal.");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <section className="surface-card">
        <h1 className="section-title">Loading job details...</h1>
      </section>
    );
  }

  if (errorMessage || !job) {
    return (
      <section className="surface-card">
        <h1 className="section-title">Job Detail</h1>
        <p className="error-text">{errorMessage ?? "Job not found."}</p>
        <Link href="/jobs" className="btn-secondary">
          Back to jobs
        </Link>
      </section>
    );
  }

  return (
    <div className="split-2">
      <section className="surface-card">
        <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <h1 className="section-title" style={{ marginBottom: 0 }}>
            {job.title}
          </h1>
          <span className="pill">{job.status}</span>
        </div>
        <p style={{ marginBottom: "0.7rem" }}>{job.description}</p>
        <p style={{ marginBottom: "0.35rem" }}>
          <strong>Budget:</strong> {formatMoney(job.budgetMin)} - {formatMoney(job.budgetMax)}
        </p>
        <p style={{ marginBottom: "0.35rem" }}>
          <strong>Created:</strong> {formatDate(job.createdAt)}
        </p>
        <p style={{ marginBottom: "0.6rem" }}>
          <strong>Tags:</strong> {job.tags?.length ? job.tags.join(", ") : "No tags"}
        </p>
        <div className="row-actions">
          <Link href="/jobs" className="btn-secondary">
            Back to jobs
          </Link>
          {isClientOwner ? (
            <Link href="/dashboard/client" className="btn-secondary">
              Review proposals
            </Link>
          ) : (
            <Link href="/dashboard/freelancer" className="btn-secondary">
              Freelancer dashboard
            </Link>
          )}
        </div>
      </section>

      {canApply ? (
        <section className="surface-card">
          <h2 className="section-title">Apply to this job</h2>
          <form className="form-grid" onSubmit={handleApply}>
            <label>
              <div className="field-label">Cover letter</div>
              <textarea
                className="textarea-field"
                value={proposalForm.coverLetter}
                onChange={(event) => setProposalForm((prev) => ({ ...prev, coverLetter: event.target.value }))}
                maxLength={4000}
                required
              />
            </label>
            <div className="row-actions">
              <label style={{ flex: 1 }}>
                <div className="field-label">Price (USD)</div>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  step="0.01"
                  value={proposalForm.price}
                  onChange={(event) => setProposalForm((prev) => ({ ...prev, price: event.target.value }))}
                  required
                />
              </label>
              <label style={{ flex: 1 }}>
                <div className="field-label">Duration (days)</div>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  value={proposalForm.durationDays}
                  onChange={(event) => setProposalForm((prev) => ({ ...prev, durationDays: event.target.value }))}
                  required
                />
              </label>
            </div>
            <button className="btn-primary" type="submit" disabled={applying}>
              {applying ? "Submitting..." : "Submit proposal"}
            </button>
          </form>
          {applyError ? <p className="error-text">{applyError}</p> : null}
          {applySuccess ? <p className="success-text">{applySuccess}</p> : null}
        </section>
      ) : (
        <section className="surface-card">
          <h2 className="section-title">Proposal panel</h2>
          <p style={{ color: "var(--muted)" }}>
            {job.status !== "OPEN"
              ? "This job is closed, so new proposals are disabled."
              : "Only freelancer accounts can apply to jobs."}
          </p>
        </section>
      )}
    </div>
  );
}
