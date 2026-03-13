import type { CreateJobRequest, UserRole } from "@/lib/types";

type FieldErrors<TFields extends string> = Partial<Record<TFields, string>>;

type ValidationResult<TFields extends string> = {
  ok: boolean;
  fieldErrors: FieldErrors<TFields>;
};

export type LoginFields = "email" | "password";
export type RegisterFields = LoginFields | "confirmPassword" | "role";
export type CreateJobFields = "title" | "description" | "budgetMin" | "budgetMax" | "tags";
export type ProposalFields = "coverLetter" | "price" | "durationDays";

type RawLoginInput = {
  email: string;
  password: string;
};

type RawRegisterInput = RawLoginInput & {
  confirmPassword: string;
  role: string;
};

type RawCreateJobInput = {
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  tags: string;
};

type RawProposalInput = {
  coverLetter: string;
  price: string;
  durationDays: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: UserRole[] = ["CLIENT", "FREELANCER"];

function normalizeFieldKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function createResult<TFields extends string>(fieldErrors: FieldErrors<TFields>): ValidationResult<TFields> {
  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

function parsePositiveNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const number = Number(normalized);
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }
  return number;
}

function parsePositiveInteger(value: string): number | null {
  const number = parsePositiveNumber(value);
  if (number === null || !Number.isInteger(number)) {
    return null;
  }
  return number;
}

export function validateLoginInput(input: RawLoginInput): ValidationResult<LoginFields> {
  const fieldErrors: FieldErrors<LoginFields> = {};
  const email = input.email.trim();
  const password = input.password;

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email) || email.length > 254) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password.trim()) {
    fieldErrors.password = "Password is required.";
  } else if (password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters.";
  }

  return createResult(fieldErrors);
}

export function validateRegisterInput(input: RawRegisterInput): ValidationResult<RegisterFields> {
  const loginValidation = validateLoginInput({ email: input.email, password: input.password });
  const fieldErrors: FieldErrors<RegisterFields> = { ...loginValidation.fieldErrors };
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!fieldErrors.password && password.trim() && (!/[A-Za-z]/.test(password) || !/\d/.test(password))) {
    fieldErrors.password = "Password must include letters and numbers.";
  }

  if (!confirmPassword.trim()) {
    fieldErrors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (!VALID_ROLES.includes(input.role as UserRole)) {
    fieldErrors.role = "Please choose a valid role.";
  }

  return createResult(fieldErrors);
}

export function validateCreateJobInput(input: RawCreateJobInput): ValidationResult<CreateJobFields> {
  const fieldErrors: FieldErrors<CreateJobFields> = {};
  const title = input.title.trim();
  const description = input.description.trim();
  const budgetMin = parsePositiveNumber(input.budgetMin);
  const budgetMax = parsePositiveNumber(input.budgetMax);

  if (title.length < 6) {
    fieldErrors.title = "Title must be at least 6 characters.";
  } else if (title.length > 150) {
    fieldErrors.title = "Title cannot exceed 150 characters.";
  }

  if (description.length < 24) {
    fieldErrors.description = "Description must be at least 24 characters.";
  } else if (description.length > 4000) {
    fieldErrors.description = "Description cannot exceed 4000 characters.";
  }

  if (budgetMin === null) {
    fieldErrors.budgetMin = "Budget min must be a positive number.";
  }

  if (budgetMax === null) {
    fieldErrors.budgetMax = "Budget max must be a positive number.";
  }

  if (budgetMin !== null && budgetMax !== null && budgetMax < budgetMin) {
    fieldErrors.budgetMax = "Budget max must be greater than or equal to budget min.";
  }

  return createResult(fieldErrors);
}

export function toCreateJobPayload(input: RawCreateJobInput): CreateJobRequest {
  const uniqueTags = Array.from(
    new Map(
      input.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => [tag.toLowerCase(), tag] as const)
    ).values()
  );

  return {
    title: input.title.trim(),
    description: input.description.trim(),
    budgetMin: Number(input.budgetMin),
    budgetMax: Number(input.budgetMax),
    tags: uniqueTags,
  };
}

export function validateProposalInput(input: RawProposalInput): ValidationResult<ProposalFields> {
  const fieldErrors: FieldErrors<ProposalFields> = {};
  const coverLetter = input.coverLetter.trim();
  const price = parsePositiveNumber(input.price);
  const durationDays = parsePositiveInteger(input.durationDays);

  if (coverLetter.length < 40) {
    fieldErrors.coverLetter = "Cover letter must be at least 40 characters.";
  } else if (coverLetter.length > 4000) {
    fieldErrors.coverLetter = "Cover letter cannot exceed 4000 characters.";
  }

  if (price === null) {
    fieldErrors.price = "Price must be a positive number.";
  }

  if (durationDays === null) {
    fieldErrors.durationDays = "Duration must be a positive whole number.";
  } else if (durationDays > 365) {
    fieldErrors.durationDays = "Duration cannot exceed 365 days.";
  }

  return createResult(fieldErrors);
}

export function pickApiFieldErrors<TFields extends string>(
  fieldErrors: Record<string, string> | undefined,
  allowedFields: readonly TFields[]
): FieldErrors<TFields> {
  if (!fieldErrors) {
    return {};
  }

  const fieldMap = allowedFields.reduce<Record<string, TFields>>((acc, field) => {
    acc[normalizeFieldKey(field)] = field;
    return acc;
  }, {});

  return Object.entries(fieldErrors).reduce<FieldErrors<TFields>>((acc, [key, value]) => {
    const mappedKey = fieldMap[normalizeFieldKey(key)];
    if (mappedKey && value) {
      acc[mappedKey] = value;
    }
    return acc;
  }, {});
}
