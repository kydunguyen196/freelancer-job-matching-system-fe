"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { createJob, listJobs } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http-client";
import type { CreateJobRequest, JobResponse } from "@/lib/types";

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
    setCreatingJob(true);
    setCreateJobError(null);
    setCreateJobSuccess(null);

    const payload: CreateJobRequest = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      budgetMin: Number(createForm.budgetMin),
      budgetMax: Number(createForm.budgetMax),
      tags: createForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      await createJob(payload);
      setCreateJobSuccess("Job created successfully.");
      setCreateForm(emptyCreateJobForm);
      await refreshJobs();
    } catch (error) {
      if (error instanceof ApiError) {
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
                <p style={{ color: "var(--muted)", marginBottom: "0.35rem" }}>{job.description.slice(0, 180)}</p>
                <div className="row-actions">
                  <span className="pill">{job.status}</span>
                  <span>{formatMoney(job.budgetMin)} - {formatMoney(job.budgetMax)}</span>
                  <span style={{ color: "var(--muted)" }}>Updated {formatDate(job.updatedAt)}</span>
                </div>
                <div className="row-actions" style={{ marginTop: "0.55rem" }}>
                  <Link className="btn-primary" href={`/jobs/${job.id}`}>
                    View details
                  </Link>
                  {job.tags?.length ? <span style={{ color: "var(--muted)" }}>Tags: {job.tags.join(", ")}</span> : null}
                </div>
              </article>
            ))}
            {!jobs.length && !loadingJobs ? <p style={{ color: "var(--muted)" }}>No jobs found with current filter.</p> : null}
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
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                  maxLength={150}
                  required
                />
              </label>
              <label>
                <div className="field-label">Description</div>
                <textarea
                  className="textarea-field"
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                  maxLength={4000}
                  required
                />
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
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, budgetMin: event.target.value }))}
                    required
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <div className="field-label">Budget Max</div>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    step="0.01"
                    value={createForm.budgetMax}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, budgetMax: event.target.value }))}
                    required
                  />
                </label>
              </div>
              <label>
                <div className="field-label">Tags (comma separated)</div>
                <input
                  className="input-field"
                  value={createForm.tags}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder="java, spring, api"
                />
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
            <p style={{ color: "var(--muted)" }}>
              Open a job to send your proposal with price and duration. Accepted proposals automatically create
              contracts and default milestones.
            </p>
            <div className="row-actions" style={{ marginTop: "0.8rem" }}>
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
