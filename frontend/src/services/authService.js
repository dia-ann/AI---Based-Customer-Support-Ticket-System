import api from "./api";

export async function login(email, password) {
  const response = await api.post("/auth/login", { email, password });
  const data = response.data;
  // Expected shape: { access_token, user: { id, name, email, role } }
  return data;
}

export async function register(payload) {
  // payload: { email, password }
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  }
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}
