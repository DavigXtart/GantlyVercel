import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  warning: (message: string) => addToast(message, 'warning'),
  info: (message: string) => addToast(message, 'info'),
};

function addToast(message: string, type: ToastType) {
  const id = `toast-${++toastId}`;
  const newToast: Toast = { id, message, type };
  toasts = [...toasts, newToast];
  notifyListeners();

  setTimeout(() => {
    removeToast(id);
  }, 5000);
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}

function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setState);
    setState([...toasts]);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return state;
}

const typeConfig: Record<ToastType, { containerClass: string; icon: string }> = {
  success: {
    containerClass: 'bg-gantly-emerald-50 border-gantly-emerald-500 text-gantly-emerald-800',
    icon: '✓',
  },
  error: {
    containerClass: 'bg-red-50 border-red-500 text-red-800',
    icon: '✕',
  },
  warning: {
    containerClass: 'bg-gantly-gold-50 border-gantly-gold-500 text-gantly-gold-800',
    icon: '!',
  },
  info: {
    containerClass: 'bg-gantly-blue-50 border-gantly-blue-500 text-gantly-blue-800',
    icon: 'i',
  },
};

export function ToastContainer() {
  const currentToasts = useToasts();

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[10000] flex flex-col gap-3 max-w-[400px]">
      {currentToasts.map(t => {
        const config = typeConfig[t.type];
        return (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={cn(
              'border-l-4 rounded-xl px-5 py-4 shadow-elevated cursor-pointer',
              'flex items-center gap-3 min-w-[300px] animate-slide-in-right',
              config.containerClass
            )}
          >
            <span className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {config.icon}
            </span>
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(t.id);
              }}
              className="text-current/60 hover:text-current text-lg leading-none p-0 bg-transparent border-none cursor-pointer"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
