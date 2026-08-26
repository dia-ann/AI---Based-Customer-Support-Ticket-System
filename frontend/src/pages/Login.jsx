import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Zap, Star } from "lucide-react";
import Logo from "../components/common/Logo";
import DotGrid from "../components/common/DotGrid";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/common/Toast";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      const dest =
        user.role === "admin" ? "/admin/analytics" : user.role === "agent" ? "/agent/dashboard" : "/tickets";
      navigate(dest);
    } catch (err) {
      showToast(err.response?.data?.detail || "Invalid email or password", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleSignIn() {
    // Not wired to the backend yet — add an OAuth route (e.g. /api/auth/google)
    // and redirect here once that's built.
    showToast("Google sign-in isn't connected yet", "info");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bg p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-surface-border bg-surface-card md:grid-cols-2">
        {/* Left panel — branding */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-surface-sidebar p-10 md:flex">
          <DotGrid className="absolute left-6 top-6" />
          <DotGrid className="absolute bottom-6 left-6" />

          <div>
            <Logo size={64} className="mb-4" />
            <h1 className="text-2xl font-bold text-white">
              Desk<span className="text-accent">wise</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">AI-Powered Customer Support Ticket System</p>

            <div className="my-6 h-0.5 w-10 bg-accent" />

            <p className="text-lg font-semibold text-white">
              Smarter support.
              <br />
              Faster resolution.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Let AI handle the tickets while you focus on what matters.
            </p>
          </div>

          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">Secure</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Zap className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">Reliable</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Star className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">Intelligent</span>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="p-8 sm:p-10">
          <h2 className="text-xl font-bold text-white">Welcome Back 👋</h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to continue to your dashboard</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Email Address <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-surface-border bg-surface-bg py-2.5 pl-10 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Password <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-surface-border bg-surface-bg py-2.5 pl-10 pr-10 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="rounded border-surface-border bg-surface-bg"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="font-medium text-accent hover:text-accent-hover">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign In →"}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-surface-border" />
              <span className="text-xs text-gray-500">OR</span>
              <div className="h-px flex-1 bg-surface-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-hover py-2.5 text-sm font-medium text-gray-200 hover:bg-surface-border"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0012 23z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.05H2.18a11 11 0 000 9.9l3.66-2.85z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.05l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Sign in with Google
            </button>

            <p className="pt-1 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-accent hover:text-accent-hover">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
