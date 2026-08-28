import clsx from "clsx";

const VARIANTS = {
  primary: "bg-accent text-black hover:bg-accent-hover disabled:opacity-60",
  secondary: "bg-surface-hover text-gray-200 hover:bg-surface-border",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-accent hover:bg-surface-hover",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}