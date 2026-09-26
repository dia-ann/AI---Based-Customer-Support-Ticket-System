import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTickets } from "../../hooks/useTickets";
import TicketTable from "../../components/agent/TicketTable";
import api from "../../services/api";

export default function AdminTicketPanel() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load initial tab from URL query param ?tab=... or localStorage fallback
  const initialFilter = useMemo(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && ["unassigned", "assigned"].includes(urlTab)) {
      return urlTab;
    }
    const saved = localStorage.getItem("deskwise_admin_panel_tab");
    if (saved && ["unassigned", "assigned"].includes(saved)) {
      return saved;
    }
    return "unassigned";
  }, []);

  const [filter, setFilter] = useState(initialFilter);

  const handleFilterChange = (mode) => {
    setFilter(mode);
    localStorage.setItem("deskwise_admin_panel_tab", mode);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", mode);
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && ["unassigned", "assigned"].includes(urlTab)) {
      setFilter(urlTab);
      localStorage.setItem("deskwise_admin_panel_tab", urlTab);
    } else if (!urlTab) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", filter);
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams]);

  // When filter is "unassigned", we ask for needs_triage.
  // When filter is "assigned", we fetch the general unresolved queue.
  const queryParams =
    filter === "unassigned" ? { needs_triage: true } : { needs_triage: false };
  const { tickets, loading, refetch } = useTickets("queue", queryParams);
  const [departments, setDepartments] = useState([]);

  // Real-time freshness: poll every 15s for new unclassified tickets
  useEffect(() => {
    const interval = setInterval(refetch, 15000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Load active departments for assignment dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/departments/");
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepartments();
  }, []);

  const handleAssignDepartment = async (ticketId, departmentId) => {
    if (!departmentId) return;
    try {
      await api.put(`/tickets/${ticketId}`, {
        department_id: departmentId,
        classification_confidence: 1.0,
      });
      await api.post("/replies/", {
        ticket_id: ticketId,
        body: `Admin assigned ticket to department ID: ${departmentId} and cleared Triage flag.`,
        is_internal_note: true,
      });
      refetch();
    } catch (err) {
      console.error("Failed to assign department", err);
      alert("Failed to assign department.");
    }
  };

  const renderActions =
    filter === "unassigned"
      ? (ticket) => (
          <select
            className="bg-surface-bg text-gray-200 border border-surface-border text-sm rounded px-2 py-1.5 focus:outline-none focus:border-accent"
            onChange={(e) => handleAssignDepartment(ticket.id, e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Assign Dept...
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )
      : null;

  return (
    <div className="min-h-screen w-full bg-[#0a0c10] p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Ticket Triage Panel
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage unrouted tickets or track assigned ones.
          </p>
        </div>
        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterChange("unassigned")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              filter === "unassigned"
                ? "bg-[#f2b705] text-black font-semibold shadow-md"
                : "bg-[#181b26] border border-[#232632] text-gray-300 hover:text-white"
            }`}
          >
            Unassigned Tickets
          </button>
          <button
            onClick={() => handleFilterChange("assigned")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              filter === "assigned"
                ? "bg-[#f2b705] text-black font-semibold shadow-md"
                : "bg-[#181b26] border border-[#232632] text-gray-300 hover:text-white"
            }`}
          >
            Assigned Tickets
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-[#232632] bg-[#141824] p-4 sm:p-6 shadow-xl">
        <TicketTable
          tickets={tickets}
          loading={loading}
          renderActions={renderActions}
          departments={departments}
        />
      </div>
    </div>
  );
}
