import clsx from "clsx";
import { useSLA } from "../../hooks/useSLA";

const BADGE_STYLES = {
  ok: "bg-green-500/15 text-green-400",
  "at-risk": "bg-amber-500/15 text-amber-400",
  breached: "bg-red-500/15 text-red-400",
  none: "bg-surface-hover text-gray-500",
};

export default function SLAWatcher({ dueAt }) {
  const { label, status } = useSLA(dueAt);

  return (
    <span className={clsx("rounded-full px-2.5 py-1 text-xs font-medium", BADGE_STYLES[status])}>
      {label}
    </span>
  );
}
