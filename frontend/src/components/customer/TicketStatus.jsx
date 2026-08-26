import clsx from "clsx";
import { STATUS_COLORS } from "../../utils/constants";
import { formatRelativeTime } from "../../utils/formatters";

export default function TicketStatus({ ticket }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{ticket.subject}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ticket #{ticket.id} • Opened {formatRelativeTime(ticket.created_at)}
          </p>
        </div>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium capitalize",
            STATUS_COLORS[ticket.status]
          )}
        >
          {ticket.status?.replace("_", " ")}
        </span>
      </div>

      {ticket.assigned_agent_name && (
        <p className="mt-3 text-sm text-gray-600">
          Handled by <span className="font-medium">{ticket.assigned_agent_name}</span>
        </p>
      )}

      {ticket.last_message && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{ticket.last_message}</p>
      )}
    </div>
  );
}
