import api from "./api";

export async function getUsers(params = {}) {
  const { data } = await api.get("/users/", { params });
  return data;
}

export async function updateUserRole(userId, payload) {
  const { data } = await api.put(`/users/${userId}`, payload);
  return data;
}

export async function getDepartments() {
  const { data } = await api.get("/departments/");
  return data;
}

export async function getCategories() {
  const { data } = await api.get("/categories/");
  return data;
}

export async function createCategory(payload) {
  const { data } = await api.post("/categories/", payload);
  return data;
}

export async function updateCategory(categoryId, payload) {
  const { data } = await api.put(`/categories/${categoryId}`, payload);
  return data;
}

export async function deleteCategory(categoryId) {
  await api.delete(`/categories/${categoryId}`);
}

export async function getSLAPolicies() {
  const { data } = await api.get("/sla-policies/");
  return data;
}

export async function updateSLAPolicy(policyId, payload) {
  const { data } = await api.put(`/sla-policies/${policyId}`, payload);
  return data;
}

// Backend analytics endpoint does not exist yet, so keep UI alive.
export async function getAnalyticsOverview() {
  const tickets = await api.get("/tickets/").then((res) => res.data).catch(() => []);

  return {
    total_tickets: tickets.length,
    total_tickets_trend: 0,
    open_count: tickets.filter((t) => ["open", "pending", "in_progress"].includes(t.status)).length,
    open_count_trend: 0,
    resolved_today: tickets.filter((t) => t.status === "resolved").length,
    resolved_today_trend: 0,
    avg_response_label: "N/A",
    avg_response_trend: 0,
    tickets_by_category: [],
    sla_compliance: { overall: 0, response: 0, resolution: 0, csat: null },
  };
}