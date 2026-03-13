"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { getMyProfile, updateMyProfile, uploadMyResume } from "@/lib/api";
import { ApiError } from "@/lib/http-client";
import type { UpdateProfileRequest, UserProfileResponse } from "@/lib/types";

type ProfileField =
  | "contactEmail"
  | "phoneNumber"
  | "address"
  | "skills"
  | "hourlyRate"
  | "overview"
  | "companyName"
  | "companyAddress";

const allowedFieldKeys: ProfileField[] = [
  "contactEmail",
  "phoneNumber",
  "address",
  "skills",
  "hourlyRate",
  "overview",
  "companyName",
  "companyAddress",
];

type ProfileFormState = {
  contactEmail: string;
  phoneNumber: string;
  address: string;
  skills: string;
  hourlyRate: string;
  overview: string;
  companyName: string;
  companyAddress: string;
};

const emptyForm: ProfileFormState = {
  contactEmail: "",
  phoneNumber: "",
  address: "",
  skills: "",
  hourlyRate: "",
  overview: "",
  companyName: "",
  companyAddress: "",
};

const maxResumeFileSizeBytes = 5 * 1024 * 1024;

function toOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function splitSkills(value: string): string[] {
  return Array.from(
    new Map(
      value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => [skill.toLowerCase(), skill] as const)
    ).values()
  );
}

function mapProfileFieldErrors(fieldErrors: Record<string, string> | undefined) {
  if (!fieldErrors) {
    return {};
  }
  const allowed = new Set(allowedFieldKeys);
  return Object.entries(fieldErrors).reduce<Partial<Record<ProfileField, string>>>((acc, [key, value]) => {
    if (allowed.has(key as ProfileField) && value) {
      acc[key as ProfileField] = value;
    }
    return acc;
  }, {});
}

export default function ProfilePage() {
  const { session } = useAuth();
  const isFreelancer = session?.role === "FREELANCER";
  const isClient = session?.role === "CLIENT";

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProfileField, string>>>({});

  const hydrateForm = useCallback((data: UserProfileResponse) => {
    setForm({
      contactEmail: data.contactEmail ?? "",
      phoneNumber: data.phoneNumber ?? "",
      address: data.address ?? "",
      skills: data.skills?.join(", ") ?? "",
      hourlyRate: data.hourlyRate?.toString() ?? "",
      overview: data.overview ?? "",
      companyName: data.companyName ?? "",
      companyAddress: data.companyAddress ?? "",
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
      hydrateForm(data);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not load profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [hydrateForm]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const roleLabel = useMemo(() => (isFreelancer ? "Freelancer" : isClient ? "Client" : "Account"), [isClient, isFreelancer]);

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    const nextFieldErrors: Partial<Record<ProfileField, string>> = {};
    let parsedHourlyRate: number | null = null;
    if (isFreelancer && form.hourlyRate.trim()) {
      const numericHourlyRate = Number(form.hourlyRate.trim());
      if (!Number.isFinite(numericHourlyRate) || numericHourlyRate <= 0) {
        nextFieldErrors.hourlyRate = "Hourly rate must be a positive number.";
      } else {
        parsedHourlyRate = numericHourlyRate;
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage("Please fix the highlighted fields.");
      return;
    }

    const payload: UpdateProfileRequest = isFreelancer
      ? {
          contactEmail: toOptionalText(form.contactEmail),
          phoneNumber: toOptionalText(form.phoneNumber),
          address: toOptionalText(form.address),
          skills: splitSkills(form.skills),
          hourlyRate: parsedHourlyRate,
          overview: toOptionalText(form.overview),
        }
      : {
          contactEmail: toOptionalText(form.contactEmail),
          phoneNumber: toOptionalText(form.phoneNumber),
          companyName: toOptionalText(form.companyName),
          companyAddress: toOptionalText(form.companyAddress),
        };

    setSaving(true);
    try {
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      hydrateForm(updated);
      setSuccessMessage("Profile updated.");
    } catch (error) {
      if (error instanceof ApiError) {
        const apiFieldErrors = mapProfileFieldErrors(error.fieldErrors);
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors);
        }
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not update profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUploadResume = async () => {
    if (!resumeFile) {
      setErrorMessage("Please choose a CV file first.");
      return;
    }
    const normalizedName = resumeFile.name.toLowerCase();
    const hasAllowedExtension =
      normalizedName.endsWith(".pdf") || normalizedName.endsWith(".doc") || normalizedName.endsWith(".docx");
    if (!hasAllowedExtension) {
      setErrorMessage("CV must be in PDF, DOC, or DOCX format.");
      return;
    }
    if (resumeFile.size > maxResumeFileSizeBytes) {
      setErrorMessage("CV file must be 5MB or smaller.");
      return;
    }

    setUploadingResume(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = await uploadMyResume(resumeFile);
      setProfile(updated);
      setResumeFile(null);
      setSuccessMessage("CV uploaded.");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not upload CV.");
      }
    } finally {
      setUploadingResume(false);
    }
  };

  if (!isFreelancer && !isClient) {
    return (
      <section className="surface-card">
        <h1 className="section-title">Profile</h1>
        <p className="error-text">This page is available only for CLIENT or FREELANCER accounts.</p>
      </section>
    );
  }

  return (
    <div className="surface-grid">
      <section className="surface-card">
        <h1 className="section-title">Edit Profile</h1>
        <div className="row-actions">
          <span className="pill">{roleLabel}</span>
          <button type="button" className="btn-secondary" onClick={() => void refreshProfile()} disabled={loading || saving}>
            {loading ? "Refreshing..." : "Refresh profile"}
          </button>
        </div>
        <p className="muted-text mt-sm mb-0">Account email: {profile?.email ?? session?.email ?? "-"}</p>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {successMessage ? <p className="success-text">{successMessage}</p> : null}
      </section>

      <section className="surface-card">
        <form className="form-grid" onSubmit={handleSaveProfile}>
          <label>
            <div className="field-label">Contact email</div>
            <input
              className="input-field"
              type="email"
              maxLength={255}
              value={form.contactEmail}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, contactEmail: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, contactEmail: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.contactEmail)}
              placeholder={profile?.email ?? "your@email.com"}
            />
            {fieldErrors.contactEmail ? <p className="error-text">{fieldErrors.contactEmail}</p> : null}
          </label>

          <label>
            <div className="field-label">{isFreelancer ? "Phone number" : "Company phone number"}</div>
            <input
              className="input-field"
              maxLength={32}
              value={form.phoneNumber}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, phoneNumber: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.phoneNumber)}
              placeholder="+84 912 345 678"
            />
            {fieldErrors.phoneNumber ? <p className="error-text">{fieldErrors.phoneNumber}</p> : null}
          </label>

          {isFreelancer ? (
            <>
              <label>
                <div className="field-label">Address</div>
                <input
                  className="input-field"
                  maxLength={255}
                  value={form.address}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, address: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, address: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.address)}
                  placeholder="City, district, country..."
                />
                {fieldErrors.address ? <p className="error-text">{fieldErrors.address}</p> : null}
              </label>

              <label>
                <div className="field-label">Skills (comma separated)</div>
                <input
                  className="input-field"
                  maxLength={500}
                  value={form.skills}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, skills: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, skills: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.skills)}
                  placeholder="react, spring boot, figma"
                />
                {fieldErrors.skills ? <p className="error-text">{fieldErrors.skills}</p> : null}
              </label>

              <label>
                <div className="field-label">Hourly rate (USD)</div>
                <input
                  className="input-field"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, hourlyRate: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, hourlyRate: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.hourlyRate)}
                  placeholder="35"
                />
                {fieldErrors.hourlyRate ? <p className="error-text">{fieldErrors.hourlyRate}</p> : null}
              </label>

              <label>
                <div className="field-label">Overview</div>
                <textarea
                  className="textarea-field"
                  maxLength={4000}
                  value={form.overview}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, overview: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, overview: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.overview)}
                  placeholder="Short bio about your experience and services"
                />
                {fieldErrors.overview ? <p className="error-text">{fieldErrors.overview}</p> : null}
              </label>
            </>
          ) : (
            <>
              <label>
                <div className="field-label">Company name</div>
                <input
                  className="input-field"
                  maxLength={255}
                  value={form.companyName}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, companyName: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, companyName: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.companyName)}
                  placeholder="SkillBridge Studio"
                />
                {fieldErrors.companyName ? <p className="error-text">{fieldErrors.companyName}</p> : null}
              </label>

              <label>
                <div className="field-label">Company address</div>
                <input
                  className="input-field"
                  maxLength={255}
                  value={form.companyAddress}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, companyAddress: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, companyAddress: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.companyAddress)}
                  placeholder="Building, street, city"
                />
                {fieldErrors.companyAddress ? <p className="error-text">{fieldErrors.companyAddress}</p> : null}
              </label>
            </>
          )}

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </section>

      {isFreelancer ? (
        <section className="surface-card">
          <h2 className="section-title">CV Upload</h2>
          <p className="muted-text">Accepted formats: PDF, DOC, DOCX (max 5MB).</p>
          <div className="row-actions mt-sm">
            <input
              className="input-field"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              disabled={uploadingResume}
            />
            <button type="button" className="btn-secondary" onClick={() => void handleUploadResume()} disabled={uploadingResume}>
              {uploadingResume ? "Uploading..." : "Upload CV"}
            </button>
          </div>
          <p className="muted-text mt-sm mb-0">Current CV: {profile?.resumeFileName ?? "Not uploaded yet"}</p>
        </section>
      ) : null}
    </div>
  );
}
