// frontend/src/pages/agent/Dashboard.jsx
import { useState } from "react";
import { useTickets } from "../../hooks/useTickets";
import TicketTable from "../../components/agent/TicketTable";
import api from "../../services/api";

export default function Dashboard() {
  const params = { status: "unresolved" };
  const { tickets, loading, refetch } = useTickets("queue", params);

  const handleReassignToTriage = async (ticket) => {
    if (!window.confirm("Send this ticket back to admin triage?")) return;
    try {
      // Clear department to push it back to the Admin Triage view
      await api.put(`/tickets/${ticket.id}`, { department_id: null });

      // Audit log via internal note
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
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-card p-4 overflow-hidden">
        <TicketTable
          tickets={tickets}
          loading={loading}
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
