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
    <div className="min-h-screen w-full bg-surface-bg mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{ticket.subject}</h1>
          <p className="text-sm text-gray-500">
            Ticket #{ticket.id} • {ticket.customer_name}
          </p>
        </div>
        <SLAWatcher dueAt={ticket.sla_due_at} />
      </div>

      {/* Ticket details card */}
      <div className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5">
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span>Ticket #{ticket.id?.slice(0, 8)}</span>
          <span>•</span>
          <span>{formatDateTime(ticket.created_at)}</span>
          <span>•</span>
          <span className="capitalize">Priority: {ticket.priority}</span>
          <span>•</span>
          <span className="capitalize">{ticket.status?.replace("_", " ")}</span>
        </div>
        <div className="rounded-lg bg-surface-bg p-4">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {ticket.body_redacted}
          </p>
        </div>
      </div>

      <ReplyBox ticketId={ticketId} onSent={refetch} />
    </div>
  );
}
