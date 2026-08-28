export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-surface-card border border-surface-border shadow-xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-surface-hover hover:text-gray-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 text-gray-300">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-surface-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}