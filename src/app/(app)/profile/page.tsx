"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingBlock } from "@/components/ui/loading-block";
import { Textarea } from "@/components/ui/textarea";
import { getMyProfile, updateMyProfile, uploadMyResume } from "@/lib/api";
import { ApiError } from "@/lib/http/api-error";
import { profileClientSchema, profileFreelancerSchema } from "@/lib/validation";
import type { UpdateProfileRequest } from "@/lib/types";
import type { z } from "zod";

type FreelancerFormValues = z.input<typeof profileFreelancerSchema>;
type FreelancerValues = z.output<typeof profileFreelancerSchema>;
type ClientFormValues = z.input<typeof profileClientSchema>;
type ClientValues = z.output<typeof profileClientSchema>;

function splitSkills(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toOptionalText(value: string | undefined) {
  const normalized = (value ?? "").trim();
  return normalized ? normalized : null;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const freelancerForm = useForm<FreelancerFormValues, undefined, FreelancerValues>({
    resolver: zodResolver(profileFreelancerSchema),
    defaultValues: {
      contactEmail: "",
      phoneNumber: "",
      address: "",
      skillsRaw: "",
      hourlyRate: "",
      overview: "",
    },
  });

  const clientForm = useForm<ClientFormValues, undefined, ClientValues>({
    resolver: zodResolver(profileClientSchema),
    defaultValues: {
      contactEmail: "",
      phoneNumber: "",
      companyName: "",
      companyAddress: "",
    },
  });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      return;
    }
    freelancerForm.reset({
      contactEmail: profile.contactEmail ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      address: profile.address ?? "",
      skillsRaw: profile.skills?.join(", ") ?? "",
      hourlyRate: profile.hourlyRate ?? "",
      overview: profile.overview ?? "",
    });
    clientForm.reset({
      contactEmail: profile.contactEmail ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      companyName: profile.companyName ?? "",
      companyAddress: profile.companyAddress ?? "",
    });
  }, [profileQuery.data, freelancerForm, clientForm]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateMyProfile(payload),
    onSuccess: () => {
      toast.success("Profile updated.");
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not update profile.");
    },
  });

  const uploadResumeMutation = useMutation({
    mutationFn: (file: File) => uploadMyResume(file),
    onSuccess: () => {
      toast.success("CV uploaded successfully.");
      setResumeFile(null);
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Could not upload CV.");
    },
  });

  const isFreelancer = session?.role === "FREELANCER";
  const isClient = session?.role === "CLIENT";

  if (!isFreelancer && !isClient) {
    return <ErrorState message="Profile page is available only for CLIENT or FREELANCER accounts." />;
  }

  if (profileQuery.isLoading) {
    return <LoadingBlock label="Loading profile..." />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorState
        message={profileQuery.error instanceof ApiError ? profileQuery.error.message : "Could not load profile."}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white/95">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Profile</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge>{profile.role}</Badge>
          <Badge>{profile.email}</Badge>
        </div>
      </Card>

      {isFreelancer ? (
        <Card className="border-slate-200 bg-white/95">
          <form
            className="space-y-4"
            onSubmit={freelancerForm.handleSubmit(async (values) => {
              await updateMutation.mutateAsync({
                contactEmail: toOptionalText(values.contactEmail),
                phoneNumber: toOptionalText(values.phoneNumber),
                address: toOptionalText(values.address),
                skills: splitSkills(values.skillsRaw),
                hourlyRate: values.hourlyRate === "" ? null : Number(values.hourlyRate),
                overview: toOptionalText(values.overview),
              });
            })}
          >
            <h2 className="text-lg font-semibold">Freelancer Profile</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Contact email" error={freelancerForm.formState.errors.contactEmail?.message}>
                <Input type="email" {...freelancerForm.register("contactEmail")} />
              </Field>
              <Field label="Phone number" error={freelancerForm.formState.errors.phoneNumber?.message}>
                <Input {...freelancerForm.register("phoneNumber")} />
              </Field>
              <Field label="Address" error={freelancerForm.formState.errors.address?.message}>
                <Input {...freelancerForm.register("address")} />
              </Field>
              <Field label="Hourly rate (USD)" error={freelancerForm.formState.errors.hourlyRate?.message}>
                <Input type="number" min={1} step="0.01" {...freelancerForm.register("hourlyRate")} />
              </Field>
            </div>
            <Field label="Skills (comma separated)" error={freelancerForm.formState.errors.skillsRaw?.message}>
              <Input placeholder="react, spring, sql, aws" {...freelancerForm.register("skillsRaw")} />
            </Field>
            <Field label="Overview" error={freelancerForm.formState.errors.overview?.message}>
              <Textarea rows={6} {...freelancerForm.register("overview")} />
            </Field>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </Card>
      ) : null}

      {isClient ? (
        <Card className="border-slate-200 bg-white/95">
          <form
            className="space-y-4"
            onSubmit={clientForm.handleSubmit(async (values) => {
              await updateMutation.mutateAsync({
                contactEmail: toOptionalText(values.contactEmail),
                phoneNumber: toOptionalText(values.phoneNumber),
                companyName: toOptionalText(values.companyName),
                companyAddress: toOptionalText(values.companyAddress),
              });
            })}
          >
            <h2 className="text-lg font-semibold">Client Company Profile</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Contact email" error={clientForm.formState.errors.contactEmail?.message}>
                <Input type="email" {...clientForm.register("contactEmail")} />
              </Field>
              <Field label="Phone number" error={clientForm.formState.errors.phoneNumber?.message}>
                <Input {...clientForm.register("phoneNumber")} />
              </Field>
              <Field label="Company name" error={clientForm.formState.errors.companyName?.message}>
                <Input {...clientForm.register("companyName")} />
              </Field>
              <Field label="Company address" error={clientForm.formState.errors.companyAddress?.message}>
                <Input {...clientForm.register("companyAddress")} />
              </Field>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </Card>
      ) : null}

      {isFreelancer ? (
        <Card className="border-slate-200 bg-white/95">
          <h2 className="mb-2 text-lg font-semibold">CV / Resume</h2>
          <p className="mb-3 text-sm text-slate-600">Accepted formats: PDF, DOC, DOCX. File size limit depends on backend config.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              className="max-w-md"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            />
            <Button
              variant="secondary"
              disabled={!resumeFile || uploadResumeMutation.isPending}
              onClick={() => {
                if (resumeFile) {
                  uploadResumeMutation.mutate(resumeFile);
                }
              }}
            >
              <Upload className="h-4 w-4" />
              {uploadResumeMutation.isPending ? "Uploading..." : "Upload CV"}
            </Button>
          </div>
          <p className="mt-3 text-sm text-slate-600">Current file: {profile.resumeFileName ?? "Not uploaded"}</p>
        </Card>
      ) : null}
    </div>
  );
}
