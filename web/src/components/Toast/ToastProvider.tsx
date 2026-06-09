'use client';

/**
 * In-app toast notification module.
 *
 * A lightweight, dependency-free toast system: a context provider holds a
 * queue of transient messages, renders them in a fixed viewport, and
 * auto-dismisses each after a timeout. Consume via the `useToast()` hook:
 *
 *   const toast = useToast();
 *   toast.success('Saved');
 *   toast.error('Something went wrong');
 *   toast.info('Heads up');
 *
 * This handles ONLY in-app (foreground) notifications. Off-app delivery
 * (WhatsApp / push) lives server-side in CoreMesh's notification module.
 */

import {
  createContext, useCallback, useContext, useMemo, useRef, useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Access the toast API. Must be called within <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const DURATION_MS = 3200;
const MAX_VISIBLE = 4;

const ICONS: Record<ToastType, React.ComponentType<{ size?: number }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((tt) => tt.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }].slice(-MAX_VISIBLE));
      setTimeout(() => remove(id), DURATION_MS);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m: string) => show(m, 'success'),
      error: (m: string) => show(m, 'error'),
      info: (m: string) => show(m, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className={styles.viewport}
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((tt) => {
          const Icon = ICONS[tt.type];
          return (
            <div
              key={tt.id}
              className={`${styles.toast} ${styles[tt.type]}`}
              role="status"
            >
              <span className={styles.icon} aria-hidden="true">
                <Icon size={16} />
              </span>
              <p className={styles.msg}>{tt.message}</p>
              <button
                type="button"
                className={styles.close}
                onClick={() => remove(tt.id)}
                aria-label="Dismiss"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
