import { createContext, useEffect, useState } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: if a token exists, restore the session by fetching the profile.
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .fetchCurrentUser()
      .then((profile) => setUser(withDisplayName(profile)))
      .catch(() => clearSession()) // token expired/invalid -> log out cleanly
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    // 1) exchange credentials for tokens
    const { access_token, refresh_token } = await authService.login(email, password);
    localStorage.setItem("access_token", access_token);
    if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
    // 2) role lives in public.users, not in the login response -> fetch /auth/me
    const profile = withDisplayName(await authService.fetchCurrentUser());
    localStorage.setItem("user", JSON.stringify(profile));
    setUser(profile);
    return profile; // Login.jsx reads profile.role from this
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }

  function clearSession() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// The users table has no name column yet, so /auth/me returns no name.
// Fall back to the email's local-part so the navbar isn't blank.
function withDisplayName(profile) {
  if (!profile) return profile;
  return { ...profile, name: profile.name ?? profile.email?.split("@")[0] ?? "User" };
}