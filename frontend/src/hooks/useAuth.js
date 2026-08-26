import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { RoleContext } from "../context/RoleContext";

export function useAuth() {
  const auth = useContext(AuthContext);
  const role = useContext(RoleContext);
  if (!auth) throw new Error("useAuth must be used within an AuthProvider");
  return { ...auth, ...role };
}
