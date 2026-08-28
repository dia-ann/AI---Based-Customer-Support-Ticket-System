import { useEffect, useMemo, useState } from "react";
import * as adminService from "../../services/adminService";
import { useToast } from "../common/Toast";
import Loader from "../common/Loader";

const SUPER_ADMIN_EMAIL = "admin@test.com";

function assignmentValue(user) {
  if (user.role === "admin") return "admin";
  if (user.role === "agent" && user.department_id)
    return `agent:${user.department_id}`;
  return "";
}

export default function UserMgmt() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    Promise.all([adminService.getUsers(), adminService.getDepartments()])
      .then(([userList, departmentList]) => {
        setUsers(
          userList.filter(
            (u) =>
              u.email?.toLowerCase() !== SUPER_ADMIN_EMAIL &&
              u.role !== "customer",
          ),
        );
        setDepartments(departmentList);
      })
      .finally(() => setLoading(false));
  }, []);

  const departmentsById = useMemo(
    () =>
      Object.fromEntries(
        departments.map((department) => [department.id, department]),
      ),
    [departments],
  );

  function assignmentLabel(user) {
    if (user.role === "admin") return "Admin";
    if (user.role === "agent" && user.department_id) {
      return `Agent - ${departmentsById[user.department_id]?.name || "Department"}`;
    }
    return "Unassigned";
  }

  async function handleAssignmentChange(userId, value) {
    const selectedDepartmentId = value.replace("agent:", "");
    const selectedDepartment = departmentsById[selectedDepartmentId];
    const isAdministration =
      selectedDepartment?.name?.trim().toLowerCase() === "administration";

    const payload = {
      role: isAdministration ? "admin" : "agent",
      department_id: selectedDepartmentId,
    };

    try {
      const updatedUser = await adminService.updateUserRole(userId, payload);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      showToast("Assignment updated", "success");
    } catch {
      showToast("Failed to update assignment", "error");
    }
  }

  function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    showToast("Invite flow isn't wired to the backend yet", "info");
    setInviteEmail("");
  }

  if (loading) return <Loader />;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          Team Members ({users.length})
        </h2>
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
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-200">
                  {u.name}
                </span>
                <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {assignmentLabel(u)}
                </span>
              </div>
              <p className="text-xs text-gray-500">{u.email}</p>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={
                  u.is_active === false
                    ? "text-xs text-gray-500"
                    : "text-xs text-green-400"
                }
              >
                {u.is_active === false ? "Inactive" : "Active"}
              </span>
              <select
                value={assignmentValue(u)}
                onChange={(e) => handleAssignmentChange(u.id, e.target.value)}
                className="rounded-lg border border-surface-border bg-surface-bg px-2 py-1 text-xs text-gray-300"
              >
                <option value="admin">Admin</option>
                {departments.map((department) => (
                  <option key={department.id} value={`agent:${department.id}`}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {!users.length && (
          <p className="py-3 text-sm text-gray-500">
            No editable team members yet.
          </p>
        )}
      </div>
    </div>
  );
}
