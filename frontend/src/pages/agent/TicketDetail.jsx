import { useParams } from "react-router-dom";
import { useTicketDetail } from "../../hooks/useTickets";
import ReplyBox from "../../components/agent/ReplyBox";
import SLAWatcher from "../../components/agent/SLAWatcher";
import Loader from "../../components/common/Loader";
import * as ticketService from "../../services/ticketService";
import { formatDateTime } from "../../utils/formatters";

export default function TicketDetail() {
  const { ticketId } = useParams();
  const { ticket, loading, refetch } = useTicketDetail(ticketId);

  if (loading || !ticket) return <Loader fullScreen />;

  async function handleStatusChange(e) {
    await ticketService.updateTicketStatus(ticketId, e.target.value);
    refetch();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 bg-surface-bg">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{ticket.subject}</h1>
          <p className="text-sm text-gray-500">
            Ticket #{ticket.id} • {ticket.customer_name}
          </p>
        </div>
        <SLAWatcher dueAt={ticket.sla_due_at} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <select
          defaultValue={ticket.status}
          onChange={handleStatusChange}
          className="rounded-lg border border-surface-border bg-surface-bg px-3 py-1.5 text-sm text-gray-200 focus:border-accent focus:outline-none"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <span className="text-xs text-gray-400 capitalize">Priority: {ticket.priority}</span>
      </div>

      <div className="mb-6 space-y-3 rounded-xl border border-surface-border bg-surface-card p-4">
        {ticket.messages?.map((m) => (
          <div key={m.id} className={m.is_internal_note ? "rounded-lg bg-accent/10 border border-accent/30 p-3" : ""}>
            <p className="text-xs font-medium text-gray-500">
              {m.author_name} • {formatDateTime(m.created_at)}
              {m.is_internal_note && " • internal note"}
            </p>
            <p className="mt-1 text-sm text-gray-200">{m.message}</p>
          </div>
        ))}
      </div>

      <ReplyBox ticketId={ticketId} onSent={refetch} />
    </div>
  );
}