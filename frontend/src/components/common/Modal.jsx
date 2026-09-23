export default function Modal({ open, isOpen, onClose, title, children, footer }) {
  const isVisible = open ?? isOpen;
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface-card border border-surface-border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4 shrink-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-hover hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 text-gray-300 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-surface-border px-5 py-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
