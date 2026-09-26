import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Search, Filter } from "lucide-react";
import { STATUS_COLORS, SENTIMENT_COLORS } from "../../utils/constants";
import { formatRelativeTime } from "../../utils/formatters";
import SLAWatcher from "./SLAWatcher";

export default function TicketTable({
  tickets = [],
  loading,
  renderActions,
  departments = [],
  extraFilter,
}) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const departmentNameById = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d.name])),
    [departments],
  );

  // Client-side filtering with Escalations Pinned to Top
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    const filtered = tickets.filter((t) => {
      const matchSearch =
        !debouncedSearch.trim() ||
        t.subject?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.customer_email
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        t.body_redacted?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        t.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchPriority =
        priorityFilter === "all" ||
        t.priority?.toLowerCase() === priorityFilter.toLowerCase();
      return matchSearch && matchStatus && matchPriority;
    });
    // Pin active escalations to the top
    return filtered.sort((a, b) => {
      const aUrgent =
        (a.priority === "high" || a.sentiment === "negative") &&
        a.status !== "resolved" &&
        a.status !== "closed";
      const bUrgent =
        (b.priority === "high" || b.sentiment === "negative") &&
        b.status !== "resolved" &&
        b.status !== "closed";
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      // Secondary sort: prioritize tickets closest to SLA resolution deadline
      const aDue =
        a.sla_due_at && a.status !== "resolved" && a.status !== "closed"
          ? new Date(a.sla_due_at).getTime()
          : Infinity;
      const bDue =
        b.sla_due_at && b.status !== "resolved" && b.status !== "closed"
          ? new Date(b.sla_due_at).getTime()
          : Infinity;
      return aDue - bDue;
    });
  }, [tickets, debouncedSearch, statusFilter, priorityFilter]);

  if (loading)
    return (
      <p className="text-sm text-gray-500 py-6 text-center">Loading queue…</p>
    );

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search tickets by subject, keyword, customer…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg py-2 pl-9 pr-3 text-xs text-gray-200 placeholder:text-gray-400 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative min-w-[130px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-surface-border bg-surface-bg py-2 pl-3 pr-8 text-xs text-gray-200 focus:border-accent focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <Filter className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          </div>
          <div className="relative min-w-[130px]">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-surface-border bg-surface-bg py-2 pl-3 pr-8 text-xs text-gray-200 focus:border-accent focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <Filter className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          </div>
          {extraFilter}
        </div>
      </div>

      {/* Table */}
      {!filteredTickets.length ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No tickets matched your filter criteria.
        </p>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-surface-border text-xs uppercase text-gray-400 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Sentiment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">SLA</th>
                <th className="py-2.5 px-3">Opened</th>
                {renderActions && <th className="py-2.5 px-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors"
                >
                  <td className="py-3 px-3 whitespace-normal min-w-[200px] sm:min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        to={`/agent/tickets/${t.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {t.subject}
                      </Link>
                      {(t.priority === "high" || t.sentiment === "negative") &&
                        t.status !== "resolved" &&
                        t.status !== "closed" && (
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Escalated
                          </span>
                        )}
                    </div>
                    {t.classification_confidence !== null && (
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Department:{" "}
                        {departmentNameById[t.department_id] || "General"}
                        {t.classification_confidence !== undefined && (
                          <span>
                            {" "}
                            ({(t.classification_confidence * 100).toFixed(0)}%
                            confidence)
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-400">
                    {t.customer_email || t.customer_name || "Customer"}
                  </td>
                  <td className="py-3 px-3 text-xs capitalize text-gray-300">
                    {t.priority || "Normal"}
                  </td>
                  <td className="py-3 px-3">
                    {t.sentiment ? (
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          SENTIMENT_COLORS[t.sentiment],
                        )}
                      >
                        {t.sentiment}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                        STATUS_COLORS[t.status],
                      )}
                    >
                      {t.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <SLAWatcher dueAt={t.sla_due_at} />
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-500">
                    {formatRelativeTime(t.created_at)}
                  </td>
                  {renderActions && (
                    <td className="py-3 px-3">{renderActions(t)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
