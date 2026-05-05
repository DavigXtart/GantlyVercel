import { useState, useMemo } from 'react';

interface Appointment {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  price: number | null;
  paymentStatus: string | null;
  confirmedAt: string | null;
  user: { id: number; name: string; email: string } | null;
}

interface Props {
  appointments: Appointment[];
  loading: boolean;
  onRefresh: () => void;
}

export default function PsychBillingTab({ appointments, loading, onRefresh }: Props) {
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    appointments.forEach(a => {
      if (a.startTime) {
        const d = new Date(a.startTime);
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return Array.from(months).sort().reverse();
  }, [appointments]);

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (filterMonth) {
        const d = new Date(a.startTime);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (month !== filterMonth) return false;
      }
      if (filterPaymentStatus && (a.paymentStatus || 'PENDING') !== filterPaymentStatus) return false;
      return true;
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [appointments, filterMonth, filterPaymentStatus]);

  const totals = useMemo(() => {
    let paid = 0, pending = 0, expired = 0;
    filtered.forEach(a => {
      const price = Number(a.price) || 0;
      const status = a.paymentStatus || 'PENDING';
      if (status === 'PAID') paid += price;
      else if (status === 'EXPIRED') expired += price;
      else pending += price;
    });
    return { paid, pending, expired };
  }, [filtered]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    const d = new Date(Number(y), Number(m) - 1);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const paymentBadge = (status: string | null) => {
    const s = status || 'PENDING';
    const styles: Record<string, { classes: string; label: string }> = {
      PAID: { classes: 'bg-emerald-500/10 text-emerald-600', label: 'Pagado' },
      PENDING: { classes: 'bg-yellow-500/10 text-yellow-600', label: 'Pendiente' },
      EXPIRED: { classes: 'bg-slate-400/10 text-slate-500', label: 'Expirado' },
    };
    const st = styles[s] || styles.PENDING;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.classes}`}>
        {st.label}
      </span>
    );
  };

  return (
    <div className="mt-10 w-full">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-emerald-600 text-[22px]">payments</span>
            <span className="text-sm text-slate-500">Cobrado</span>
          </div>
          <p className="text-[28px] font-semibold text-emerald-600 m-0">
            {totals.paid.toFixed(2)} &euro;
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-yellow-600 text-[22px]">schedule</span>
            <span className="text-sm text-slate-500">Pendiente</span>
          </div>
          <p className="text-[28px] font-semibold text-yellow-600 m-0">
            {totals.pending.toFixed(2)} &euro;
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-slate-500 text-[22px]">timer_off</span>
            <span className="text-sm text-slate-500">Expirado</span>
          </div>
          <p className="text-[28px] font-semibold text-slate-500 m-0">
            {totals.expired.toFixed(2)} &euro;
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            <option value="">Todos los meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>

          <select
            value={filterPaymentStatus}
            onChange={e => setFilterPaymentStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="PAID">Pagado</option>
            <option value="PENDING">Pendiente</option>
            <option value="EXPIRED">Expirado</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-transparent cursor-pointer flex items-center gap-1.5 text-sm text-gantly-blue-500 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refrescar
          </button>

          <span className="text-[13px] text-slate-400 ml-auto">
            {filtered.length} cita{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Appointment list */}
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-card">
        <h3 className="text-2xl font-semibold text-gantly-text mb-6">Detalle de citas</h3>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin w-8 h-8 border-3 border-gantly-blue-100 border-t-gantly-blue-500 rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-10">
            No hay citas para los filtros seleccionados.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(a => (
              <div
                key={a.id}
                className="flex flex-wrap justify-between items-center px-5 py-4 rounded-2xl border border-slate-100 hover:bg-gantly-cloud/50 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-[180px]">
                  <span className="font-medium text-[15px] text-slate-800">
                    {a.user?.name || 'Paciente'}
                  </span>
                  <span className="text-[13px] text-slate-500">
                    {formatDate(a.startTime)} &middot; {formatTime(a.startTime)} - {formatTime(a.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-base text-slate-800">
                    {a.price != null ? `${Number(a.price).toFixed(2)} \u20AC` : '--'}
                  </span>
                  {paymentBadge(a.paymentStatus)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
