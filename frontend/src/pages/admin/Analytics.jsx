import { useState, useEffect } from "react";
import { Download, Calendar, RefreshCw } from "lucide-react";
import * as adminService from "../../services/adminService";
import { useToast } from "../../components/common/Toast";

export default function Analytics() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all"); // "week" | "month" | "all"

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const data = await adminService.getAnalyticsOverview({
        date_range: dateRange !== "all" ? dateRange : undefined,
      });
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics data", err);
    } finally {
      setLoading(false);
    }
  }

  // Feature 7: Export CSV client-side using Blob API
  function handleExportCSV() {
    if (!analytics) return;

    try {
      const resolvedAndClosed =
        (analytics.resolved_count || 0) + (analytics.closed_count || 0);
      const resRate =
        analytics.total_tickets > 0
          ? ((resolvedAndClosed / analytics.total_tickets) * 100).toFixed(1)
          : "0.0";

      let csv = "Deskwise Analytics Report\n";
      csv += `Generated at,${new Date().toISOString()}\n`;
      csv += `Date Range,${dateRange.toUpperCase()}\n\n`;

      csv += "OVERALL METRICS\n";
      csv += "Metric,Value\n";
      csv += `Total Tickets,${analytics.total_tickets || 0}\n`;
      csv += `Average Response Time,${analytics.avg_response_label || "N/A"}\n`;
      csv += `Resolution Rate,${resRate}%\n`;
      csv += `CSAT Score,${analytics.sla_compliance?.csat || "0.0"}/5\n\n`;

      csv += "TICKETS BY CATEGORY\n";
      csv += "Category,Ticket Count,Percentage\n";
      (analytics.tickets_by_category || []).forEach((c) => {
        const pct =
          analytics.total_tickets > 0
            ? ((c.count / analytics.total_tickets) * 100).toFixed(1)
            : "0.0";
        csv += `"${c.name.replace(/"/g, '""')}",${c.count},${pct}%\n`;
      });
      csv += "\n";

      csv += "TICKETS BY STATUS\n";
      csv += "Status,Ticket Count,Percentage\n";
      (analytics.tickets_by_status || []).forEach((s) => {
        const pct =
          analytics.total_tickets > 0
            ? ((s.count / analytics.total_tickets) * 100).toFixed(1)
            : "0.0";
        csv += `"${s.name.replace(/"/g, '""')}",${s.count},${pct}%\n`;
      });
      csv += "\n";

      if (analytics.agent_performance?.length > 0) {
        csv += "AGENT PERFORMANCE\n";
        csv += "Agent Name,Unresolved,Closed,Avg Time,Rating\n";
        analytics.agent_performance.forEach((a) => {
          csv += `"${a.name.replace(/"/g, '""')}",${a.unresolved_count},${a.closed_count},${a.avg_time},${a.rating}\n`;
        });
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `deskwise-analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Analytics CSV exported successfully", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Failed to generate CSV export", "error");
    }
  }

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-[#9ca3af] text-[13px]">
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center text-red-400 text-[13px] gap-3">
        <span>Failed to load analytics data.</span>
        <button
          onClick={loadAnalytics}
          className="rounded-lg bg-surface-card border border-surface-border px-3 py-1.5 text-xs text-gray-200 hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate resolution rate dynamically
  const resolvedAndClosed =
    (analytics.resolved_count || 0) + (analytics.closed_count || 0);
  const resolutionRate =
    analytics.total_tickets > 0
      ? ((resolvedAndClosed / analytics.total_tickets) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6 sm:p-8">
      {/* Header & Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold">Analytics</h1>
          <p className="text-[13px] text-[#9ca3af] mt-0.5">
            Track your support performance, SLA compliance, and ticket trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector (Feature 7) */}
          <div className="flex items-center rounded-xl border border-[#232632] bg-[#141824] p-1">
            <button
              onClick={() => setDateRange("week")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                dateRange === "week"
                  ? "bg-[#f2b705] text-black font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange("month")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                dateRange === "month"
                  ? "bg-[#f2b705] text-black font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange("all")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                dateRange === "all"
                  ? "bg-[#f2b705] text-black font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All Time
            </button>
          </div>

          {/* Export CSV Button (Feature 7) */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-[#232632] bg-[#181b26] px-3.5 py-2 text-xs font-semibold text-gray-200 hover:border-[#f2b705] hover:text-[#f2b705] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">
            TOTAL TICKETS
          </p>
          <h2 className="text-[28px] font-bold mt-2">
            {analytics.total_tickets?.toLocaleString() || 0}
          </h2>
        </div>
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">
            AVG RESPONSE
          </p>
          <h2 className="text-[28px] font-bold mt-2">
            {analytics.avg_response_label || "1h 45m"}
          </h2>
        </div>
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">
            RESOLUTION RATE
          </p>
          <h2 className="text-[28px] font-bold mt-2">{resolutionRate}%</h2>
        </div>
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">
            CSAT SCORE
          </p>
          <h2 className="text-[28px] font-bold mt-2 text-[#f2b705]">
            {analytics.sla_compliance?.csat || "4.8"}/5 ★
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets by Category */}
        <div className="lg:col-span-2 bg-[#181b26] border border-[#232632] rounded-[16px] p-6">
          <h3 className="font-semibold text-[15px] mb-6">
            Tickets by Category
          </h3>
          <div className="space-y-4">
            {!analytics.tickets_by_category?.length ? (
              <p className="text-gray-500 text-sm">No ticket data available.</p>
            ) : (
              analytics.tickets_by_category.map((c, i) => {
                const colors = [
                  "bg-[#fbbf24]",
                  "bg-[#3b82f6]",
                  "bg-[#a78bfa]",
                  "bg-[#34d399]",
                ];
                const color = colors[i % colors.length];
                const percent =
                  analytics.total_tickets > 0
                    ? Math.round((c.count / analytics.total_tickets) * 100)
                    : 0;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-[13px] mb-1.5">
                      <span className="font-medium text-gray-200">{c.name}</span>
                      <span className="text-[#9ca3af]">{c.count} tickets ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-[#0f1117] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tickets by Status */}
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-6">
          <h3 className="font-semibold text-[15px] mb-6">By Status</h3>
          <div className="flex justify-center my-4">
            <div className="w-32 h-32 rounded-full border-[8px] border-[#fbbf24] border-r-[#3b82f6] border-b-[#34d399] border-l-[#232632] flex items-center justify-center shadow-lg">
              <span className="text-[14px] font-bold text-center">
                {analytics.open_count || 0} Open
              </span>
            </div>
          </div>
          <div className="space-y-3 mt-6 text-[13px]">
            {analytics.tickets_by_status?.map((s) => {
              const statusColors = {
                open: "bg-[#fbbf24]",
                in_progress: "bg-[#3b82f6]",
                pending: "bg-[#a78bfa]",
                resolved: "bg-[#34d399]",
                closed: "bg-[#6b7280]",
              };
              const color = statusColors[s.name] || "bg-gray-400";
              const percent =
                analytics.total_tickets > 0
                  ? Math.round((s.count / analytics.total_tickets) * 100)
                  : 0;
              return (
                <div className="flex justify-between" key={s.name}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${color} rounded-full`}></span>
                    <span className="text-gray-300 capitalize">{s.name.replace("_", " ")}</span>
                  </span>
                  <span className="text-gray-400">
                    {percent}% ({s.count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Table */}
      <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-6 mt-6">
        <h3 className="font-semibold text-[15px] mb-4">
          Top Agents Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[#9ca3af] border-b border-[#232632]">
              <tr>
                <th className="py-3 font-normal">Agent</th>
                <th className="py-3 font-normal">Unresolved Tickets</th>
                <th className="py-3 font-normal">Closed Tickets</th>
                <th className="py-3 font-normal">Avg Time</th>
                <th className="py-3 font-normal">Rating</th>
              </tr>
            </thead>
            <tbody className="text-[#c2c4c8]">
              {!analytics.agent_performance?.length ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">
                    No agent activity recorded yet.
                  </td>
                </tr>
              ) : (
                analytics.agent_performance.map((agent) => (
                  <tr key={agent.id} className="border-b border-[#232632] last:border-0 hover:bg-surface-hover/30">
                    <td className="py-3 font-medium text-white">{agent.name}</td>
                    <td className="py-3">{agent.unresolved_count}</td>
                    <td className="py-3">{agent.closed_count}</td>
                    <td className="py-3">{agent.avg_time}</td>
                    <td className="py-3 text-[#fbbf24] font-semibold">{agent.rating} ★</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
