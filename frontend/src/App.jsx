import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";
import AdminLayout from "./components/common/AdminLayout";
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NewTicket from "./pages/customer/NewTicket";
import MyTickets from "./pages/customer/MyTickets";
import AgentDashboard from "./pages/agent/Dashboard";
import TicketDetail from "./pages/agent/TicketDetail";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function HomeRedirect() {
  const { homeRoute } = useAuth();
  return <Navigate to={homeRoute} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer routes */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route
            path="/tickets/new"
            element={
              <AppLayout>
                <NewTicket />
              </AppLayout>
            }
          />
          <Route
            path="/tickets"
            element={
              <AppLayout>
                <MyTickets />
              </AppLayout>
            }
          />
        </Route>

        {/* Agent routes */}
        <Route element={<ProtectedRoute allowedRoles={["agent", "admin"]} />}>
          <Route
            path="/agent/dashboard"
            element={
              <AppLayout>
                <AgentDashboard />
              </AppLayout>
            }
          />
          <Route
            path="/agent/tickets/:ticketId"
            element={
              <AppLayout>
                <TicketDetail />
              </AppLayout>
            }
          />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route
            path="/admin/analytics"
            element={
              <AdminLayout>
                <Analytics />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminLayout>
                <Settings />
              </AdminLayout>
            }
          />
        </Route>

        {/* Fallback: send logged-in users to their home, others to login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeRedirect />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
