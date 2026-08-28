import { Link } from "react-router-dom";
import clsx from "clsx";
import { STATUS_COLORS } from "../../utils/constants";
import { formatRelativeTime } from "../../utils/formatters";
import SLAWatcher from "./SLAWatcher";

export default function TicketQueue({ tickets, loading }) {
  if (loading) return <p className="text-sm text-gray-500">Loading queue…</p>;
  if (!tickets?.length) return <p className="text-sm text-gray-500">No tickets in this view.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-surface-border text-xs uppercase text-gray-500">
        <tr>
          <th className="py-2">Subject</th>
          <th className="py-2">Customer</th>
          <th className="py-2">Priority</th>
          <th className="py-2">Status</th>
          <th className="py-2">SLA</th>
          <th className="py-2">Opened</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((t) => (
          <tr key={t.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover">
            <td className="py-3">
              <Link to={`/agent/tickets/${t.id}`} className="font-medium text-accent hover:underline">
                {t.subject}
              </Link>
            </td>
            <td className="py-3 text-gray-400">{t.customer_name}</td>
            <td className="py-3 capitalize text-gray-300">{t.priority}</td>
            <td className="py-3">
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                  STATUS_COLORS[t.status]
                )}
              >
                {t.status?.replace("_", " ")}
              </span>
            </td>
            <td className="py-3">
              <SLAWatcher dueAt={t.sla_due_at} />
            </td>
            <td className="py-3 text-gray-500">{formatRelativeTime(t.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}