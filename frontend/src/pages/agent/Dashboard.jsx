import { useState } from "react";
import { useTickets } from "../../hooks/useTickets";
import TicketQueue from "../../components/agent/TicketQueue";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  { key: "mine", label: "Assigned to me" },
];

export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const params =
    filter === "mine"
      ? { assigned_to_me: true }
      : filter === "unassigned"
        ? { status: "open", unassigned: true }
        : {};

  const { tickets, loading, refetch } = useTickets("queue", params);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 bg-surface-bg">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Ticket Queue</h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-sm ${filter === f.key ? "bg-accent text-black" : "bg-surface-hover text-gray-300"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-card p-4">
        <TicketQueue tickets={tickets} loading={loading} onRefresh={refetch} />
      </div>
    </div>
  );
}