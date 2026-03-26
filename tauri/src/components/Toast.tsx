import { useEffect } from "react";
import "./Toast.css";

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs ?? 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.durationMs, onDismiss]);

  const icon = {
    error: "❌",
    success: "✅",
    info: "ℹ️",
    warning: "⚠️",
  }[toast.type];

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <span className="toast-icon">{icon}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-dismiss" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
