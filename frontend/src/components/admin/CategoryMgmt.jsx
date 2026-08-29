import { useEffect, useState } from "react";
import * as adminService from "../../services/adminService";
import { useToast } from "../common/Toast";

export default function DepartmentMgmt() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDepartments()
      .then(setDepartments)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const department = await adminService.createDepartment({ name: newName });
      setDepartments((prev) => [...prev, department]);
      setNewName("");
    } catch {
      showToast("Failed to create department", "error");
    }
  }

  async function handleRemove(department) {
    try {
      await adminService.deleteDepartment(department.id);
      setDepartments((prev) => prev.filter((d) => d.id !== department.id));
    } catch {
      showToast("Failed to remove department", "error");
    }
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          Department Management
        </h2>
      </div>

      <form onSubmit={handleAdd} className="mb-5 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New department"
          className="flex-1 rounded-lg border border-surface-border bg-surface-bg px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
        />

        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
        >
          + Add Department
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {departments.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-hover px-3 py-2.5"
            >
              <span className="text-sm text-gray-200">{d.name}</span>

              <button
                onClick={() => handleRemove(d)}
                className="rounded-md px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-surface-border hover:text-red-400"
                aria-label={`Remove ${d.name}`}
              >
                ✕
              </button>
            </div>
          ))}

          {!departments.length && (
            <p className="py-3 text-sm text-gray-500">
              No departments yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}