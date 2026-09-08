import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import UserMenu from "./UserMenu";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0a0c10]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0c10] overflow-y-auto">
        {/* Top Header Bar with Top-Right Username */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-[#232838] bg-[#0f121a]/85 backdrop-blur px-8">
          <div className="flex items-center gap-3">
            <UserMenu position="top-right" />
          </div>
        </header>

        <main className="flex-1">{children ? children : <Outlet />}</main>
      </div>
    </div>
  );
}
