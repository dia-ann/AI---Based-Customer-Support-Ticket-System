import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "./Button";

export default function Navbar() {
  const { user, logout, isAgent, isAdmin, isCustomer, homeRoute } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <Link to={homeRoute} className="text-lg font-semibold text-brand-700">
        Deskwise
      </Link>

      <nav className="flex items-center gap-4 text-sm text-gray-600">
        {isCustomer && (
          <>
            <Link to="/tickets/new">New Ticket</Link>
            <Link to="/tickets">My Tickets</Link>
          </>
        )}
        {isAgent && (
          <>
            <Link to="/agent/dashboard">Dashboard</Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link to="/admin/analytics">Analytics</Link>
            <Link to="/admin/settings">Settings</Link>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{user?.name}</span>
        <Button variant="secondary" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
