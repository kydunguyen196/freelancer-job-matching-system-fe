"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, FileText, MapPin, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingBlock } from "@/components/ui/loading-block";
import { Textarea } from "@/components/ui/textarea";
import {
  closeJob,
  createProposal,
  followCompany,
  getJobById,
  saveJob,
  unfollowCompany,
  unsaveJob,
  updateJobStatus,
  uploadProposalCv,
} from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http/api-error";
import { proposalSchema } from "@/lib/validation";
import type { z } from "zod";

type ProposalFormValues = z.input<typeof proposalSchema>;
type ProposalValues = z.output<typeof proposalSchema>;

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [cvFile, setCvFile] = useState<File | null>(null);

  const jobId = Number(params.id);

  const jobQuery = useQuery({
    queryKey: ["job-detail", jobId],
    queryFn: () => getJobById(jobId),
    enabled: Number.isFinite(jobId) && jobId > 0,
  });

  const proposalForm = useForm<ProposalFormValues, undefined, ProposalValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      coverLetter: "",
      price: 100,
      durationDays: 7,
    },
  });

  const createProposalMutation = useMutation({
    mutationFn: async (values: ProposalValues) =>
      createProposal({
        jobId,
        coverLetter: values.coverLetter,
        price: values.price,
        durationDays: values.durationDays,
      }),
    onSuccess: async (proposal) => {
      if (cvFile) {
        try {
          await uploadProposalCv(proposal.id, cvFile);
          toast.success("Proposal submitted with CV.");
        } catch (error) {
          toast.warning("Proposal submitted but CV upload failed.");
          console.error("Upload CV error after proposal create", error);
        }
      } else {
        toast.success("Proposal submitted.");
      }
      proposalForm.reset();
      setCvFile(null);
      void queryClient.invalidateQueries({ queryKey: ["my-proposals"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([name, message]) => {
            if (name === "coverLetter" || name === "price" || name === "durationDays") {
              proposalForm.setError(name as keyof ProposalFormValues, { type: "server", message });
            }
          });
        }
        toast.error(error.message);
        return;
      }
      toast.error("Could not submit proposal.");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (saved: boolean) => {
      if (saved) {
        await unsaveJob(jobId);
      } else {
        await saveJob(jobId);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["job-detail", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });

  const followMutation = useMutation({
    mutationFn: async (followed: boolean) => {
      if (followed) {
        await unfollowCompany(jobId);
      } else {
        await followCompany(jobId);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["job-detail", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["followed-companies"] });
    },
  });

  const openMutation = useMutation({
    mutationFn: () => updateJobStatus(jobId, "OPEN"),
    onSuccess: () => {
      toast.success("Job is now OPEN.");
      void queryClient.invalidateQueries({ queryKey: ["job-detail", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => closeJob(jobId),
    onSuccess: () => {
      toast.success("Job has been closed.");
      void queryClient.invalidateQueries({ queryKey: ["job-detail", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const job = jobQuery.data;
  const isClientOwner = useMemo(() => job && session?.role === "CLIENT" && session.userId === job.clientId, [job, session]);
  const canApply = useMemo(
    () => job && session?.role === "FREELANCER" && job.status === "OPEN",
    [job, session?.role]
  );

  if (!Number.isFinite(jobId) || jobId <= 0) {
    return <ErrorState message="Invalid job id." />;
  }

  if (jobQuery.isLoading) {
    return <LoadingBlock label="Loading job detail..." />;
  }

  if (jobQuery.isError) {
    return (
      <ErrorState
        message={jobQuery.error instanceof ApiError ? jobQuery.error.message : "Could not load job detail."}
        onRetry={() => void jobQuery.refetch()}
      />
    );
  }

  if (!job) {
    return <EmptyState title="Job not found" description="This job may have been removed or you do not have access." />;
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white/95">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">{job.title}</h1>
              <Badge>{job.status}</Badge>
              {job.remote ? <Badge className="bg-emerald-100 text-emerald-800">Remote</Badge> : null}
            </div>
            <p className="leading-7 text-slate-700">{job.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                {formatMoney(job.budgetMin)} - {formatMoney(job.budgetMax)}
              </span>
              {job.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-4 w-4" />
                Posted {formatDateTime(job.createdAt)}
              </span>
              {job.companyName ? <span>Company: {job.companyName}</span> : null}
            </div>
            {job.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <Badge key={`${job.id}-${tag}`} className="bg-slate-100 text-slate-700">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => saveMutation.mutate(job.savedByCurrentUser)}
              disabled={saveMutation.isPending}
            >
              {job.savedByCurrentUser ? "Unsave" : "Save"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => followMutation.mutate(job.companyFollowedByCurrentUser)}
              disabled={followMutation.isPending}
            >
              {job.companyFollowedByCurrentUser ? "Unfollow company" : "Follow company"}
            </Button>
            <Link href="/jobs">
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        </div>
      </Card>

      {isClientOwner ? (
        <Card className="border-slate-200 bg-white/95">
          <h2 className="mb-3 text-lg font-semibold">Client actions</h2>
          <div className="flex flex-wrap gap-2">
            {job.status !== "OPEN" ? (
              <Button onClick={() => openMutation.mutate()} disabled={openMutation.isPending}>
                Open job
              </Button>
            ) : null}
            {job.status === "OPEN" ? (
              <Button variant="secondary" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
                Close job
              </Button>
            ) : null}
            <Link href="/dashboard/client">
              <Button variant="secondary">Manage proposals</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {canApply ? (
        <Card className="border-slate-200 bg-white/95">
          <h2 className="mb-3 text-lg font-semibold">Submit proposal</h2>
          <form
            className="space-y-4"
            onSubmit={proposalForm.handleSubmit(async (values) => {
              await createProposalMutation.mutateAsync(values);
            })}
          >
            <Field label="Cover letter" error={proposalForm.formState.errors.coverLetter?.message}>
              <Textarea rows={8} placeholder="Describe why you are a strong fit for this role..." {...proposalForm.register("coverLetter")} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Proposed Price (USD)" error={proposalForm.formState.errors.price?.message}>
                <Input type="number" min={1} step="0.01" {...proposalForm.register("price")} />
              </Field>
              <Field label="Duration (days)" error={proposalForm.formState.errors.durationDays?.message}>
                <Input type="number" min={1} max={365} {...proposalForm.register("durationDays")} />
              </Field>
            </div>

            <Field label="CV file (optional)">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
              />
            </Field>

            <Button type="submit" disabled={createProposalMutation.isPending}>
              <FileText className="h-4 w-4" />
              {createProposalMutation.isPending ? "Submitting..." : "Submit proposal"}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white/95">
          <p className="text-sm text-slate-600">
            {job.status !== "OPEN"
              ? "This job is not OPEN, so new proposals are disabled."
              : "Only freelancer accounts can submit proposals."}
          </p>
        </Card>
      )}
    </div>
  );
}
