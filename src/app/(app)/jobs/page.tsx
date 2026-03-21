"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Filter, Search, Star } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createJob,
  followCompany,
  listJobs,
  saveJob,
  unfollowCompany,
  unsaveJob,
  type JobListFilters,
} from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http/api-error";
import type { CreateJobRequest, EmploymentType, JobSortBy, JobStatus } from "@/lib/types";
import { createJobSchema } from "@/lib/validation";
import type { z } from "zod";

type CreateJobFormValues = z.input<typeof createJobSchema>;
type CreateJobValues = z.output<typeof createJobSchema>;

const employmentTypes: Array<{ label: string; value: EmploymentType }> = [
  { label: "Full time", value: "FULL_TIME" },
  { label: "Part time", value: "PART_TIME" },
  { label: "Contract", value: "CONTRACT" },
];

function parseNumberOrUndefined(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toCreatePayload(values: CreateJobValues): CreateJobRequest {
  const tags = values.tagsRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    budgetMin: Number(values.budgetMin),
    budgetMax: Number(values.budgetMax),
    tags,
    companyName: values.companyName?.trim() ? values.companyName.trim() : null,
    location: values.location?.trim() ? values.location.trim() : null,
    employmentType: values.employmentType ? (values.employmentType as EmploymentType) : null,
    remote: values.remote,
    experienceYears:
      values.experienceYears === null || values.experienceYears === undefined ? null : Number(values.experienceYears),
    status: values.status as JobStatus,
    expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
  };
}

export default function JobsPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const isClient = session?.role === "CLIENT";

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [status, setStatus] = useState<JobStatus | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [remote, setRemote] = useState<"" | "true" | "false">("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [experienceYearsMin, setExperienceYearsMin] = useState("");
  const [experienceYearsMax, setExperienceYearsMax] = useState("");
  const [sortBy, setSortBy] = useState<JobSortBy>("latest");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const resolvedStatus = status || (session?.role === "FREELANCER" ? "OPEN" : "");

  const filters = useMemo<JobListFilters>(
    () => ({
      keyword: keyword.trim() || undefined,
      location: location.trim() || undefined,
      companyName: companyName.trim() || undefined,
      status: (resolvedStatus || undefined) as JobStatus | undefined,
      employmentType: employmentType || undefined,
      remote: remote === "" ? undefined : remote === "true",
      budgetMin: parseNumberOrUndefined(budgetMin),
      budgetMax: parseNumberOrUndefined(budgetMax),
      experienceYearsMin: parseNumberOrUndefined(experienceYearsMin),
      experienceYearsMax: parseNumberOrUndefined(experienceYearsMax),
      sortBy,
      page,
      size,
    }),
    [
      keyword,
      location,
      companyName,
      resolvedStatus,
      employmentType,
      remote,
      budgetMin,
      budgetMax,
      experienceYearsMin,
      experienceYearsMax,
      sortBy,
      page,
      size,
    ]
  );

  const jobsQuery = useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => listJobs(filters),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ jobId, saved }: { jobId: number; saved: boolean }) => {
      if (saved) {
        await unsaveJob(jobId);
      } else {
        await saveJob(jobId);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });

  const followMutation = useMutation({
    mutationFn: async ({ jobId, followed }: { jobId: number; followed: boolean }) => {
      if (followed) {
        await unfollowCompany(jobId);
      } else {
        await followCompany(jobId);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["followed-companies"] });
    },
  });

  const createForm = useForm<CreateJobFormValues, undefined, CreateJobValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      description: "",
      budgetMin: 100,
      budgetMax: 500,
      tagsRaw: "",
      companyName: "",
      location: "",
      employmentType: "",
      remote: false,
      experienceYears: null,
      status: "DRAFT",
      expiresAt: "",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (values: CreateJobValues) => createJob(toCreatePayload(values)),
    onSuccess: () => {
      toast.success("Job created successfully.");
      createForm.reset();
      setPage(0);
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["client-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["job-dashboard"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([name, message]) => {
            if (name in createForm.getValues()) {
              createForm.setError(name as keyof CreateJobFormValues, { type: "server", message });
            }
          });
        }
        toast.error(error.message);
        return;
      }
      toast.error("Could not create job.");
    },
  });

  const handleSubmitCreateJob = createForm.handleSubmit(async (values) => {
    await createJobMutation.mutateAsync(values);
  });

  const jobs = jobsQuery.data?.items ?? [];
  const meta = jobsQuery.data?.meta;

  const totalOpenJobs = jobs.filter((item) => item.status === "OPEN").length;

  return (
    <div className="space-y-5">
      <Card className="border-slate-200/90 bg-white/95">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Job Marketplace</h1>
            <p className="text-sm text-slate-600">Search, filter, sort and manage job opportunities at scale.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{totalOpenJobs} open in page</Badge>
            <Badge>{meta?.totalElements ?? 0} total</Badge>
          </div>
        </div>
      </Card>

      <Card className="border-slate-200/90 bg-white/95">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Search Filters</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Input placeholder="Keyword..." value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Input placeholder="Location" value={location} onChange={(event) => setLocation(event.target.value)} />
          <Input
            placeholder="Company name"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value as JobStatus | "")}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="CLOSED">Closed</option>
            <option value="EXPIRED">Expired</option>
          </Select>
          <Select value={employmentType} onChange={(event) => setEmploymentType(event.target.value as EmploymentType | "")}>
            <option value="">All employment types</option>
            {employmentTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Select value={remote} onChange={(event) => setRemote(event.target.value as "" | "true" | "false")}>
            <option value="">Remote / On-site</option>
            <option value="true">Remote only</option>
            <option value="false">On-site only</option>
          </Select>
          <Input placeholder="Budget min" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} />
          <Input placeholder="Budget max" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} />
          <Input
            placeholder="Experience min (years)"
            value={experienceYearsMin}
            onChange={(event) => setExperienceYearsMin(event.target.value)}
          />
          <Input
            placeholder="Experience max (years)"
            value={experienceYearsMax}
            onChange={(event) => setExperienceYearsMax(event.target.value)}
          />
          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as JobSortBy)}>
            <option value="latest">Latest</option>
            <option value="salary_high">Salary high</option>
            <option value="salary_low">Salary low</option>
          </Select>
          <Select
            value={String(size)}
            onChange={(event) => {
              setPage(0);
              setSize(Number(event.target.value));
            }}
          >
            <option value="12">12 per page</option>
            <option value="20">20 per page</option>
            <option value="30">30 per page</option>
          </Select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setPage(0);
              void jobsQuery.refetch();
            }}
            disabled={jobsQuery.isFetching}
          >
            <Search className="h-4 w-4" />
            Apply search
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setKeyword("");
              setLocation("");
              setCompanyName("");
              setStatus(session?.role === "FREELANCER" ? "OPEN" : "");
              setEmploymentType("");
              setRemote("");
              setBudgetMin("");
              setBudgetMax("");
              setExperienceYearsMin("");
              setExperienceYearsMax("");
              setSortBy("latest");
              setPage(0);
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {jobsQuery.isLoading ? <LoadingBlock label="Loading jobs..." /> : null}
      {jobsQuery.isError ? (
        <ErrorState
          message={jobsQuery.error instanceof ApiError ? jobsQuery.error.message : "Could not load jobs."}
          onRetry={() => void jobsQuery.refetch()}
        />
      ) : null}

      {!jobsQuery.isLoading && !jobsQuery.isError ? (
        <div className="space-y-3">
          {jobs.length ? (
            jobs.map((job) => (
              <Card key={job.id} className="border-slate-200 bg-white/95 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold tracking-tight">{job.title}</h3>
                      <Badge>{job.status}</Badge>
                      {job.remote ? <Badge className="bg-emerald-100 text-emerald-800">Remote</Badge> : null}
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-600">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span>{formatMoney(job.budgetMin)} - {formatMoney(job.budgetMax)}</span>
                      {job.companyName ? <span>Company: {job.companyName}</span> : null}
                      {job.location ? <span>Location: {job.location}</span> : null}
                      {job.employmentType ? <span>{job.employmentType}</span> : null}
                      {job.experienceYears !== null ? <span>{job.experienceYears}+ years</span> : null}
                    </div>
                    <div className="text-xs text-slate-500">Created {formatDateTime(job.createdAt)}</div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Link href={`/jobs/${job.id}`}>
                      <Button size="sm">View detail</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={saveMutation.isPending}
                      onClick={() => saveMutation.mutate({ jobId: job.id, saved: job.savedByCurrentUser })}
                    >
                      <Star className="h-4 w-4" />
                      {job.savedByCurrentUser ? "Unsave" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={followMutation.isPending}
                      onClick={() => followMutation.mutate({ jobId: job.id, followed: job.companyFollowedByCurrentUser })}
                    >
                      {job.companyFollowedByCurrentUser ? "Unfollow company" : "Follow company"}
                    </Button>
                  </div>
                </div>
                {job.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <Badge key={`${job.id}-${tag}`} className="bg-slate-100 text-slate-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </Card>
            ))
          ) : (
            <EmptyState title="No jobs found" description="Adjust filters or try broader keywords to see more results." />
          )}
        </div>
      ) : null}

      {meta ? (
        <Card className="flex flex-wrap items-center justify-between gap-2 border-slate-200 bg-white/95">
          <p className="text-sm text-slate-600">
            Page {meta.page + 1} / {Math.max(meta.totalPages, 1)} • {meta.totalElements} items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={meta.page <= 0}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(meta.totalPages - 1, 0)))}
              disabled={meta.page + 1 >= meta.totalPages}
            >
              Next
            </Button>
          </div>
        </Card>
      ) : null}

      {isClient ? (
        <Card className="border-slate-200/90 bg-white/95">
          <div className="mb-4 flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-slate-500" />
            <h2 className="text-lg font-semibold">Create New Job</h2>
          </div>
          <form className="space-y-4" onSubmit={handleSubmitCreateJob}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" error={createForm.formState.errors.title?.message}>
                <Input placeholder="Senior React Engineer" {...createForm.register("title")} />
              </Field>
              <Field label="Company Name" error={createForm.formState.errors.companyName?.message}>
                <Input placeholder="SkillBridge Labs" {...createForm.register("companyName")} />
              </Field>
              <Field label="Budget Min" error={createForm.formState.errors.budgetMin?.message}>
                <Input type="number" min={1} step="0.01" {...createForm.register("budgetMin")} />
              </Field>
              <Field label="Budget Max" error={createForm.formState.errors.budgetMax?.message}>
                <Input type="number" min={1} step="0.01" {...createForm.register("budgetMax")} />
              </Field>
              <Field label="Location" error={createForm.formState.errors.location?.message}>
                <Input placeholder="Ho Chi Minh City" {...createForm.register("location")} />
              </Field>
              <Field label="Employment Type" error={createForm.formState.errors.employmentType?.message}>
                <Select {...createForm.register("employmentType")}>
                  <option value="">Not specified</option>
                  {employmentTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Experience (Years)" error={createForm.formState.errors.experienceYears?.message}>
                <Input type="number" min={0} max={60} {...createForm.register("experienceYears")} />
              </Field>
              <Field label="Expires At" error={createForm.formState.errors.expiresAt?.message}>
                <Input type="datetime-local" {...createForm.register("expiresAt")} />
              </Field>
              <Field label="Status" error={createForm.formState.errors.status?.message}>
                <Select {...createForm.register("status")}>
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open</option>
                </Select>
              </Field>
              <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...createForm.register("remote")} />
                Remote available
              </label>
            </div>

            <Field label="Description" error={createForm.formState.errors.description?.message}>
              <Textarea rows={6} placeholder="Describe scope, requirements, and expected outcomes..." {...createForm.register("description")} />
            </Field>

            <Field label="Tags (comma separated)" error={createForm.formState.errors.tagsRaw?.message}>
              <Input placeholder="react, nextjs, api, microservices" {...createForm.register("tagsRaw")} />
            </Field>

            <Button type="submit" disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? "Creating..." : "Create job"}
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
