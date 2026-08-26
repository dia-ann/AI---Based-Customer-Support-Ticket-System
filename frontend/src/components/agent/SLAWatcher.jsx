import clsx from "clsx";
import { useSLA } from "../../hooks/useSLA";

const BADGE_STYLES = {
  ok: "bg-green-100 text-green-700",
  "at-risk": "bg-amber-100 text-amber-700",
  breached: "bg-red-100 text-red-700",
  none: "bg-gray-100 text-gray-500",
};

export default function SLAWatcher({ dueAt }) {
  const { label, status } = useSLA(dueAt);

  return (
    <span className={clsx("rounded-full px-2.5 py-1 text-xs font-medium", BADGE_STYLES[status])}>
      {label}
    </span>
  );
}
