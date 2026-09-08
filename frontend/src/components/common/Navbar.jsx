import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import UserMenu from "./UserMenu";

export default function Navbar() {
  const { isAgent, isAdmin, isCustomer, homeRoute } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-surface-border bg-surface-card px-6 py-3">
      <Link to={homeRoute} className="text-lg font-semibold text-white">
        Desk<span className="text-accent">wise</span>
      </Link>

      <nav className="flex items-center gap-4 text-sm text-gray-300">
        {isCustomer && (
          <>
            <Link to="/tickets/new" className="hover:text-accent transition-colors">New Ticket</Link>
            <Link to="/tickets" className="hover:text-accent transition-colors">My Tickets</Link>
          </>
        )}
        {isAgent && (
          <>
            <Link to="/agent/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link to="/admin/analytics" className="hover:text-accent transition-colors">Analytics</Link>
            <Link to="/admin/settings" className="hover:text-accent transition-colors">Settings</Link>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {/* Top-Right Username with User Card */}
        <UserMenu position="top-right" />
      </div>
    </header>
  );
}
