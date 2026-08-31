import { Link } from "react-router-dom";
import clsx from "clsx";
import { STATUS_COLORS } from "../../utils/constants";
import { formatRelativeTime } from "../../utils/formatters";
import SLAWatcher from "./SLAWatcher";

export default function TicketTable({ tickets, loading, renderActions }) {
  if (loading) return <p className="text-sm text-gray-500">Loading queue…</p>;
  if (!tickets?.length) return <p className="text-sm text-gray-500">No tickets in this view.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="border-b border-surface-border text-xs uppercase text-gray-500">
          <tr>
            <th className="py-2 px-2">Subject</th>
            <th className="py-2 px-2">Customer</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2">SLA</th>
            <th className="py-2 px-2">Opened</th>
            {renderActions && <th className="py-2 px-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover">
              <td className="py-3 px-2 whitespace-normal min-w-[250px]">
                <Link to={`/agent/tickets/${t.id}`} className="font-medium text-accent hover:underline">
                  {t.subject}
                </Link>
                {/* Highlight AI confidence in triage cases */}
                {t.classification_confidence !== null && (
                  <div className="text-[11px] text-gray-400 mt-1">
                    AI Category ID: {t.category_id || "None"} (Confidence: {t.classification_confidence})
                  </div>
                )}
              </td>
              <td className="py-3 px-2 text-gray-400">{t.customer_email || "Unknown"}</td>
              <td className="py-3 px-2">
                <span
                  className={clsx(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    STATUS_COLORS[t.status]
                  )}
                >
                  {t.status?.replace("_", " ")}
                </span>
              </td>
              <td className="py-3 px-2">
                <SLAWatcher dueAt={t.sla_due_at} />
              </td>
              <td className="py-3 px-2 text-gray-500">{formatRelativeTime(t.created_at)}</td>
              {renderActions && (
                <td className="py-3 px-2">
                  {renderActions(t)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
