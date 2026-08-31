import api from "./api";

export async function getUsers(params = {}) {
  const { data } = await api.get("/users/", { params });
  return data;
}

export async function updateUserRole(userId, payload) {
  const { data } = await api.put(`/users/${userId}`, payload);
  return data;
}

// Department services
export function getDepartments() {
  return api.get("/departments/").then((res) => res.data);
}

export function createDepartment(payload) {
  return api.post("/departments/", payload).then((res) => res.data);
}

export function updateDepartment(id, payload) {
  return api.put(`/departments/${id}`, payload).then((res) => res.data);
}

export function deleteDepartment(id) {
  return api.delete(`/departments/${id}`);
}

// SLA services
export async function getSLAPolicies() {
  const { data } = await api.get("/sla-policies/");
  return data;
}

export async function updateSLAPolicy(policyId, payload) {
  const { data } = await api.put(`/sla-policies/${policyId}`, payload);
  return data;
}

export async function getAnalyticsOverview() {
  const { data } = await api.get("/tickets/analytics");
  return data;
}

// export async function inviteUser(email) {
//   const { data } = await api.post("/users/invite", { email });
//   return data;
// }

export async function inviteUser(email, departmentId = null) {
  const { data } = await api.post("/users/invite", { 
    email, 
    department_id: departmentId 
  });
  return data;
}
