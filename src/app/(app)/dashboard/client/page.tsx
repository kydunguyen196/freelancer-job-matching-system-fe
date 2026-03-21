"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ClipboardList, Download, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingBlock } from "@/components/ui/loading-block";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptProposal,
  downloadProposalCv,
  getMyJobDashboard,
  getMyProposalDashboard,
  listMyJobs,
  listProposalsByJob,
  rejectProposal,
  reviewProposal,
  scheduleInterview,
} from "@/lib/api";
import { formatDateTime, formatMoney, toOptionalIsoDateTime } from "@/lib/format";
import { ApiError } from "@/lib/http/api-error";
import type { ProposalStatus } from "@/lib/types";

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

type InterviewDraft = {
  interviewScheduledAt: string;
  interviewEndsAt: string;
  meetingLink: string;
  notes: string;
};

const initialInterviewDraft: InterviewDraft = {
  interviewScheduledAt: "",
  interviewEndsAt: "",
  meetingLink: "",
  notes: "",
};

export default function ClientDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedJobIdManual, setSelectedJobIdManual] = useState<number | null>(null);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | "">("");
  const [feedbackByProposalId, setFeedbackByProposalId] = useState<Record<number, string>>({});
  const [interviewByProposalId, setInterviewByProposalId] = useState<Record<number, InterviewDraft>>({});

  const jobsQuery = useQuery({
    queryKey: ["client-jobs"],
    queryFn: () => listMyJobs({ page: 0, size: 50, sortBy: "latest" }),
  });

  const selectedJobId = selectedJobIdManual ?? jobsQuery.data?.items?.[0]?.id ?? null;

  const proposalsQuery = useQuery({
    queryKey: ["job-proposals", selectedJobId, proposalStatus],
    queryFn: () =>
      listProposalsByJob(selectedJobId as number, {
        page: 0,
        size: 50,
        status: proposalStatus || undefined,
      }),
    enabled: selectedJobId !== null,
  });

  const jobDashboardQuery = useQuery({
    queryKey: ["job-dashboard"],
    queryFn: getMyJobDashboard,
  });

  const proposalDashboardQuery = useQuery({
    queryKey: ["proposal-dashboard"],
    queryFn: getMyProposalDashboard,
  });

  const commonActionOnSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: ["job-proposals"] });
    void queryClient.invalidateQueries({ queryKey: ["proposal-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const reviewMutation = useMutation({
    mutationFn: ({ proposalId, feedbackMessage }: { proposalId: number; feedbackMessage: string }) =>
      reviewProposal(proposalId, { feedbackMessage }),
    onSuccess: () => {
      toast.success("Proposal moved to REVIEWING.");
      commonActionOnSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not review proposal.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ proposalId, feedbackMessage }: { proposalId: number; feedbackMessage: string }) =>
      rejectProposal(proposalId, { feedbackMessage }),
    onSuccess: () => {
      toast.success("Proposal rejected.");
      commonActionOnSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not reject proposal.");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (proposalId: number) => acceptProposal(proposalId),
    onSuccess: () => {
      toast.success("Proposal accepted and contract created.");
      commonActionOnSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not accept proposal.");
    },
  });

  const interviewMutation = useMutation({
    mutationFn: ({ proposalId, payload }: { proposalId: number; payload: InterviewDraft }) =>
      scheduleInterview(proposalId, {
        interviewScheduledAt: toOptionalIsoDateTime(payload.interviewScheduledAt) ?? payload.interviewScheduledAt,
        interviewEndsAt: toOptionalIsoDateTime(payload.interviewEndsAt) ?? payload.interviewEndsAt,
        meetingLink: payload.meetingLink || undefined,
        notes: payload.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Interview scheduled.");
      commonActionOnSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not schedule interview.");
    },
  });

  const handleDownloadCv = async (proposalId: number) => {
    try {
      const result = await downloadProposalCv(proposalId);
      triggerBrowserDownload(result.blob, result.fileName ?? `proposal-${proposalId}-cv`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not download CV.");
    }
  };

  const jobs = jobsQuery.data?.items ?? [];
  const proposals = proposalsQuery.data?.items ?? [];

  const totals = useMemo(() => {
    const jobDashboard = jobDashboardQuery.data;
    const proposalDashboard = proposalDashboardQuery.data;
    return {
      totalJobs: jobDashboard?.totalJobs ?? 0,
      openJobs: jobDashboard?.openJobs ?? 0,
      totalApplications: proposalDashboard?.totalApplications ?? 0,
      interviewsScheduled: proposalDashboard?.interviewsScheduled ?? 0,
    };
  }, [jobDashboardQuery.data, proposalDashboardQuery.data]);

  return (
    <RoleGuard allow={["CLIENT"]}>
      <div className="space-y-5">
        <Card className="border-slate-200 bg-white/95">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Client Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Manage job postings, review applicants, and schedule interviews.</p>
        </Card>

        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total jobs</p>
            <p className="mt-2 text-2xl font-semibold">{totals.totalJobs}</p>
          </Card>
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Open jobs</p>
            <p className="mt-2 text-2xl font-semibold">{totals.openJobs}</p>
          </Card>
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Applications</p>
            <p className="mt-2 text-2xl font-semibold">{totals.totalApplications}</p>
          </Card>
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Interviews</p>
            <p className="mt-2 text-2xl font-semibold">{totals.interviewsScheduled}</p>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[330px_1fr]">
          <Card className="border-slate-200 bg-white/95">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <h2 className="text-lg font-semibold">Your Jobs</h2>
            </div>
            {jobsQuery.isLoading ? <LoadingBlock label="Loading jobs..." /> : null}
            {jobsQuery.isError ? (
              <ErrorState
                message={jobsQuery.error instanceof ApiError ? jobsQuery.error.message : "Could not load jobs."}
                onRetry={() => void jobsQuery.refetch()}
              />
            ) : null}
            <div className="space-y-2">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedJobId === job.id
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedJobIdManual(job.id)}
                >
                  <p className="line-clamp-1 text-sm font-semibold">{job.title}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                    <span>{job.status}</span>
                    <span>{formatMoney(job.budgetMin)} - {formatMoney(job.budgetMax)}</span>
                  </div>
                </button>
              ))}
              {!jobs.length && !jobsQuery.isLoading ? (
                <EmptyState title="No jobs yet" description="Create a new job from Jobs page to receive proposals." />
              ) : null}
            </div>
          </Card>

          <Card className="border-slate-200 bg-white/95">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <h2 className="text-lg font-semibold">Proposals</h2>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={proposalStatus}
                  onChange={(event) => setProposalStatus(event.target.value as ProposalStatus | "")}
                  className="h-9 w-[180px]"
                >
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="REVIEWING">Reviewing</option>
                  <option value="INTERVIEW_SCHEDULED">Interview scheduled</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </Select>
                <Button variant="secondary" size="sm" onClick={() => void proposalsQuery.refetch()}>
                  Refresh
                </Button>
              </div>
            </div>

            {selectedJobId === null ? (
              <EmptyState title="Select a job" description="Choose one of your jobs to see applicants and actions." />
            ) : null}
            {proposalsQuery.isLoading ? <LoadingBlock label="Loading proposals..." /> : null}
            {proposalsQuery.isError ? (
              <ErrorState
                message={proposalsQuery.error instanceof ApiError ? proposalsQuery.error.message : "Could not load proposals."}
                onRetry={() => void proposalsQuery.refetch()}
              />
            ) : null}

            <div className="space-y-3">
              {proposals.map((proposal) => {
                const feedback = feedbackByProposalId[proposal.id] ?? "";
                const interview = interviewByProposalId[proposal.id] ?? initialInterviewDraft;
                const editable = proposal.status === "PENDING" || proposal.status === "REVIEWING";

                return (
                  <Card key={proposal.id} className="border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Proposal #{proposal.id}</p>
                        <p className="text-xs text-slate-600">Freelancer: {proposal.freelancerEmail}</p>
                      </div>
                      <Badge>{proposal.status}</Badge>
                    </div>

                    <p className="mt-2 line-clamp-3 text-sm text-slate-700">{proposal.coverLetter}</p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span>Price: {formatMoney(proposal.price)}</span>
                      <span>Duration: {proposal.durationDays} days</span>
                      <span>Submitted: {formatDateTime(proposal.createdAt)}</span>
                    </div>

                    {proposal.interviewScheduledAt ? (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Interview: {formatDateTime(proposal.interviewScheduledAt)} - {formatDateTime(proposal.interviewEndsAt)}
                        {proposal.calendarWarning ? ` (${proposal.calendarWarning})` : ""}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void handleDownloadCv(proposal.id)}>
                        <Download className="h-4 w-4" />
                        Download CV
                      </Button>

                      {editable ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              const message = feedback.trim();
                              if (message.length < 6) {
                                toast.error("Feedback must be at least 6 characters.");
                                return;
                              }
                              reviewMutation.mutate({ proposalId: proposal.id, feedbackMessage: message });
                            }}
                            disabled={reviewMutation.isPending}
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              const message = feedback.trim();
                              if (message.length < 6) {
                                toast.error("Feedback must be at least 6 characters.");
                                return;
                              }
                              rejectMutation.mutate({ proposalId: proposal.id, feedbackMessage: message });
                            }}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => acceptMutation.mutate(proposal.id)}
                            disabled={acceptMutation.isPending}
                          >
                            Accept
                          </Button>
                        </>
                      ) : null}
                    </div>

                    {editable ? (
                      <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                        <Textarea
                          rows={2}
                          placeholder="Feedback for review/reject..."
                          value={feedback}
                          onChange={(event) =>
                            setFeedbackByProposalId((prev) => ({ ...prev, [proposal.id]: event.target.value }))
                          }
                        />

                        <div className="grid gap-3 md:grid-cols-2">
                          <Input
                            type="datetime-local"
                            value={interview.interviewScheduledAt}
                            onChange={(event) =>
                              setInterviewByProposalId((prev) => ({
                                ...prev,
                                [proposal.id]: { ...interview, interviewScheduledAt: event.target.value },
                              }))
                            }
                          />
                          <Input
                            type="datetime-local"
                            value={interview.interviewEndsAt}
                            onChange={(event) =>
                              setInterviewByProposalId((prev) => ({
                                ...prev,
                                [proposal.id]: { ...interview, interviewEndsAt: event.target.value },
                              }))
                            }
                          />
                          <Input
                            placeholder="Meeting link (optional)"
                            value={interview.meetingLink}
                            onChange={(event) =>
                              setInterviewByProposalId((prev) => ({
                                ...prev,
                                [proposal.id]: { ...interview, meetingLink: event.target.value },
                              }))
                            }
                          />
                          <Input
                            placeholder="Notes (optional)"
                            value={interview.notes}
                            onChange={(event) =>
                              setInterviewByProposalId((prev) => ({
                                ...prev,
                                [proposal.id]: { ...interview, notes: event.target.value },
                              }))
                            }
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (!interview.interviewScheduledAt || !interview.interviewEndsAt) {
                              toast.error("Please choose interview start and end time.");
                              return;
                            }
                            interviewMutation.mutate({ proposalId: proposal.id, payload: interview });
                          }}
                          disabled={interviewMutation.isPending}
                        >
                          <Calendar className="h-4 w-4" />
                          Schedule interview
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
              {selectedJobId !== null && !proposals.length && !proposalsQuery.isLoading ? (
                <EmptyState title="No proposals" description="No applicants for this job with current filter." />
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
