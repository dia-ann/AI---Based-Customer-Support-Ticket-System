import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import Logo from "../components/common/Logo";
import * as authService from "../services/authService";
import { useToast } from "../components/common/Toast";

export default function Signup() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.register(form);
      showToast("Account created — please sign in", "success");
      navigate("/login");
    } catch (err) {
      showToast(err.response?.data?.detail || "Registration failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <Logo size={44} />
          <div>
            <h1 className="text-lg font-bold text-white">
              Desk<span className="text-accent">wise</span>
            </h1>
            <p className="text-xs text-gray-500">Create your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-surface-border bg-surface-bg py-2.5 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
            />
          </div> */}

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-surface-border bg-surface-bg py-2.5 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-surface-border bg-surface-bg py-2.5 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-black hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Register"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
