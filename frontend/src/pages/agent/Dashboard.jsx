// frontend/src/pages/agent/Dashboard.jsx
import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { useTickets } from "../../hooks/useTickets";
import TicketTable from "../../components/agent/TicketTable";
import api from "../../services/api";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [departments, setDepartments] = useState([]);

  const params = statusFilter === "all" ? {} : { status: statusFilter };
  const { tickets, loading, refetch } = useTickets("queue", params);

  // Load departments so TicketTable can resolve department_id -> name
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

  const handleReassignToTriage = async (ticket) => {
    if (!window.confirm("Send this ticket back to admin triage?")) return;
    try {
      await api.put(`/tickets/${ticket.id}`, { department_id: null });
      await api.post("/replies/", {
        ticket_id: ticket.id,
        body: "Reassigned to admin triage (Invalid Department)",
        is_internal_note: true,
      });
      refetch();
    } catch (err) {
      console.error("Failed to reassign ticket", err);
      alert("Failed to reassign ticket.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-bg mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Ticket Queue</h1>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-surface-border bg-surface-bg py-2 pl-3 pr-8 text-sm text-gray-200 focus:border-accent focus:outline-none"
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
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-card p-4 overflow-hidden">
        <TicketTable
          tickets={tickets}
          loading={loading}
          onBulkUpdated={refetch}
          departments={departments}
          renderActions={(ticket) => (
            <button
              onClick={() => handleReassignToTriage(ticket)}
              className="text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50 px-3 py-1 rounded"
            >
              Send to Triage
            </button>
          )}
        />
      </div>
    </div>
  );
}