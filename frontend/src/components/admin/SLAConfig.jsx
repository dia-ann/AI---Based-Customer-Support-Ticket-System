import { useEffect, useState } from "react";
import * as adminService from "../../services/adminService";
import { useToast } from "../common/Toast";
import Loader from "../common/Loader";

export default function SLAConfig() {
  const { showToast } = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    adminService
      .getSLAPolicies()
      .then(setPolicies)
      .finally(() => setLoading(false));
  }, []);

  function handleChange(id, field, value) {
    setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function handleSave(policy) {
    setSavingId(policy.id);
    try {
      await adminService.updateSLAPolicy(policy.id, {
        response_minutes: Number(policy.response_minutes),
        resolution_minutes: Number(policy.resolution_minutes),
      });
      showToast("SLA policy saved", "success");
    } catch {
      showToast("Failed to save policy", "error");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-white">SLA Configuration</h2>

      <div className="space-y-4">
        {policies.map((p) => (
          <div key={p.id} className="rounded-lg border border-surface-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{p.priority}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-500">
                First Response (minutes)
                <input
                  type="number"
                  value={p.response_minutes}
                  onChange={(e) => handleChange(p.id, "response_minutes", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-gray-200 focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs text-gray-500">
                Resolution Time (minutes)
                <input
                  type="number"
                  value={p.resolution_minutes}
                  onChange={(e) => handleChange(p.id, "resolution_minutes", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-gray-200 focus:border-accent focus:outline-none"
                />
              </label>
            </div>
            <button
              onClick={() => handleSave(p)}
              disabled={savingId === p.id}
              className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-black hover:bg-accent-hover disabled:opacity-50"
            >
              {savingId === p.id ? "Saving…" : "Save"}
            </button>
          </div>
        ))}
        {!policies.length && <p className="text-sm text-gray-500">No SLA policies configured.</p>}
      </div>
    </div>
  );
}
