import { useState, useEffect } from "react";

const API = "http://localhost:5000/api"; // change if your backend is different

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sla, setSla] = useState({
    high: { firstResponse: 30, resolutionTime: 120 },
    medium: { firstResponse: 120, resolutionTime: 480 },
    low: { firstResponse: 240, resolutionTime: 1440 },
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // LOAD ALL DATA
  useEffect(() => {
    async function fetchAll() {
      try {
        const [uRes, cRes, sRes] = await Promise.all([
          fetch(`${API}/users`),
          fetch(`${API}/categories`),
          fetch(`${API}/sla`),
        ]);
        if (uRes.ok) setUsers(await uRes.json());
        if (cRes.ok) setCategories(await cRes.json());
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.high) setSla(sData);
        }
      } catch (err) {
        console.log("Backend not running yet");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // INVITE USER
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const res = await fetch(`${API}/users/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers([...users, newUser]);
        setInviteEmail("");
      }
    } catch (e) { alert("Invite failed - check backend"); }
  };

  // UPDATE ASSIGNMENT
  const updateAssignment = async (id, assignment) => {
    setUsers(users.map(u => u.id === id ? { ...u, assignment } : u));
    await fetch(`${API}/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignment }),
    });
  };

  // ADD CATEGORY
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await fetch(`${API}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories([...categories, cat]);
        setNewCategory("");
      }
    } catch (e) { alert("Add category failed"); }
  };

  // DELETE CATEGORY
  const deleteCategory = async (id) => {
    setCategories(categories.filter(c => c._id !== id && c.id !== id));
    await fetch(`${API}/categories/${id}`, { method: "DELETE" });
  };

  // SAVE SLA
  const saveSla = async (priority) => {
    try {
      await fetch(`${API}/sla`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sla),
      });
      alert(`${priority.toUpperCase()} SLA saved`);
    } catch (e) { alert("SLA save failed"); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-[#9ca3af] text-[13px]">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-bold">Settings</h1>
          <p className="text-[13px] text-[#9ca3af] mt-1">Manage your team, categories, and SLA policy.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#181b26] border border-[#232632] px-3 py-1.5 rounded-full">
          <div className="w-6 h-6 bg-[#fbbf24] rounded-full flex items-center justify-center text-black text-[11px] font-bold">A</div>
          <span className="text-[13px]">Admin</span>
        </div>
      </div>

      {/* USER MANAGEMENT */}
      <div className="bg-[#11131a] border border-[#232632] rounded-[12px] p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-[14px]">User Management ({users.length})</h2>
          <button onClick={handleInvite} className="bg-[#fbbf24] text-black text-[12px] px-3 py-1.5 rounded-full font-semibold">+ Invite</button>
        </div>

        <div className="flex gap-2 mb-4">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Enter email to invite"
            className="bg-[#0a0c10] border border-[#232632] rounded-[8px] px-3 py-2 text-[12px] w-[280px] outline-none" />
          <button onClick={handleInvite} className="bg-[#fbbf24] text-black text-[12px] px-4 py-2 rounded-[8px] font-semibold">+ Invite</button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12 text-[#9ca3af] text-[13px] border border-dashed border-[#232632] rounded-[8px]">No users found. Invite your first team member.</div>
        ) : (
          <>
            <div className="grid grid-cols-[2fr_2.5fr_1fr_1.5fr] text-[11px] text-[#9ca3af] px-3 py-2">
              <span>NAME</span><span>EMAIL</span><span>STATUS</span><span>ASSIGNMENT</span>
            </div>
            {users.map((u) => (
              <div key={u._id || u.id} className="grid grid-cols-[2fr_2.5fr_1fr_1.5fr] items-center px-3 py-2.5 border-t border-[#1a1d27] text-[13px]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#fbbf24] flex items-center justify-center text-[11px] font-bold text-black">{u.name?.[0] || u.email[0]}</div>
                  <span>{u.name || u.email.split('@')[0]}</span>
                </div>
                <span className="text-[#9ca3af] text-[12px]">{u.email}</span>
                <span className={`w-fit px-2 py-0.5 rounded text-[10px] ${u.status === "Inactive" ? "bg-[#2a1414] text-[#f87171]" : "bg-[#102a18] text-[#4ade80]"}`}>{u.status || "Active"}</span>
                <select value={u.assignment || u.role} onChange={(e) => updateAssignment(u._id || u.id, e.target.value)} className="bg-[#0a0c10] border border-[#232632] rounded-[6px] px-2 py-1 text-[12px] outline-none">
                  <option>Admin</option><option>Support</option><option>Technical</option><option>Billing</option><option>Administration</option>
                </select>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CATEGORY */}
        <div className="bg-[#11131a] border border-[#232632] rounded-[12px] p-5">
          <h2 className="font-semibold text-[14px] mb-4">Category Management</h2>
          <div className="flex gap-2 mb-4">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category" className="flex-1 bg-[#0a0c10] border border-[#232632] rounded-[8px] px-3 py-2 text-[12px] outline-none" />
            <button onClick={addCategory} className="bg-[#fbbf24] text-black text-[12px] px-3 py-2 rounded-[8px] font-semibold">+ Add Category</button>
          </div>
          {categories.length === 0 ? <div className="text-center py-8 text-[#9ca3af] text-[13px]">No categories yet.</div> : categories.map((c) => (
            <div key={c._id || c.id} className="flex justify-between items-center bg-[#0a0c10] border border-[#1a1d27] rounded-[8px] px-3 py-2.5 text-[13px] mb-2">
              <span>{c.name || c}</span>
              <button onClick={() => deleteCategory(c._id || c.id)} className="text-[#f87171]">🗑</button>
            </div>
          ))}
        </div>

        {/* SLA */}
        <div className="bg-[#11131a] border border-[#232632] rounded-[12px] p-5">
          <h2 className="font-semibold text-[14px] mb-4">SLA Configuration</h2>
          <div className="space-y-4">
            {[{ key: "high", label: "HIGH", color: "text-[#f87171]" }, { key: "medium", label: "MEDIUM", color: "text-[#fbbf24]" }, { key: "low", label: "LOW", color: "text-[#4ade80]" }].map((row) => (
              <div key={row.key} className="bg-[#0a0c10] border border-[#1a1d27] rounded-[8px] p-3 flex items-center gap-3">
                <span className={`text-[11px] font-bold w-[55px] ${row.color}`}>{row.label}</span>
                <div className="flex-1"><p className="text-[10px] text-[#9ca3af] mb-1">First Response (minutes)</p><input type="number" value={sla[row.key].firstResponse} onChange={(e) => setSla({ ...sla, [row.key]: { ...sla[row.key], firstResponse: Number(e.target.value) } })} className="bg-[#11131a] border border-[#232632] rounded-[6px] px-2 py-1.5 text-[12px] w-full outline-none" /></div>
                <div className="flex-1"><p className="text-[10px] text-[#9ca3af] mb-1">Resolution Time (minutes)</p><input type="number" value={sla[row.key].resolutionTime} onChange={(e) => setSla({ ...sla, [row.key]: { ...sla[row.key], resolutionTime: Number(e.target.value) } })} className="bg-[#11131a] border border-[#232632] rounded-[6px] px-2 py-1.5 text-[12px] w-full outline-none" /></div>
                <button onClick={() => saveSla(row.key)} className="bg-[#fbbf24] text-black text-[11px] px-3 py-1.5 rounded-[8px] font-semibold self-end">Save Changes</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}