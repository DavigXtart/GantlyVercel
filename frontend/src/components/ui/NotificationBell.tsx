import { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const c = await notificationService.unreadCount();
        setCount(c);
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open) {
      setLoading(true);
      try {
        const list = await notificationService.list();
        setNotifications(list);
      } catch { /* ignore */ }
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  };

  const typeIcon: Record<string, string> = {
    TASK: 'task_alt',
    APPOINTMENT: 'calendar_today',
    MESSAGE: 'chat',
    CRISIS: 'emergency',
    REMINDER: 'alarm',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-sage/10 transition-colors"
        title="Notificaciones"
      >
        <span className="material-symbols-outlined text-[22px] text-sage">notifications</span>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-sage/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-sage/10">
            <h3 className="text-sm font-medium text-forest">Notificaciones</h3>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-sage hover:text-forest transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sage/60 text-sm">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sage/60 text-sm">Sin notificaciones</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <button
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-sage/5 hover:bg-cream/50 transition-colors flex gap-3 ${!n.read ? 'bg-emerald-50/50' : ''}`}
                >
                  <span className={`material-symbols-outlined text-lg mt-0.5 ${n.type === 'CRISIS' ? 'text-red-500' : 'text-sage'}`}>
                    {typeIcon[n.type] || 'circle_notifications'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.type === 'CRISIS' ? 'font-bold text-red-600' : !n.read ? 'font-medium text-forest' : 'text-sage/80'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-sage/60 truncate">{n.message}</p>
                    <p className="text-[10px] text-sage/40 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
