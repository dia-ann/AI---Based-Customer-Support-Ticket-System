import { useEffect, useState } from "react";

/**
 * Dynamically formats SLA resolution time:
 * - Days: Xd Yh remaining (>= 24 hours)
 * - Hours: Xh Ym remaining (>= 1 hour)
 * - Minutes: Xm remaining (> 5 minutes)
 * - Countdown: mm:ss left (<= 5 minutes, live second-by-second countdown)
 * - Breached: Breached Xm / Xh ago (< 0)
 */
export function useSLA(dueAt) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!dueAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [dueAt]);

  if (!dueAt) return { label: "No SLA", status: "none", isUrgent: false };

  const due = new Date(dueAt).getTime();
  if (isNaN(due)) return { label: "Invalid SLA", status: "none", isUrgent: false };

  const diffMs = due - now;
  const isBreached = diffMs <= 0;

  // 1. Breached state
  if (isBreached) {
    const elapsedSecs = Math.floor(Math.abs(diffMs) / 1000);
    const elapsedMins = Math.floor(elapsedSecs / 60);

    let breachLabel = "Breached just now";
    if (elapsedMins >= 1440) {
      const d = Math.floor(elapsedMins / 1440);
      const h = Math.floor((elapsedMins % 1440) / 60);
      breachLabel = `Breached ${d}d ${h}h ago`;
    } else if (elapsedMins >= 60) {
      const h = Math.floor(elapsedMins / 60);
      const m = elapsedMins % 60;
      breachLabel = m > 0 ? `Breached ${h}h ${m}m ago` : `Breached ${h}h ago`;
    } else if (elapsedMins > 0) {
      breachLabel = `Breached ${elapsedMins}m ago`;
    }

    return {
      label: breachLabel,
      status: "breached",
      isUrgent: false,
      diffMinutes: -elapsedMins,
    };
  }

  // 2. Active countdown calculations
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);

  // Critical Countdown: <= 5 minutes (Live mm:ss countdown)
  if (totalSeconds <= 300) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const countdown = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return {
      label: `${countdown} left`,
      status: "urgent",
      isUrgent: true,
      diffMinutes: totalMinutes,
    };
  }

  // Under 60 minutes: Xm remaining
  if (totalMinutes < 60) {
    return {
      label: `${totalMinutes}m remaining`,
      status: totalMinutes <= 30 ? "at-risk" : "ok",
      isUrgent: false,
      diffMinutes: totalMinutes,
    };
  }

  // Under 24 hours: Xh Ym remaining
  if (totalMinutes < 1440) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const label = mins > 0 ? `${hours}h ${mins}m remaining` : `${hours}h remaining`;
    return {
      label,
      status: "ok",
      isUrgent: false,
      diffMinutes: totalMinutes,
    };
  }

  // Long term: >= 24 hours (Xd Yh remaining)
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const label = hours > 0 ? `${days}d ${hours}h remaining` : `${days}d remaining`;

  return {
    label,
    status: "ok",
    isUrgent: false,
    diffMinutes: totalMinutes,
  };
}
