import { useState, useEffect } from "react";
import * as adminService from "../../services/adminService";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await adminService.getAnalyticsOverview();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-[#9ca3af] text-[13px]">
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-red-400 text-[13px]">
        Failed to load analytics data.
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
    <div className="min-h-screen bg-[#0a0c10] text-white p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold">Analytics</h1>
        <p className="text-[13px] text-[#9ca3af] mt-1">
          Track your support performance and ticket trends.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">
            TOTAL TICKETS
          </p>
          <h2 className="text-[28px] font-bold mt-2">
            {analytics.total_tickets.toLocaleString()}
          </h2>
        </div>
        <div className="bg-[#181b26] border border-[#232632] rounded-[16px] p-5">
          <p className="text-[11px] tracking-widest text-[#9ca3af]">
            AVG RESPONSE
          </p>
          <h2 className="text-[28px] font-bold mt-2">
            {analytics.avg_response_label}
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
          <h2 className="text-[28px] font-bold mt-2">
            {analytics.sla_compliance?.csat || "0.0"}/5
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
            {analytics.tickets_by_category?.length === 0 ? (
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
                      <span>{c.name}</span>
                      <span className="text-[#9ca3af]">{c.count} tickets</span>
                    </div>
                    <div className="h-2 bg-[#0f1117] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
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
            <div className="w-32 h-32 rounded-full border-[8px] border-[#fbbf24] border-r-[#3b82f6] border-b-[#34d399] border-l-[#232632] flex items-center justify-center">
              <span className="text-[14px] font-bold">
                {analytics.open_count} Open
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
                    {s.name.replace("_", " ").toUpperCase()}
                  </span>
                  <span>
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
              {analytics.agent_performance?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">
                    No agent activity recorded yet.
                  </td>
                </tr>
              ) : (
                analytics.agent_performance.map((agent) => (
                  <tr key={agent.id} className="border-b border-[#232632]">
                    <td className="py-3">{agent.name}</td>
                    <td className="py-3">{agent.unresolved_count}</td>
                    <td className="py-3">{agent.closed_count}</td>
                    <td className="py-3">{agent.avg_time}</td>
                    <td className="py-3 text-[#fbbf24]">{agent.rating}</td>
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
