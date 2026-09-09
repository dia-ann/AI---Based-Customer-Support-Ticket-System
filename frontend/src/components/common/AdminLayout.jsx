import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0a0c10]">
      <AdminSidebar />
      <div className="flex-1 bg-[#0a0c10] overflow-y-auto">
        {children ? children : <Outlet />}
      </div>
    </div>
  );
}