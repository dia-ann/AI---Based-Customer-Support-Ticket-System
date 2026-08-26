import { createContext, useEffect, useState } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TEMP: mock auth for frontend-only preview — no backend required.
  // Change "role" below to "agent" or "customer" to preview those views instead.
  const [user, setUser] = useState({
    id: "mock-id",
    name: "Preview Admin",
    email: "preview@example.com",
    role: "admin",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  async function login(email, password) {
    const { access_token, user: loggedInUser } = await authService.login(email, password);
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
