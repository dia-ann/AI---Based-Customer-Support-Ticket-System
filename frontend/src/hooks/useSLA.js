import { useEffect, useState } from "react";

/**
 * Ticks down the time remaining until an SLA deadline and flags
 * whether it's breached / at-risk. Pure client-side timer — the
 * source of truth for actual breaches is backend/app/services/sla_engine.py
 * and backend/app/jobs/sla_cron.py; this just drives the UI countdown.
 */
export function useSLA(dueAt) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  if (!dueAt) return { label: "No SLA", status: "none" };

  const due = new Date(dueAt).getTime();
  const diffMs = due - now;
  const diffMinutes = Math.round(diffMs / 60000);

  let status = "ok";
  if (diffMs <= 0) status = "breached";
  else if (diffMinutes <= 30) status = "at-risk";

  const label =
    status === "breached"
      ? `Breached ${Math.abs(diffMinutes)}m ago`
      : `${diffMinutes}m remaining`;

  return { label, status, diffMinutes };
}
