import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`toast ${isSuccess ? 'toast-success' : isError ? 'toast-error' : 'toast-info'}`}
          >
            {isSuccess && <CheckCircle2 size={20} className="text-emerald" style={{ color: 'var(--color-emerald)' }} />}
            {isError && <AlertCircle size={20} className="text-rose" style={{ color: 'var(--color-rose)' }} />}
            {!isSuccess && !isError && <Info size={20} className="text-cyan" style={{ color: 'var(--color-cyan)' }} />}

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>{toast.title}</div>
              {toast.message && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {toast.message}
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="close-btn"
              style={{ marginLeft: '8px' }}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
