import { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-sm ${
          isSuccess
            ? 'border-ok/30 bg-ink/95 text-ok'
            : 'border-crit/30 bg-ink/95 text-crit'
        }`}
      >
        <span className="text-sm font-medium">{toast.message}</span>
        <button
          onClick={onClose}
          className="ml-2 opacity-60 hover:opacity-100 transition"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
