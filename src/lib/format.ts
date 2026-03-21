import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return "-";
  }
  return format(parsed, "MMM d, yyyy HH:mm");
}

export function formatDateTime(value: string | null | undefined) {
  return formatDate(value);
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return "-";
  }
  return formatDistanceToNowStrict(parsed, { addSuffix: true });
}

export function formatRelativeDate(value: string | null | undefined) {
  return formatRelativeTime(value);
}

export function toLocalDateTimeInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return "";
  }
  return format(parsed, "yyyy-MM-dd'T'HH:mm");
}

export function toOptionalIsoDateTime(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (!isValid(parsed)) {
    return undefined;
  }
  return parsed.toISOString();
}
