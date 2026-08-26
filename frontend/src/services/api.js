import axios from "axios";
import { MOCK_ROUTES } from "./mockData";

// TEMP: Preview mode — set VITE_PREVIEW_MODE=true in frontend/.env to view
// every page with instant mock data and zero backend calls. Turn it off
// (or delete this block + mockData.js) once the real backend is wired up.
const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === "true";

function mockAdapter(config) {
  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";
  const match = MOCK_ROUTES.find(([test]) => test(method, url));
  const data = match ? match[1](config) : {};

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data, status: 200, statusText: "OK", headers: {}, config });
    }, 150); // small delay so loading states are visible, not instant-flash
  });
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
  ...(PREVIEW_MODE ? { adapter: mockAdapter } : {}),
});

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
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
