// frontend/src/App.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";
import AdminLayout from "./components/common/AdminLayout";
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import FAQ from "./pages/FAQ";
import NewTicket from "./pages/customer/NewTicket";
import CustomerTicketDetail from "./pages/customer/TicketDetail";
import MyTickets from "./pages/customer/MyTickets";
import AgentDashboard from "./pages/agent/Dashboard";
import TicketDetail from "./pages/agent/TicketDetail";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import AgentPanel from "./pages/admin/AgentPanel";
import ResetPassword from "./pages/ResetPassword";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0B0D13]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function HomeRedirect() {
  const { homeRoute } = useAuth();
  return <Navigate to={homeRoute} replace />;
}

function RoleBasedLayout({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? (
    <AdminLayout>{children}</AdminLayout>
  ) : (
    <AppLayout>{children}</AppLayout>
  );
}

export default function App() {
  return (
    <div className="bg-gray-900">
      <ToastProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Signed in, but still on temporary password */}
            <Route element={<ProtectedRoute bypassPasswordGate />}>
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>

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
                path="/tickets/:ticketId"
                element={
                  <AppLayout>
                    <CustomerTicketDetail />
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
            <Route
              element={<ProtectedRoute allowedRoles={["agent", "admin"]} />}
            >
              <Route
                path="/agent/dashboard"
                element={
                  <RoleBasedLayout>
                    <AgentDashboard />
                  </RoleBasedLayout>
                }
              />

              <Route
                path="/agent/tickets/:ticketId"
                element={
                  <RoleBasedLayout>
                    <TicketDetail />
                  </RoleBasedLayout>
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

              <Route
                path="/admin/triage"
                element={
                  <AdminLayout>
                    <AgentPanel />
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
        </NotificationProvider>
      </ToastProvider>
    </div>
  );
}
