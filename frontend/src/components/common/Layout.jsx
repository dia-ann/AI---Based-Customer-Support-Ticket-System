import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../hooks/useAuth";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { homeRoute, user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0c10]">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar (Slide-in drawer on mobile, static on desktop) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Mobile Header Bar (< md) */}
        <header className="flex md:hidden items-center justify-between px-3 sm:px-4 py-2.5 bg-[#0f121a] border-b border-[#232838] shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1e2d] transition-colors focus:outline-none cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to={homeRoute || "/"} className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#12131a] rounded-lg flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
                  <path
                    d="M6 18 C6 8 10 3 18 3 C26 3 30 8 30 18"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <rect
                    x="4"
                    y="15"
                    width="10"
                    height="14"
                    rx="5"
                    stroke="white"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="22"
                    y="15"
                    width="10"
                    height="14"
                    rx="5"
                    stroke="white"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M10 28 Q18 36 28 28"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M8 16 Q18 13 28 16 L28 26 Q18 29 8 26 Z"
                    fill="#FFB800"
                  />
                  <path
                    d="M18 17 L19.5 20.5 L23 22 L19.5 23.5 L18 27 L16.5 23.5 L13 22 L16.5 20.5 Z"
                    fill="white"
                  />
                </svg>
              </div>
              <span className="text-white font-bold text-sm sm:text-base tracking-tight">
                Deskwise
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-1 rounded-full bg-[#f2b705]/20 border border-[#f2b705]/40 px-2 py-0.5 text-[10px] font-bold text-[#f2b705] animate-pulse"
                title={`${unreadCount} unread notification(s)`}
              >
                <span>{unreadCount > 9 ? "9+" : unreadCount}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="h-7 w-7 rounded-lg bg-[#1b2030] border border-[#2d3345] flex items-center justify-center text-[#f2b705] font-bold text-xs uppercase"
              aria-label="User profile"
            >
              {(user?.first_name || user?.name || user?.email || "U")[0]}
            </button>
          </div>
        </header>

        <main className="flex-1 bg-[#0a0c10] overflow-y-auto min-w-0">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
}
