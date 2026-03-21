"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, FileCheck2, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Select } from "@/components/ui/select";
import {
  completeMilestone,
  getMyContracts,
  getMyNotifications,
  getMyProposalDashboard,
  listMyProposals,
  markNotificationRead,
} from "@/lib/api";
import { formatDateTime, formatMoney, formatRelativeDate } from "@/lib/format";
import { ApiError } from "@/lib/http/api-error";
import type { ProposalStatus } from "@/lib/types";

export default function FreelancerDashboardPage() {
  const queryClient = useQueryClient();
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | "">("");

  const proposalQuery = useQuery({
    queryKey: ["my-proposals", proposalStatus],
    queryFn: () => listMyProposals({ status: proposalStatus || undefined, page: 0, size: 50 }),
  });

  const proposalDashboardQuery = useQuery({
    queryKey: ["proposal-dashboard"],
    queryFn: getMyProposalDashboard,
  });

  const contractsQuery = useQuery({
    queryKey: ["my-contracts"],
    queryFn: getMyContracts,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "freelancer"],
    queryFn: getMyNotifications,
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not mark notification as read.");
    },
  });

  const completeMilestoneMutation = useMutation({
    mutationFn: completeMilestone,
    onSuccess: () => {
      toast.success("Milestone marked as completed.");
      void queryClient.invalidateQueries({ queryKey: ["my-contracts"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not complete milestone.");
    },
  });

  const proposalStats = proposalDashboardQuery.data;
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;
  const contracts = contractsQuery.data ?? [];
  const proposals = proposalQuery.data?.items ?? [];

  return (
    <RoleGuard allow={["FREELANCER"]}>
      <div className="space-y-5">
        <Card className="border-slate-200 bg-white/95">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Freelancer Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Track your proposals, contracts, milestones, and notifications.</p>
        </Card>

        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total proposals</p>
            <p className="mt-2 text-2xl font-semibold">{proposalStats?.totalApplications ?? 0}</p>
          </Card>
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
            <p className="mt-2 text-2xl font-semibold">{proposalStats?.pendingApplications ?? 0}</p>
          </Card>
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Interviews</p>
            <p className="mt-2 text-2xl font-semibold">{proposalStats?.interviewsScheduled ?? 0}</p>
          </Card>
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Unread notifications</p>
            <p className="mt-2 text-2xl font-semibold">{unreadCount}</p>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-slate-200 bg-white/95">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-slate-500" />
                <h2 className="text-lg font-semibold">My Proposals</h2>
              </div>
              <Select
                value={proposalStatus}
                className="h-9 w-[180px]"
                onChange={(event) => setProposalStatus(event.target.value as ProposalStatus | "")}
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWING">Reviewing</option>
                <option value="INTERVIEW_SCHEDULED">Interview scheduled</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>

            {proposalQuery.isLoading ? <p className="text-sm text-slate-500">Loading proposals...</p> : null}
            {proposalQuery.isError ? (
              <ErrorState
                message={proposalQuery.error instanceof ApiError ? proposalQuery.error.message : "Could not load proposals."}
                onRetry={() => void proposalQuery.refetch()}
              />
            ) : null}

            <div className="space-y-3">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Proposal #{proposal.id}</p>
                    <Badge>{proposal.status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-700">{proposal.coverLetter}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span>Job #{proposal.jobId}</span>
                    <span>Price {formatMoney(proposal.price)}</span>
                    <span>{proposal.durationDays} days</span>
                    <span>{formatDateTime(proposal.createdAt)}</span>
                  </div>
                  {proposal.feedbackMessage ? (
                    <p className="mt-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                      Feedback: {proposal.feedbackMessage}
                    </p>
                  ) : null}
                  {proposal.interviewScheduledAt ? (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                      Interview: {formatDateTime(proposal.interviewScheduledAt)} - {formatDateTime(proposal.interviewEndsAt)}
                    </p>
                  ) : null}
                </Card>
              ))}
              {!proposals.length && !proposalQuery.isLoading ? (
                <EmptyState title="No proposals" description="Apply to jobs to build your proposal pipeline." />
              ) : null}
            </div>
          </Card>

          <Card className="border-slate-200 bg-white/95">
            <div className="mb-3 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-slate-500" />
              <h2 className="text-lg font-semibold">Contracts & Milestones</h2>
            </div>

            {contractsQuery.isLoading ? <p className="text-sm text-slate-500">Loading contracts...</p> : null}
            {contractsQuery.isError ? (
              <ErrorState
                message={contractsQuery.error instanceof ApiError ? contractsQuery.error.message : "Could not load contracts."}
                onRetry={() => void contractsQuery.refetch()}
              />
            ) : null}

            <div className="space-y-3">
              {contracts.map((contract) => (
                <Card key={contract.id} className="border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Contract #{contract.id}</p>
                    <Badge>{contract.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Job #{contract.jobId}</p>
                  <p className="text-xs text-slate-500">Updated {formatDateTime(contract.updatedAt)}</p>
                  <div className="mt-3 space-y-2">
                    {contract.milestones.map((milestone) => (
                      <div key={milestone.id} className="rounded-lg border border-slate-200 bg-white p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{milestone.title}</p>
                          <Badge>{milestone.status}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span>{formatMoney(milestone.amount)}</span>
                          <span>Due {milestone.dueDate}</span>
                        </div>
                        {milestone.status === "PENDING" ? (
                          <Button
                            size="sm"
                            className="mt-2"
                            variant="secondary"
                            onClick={() => completeMilestoneMutation.mutate(milestone.id)}
                            disabled={completeMilestoneMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark complete
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    {!contract.milestones.length ? <p className="text-xs text-slate-500">No milestones yet.</p> : null}
                  </div>
                </Card>
              ))}
              {!contracts.length && !contractsQuery.isLoading ? (
                <EmptyState title="No contracts" description="Accepted proposals will appear here as active contracts." />
              ) : null}
            </div>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white/95">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-500" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          {notificationsQuery.isLoading ? <p className="text-sm text-slate-500">Loading notifications...</p> : null}
          {notificationsQuery.isError ? (
            <ErrorState
              message={notificationsQuery.error instanceof ApiError ? notificationsQuery.error.message : "Could not load notifications."}
              onRetry={() => void notificationsQuery.refetch()}
            />
          ) : null}
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card key={notification.id} className="border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  {!notification.read ? <Badge className="bg-amber-100 text-amber-800">Unread</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatRelativeDate(notification.createdAt)}</span>
                  {!notification.read ? (
                    <button
                      type="button"
                      className="font-medium text-blue-700 hover:text-blue-800"
                      onClick={() => readMutation.mutate(notification.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </Card>
            ))}
            {!notifications.length && !notificationsQuery.isLoading ? (
              <EmptyState title="No notifications" description="Activity updates and reminders will appear here." />
            ) : null}
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
