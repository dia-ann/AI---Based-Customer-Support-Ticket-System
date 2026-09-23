// frontend/src/pages/ChangePassword.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck, Check, X } from "lucide-react";
import Logo from "../components/common/Logo";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/common/Toast";
import {
  MIN_PASSWORD_LENGTH as MIN_LENGTH,
  MAX_PASSWORD_LENGTH as MAX_LENGTH,
  PASSWORD_REQUIREMENTS,
} from "../utils/passwordRules";

export default function ChangePassword({
  isModal = false,
  isOpen = true,
  onClose,
}) {
  const { user, changePassword, mustChangePassword, homeRoute } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  if (isModal && !isOpen) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const allRulesMet = PASSWORD_REQUIREMENTS.every((r) => r.test(form.next));
  const canSubmit =
    Boolean(form.current) &&
    allRulesMet &&
    form.next === form.confirm &&
    form.next !== form.current &&
    !submitting;

  const handleClose = () => {
    if (submitting) return;
    setForm({ current: "", next: "", confirm: "" });
    onClose?.();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(form.current, form.next);
      showToast("Password updated successfully", "success");
      if (isModal) {
        handleClose();
      } else {
        navigate(homeRoute || "/tickets", { replace: true });
      }
    } catch (err) {
      showToast(
        err.response?.data?.detail?.[0]?.msg ||
          err.response?.data?.detail ||
          "Could not update password",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Full-viewport overlay: z-[100] ensures it floats in front of the entire screen
  const containerClasses = isModal
    ? "fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    : "flex min-h-screen items-center justify-center bg-surface-bg p-3 sm:p-4 py-8";

  const modalContent = (
    <div
      className={containerClasses}
      onClick={isModal ? handleClose : undefined}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-7 shadow-2xl relative my-auto max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-surface-bg border border-surface-border flex items-center justify-center shrink-0">
              <Logo size={32} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {mustChangePassword ? "Set your password" : "Change password"}
              </h1>
              <p className="text-xs text-gray-500 truncate" title={user?.email}>
                {user?.email}
              </p>
            </div>
          </div>
          {isModal && (
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 pr-1 -mr-1">
          {mustChangePassword && (
            <div className="mb-4 flex gap-2.5 rounded-xl border border-accent/30 bg-accent/10 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs text-gray-300 leading-relaxed">
                You are signed in with a temporary password from your invitation
                email. Choose your own secure password to continue.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label={
                mustChangePassword ? "Temporary password" : "Current password"
              }
              value={form.current}
              onChange={set("current")}
            />
            <PasswordField
              label="New password"
              value={form.next}
              onChange={set("next")}
              maxLength={MAX_LENGTH}
            />
            <PasswordField
              label="Confirm new password"
              value={form.confirm}
              onChange={set("confirm")}
              maxLength={MAX_LENGTH}
            />

            {/* Password Requirements Checklist & Match Status */}
            <div className="rounded-xl border border-surface-border/70 bg-surface-bg/70 p-3 sm:p-3.5 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400">
                New password requirements:
              </p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.test(form.next);
                  return (
                    <div
                      key={req.id}
                      className={`flex items-center gap-2 transition-colors ${
                        met ? "text-emerald-400" : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                          met
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-surface-border text-gray-600"
                        }`}
                      >
                        <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                      </div>
                      <span className="leading-tight">{req.label}</span>
                    </div>
                  );
                })}
              </div>

              {form.confirm.length > 0 && (
                <div
                  className={`flex items-center gap-2 pt-2 border-t border-surface-border/50 text-xs transition-colors ${
                    form.next === form.confirm
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      form.next === form.confirm
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {form.next === form.confirm ? (
                      <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                    ) : (
                      <X className="h-2.5 w-2.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span>
                    {form.next === form.confirm
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </span>
                </div>
              )}

              {form.current && form.next && form.current === form.next && (
                <p className="text-[11px] text-rose-400 pt-1">
                  New password must be different from current password
                </p>
              )}
            </div>

            {/* Action Buttons: Stack on mobile, side-by-side on tablet/desktop */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
              {isModal && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white bg-surface-hover border border-surface-border transition-colors cursor-pointer disabled:opacity-50 text-center"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`${
                  isModal ? "sm:flex-1" : "w-full"
                } rounded-xl bg-accent py-2.5 px-4 text-xs sm:text-sm font-semibold text-black hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed text-center shadow-md`}
              >
                {submitting ? "Saving…" : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // In modal mode, portal straight to document.body so it floats dead-center in front of the entire website
  if (isModal) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

function PasswordField({ label, value, onChange, maxLength }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-300">
        {label} <span className="text-accent">*</span>
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type={reveal ? "text" : "password"}
          required
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          className="w-full rounded-xl border border-surface-border bg-surface-bg py-2.5 pl-10 pr-10 text-xs sm:text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer p-1"
        >
          {reveal ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
