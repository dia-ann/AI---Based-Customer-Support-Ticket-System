import UserMgmt from "../../components/admin/UserMgmt";
import CategoryMgmt from "../../components/admin/CategoryMgmt";
import SLAConfig from "../../components/admin/SLAConfig";

export default function Settings() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-gray-500">Manage your team, categories, and SLA policy.</p>
      </div>

      <UserMgmt />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryMgmt />
        <SLAConfig />
      </div>
    </div>
  );
}
