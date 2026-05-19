import { useState, useCallback } from 'react';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { cn } from '@/lib/utils';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

const variantConfig: Record<Variant, {
  icon: typeof AlertTriangle;
  iconClass: string;
  buttonClass: string;
}> = {
  danger: {
    icon: Trash2,
    iconClass: 'text-red-500',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  info: {
    icon: Info,
    iconClass: 'text-gantly-blue',
    buttonClass: 'bg-gantly-blue hover:bg-gantly-blue/90 text-white',
  },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // caller handles errors
    } finally {
      setLoading(false);
    }
  }, [onConfirm, onClose]);

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={cn('p-3 rounded-full bg-slate-50', config.iconClass)}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{message}</p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gantly-blue/20"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gantly-blue/20',
              config.buttonClass,
              loading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
