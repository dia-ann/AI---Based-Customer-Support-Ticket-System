import clsx from "clsx";
import { Clock } from "lucide-react";
import { useSLA } from "../../hooks/useSLA";

const BADGE_STYLES = {
  ok: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  "at-risk": "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  urgent: "bg-red-500/10 text-red-400 border border-red-500/20",
  breached: "bg-red-500/10 text-red-400 border border-red-500/20",
  none: "bg-surface-hover text-gray-400 border border-transparent",
};

export default function SLAWatcher({ dueAt }) {
  const { label, status } = useSLA(dueAt);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium select-none",
        BADGE_STYLES[status] || BADGE_STYLES.none,
      )}
      title={
        dueAt
          ? `Resolution SLA Due: ${new Date(dueAt).toLocaleString()}`
          : "No SLA"
      }
    >
      <Clock className="h-3 w-3 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
