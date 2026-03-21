"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Briefcase, UserCheck } from "lucide-react";

import { RoleGuard } from "@/components/role-guard";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { getMyJobDashboard, getMyProposalDashboard } from "@/lib/api";
import { ApiError } from "@/lib/http/api-error";

export default function ReportsPage() {
  const jobDashboardQuery = useQuery({
    queryKey: ["job-dashboard", "reports"],
    queryFn: getMyJobDashboard,
  });

  const proposalDashboardQuery = useQuery({
    queryKey: ["proposal-dashboard", "reports"],
    queryFn: getMyProposalDashboard,
  });

  return (
    <RoleGuard allow={["CLIENT"]}>
      <div className="space-y-4">
        <Card className="border-slate-200 bg-white/95">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard Reports</h1>
          <p className="mt-1 text-sm text-slate-600">Job performance and application pipeline overview for recruiters.</p>
        </Card>

        {jobDashboardQuery.isError ? (
          <ErrorState
            message={jobDashboardQuery.error instanceof ApiError ? jobDashboardQuery.error.message : "Could not load job dashboard."}
            onRetry={() => void jobDashboardQuery.refetch()}
          />
        ) : null}

        {proposalDashboardQuery.isError ? (
          <ErrorState
            message={
              proposalDashboardQuery.error instanceof ApiError
                ? proposalDashboardQuery.error.message
                : "Could not load proposal dashboard."
            }
            onRetry={() => void proposalDashboardQuery.refetch()}
          />
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
              <Briefcase className="h-4 w-4" />
              Jobs
            </p>
            <p className="mt-2 text-2xl font-semibold">{jobDashboardQuery.data?.totalJobs ?? 0}</p>
            <p className="mt-1 text-sm text-slate-600">
              Open {jobDashboardQuery.data?.openJobs ?? 0} • Closed {jobDashboardQuery.data?.closedJobs ?? 0}
            </p>
          </Card>
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
              <UserCheck className="h-4 w-4" />
              Applications
            </p>
            <p className="mt-2 text-2xl font-semibold">{proposalDashboardQuery.data?.totalApplications ?? 0}</p>
            <p className="mt-1 text-sm text-slate-600">
              Pending {proposalDashboardQuery.data?.pendingApplications ?? 0} • Reviewing {proposalDashboardQuery.data?.reviewingApplications ?? 0}
            </p>
          </Card>
          <Card className="border-slate-200 bg-white/95 p-4">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
              <BarChart3 className="h-4 w-4" />
              Conversion
            </p>
            <p className="mt-2 text-2xl font-semibold">{proposalDashboardQuery.data?.acceptedApplications ?? 0}</p>
            <p className="mt-1 text-sm text-slate-600">
              Accepted proposals • Interviews {proposalDashboardQuery.data?.interviewsScheduled ?? 0}
            </p>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white/95 p-4">
          <h2 className="text-lg font-semibold">Per-job Application Stats</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Job Id</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Pending</th>
                  <th className="px-3 py-2">Reviewing</th>
                  <th className="px-3 py-2">Interview</th>
                  <th className="px-3 py-2">Accepted</th>
                  <th className="px-3 py-2">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {(proposalDashboardQuery.data?.jobStats ?? []).map((item) => (
                  <tr key={item.jobId} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">#{item.jobId}</td>
                    <td className="px-3 py-2">{item.totalApplications}</td>
                    <td className="px-3 py-2">{item.pendingApplications}</td>
                    <td className="px-3 py-2">{item.reviewingApplications}</td>
                    <td className="px-3 py-2">{item.interviewsScheduled}</td>
                    <td className="px-3 py-2">{item.acceptedApplications}</td>
                    <td className="px-3 py-2">{item.rejectedApplications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!proposalDashboardQuery.data?.jobStats?.length ? (
            <p className="mt-3 text-sm text-slate-500">No data yet. Stats will appear after candidates apply.</p>
          ) : null}
        </Card>
      </div>
    </RoleGuard>
  );
}
