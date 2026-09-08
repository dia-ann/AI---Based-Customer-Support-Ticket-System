import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function UserCard({ onClose, onLogout, position = "top-right" }) {
  const { user, updateProfile } = useAuth();

  const [copied, setCopied] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(user?.phone_number || "");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    setPhoneInput(user?.phone_number || "");
  }, [user?.phone_number]);

  async function handleCopyEmail() {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  }

  async function handleSavePhone(e) {
    e.preventDefault();
    setSavingPhone(true);
    try {
      if (updateProfile) {
        await updateProfile({ phone_number: phoneInput });
      }
      setIsEditingPhone(false);
    } catch (err) {
      console.error("Failed to update contact number", err);
    } finally {
      setSavingPhone(false);
    }
  }

  const role = user?.role || "customer";
  const isCustomer = role === "customer";
  const isAgent = role === "agent";
  const isAdmin = role === "admin";

  const roleBadgeConfig = {
    customer: {
      label: "Customer",
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    agent: {
      label: "Support Agent",
      bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    admin: {
      label: "Administrator",
      bg: "bg-[#f2b705]/10 text-[#f2b705] border-[#f2b705]/30",
    },
  }[role] || {
    label: role,
    bg: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  };

  const formattedCreatedAt = (() => {
    if (!user?.created_at) return "Not available";
    try {
      const d = new Date(user.created_at);
      if (isNaN(d.getTime())) return "Not available";
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Not available";
    }
  })();

  const initial = (user?.name || user?.email || "U")[0].toUpperCase();

  const positionClasses =
    position === "sidebar"
      ? "absolute left-full bottom-0 ml-3"
      : "absolute right-0 top-full mt-2";

  return (
    <div
      className={`${positionClasses} w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-surface-border bg-[#141824] p-5 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-surface-border pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-lg font-bold text-white shadow-md">
            {initial}
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#141824] bg-emerald-500" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white">
              {user?.name || user?.email?.split("@")[0]}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="truncate text-xs text-gray-400 max-w-[170px]" title={user?.email}>
                {user?.email}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy email"
              >
                {copied ? (
                  <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-surface-hover hover:text-white transition-colors"
          aria-label="Close user card"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Details Section */}
      <div className="py-4 space-y-3.5 text-xs">
        {/* Role & Department: If customer then nothing */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Role</span>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${roleBadgeConfig.bg}`}>
              {roleBadgeConfig.label}
            </span>
            {!isCustomer && (
              <span className="text-gray-300 font-medium">
                — {user?.department_name || (isAdmin ? "Administration" : "Support")}
              </span>
            )}
          </div>
        </div>

        {/* Contact Number */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Contact Number</span>
          {isEditingPhone ? (
            <form onSubmit={handleSavePhone} className="flex items-center gap-1.5">
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+1 555-0199"
                className="w-28 rounded border border-surface-border bg-surface-bg px-2 py-0.5 text-xs text-white focus:border-accent focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={savingPhone}
                className="rounded bg-brand-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {savingPhone ? "..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoneInput(user?.phone_number || "");
                  setIsEditingPhone(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={user?.phone_number ? "text-gray-200" : "text-gray-500 italic"}>
                {user?.phone_number || "Not provided"}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingPhone(true)}
                className="text-gray-400 hover:text-accent transition-colors"
                title="Edit contact number"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* When was it created */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Created On</span>
          <span className="text-gray-200">{formattedCreatedAt}</span>
        </div>

        {/* If agent then created by whom */}
        {isAgent && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Created By</span>
            <span
              className="text-gray-200 font-medium truncate max-w-[180px]"
              title={user?.invited_by_email || "System Administrator"}
            >
              {user?.invited_by_email || "System Administrator"}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-3 border-t border-surface-border flex items-center justify-between">
        <Link
          to="/change-password"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-accent transition-colors"
        >
          Change password
        </Link>

        <button
          type="button"
          onClick={() => {
            onClose();
            if (onLogout) onLogout();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
}
