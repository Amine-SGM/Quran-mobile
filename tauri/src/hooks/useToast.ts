import { useState, useCallback } from "react";
import type { ToastMessage, ToastType } from "../components/Toast";

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, durationMs?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const toast: ToastMessage = { id, type, message, durationMs };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (message: string) => addToast("error", message),
    [addToast]
  );

  const showSuccess = useCallback(
    (message: string) => addToast("success", message),
    [addToast]
  );

  const showInfo = useCallback(
    (message: string) => addToast("info", message),
    [addToast]
  );

  const showWarning = useCallback(
    (message: string) => addToast("warning", message),
    [addToast]
  );

  return {
    toasts,
    addToast,
    dismissToast,
    showError,
    showSuccess,
    showInfo,
    showWarning,
  };
}
