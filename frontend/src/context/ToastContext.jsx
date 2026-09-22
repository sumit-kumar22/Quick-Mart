import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn.js';

const ToastContext = createContext(null);

let idCounter = 0;

const TOAST_STYLES = {
  success: { icon: CheckCircle2, classes: 'border-success/30 text-success' },
  error: { icon: AlertCircle, classes: 'border-danger/30 text-danger' },
  info: { icon: Info, classes: 'border-brand-500/30 text-brand-700' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'success', duration = 3000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              className={cn(
                'animate-toast pointer-events-auto flex items-center gap-2.5 w-full rounded-xl border bg-white px-4 py-3 shadow-modal',
                style.classes
              )}
              role="alert"
            >
              <Icon size={18} className="shrink-0" />
              <p className="text-sm font-medium text-slate-800 flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}