import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Auth endpoints legitimately answer 401 for bad credentials — a hard redirect
// there would wipe the page before the error toast could render.
const NO_REDIRECT_ON_401 = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/verify-reset-token",
  "/auth/reset-password",
  "/auth/change-password",
];


// Attach the JWT to every outgoing request, if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized handling for expired/invalid sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = NO_REDIRECT_ON_401.some((path) => url.includes(path));

    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    // Backend blocks every other route until the temporary password is replaced.
    const detail = error.response?.data?.detail || "";
    if (
      error.response?.status === 403 &&
      detail.startsWith("Password change required") &&
      !window.location.pathname.includes("/change-password")
    ) {
      window.location.href = "/change-password";
    }

    return Promise.reject(error);
  }
);

export default api;