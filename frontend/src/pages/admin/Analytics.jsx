import { useEffect, useState } from "react";
import * as adminService from "../../services/adminService";
import Loader from "../../components/common/Loader";
import RadialProgress from "../../components/common/RadialProgress";

function TrendBadge({ value }) {
  if (value === undefined || value === null) return null;
  const positive = value >= 0;
  return (
    <span className={positive ? "text-xs font-medium text-green-400" : "text-xs font-medium text-red-400"}>
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

function KpiCard({ label, value, trend, valueClassName }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <TrendBadge value={trend} />
      </div>
      <p className={`mt-3 text-2xl font-semibold ${valueClassName || "text-white"}`}>{value}</p>
    </div>
  );
}

function CategoryBar({ name, count, max }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-gray-300">{name}</span>
        <span className="text-gray-500">{count}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminService.getAnalyticsOverview().then(setStats);
  }, []);

  if (!stats) return <Loader fullScreen />;

  const categories = stats.tickets_by_category || [];
  const maxCategoryCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500">Track performance, SLA and team productivity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Tickets" value={stats.total_tickets} trend={stats.total_tickets_trend} valueClassName="text-accent" />
        <KpiCard label="Open / Pending" value={stats.open_count} trend={stats.open_count_trend} valueClassName="text-orange-400" />
        <KpiCard label="Resolved Today" value={stats.resolved_today} trend={stats.resolved_today_trend} valueClassName="text-green-400" />
        <KpiCard label="Avg Response" value={stats.avg_response_label} trend={stats.avg_response_trend} valueClassName="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h2 className="mb-5 text-sm font-semibold text-white">Tickets by Category</h2>
          <div className="space-y-4">
            {categories.map((c) => (
              <CategoryBar key={c.name} name={c.name} count={c.count} max={maxCategoryCount} />
            ))}
            {!categories.length && <p className="text-sm text-gray-500">No ticket data yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h2 className="mb-5 text-sm font-semibold text-white">SLA Compliance</h2>
          <div className="flex flex-col items-center gap-5">
            <RadialProgress percentage={stats.sla_compliance?.overall ?? 0} label="On Time" />
            <div className="grid w-full grid-cols-3 text-center">
              <div>
                <p className="text-lg font-semibold text-accent">{stats.sla_compliance?.response ?? 0}%</p>
                <p className="text-xs text-gray-500">Response</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-green-400">{stats.sla_compliance?.resolution ?? 0}%</p>
                <p className="text-xs text-gray-500">Resolution</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-400">
                  {stats.sla_compliance?.csat != null ? `${stats.sla_compliance.csat}%` : "—"}
                </p>
                <p className="text-xs text-gray-500">CSAT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
