import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email address.").max(254, "Email is too long.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = loginSchema
  .extend({
    role: z.enum(["CLIENT", "FREELANCER"]),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
      });
    }
  });

export const createJobSchema = z
  .object({
    title: z.string().trim().min(6, "Title must be at least 6 characters.").max(150, "Title cannot exceed 150 characters."),
    description: z
      .string()
      .trim()
      .min(24, "Description must be at least 24 characters.")
      .max(4000, "Description cannot exceed 4000 characters."),
    budgetMin: z.coerce.number().positive("Budget min must be greater than 0."),
    budgetMax: z.coerce.number().positive("Budget max must be greater than 0."),
    tagsRaw: z.string().max(300, "Tags input is too long."),
    companyName: z.string().trim().max(255, "Company name is too long.").optional().or(z.literal("")),
    location: z.string().trim().max(255, "Location is too long.").optional().or(z.literal("")),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).optional().or(z.literal("")),
    remote: z.boolean().default(false),
    experienceYears: z.coerce.number().int().min(0).max(60).optional().nullable(),
    status: z.enum(["DRAFT", "OPEN"]).default("DRAFT"),
    expiresAt: z.string().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.budgetMax < value.budgetMin) {
      ctx.addIssue({
        path: ["budgetMax"],
        code: z.ZodIssueCode.custom,
        message: "Budget max must be greater than or equal to budget min.",
      });
    }
  });

export const proposalSchema = z.object({
  coverLetter: z.string().trim().min(40, "Cover letter must be at least 40 characters.").max(4000, "Cover letter is too long."),
  price: z.coerce.number().positive("Price must be greater than 0."),
  durationDays: z.coerce.number().int().min(1, "Duration must be at least 1 day.").max(365, "Duration cannot exceed 365 days."),
});

export const reviewProposalSchema = z.object({
  feedbackMessage: z.string().trim().min(6, "Feedback is too short.").max(2000, "Feedback is too long."),
});

export const rejectProposalSchema = z.object({
  feedbackMessage: z.string().trim().min(6, "Feedback is too short.").max(2000, "Feedback is too long."),
});

export const scheduleInterviewSchema = z
  .object({
    interviewScheduledAt: z.string().min(1, "Interview start is required."),
    interviewEndsAt: z.string().min(1, "Interview end is required."),
    meetingLink: z.string().trim().max(512, "Meeting link is too long.").optional().or(z.literal("")),
    notes: z.string().trim().max(2000, "Notes are too long.").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.interviewScheduledAt);
    const end = new Date(value.interviewEndsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }
    if (end <= start) {
      ctx.addIssue({
        path: ["interviewEndsAt"],
        code: z.ZodIssueCode.custom,
        message: "Interview end must be after interview start.",
      });
    }
  });

export const profileFreelancerSchema = z.object({
  contactEmail: z.union([emailSchema, z.literal("")]),
  phoneNumber: z.string().trim().max(32, "Phone is too long.").optional().or(z.literal("")),
  address: z.string().trim().max(255, "Address is too long.").optional().or(z.literal("")),
  skillsRaw: z.string().max(500, "Skills text is too long."),
  hourlyRate: z.union([z.literal(""), z.coerce.number().positive("Hourly rate must be greater than 0.")]),
  overview: z.string().trim().max(4000, "Overview is too long.").optional().or(z.literal("")),
});

export const profileClientSchema = z.object({
  contactEmail: z.union([emailSchema, z.literal("")]),
  phoneNumber: z.string().trim().max(32, "Phone is too long.").optional().or(z.literal("")),
  companyName: z.string().trim().max(255, "Company name is too long.").optional().or(z.literal("")),
  companyAddress: z.string().trim().max(255, "Company address is too long.").optional().or(z.literal("")),
});
