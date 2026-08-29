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
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          Category Management
        </h2>
      </div>

      <form onSubmit={handleAdd} className="mb-5 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category"
          className="flex-1 rounded-lg border border-surface-border bg-surface-bg px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
        />

        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
        >
          + Add Category
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-hover px-3 py-2.5"
            >
              <span className="text-sm text-gray-200">{c.name}</span>

              <button
                onClick={() => handleRemove(c)}
                className="rounded-md px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-surface-border hover:text-red-400"
                aria-label={`Remove ${c.name}`}
              >
                ✕
              </button>
            </div>
          ))}

          {!categories.length && (
            <p className="py-3 text-sm text-gray-500">
              No categories yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}