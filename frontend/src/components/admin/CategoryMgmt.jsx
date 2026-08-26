import { useEffect, useState } from "react";
import * as adminService from "../../services/adminService";
import { useToast } from "../common/Toast";

export default function CategoryMgmt() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const category = await adminService.createCategory({ name: newName });
      setCategories((prev) => [...prev, category]);
      setNewName("");
    } catch {
      showToast("Failed to create category", "error");
    }
  }

  async function handleRemove(category) {
    try {
      await adminService.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch {
      showToast("Failed to remove category", "error");
    }
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-white">Categories</h2>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category"
          className="flex-1 rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-surface-border bg-surface-hover px-4 py-2 text-sm font-medium text-gray-200 hover:bg-surface-border"
        >
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-hover px-3 py-1 text-xs text-gray-300"
            >
              {c.name}
              <button onClick={() => handleRemove(c)} className="text-gray-500 hover:text-red-400" aria-label={`Remove ${c.name}`}>
                ✕
              </button>
            </span>
          ))}
          {!categories.length && <p className="text-sm text-gray-500">No categories yet.</p>}
        </div>
      )}
    </div>
  );
}
