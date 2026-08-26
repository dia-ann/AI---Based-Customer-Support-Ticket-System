export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"];

export const STATUS_COLORS = {
  open: "bg-status-open/10 text-status-open",
  in_progress: "bg-status-progress/10 text-status-progress",
  resolved: "bg-status-resolved/10 text-status-resolved",
  closed: "bg-status-closed/10 text-status-closed",
  breached: "bg-status-breached/10 text-status-breached",
};

export const ROLES = {
  CUSTOMER: "customer",
  AGENT: "agent",
  ADMIN: "admin",
};
