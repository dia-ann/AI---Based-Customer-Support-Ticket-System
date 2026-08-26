import api from "./api";

// Maps to backend/app/api/routes/admin.py
// (Not in the original folder list, but the admin pages need somewhere to call — add this file next to authService/ticketService.)

export async function getUsers(params = {}) {
  const { data } = await api.get("/admin/users", { params });
  return data;
}

export async function updateUserRole(userId, role) {
  const { data } = await api.patch(`/admin/users/${userId}`, { role });
  return data;
}

export async function getCategories() {
  const { data } = await api.get("/admin/categories");
  return data;
}

export async function createCategory(payload) {
  const { data } = await api.post("/admin/categories", payload);
  return data;
}

export async function updateCategory(categoryId, payload) {
  const { data } = await api.patch(`/admin/categories/${categoryId}`, payload);
  return data;
}

export async function deleteCategory(categoryId) {
  await api.delete(`/admin/categories/${categoryId}`);
}

export async function getSLAPolicies() {
  const { data } = await api.get("/admin/sla-policies");
  return data;
}

export async function updateSLAPolicy(policyId, payload) {
  const { data } = await api.patch(`/admin/sla-policies/${policyId}`, payload);
  return data;
}

export async function getAnalyticsOverview(params = {}) {
  // params: { from, to }
  const { data } = await api.get("/admin/analytics/overview", { params });
  return data;
}
