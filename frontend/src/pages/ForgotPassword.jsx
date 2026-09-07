import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import * as authService from "../services/authService";
import { useToast } from "../components/common/Toast";

const MIN_LENGTH = 8;

export default function ForgotPassword() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    current: "",
    next: "",
    confirm: "",
  });
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.next.length < MIN_LENGTH) {
      showToast(`New password must be at least ${MIN_LENGTH} characters`, "error");
      return;
    }
    if (form.next !== form.confirm) {
      showToast("New passwords do not match", "error");
      return;
    }
    setSubmitting(true);
    try {
      await authService.forgotPassword(form.email, form.current, form.next);
      showToast("Password updated — sign in with your new password", "success");
      navigate("/login", { replace: true });
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-8">
        <h1 className="text-xl font-bold text-white">Change your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your current password and pick a new one. Agents: your current
          password is the temporary one from your invitation email.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={set("email")}
              autoComplete="username"
              className="w-full rounded-lg border border-surface-border bg-surface-bg py-2.5 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
            />
          </div>

          <Field
            placeholder="Current password"
            value={form.current}
            onChange={set("current")}
            visible={show}
          />
          <Field
            placeholder={`New password (min ${MIN_LENGTH} chars)`}
            value={form.next}
            onChange={set("next")}
            visible={show}
          />
          <Field
            placeholder="Confirm new password"
            value={form.confirm}
            onChange={set("confirm")}
            visible={show}
          />

          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
              className="rounded border-surface-border bg-surface-bg"
            />
            Show passwords
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-black hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ placeholder, value, onChange, visible }) {
  const [reveal, setReveal] = useState(false);
  const shown = visible || reveal;
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <input
        type={shown ? "text" : "password"}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        className="w-full rounded-lg border border-surface-border bg-surface-bg py-2.5 pl-10 pr-10 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setReveal((v) => !v)}
        aria-label={shown ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}