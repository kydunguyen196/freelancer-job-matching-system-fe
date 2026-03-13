"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { createJob, listJobs } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http-client";
import type { CreateJobRequest, JobResponse } from "@/lib/types";
import { pickApiFieldErrors, toCreateJobPayload, type CreateJobFields, validateCreateJobInput } from "@/lib/validation";

type CreateJobForm = {
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  tags: string;
};

const emptyCreateJobForm: CreateJobForm = {
  title: "",
  description: "",
  budgetMin: "",
  budgetMax: "",
  tags: "",
};

export default function JobsPage() {
  const { session } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateJobForm>(emptyCreateJobForm);
  const [creatingJob, setCreatingJob] = useState(false);
  const [createJobError, setCreateJobError] = useState<string | null>(null);
  const [createJobSuccess, setCreateJobSuccess] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Partial<Record<CreateJobFields, string>>>({});

  const isClient = session?.role === "CLIENT";

  const refreshJobs = useCallback(async () => {
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const data = await listJobs({ keyword: keyword.trim() || undefined, status: status || undefined });
      setJobs(data);
    } catch (error) {
      if (error instanceof ApiError) {
        setJobsError(error.message);
      } else {
        setJobsError("Could not load jobs.");
      }
    } finally {
      setLoadingJobs(false);
    }
  }, [keyword, status]);

  useEffect(() => {
    void refreshJobs();
  }, [refreshJobs]);

  const handleCreateJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateJobSuccess(null);
    setCreateJobError(null);

    const validation = validateCreateJobInput(createForm);
    if (!validation.ok) {
      setCreateFieldErrors(validation.fieldErrors);
      setCreateJobError("Please fix the highlighted fields.");
      return;
    }

    setCreatingJob(true);
    setCreateFieldErrors({});

    const payload: CreateJobRequest = toCreateJobPayload(createForm);

    try {
      await createJob(payload);
      setCreateJobSuccess("Job created successfully.");
      setCreateForm(emptyCreateJobForm);
      setCreateFieldErrors({});
      await refreshJobs();
    } catch (error) {
      if (error instanceof ApiError) {
        const apiFieldErrors = pickApiFieldErrors<CreateJobFields>(
          error.fieldErrors,
          ["title", "description", "budgetMin", "budgetMax", "tags"]
        );
        if (Object.keys(apiFieldErrors).length > 0) {
          setCreateFieldErrors(apiFieldErrors);
        }
        setCreateJobError(error.message);
      } else {
        setCreateJobError("Could not create job.");
      }
    } finally {
      setCreatingJob(false);
    }
  };

  const openJobs = useMemo(() => jobs.filter((job) => job.status === "OPEN").length, [jobs]);

  return (
    <div className="surface-grid">
      <section className="surface-card">
        <h1 className="section-title">Job Marketplace</h1>
        <div className="row-actions">
          <input
            className="input-field"
            style={{ maxWidth: 260 }}
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search by keyword"
            maxLength={120}
          />
          <select className="select-field" style={{ maxWidth: 170 }} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <button type="button" className="btn-secondary" onClick={() => void refreshJobs()} disabled={loadingJobs}>
            {loadingJobs ? "Loading..." : "Refresh"}
          </button>
          <span className="pill">{openJobs} open jobs</span>
        </div>
        {jobsError ? <p className="error-text">{jobsError}</p> : null}
      </section>

      <div className="split-2">
        <section className="surface-card">
          <h2 className="section-title">Available Jobs</h2>
          <div className="job-list">
            {jobs.map((job) => (
              <article key={job.id} className="job-item">
                <h3>{job.title}</h3>
                <p className="muted-text mb-sm">{job.description.slice(0, 180)}</p>
                <div className="row-actions">
                  <span className="pill">{job.status}</span>
                  <span>{formatMoney(job.budgetMin)} - {formatMoney(job.budgetMax)}</span>
                  <span className="muted-text">Updated {formatDate(job.updatedAt)}</span>
                </div>
                <div className="row-actions mt-sm">
                  <Link className="btn-primary" href={`/jobs/${job.id}`}>
                    View details
                  </Link>
                  {job.tags?.length ? <span className="muted-text">Tags: {job.tags.join(", ")}</span> : null}
                </div>
              </article>
            ))}
            {!jobs.length && !loadingJobs ? <p className="muted-text">No jobs found with current filter.</p> : null}
          </div>
        </section>

        {isClient ? (
          <section className="surface-card">
            <h2 className="section-title">Create Job (Client)</h2>
            <form className="form-grid" onSubmit={handleCreateJob}>
              <label>
                <div className="field-label">Title</div>
                <input
                  className="input-field"
                  value={createForm.title}
                  onChange={(event) => {
                    setCreateForm((prev) => ({ ...prev, title: event.target.value }));
                    setCreateJobError(null);
                    setCreateFieldErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  minLength={6}
                  maxLength={150}
                  aria-invalid={Boolean(createFieldErrors.title)}
                  required
                />
                {createFieldErrors.title ? <p className="error-text">{createFieldErrors.title}</p> : null}
              </label>
              <label>
                <div className="field-label">Description</div>
                <textarea
                  className="textarea-field"
                  value={createForm.description}
                  onChange={(event) => {
                    setCreateForm((prev) => ({ ...prev, description: event.target.value }));
                    setCreateJobError(null);
                    setCreateFieldErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  minLength={24}
                  maxLength={4000}
                  aria-invalid={Boolean(createFieldErrors.description)}
                  required
                />
                {createFieldErrors.description ? <p className="error-text">{createFieldErrors.description}</p> : null}
              </label>
              <div className="row-actions">
                <label style={{ flex: 1 }}>
                  <div className="field-label">Budget Min</div>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    step="0.01"
                    value={createForm.budgetMin}
                    onChange={(event) => {
                      setCreateForm((prev) => ({ ...prev, budgetMin: event.target.value }));
                      setCreateJobError(null);
                      setCreateFieldErrors((prev) => ({ ...prev, budgetMin: undefined }));
                    }}
                    inputMode="decimal"
                    aria-invalid={Boolean(createFieldErrors.budgetMin)}
                    required
                  />
                  {createFieldErrors.budgetMin ? <p className="error-text">{createFieldErrors.budgetMin}</p> : null}
                </label>
                <label style={{ flex: 1 }}>
                  <div className="field-label">Budget Max</div>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    step="0.01"
                    value={createForm.budgetMax}
                    onChange={(event) => {
                      setCreateForm((prev) => ({ ...prev, budgetMax: event.target.value }));
                      setCreateJobError(null);
                      setCreateFieldErrors((prev) => ({ ...prev, budgetMax: undefined }));
                    }}
                    inputMode="decimal"
                    aria-invalid={Boolean(createFieldErrors.budgetMax)}
                    required
                  />
                  {createFieldErrors.budgetMax ? <p className="error-text">{createFieldErrors.budgetMax}</p> : null}
                </label>
              </div>
              <label>
                <div className="field-label">Tags (comma separated)</div>
                <input
                  className="input-field"
                  value={createForm.tags}
                  onChange={(event) => {
                    setCreateForm((prev) => ({ ...prev, tags: event.target.value }));
                    setCreateJobError(null);
                    setCreateFieldErrors((prev) => ({ ...prev, tags: undefined }));
                  }}
                  maxLength={220}
                  placeholder="java, spring, api"
                />
                {createFieldErrors.tags ? <p className="error-text">{createFieldErrors.tags}</p> : null}
              </label>
              <button className="btn-primary" type="submit" disabled={creatingJob}>
                {creatingJob ? "Creating..." : "Create job"}
              </button>
            </form>
            {createJobError ? <p className="error-text">{createJobError}</p> : null}
            {createJobSuccess ? <p className="success-text">{createJobSuccess}</p> : null}
          </section>
        ) : (
          <section className="surface-card">
            <h2 className="section-title">Freelancer Tip</h2>
            <p className="muted-text">
              Open a job to send your proposal with price and duration. Accepted proposals automatically create
              contracts and default milestones.
            </p>
            <div className="row-actions mt-sm">
              <Link href="/dashboard/freelancer" className="btn-secondary">
                Go to freelancer dashboard
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
