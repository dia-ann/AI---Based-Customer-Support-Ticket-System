import { useEffect, useState } from "react";
import * as adminService from "../../services/adminService";
import { useToast } from "../common/Toast";
import Loader from "../common/Loader";

const ROLE_OPTIONS = ["customer", "agent", "admin"];

export default function UserMgmt() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    adminService
      .getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId, role) {
    try {
      await adminService.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      showToast("Role updated", "success");
    } catch {
      showToast("Failed to update role", "error");
    }
  }

  function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    // No invite endpoint on the backend yet — wire this up to
    // POST /admin/users/invite once that route exists.
    showToast("Invite flow isn't wired to the backend yet", "info");
    setInviteEmail("");
  }

  if (loading) return <Loader />;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Team Members ({users.length})</h2>
      </div>

      <form onSubmit={handleInvite} className="mb-5 flex gap-2">
        <input
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Enter email to invite"
          className="flex-1 rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-hover"
        >
          Invite
        </button>
      </form>

      <div className="divide-y divide-surface-border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{u.name}</span>
                  <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    {u.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={u.is_active === false ? "text-xs text-gray-500" : "text-xs text-green-400"}>
                {u.is_active === false ? "Inactive" : "Active"}
              </span>
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                className="rounded-lg border border-surface-border bg-surface-bg px-2 py-1 text-xs text-gray-300"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {!users.length && <p className="py-3 text-sm text-gray-500">No team members yet.</p>}
      </div>
    </div>
  );
}
