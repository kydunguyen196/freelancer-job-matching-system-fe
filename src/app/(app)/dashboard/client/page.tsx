"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { acceptProposal, getMyContracts, listJobs, listProposalsByJob } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http-client";
import type { ContractResponse, JobResponse, ProposalResponse } from "@/lib/types";

export default function ClientDashboardPage() {
  const { session } = useAuth();
  const isClient = session?.role === "CLIENT";

  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshOverview = useCallback(async () => {
    if (!session?.userId) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setActionMessage(null);
    try {
      const [jobData, contractData] = await Promise.all([
        listJobs({ clientId: session.userId }),
        getMyContracts(),
      ]);
      setJobs(jobData);
      setContracts(contractData);
      setSelectedJobId((current) => current ?? jobData[0]?.id ?? null);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not load client dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }, [session?.userId]);

  const refreshProposals = useCallback(async () => {
    if (!selectedJobId) {
      setProposals([]);
      return;
    }
    try {
      const data = await listProposalsByJob(selectedJobId);
      setProposals(data);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not load proposals.");
      }
    }
  }, [selectedJobId]);

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  useEffect(() => {
    void refreshProposals();
  }, [refreshProposals]);

  const pendingProposals = useMemo(() => proposals.filter((item) => item.status === "PENDING").length, [proposals]);

  const handleAcceptProposal = async (proposalId: number) => {
    setActionMessage(null);
    try {
      await acceptProposal(proposalId);
      setActionMessage("Proposal accepted. Contract created.");
      await Promise.all([refreshProposals(), refreshOverview()]);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not accept proposal.");
      }
    }
  };

  if (!isClient) {
    return (
      <section className="surface-card">
        <h1 className="section-title">Client dashboard</h1>
        <p className="error-text">This page is available only for CLIENT accounts.</p>
      </section>
    );
  }

  return (
    <div className="surface-grid">
      <section className="surface-card">
        <h1 className="section-title">Client Dashboard</h1>
        <div className="row-actions">
          <button type="button" className="btn-secondary" onClick={() => void refreshOverview()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh dashboard"}
          </button>
          <span className="pill">{pendingProposals} pending proposals</span>
          <span className="pill">{contracts.length} contracts</span>
        </div>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {actionMessage ? <p className="success-text">{actionMessage}</p> : null}
      </section>

      <div className="split-2">
        <section className="surface-card">
          <h2 className="section-title">Your Jobs</h2>
          <div className="job-list">
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                className="job-item"
                style={{
                  textAlign: "left",
                  borderColor: selectedJobId === job.id ? "#8cb7af" : undefined,
                }}
                onClick={() => setSelectedJobId(job.id)}
              >
                <h3>{job.title}</h3>
                <div className="row-actions">
                  <span className="pill">{job.status}</span>
                  <span>{formatMoney(job.budgetMin)} - {formatMoney(job.budgetMax)}</span>
                </div>
              </button>
            ))}
            {!jobs.length ? <p style={{ color: "var(--muted)" }}>No jobs created yet.</p> : null}
          </div>
        </section>

        <section className="surface-card">
          <h2 className="section-title">Proposals {selectedJobId ? `for Job #${selectedJobId}` : ""}</h2>
          <div className="job-list">
            {proposals.map((proposal) => (
              <article key={proposal.id} className="job-item">
                <div className="row-actions" style={{ justifyContent: "space-between" }}>
                  <strong>#{proposal.id}</strong>
                  <span className="pill">{proposal.status}</span>
                </div>
                <p style={{ color: "var(--muted)", margin: "0.45rem 0" }}>{proposal.coverLetter}</p>
                <p>
                  Price: {formatMoney(proposal.price)} | Duration: {proposal.durationDays} days
                </p>
                <p style={{ color: "var(--muted)" }}>Freelancer: {proposal.freelancerEmail}</p>
                {proposal.status === "PENDING" ? (
                  <div className="row-actions" style={{ marginTop: "0.55rem" }}>
                    <button type="button" className="btn-primary" onClick={() => void handleAcceptProposal(proposal.id)}>
                      Accept proposal
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
            {selectedJobId && !proposals.length ? (
              <p style={{ color: "var(--muted)" }}>No proposals for this job yet.</p>
            ) : null}
            {!selectedJobId ? <p style={{ color: "var(--muted)" }}>Select a job to view proposals.</p> : null}
          </div>
        </section>
      </div>

      <section className="surface-card">
        <h2 className="section-title">Contracts</h2>
        <div className="job-list">
          {contracts.map((contract) => (
            <article key={contract.id} className="job-item">
              <div className="row-actions" style={{ justifyContent: "space-between" }}>
                <strong>Contract #{contract.id}</strong>
                <span className="pill">{contract.status}</span>
              </div>
              <p>Job #{contract.jobId}</p>
              <p style={{ color: "var(--muted)" }}>Updated: {formatDate(contract.updatedAt)}</p>
              <p style={{ color: "var(--muted)" }}>Milestones: {contract.milestones?.length ?? 0}</p>
            </article>
          ))}
          {!contracts.length ? <p style={{ color: "var(--muted)" }}>No contracts yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
