import { useState, useEffect } from 'react';

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

const typeStyles = {
  success: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '✅' },
  error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '❌' },
  warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚠️' },
  info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: 'ℹ️' }
};

export function ToastContainer() {
  const toasts = useToasts();
  
  if (toasts.length === 0) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => {
        const style = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              background: style.bg,
              border: `2px solid ${style.border}`,
              borderRadius: '12px',
              padding: '16px 20px',
              color: style.text,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideIn 0.3s ease-out',
              minWidth: '300px'
            }}
          >
            <span style={{ fontSize: '20px' }}>{style.icon}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: style.text,
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1',
                opacity: 0.7
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

