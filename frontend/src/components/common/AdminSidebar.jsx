import { NavLink, useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const navigate = useNavigate();
  return (
    <div className="w-64 min-h-screen bg-[#0f121a] border-r border-[#232838] flex flex-col justify-between">
      <div className="p-4">
        <div className="flex items-center gap-3 px-2 py-2 mb-8">
          <div className="w-9 h-9 bg-[#12131a] rounded-xl flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M6 18 C6 8 10 3 18 3 C26 3 30 8 30 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="4" y="15" width="10" height="14" rx="5" stroke="white" strokeWidth="2.5" />
              <rect x="22" y="15" width="10" height="14" rx="5" stroke="white" strokeWidth="2.5" />
              <path d="M10 28 Q18 36 28 28" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M8 16 Q18 13 28 16 L28 26 Q18 29 8 26 Z" fill="#FFB800" />
              <path d="M18 17 L19.5 20.5 L23 22 L19.5 23.5 L18 27 L16.5 23.5 L13 22 L16.5 20.5 Z" fill="white" />
            </svg>
          </div>
          <span className="text-white font-bold text-[18px]">Deskwise</span>
        </div>
        <nav className="space-y-2">
          <NavLink to="/admin/analytics" className={({ isActive }) => `block px-4 py-2.5 rounded-xl text-[13px] ${isActive ? "bg-[#f2b705] text-black font-medium" : "text-gray-400 hover:text-white"}`}>Analytics</NavLink>

          {/* AGENT - ADDED */}
          <NavLink to="/agent" className={({ isActive }) => `block px-4 py-2.5 rounded-xl text-[13px] ${isActive ? "bg-[#f2b705] text-black font-medium" : "text-gray-400 hover:text-white"}`}>Agent Panel</NavLink>

          <NavLink to="/admin/settings" className={({ isActive }) => `block px-4 py-2.5 rounded-xl text-[13px] ${isActive ? "bg-[#f2b705] text-black font-medium" : "text-gray-400 hover:text-white"}`}>Settings</NavLink>
        </nav>
      </div>
      <div className="p-6 mb-8">
        <button onClick={() => { localStorage.clear(); navigate("/login"); }} className="flex items-center gap-2.5 text-[15px] font-medium text-red-500 hover:text-red-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Log out
        </button>
      </div>
    </div>
  );
}