import api from "./api";

export async function login(email, password) {
  const response = await api.post("/auth/login", { email, password });
  // { access_token, refresh_token, user: { id, email, role, must_change_password } }
  return response.data;
}

export async function register(payload) {
  // Public signup only ever creates CUSTOMERS. Agents are invited by an admin.
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  }
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

// Signed-in change (used for the forced first-login change too).
export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}

// From the login screen: prove identity with the old password, set a new one.
export async function forgotPassword(email, currentPassword, newPassword) {
  const { data } = await api.post("/auth/forgot-password", {
    email,
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}