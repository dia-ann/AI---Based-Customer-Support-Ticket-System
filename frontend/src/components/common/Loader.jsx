export default function Loader({ label = "Loading…", fullScreen = false }) {
  const content = (
    <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (!fullScreen) return content;

  return <div className="flex min-h-screen items-center justify-center">{content}</div>;
}
