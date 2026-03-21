"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StarOff } from "lucide-react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { listSavedJobs, unsaveJob } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http/api-error";

export default function SavedJobsPage() {
  const queryClient = useQueryClient();

  const savedJobsQuery = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => listSavedJobs({ page: 0, size: 50 }),
  });

  const unsaveMutation = useMutation({
    mutationFn: unsaveJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not remove saved job.");
    },
  });

  const jobs = savedJobsQuery.data?.items ?? [];

  return (
    <RoleGuard allow={["FREELANCER"]}>
      <div className="space-y-4">
        <Card className="border-slate-200 bg-white/95">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Saved Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">Track shortlisted opportunities and apply when ready.</p>
        </Card>

        {savedJobsQuery.isLoading ? <p className="text-sm text-slate-500">Loading saved jobs...</p> : null}
        {savedJobsQuery.isError ? (
          <ErrorState
            message={savedJobsQuery.error instanceof ApiError ? savedJobsQuery.error.message : "Could not load saved jobs."}
            onRetry={() => void savedJobsQuery.refetch()}
          />
        ) : null}

        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="border-slate-200 bg-white/95 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                    <Badge>{job.status}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{job.description}</p>
                  <p className="text-sm text-slate-600">
                    {formatMoney(job.budgetMin)} - {formatMoney(job.budgetMax)}
                  </p>
                  <p className="text-xs text-slate-500">Saved from job created at {formatDateTime(job.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm">View detail</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={unsaveMutation.isPending}
                    onClick={() => unsaveMutation.mutate(job.id)}
                  >
                    <StarOff className="h-4 w-4" />
                    Unsave
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {!jobs.length && !savedJobsQuery.isLoading ? (
            <EmptyState title="No saved jobs yet" description="Use Save on any job to keep it in your shortlist." />
          ) : null}
        </div>
      </div>
    </RoleGuard>
  );
}
