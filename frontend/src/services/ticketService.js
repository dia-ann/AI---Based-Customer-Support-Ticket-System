import api from "./api";

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

// --- Customer-facing ---
export async function createTicket(payload) {
  const body = {
    subject: payload.subject,
    body_redacted: payload.body_redacted ?? payload.description,
    category_id: payload.category_id || null,
    department_id: payload.department_id || null,
    priority: payload.priority || null,
  };

  const { data } = await api.post("/tickets/", body);
  return data;
}

export async function getMyTickets(params = {}) {
  const { data } = await api.get("/tickets/", { params: cleanParams(params) });
  return data;
}

export async function getTicketById(ticketId) {
  const { data } = await api.get(`/tickets/${ticketId}`);
  return data;
}

export async function addCustomerReply(ticketId, message) {
  const { data } = await api.post("/replies/", {
    ticket_id: ticketId,
    body: message,
    is_auto_reply: false,
  });
  return data;
}

// --- Agent-facing ---
export async function getQueue(params = {}) {
  const { data } = await api.get("/tickets/", { params: cleanParams(params) });
  return data;
}

export async function assignTicket(ticketId, agentId) {
  const { data } = await api.put(`/tickets/${ticketId}`, {
    assigned_agent_id: agentId,
  });
  return data;
}

export async function updateTicketStatus(ticketId, status) {
  const { data } = await api.put(`/tickets/${ticketId}`, { status });
  return data;
}

export async function sendAgentReply(ticketId, message) {
  const { data } = await api.post("/replies/", {
    ticket_id: ticketId,
    body: message,
    is_auto_reply: false,
  });
  return data;
}

export async function getTicketReplies(ticketId) {
  const { data } = await api.get(`/replies/ticket/${ticketId}`);
  return data;
}

// Backend endpoint not available yet.
export async function getSuggestedReply() {
  return { suggestion: "" };
}

// Backend endpoint not available yet.
export async function getTicketEvents() {
  return [];
}