import { formatDistanceToNow, format } from "date-fns";

export function formatRelativeTime(dateString) {
  if (!dateString) return "";
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function formatDateTime(dateString) {
  if (!dateString) return "";
  return format(new Date(dateString), "dd MMM yyyy, HH:mm");
}

export function truncate(text, max = 80) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
