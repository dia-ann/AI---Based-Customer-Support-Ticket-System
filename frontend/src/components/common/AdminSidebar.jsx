import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";
import Logo from "./Logo";

const NAV_ITEMS = [
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/agent/dashboard", label: "Agent View" },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col justify-between border-r border-surface-border bg-surface-sidebar px-4 py-6">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <Logo size={24} />
          <span className="text-base font-semibold text-white">Deskwise</span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-600/20 text-accent"
                    : "text-gray-400 hover:bg-surface-hover hover:text-gray-200"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-surface-border px-2 pt-4">
        <p className="text-sm font-medium text-white">{user?.name || "Admin User"}</p>
        <p className="text-xs capitalize text-gray-500">{user?.role || "admin"}</p>
        <button
          onClick={handleLogout}
          className="mt-2 text-sm font-medium text-red-400 hover:text-red-300"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
