// TEMP: Preview-mode mock data. Used only when VITE_PREVIEW_MODE=true
// (see .env). Safe to delete this whole file once the real backend is wired
// up — remove the import + adapter block in api.js at the same time.

export const MOCK_TICKETS = [
  {
    id: "t-1001",
    subject: "Can't reset my password",
    customer_name: "Riya Sharma",
    priority: "high",
    status: "open",
    sla_due_at: new Date(Date.now() + 1000 * 60 * 40).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "t-1002",
    subject: "Invoice shows wrong plan",
    customer_name: "Aman Verma",
    priority: "medium",
    status: "in_progress",
    sla_due_at: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "t-1003",
    subject: "App crashes on file upload",
    customer_name: "Neha Gupta",
    priority: "urgent",
    status: "open",
    sla_due_at: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "t-1004",
    subject: "Feature request: dark mode",
    customer_name: "Karan Mehta",
    priority: "low",
    status: "resolved",
    sla_due_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export const MOCK_TICKET_DETAIL = {
  id: "t-1001",
  subject: "Can't reset my password",
  customer_name: "Riya Sharma",
  status: "open",
  priority: "high",
  sla_due_at: new Date(Date.now() + 1000 * 60 * 40).toISOString(),
  messages: [
    {
      id: "m-1",
      author_name: "Riya Sharma",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      message: "I requested a password reset link twice but never got the email.",
      is_internal_note: false,
    },
    {
      id: "m-2",
      author_name: "Agent Priya",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      message: "Checked — the email was going to spam. Resent manually, please check.",
      is_internal_note: false,
    },
    {
      id: "m-3",
      author_name: "Agent Priya",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      message: "Also flagged our mail provider's spam score for this domain.",
      is_internal_note: true,
    },
  ],
};

export const MOCK_ANALYTICS = {
  total_tickets: 128,
  total_tickets_trend: 12,
  open_count: 34,
  open_count_trend: -4,
  resolved_today: 9,
  resolved_today_trend: 20,
  avg_response_label: "2h 14m",
  avg_response_trend: -8,
  tickets_by_category: [
    { name: "billing", count: 41 },
    { name: "technical", count: 55 },
    { name: "account", count: 18 },
    { name: "general", count: 14 },
  ],
  sla_compliance: { overall: 87, response: 91, resolution: 84, csat: 93 },
};

export const MOCK_USERS = [
  { id: "u-1", name: "Preview Admin", email: "preview@example.com", role: "admin" },
  { id: "u-2", name: "Agent Priya", email: "priya@example.com", role: "agent" },
  { id: "u-3", name: "Riya Sharma", email: "riya@example.com", role: "customer" },
];

export const MOCK_CATEGORIES = [
  { id: "c-1", name: "billing" },
  { id: "c-2", name: "technical" },
  { id: "c-3", name: "account" },
  { id: "c-4", name: "general" },
];

export const MOCK_SLA_POLICIES = [
  { id: "s-1", priority: "low", response_minutes: 240, resolution_minutes: 4320 },
  { id: "s-2", priority: "medium", response_minutes: 120, resolution_minutes: 1440 },
  { id: "s-3", priority: "high", response_minutes: 30, resolution_minutes: 480 },
  { id: "s-4", priority: "urgent", response_minutes: 15, resolution_minutes: 120 },
];

// Ordered list of [matcher, responder] pairs. First match wins.
// matcher: (method, url) => boolean
// responder: (config) => any  (the JSON body to resolve with)
export const MOCK_ROUTES = [
  [(m, u) => m === "get" && /\/agents\/queue/.test(u), () => MOCK_TICKETS],
  [(m, u) => m === "get" && /\/tickets\/mine/.test(u), () => MOCK_TICKETS],
  [(m, u) => m === "get" && /\/tickets\/[^/]+\/events/.test(u), () => []],
  [(m, u) => m === "get" && /\/agents\/tickets\/[^/]+\/suggest-reply/.test(u), () => ({ suggestion: "Thanks for reaching out — I'm looking into this now." })],
  [(m, u) => m === "get" && /\/tickets\/[^/]+$/.test(u), () => MOCK_TICKET_DETAIL],
  [(m, u) => m === "get" && /\/admin\/analytics\/overview/.test(u), () => MOCK_ANALYTICS],
  [(m, u) => m === "get" && /\/admin\/users/.test(u), () => MOCK_USERS],
  [(m, u) => m === "get" && /\/admin\/categories/.test(u), () => MOCK_CATEGORIES],
  [(m, u) => m === "get" && /\/admin\/sla-policies/.test(u), () => MOCK_SLA_POLICIES],
  // Writes: just echo something reasonable back instead of hitting a real API.
  [(m, u) => m === "post" && /\/tickets$/.test(u), (config) => ({ id: `t-${Date.now()}`, ...JSON.parse(config.data || "{}") })],
  [(m) => ["post", "patch", "delete"].includes(m), () => ({ ok: true })],
];
