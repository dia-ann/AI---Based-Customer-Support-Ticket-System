import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Ticket, LogOut } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { formatRelativeTime } from "../../utils/formatters";
import { useAuth } from "../../hooks/useAuth";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifMenuRef = useRef(null);
  const { homeRoute } = useAuth();

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNotificationClick(notif) {
    markAsRead(notif.id);
    setShowNotifications(false);
    if (notif.ticketId) {
      navigate(`/agent/tickets/${notif.ticketId}`);
    }
  }

  return (
    <div className="w-64 min-h-screen bg-[#0f121a] border-r border-[#232838] flex flex-col justify-between">
      <div className="p-4">
        {/* Brand & Notification Header */}
        <div className="flex items-center justify-between px-2 py-2 mb-8">
          <Link
            to={homeRoute || "/admin/analytics"}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-9 h-9 bg-[#12131a] rounded-xl flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
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
            <span className="text-white font-bold text-[18px]">Deskwise</span>
          </Link>

          {/* Bell Icon in Admin Sidebar (Feature 8) */}
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1e2d] transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#f2b705] px-0.5 text-[9px] font-bold text-black ring-2 ring-[#0f121a] animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-full top-0 z-50 ml-2 w-80 rounded-2xl border border-[#232838] bg-[#141824] shadow-2xl p-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[#232838] pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#f2b705]/20 px-2 py-0.5 text-[10px] font-semibold text-[#f2b705]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#f2b705]"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span>Read all</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`group flex cursor-pointer items-start gap-2.5 rounded-xl p-2 transition-colors ${
                          notif.read
                            ? "hover:bg-[#1b2030] text-gray-400"
                            : "bg-[#0b0d13] border border-[#f2b705]/20 text-gray-200 hover:border-[#f2b705]/40"
                        }`}
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#1b2030] text-[#f2b705]">
                          <Ticket className="h-3 w-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white group-hover:text-[#f2b705] truncate">
                            {notif.title}
                          </p>
                          <p className="line-clamp-2 text-[11px] text-gray-400">
                            {notif.message}
                          </p>
                          <p className="text-[9px] text-gray-500 mt-0.5">
                            {formatRelativeTime(notif.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="space-y-2">
          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-[13px] ${isActive ? "bg-[#f2b705] text-black font-medium" : "text-gray-400 hover:text-white"}`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/admin/triage"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-[13px] ${isActive ? "bg-[#f2b705] text-black font-medium" : "text-gray-400 hover:text-white"}`
            }
          >
            Tickets Panel
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-[13px] ${isActive ? "bg-[#f2b705] text-black font-medium" : "text-gray-400 hover:text-white"}`
            }
          >
            Settings
          </NavLink>
        </nav>
      </div>

      <div className="p-6 mb-8">
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="flex items-center gap-2.5 text-[15px] font-medium text-red-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
