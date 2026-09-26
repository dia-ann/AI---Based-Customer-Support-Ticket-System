import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Clock } from "lucide-react";
import clsx from "clsx";

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 ring-1 ring-emerald-500/30",
    barColor: "bg-emerald-500",
    borderGlow: "border-emerald-500/30 shadow-[0_8px_30px_rgb(16,185,129,0.12)]",
    title: "Success",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/15 ring-1 ring-rose-500/30",
    barColor: "bg-rose-500",
    borderGlow: "border-rose-500/30 shadow-[0_8px_30px_rgb(244,63,94,0.12)]",
    title: "Error",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15 ring-1 ring-amber-500/30",
    barColor: "bg-amber-500",
    borderGlow: "border-amber-500/30 shadow-[0_8px_30px_rgb(245,158,11,0.12)]",
    title: "Warning",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15 ring-1 ring-blue-500/30",
    barColor: "bg-blue-500",
    borderGlow: "border-blue-500/30 shadow-[0_8px_30px_rgb(59,130,246,0.12)]",
    title: "Notice",
  },
};

function formatCountdown(seconds) {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }
  return `${seconds}s`;
}

function ToastItem({ toast, onRemove }) {
  const config = VARIANTS[toast.type] || VARIANTS.info;
  const Icon = config.icon;
  const isCountdown = Boolean(toast.countdown && toast.countdown > 0);
  const [secondsLeft, setSecondsLeft] = useState(toast.countdown || 0);

  useEffect(() => {
    if (!isCountdown) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 4000);
      return () => clearTimeout(timer);
    }

    setSecondsLeft(toast.countdown);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => onRemove(toast.id), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountdown, toast.countdown, toast.duration, toast.id, onRemove]);

  const progressPercent = isCountdown
    ? Math.max(0, (secondsLeft / toast.countdown) * 100)
    : null;

  return (
    <div
      className={clsx(
        "animate-toast-in pointer-events-auto relative overflow-hidden rounded-xl border bg-surface-card/95 p-4 backdrop-blur-xl transition-all duration-300 hover:border-surface-border",
        config.borderGlow
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon Badge */}
        <div
          className={clsx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            config.iconBg
          )}
        >
          <Icon className={clsx("h-4 w-4", config.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {toast.title || config.title}
          </p>
          <p className="mt-0.5 text-sm text-gray-200 break-words leading-snug">
            {toast.message}
          </p>

          {/* Countdown Timer Display */}
          {isCountdown && (
            <div className="mt-2.5">
              {secondsLeft > 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                  <Clock className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                  <span>
                    Try again in{" "}
                    <span className="font-mono text-white">
                      {formatCountdown(secondsLeft)}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Ready to try again!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onRemove(toast.id)}
          className="shrink-0 -mr-1 -mt-1 rounded-lg p-1 text-gray-500 transition-colors hover:bg-surface-border/50 hover:text-gray-300"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress timer bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-border/40">
        {isCountdown ? (
          <div
            className={clsx("h-full", config.barColor)}
            style={{
              width: `${progressPercent}%`,
              transition: "width 1s linear",
            }}
          />
        ) : (
          <div
            className={clsx("h-full animate-toast-progress", config.barColor)}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        )}
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", durationOrOptions = 4000, extraOptions = {}) => {
      let duration = 4000;
      let countdown = null;
      let title = null;

      if (typeof durationOrOptions === "object" && durationOrOptions !== null) {
        duration = durationOrOptions.duration || 4000;
        countdown = durationOrOptions.countdown || null;
        title = durationOrOptions.title || null;
      } else {
        duration = typeof durationOrOptions === "number" ? durationOrOptions : 4000;
        if (typeof extraOptions === "number") {
          countdown = extraOptions;
        } else if (typeof extraOptions === "object" && extraOptions !== null) {
          countdown = extraOptions.countdown || null;
          title = extraOptions.title || null;
        }
      }

      const id = Date.now() + Math.random();
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration, countdown, title },
      ]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-5 sm:bottom-5 z-50 flex sm:max-w-sm flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
