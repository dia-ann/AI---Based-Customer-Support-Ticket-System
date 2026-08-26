import api from "./api";

// Maps to backend/app/api/routes/tickets.py and agents.py

// --- Customer-facing ---
export async function createTicket(payload) {
  // payload: { subject, description, category_id?, attachments? }
  const { data } = await api.post("/tickets", payload);
  return data;
}

export async function getMyTickets(params = {}) {
  const { data } = await api.get("/tickets/mine", { params });
  return data;
}

export async function getTicketById(ticketId) {
  const { data } = await api.get(`/tickets/${ticketId}`);
  return data;
}

export async function addCustomerReply(ticketId, message) {
  const { data } = await api.post(`/tickets/${ticketId}/messages`, { message });
  return data;
}

// --- Agent-facing ---
export async function getQueue(params = {}) {
  // params: { status, priority, category_id, assigned_to_me }
  const { data } = await api.get("/agents/queue", { params });
  return data;
}

export async function assignTicket(ticketId, agentId) {
  const { data } = await api.patch(`/agents/tickets/${ticketId}/assign`, { agent_id: agentId });
  return data;
}

export async function updateTicketStatus(ticketId, status) {
  const { data } = await api.patch(`/agents/tickets/${ticketId}/status`, { status });
  return data;
}

export async function sendAgentReply(ticketId, message, isInternalNote = false) {
  const { data } = await api.post(`/agents/tickets/${ticketId}/reply`, {
    message,
    is_internal_note: isInternalNote,
  });
  return data;
}

export async function getSuggestedReply(ticketId) {
  // Calls the AI service (backend/app/ai/suggest_reply.py) via the API layer
  const { data } = await api.get(`/agents/tickets/${ticketId}/suggest-reply`);
  return data;
}

// --- Shared ---
export async function getTicketEvents(ticketId) {
  const { data } = await api.get(`/tickets/${ticketId}/events`);
  return data;
}
