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
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
    let paid = 0, pending = 0, expired = 0, count = 0;
    filtered.forEach(a => {
      const price = Number(a.price) || 0;
      const status = a.paymentStatus || 'PENDING';
      if (status === 'PAID') { paid += price; count++; }
      else if (status === 'EXPIRED') expired += price;
      else pending += price;
    });
    return { paid, pending, expired, paidCount: count };
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
    const styles: Record<string, { classes: string; label: string; icon: string }> = {
      PAID: { classes: 'bg-gantly-emerald/10 text-gantly-emerald border border-gantly-emerald/20', label: 'Pagado', icon: 'check_circle' },
      PENDING: { classes: 'bg-gantly-gold/10 text-gantly-gold border border-gantly-gold/20', label: 'Pendiente', icon: 'schedule' },
      EXPIRED: { classes: 'bg-slate-100 text-slate-500 border border-slate-200', label: 'Expirado', icon: 'timer_off' },
    };
    const st = styles[s] || styles.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold ${st.classes}`}>
        <span className="material-symbols-outlined text-[13px]">{st.icon}</span>
        {st.label}
      </span>
    );
  };

  const totalRevenue = totals.paid + totals.pending;
  const paidPercent = totalRevenue > 0 ? (totals.paid / totalRevenue) * 100 : 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gantly-emerald/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-gantly-emerald text-xl">account_balance_wallet</span>
          </div>
          <div>
            <h3 className="m-0 text-2xl font-heading font-bold text-gantly-text">Facturación</h3>
            <p className="text-sm font-body text-gantly-muted m-0 mt-0.5">{filtered.length} cita{filtered.length !== 1 ? 's' : ''} en el período</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="h-10 px-4 rounded-xl bg-gantly-cloud hover:bg-gantly-blue hover:text-white text-gantly-blue cursor-pointer flex items-center gap-1.5 text-sm font-heading font-semibold disabled:opacity-60 transition-all duration-300 border-none"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Actualizar
        </button>
      </div>

      {/* Revenue overview — asymmetric bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Main revenue card — large */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl p-6 shadow-sm border border-gantly-emerald/20" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #2E93CC 100%)' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-white/70 text-lg">trending_up</span>
              <span className="text-white/70 text-xs font-body font-medium uppercase tracking-widest">Total cobrado</span>
            </div>
            <p className="text-4xl font-heading font-extrabold text-white m-0 mt-2">
              {totals.paid.toFixed(2)} &euro;
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-white/60 text-xs font-body">{totals.paidCount} citas pagadas</span>
            </div>
            {/* Mini progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[11px] font-body text-white/60 mb-1">
                <span>Tasa de cobro</span>
                <span>{paidPercent.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${paidPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Pending + Expired stacked */}
        <div className="lg:col-span-4 grid grid-rows-2 gap-5">
          <div className="group bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-gantly-gold/10 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-body font-semibold text-gantly-muted uppercase tracking-widest">Pendiente</span>
                <p className="text-2xl font-heading font-extrabold text-gantly-gold m-0 mt-1">
                  {totals.pending.toFixed(2)} &euro;
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gantly-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-gantly-gold text-xl">hourglass_top</span>
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-body font-semibold text-gantly-muted uppercase tracking-widest">Expirado</span>
                <p className="text-2xl font-heading font-extrabold text-slate-400 m-0 mt-1">
                  {totals.expired.toFixed(2)} &euro;
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-slate-400 text-xl">timer_off</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats sidebar */}
        <div className="lg:col-span-3 bg-gantly-cloud rounded-2xl p-5 border border-gantly-blue/10 flex flex-col justify-between">
          <div>
            <span className="text-xs font-body font-semibold text-gantly-muted uppercase tracking-widest">Resumen</span>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-gantly-muted">Total citas</span>
                <span className="text-sm font-heading font-bold text-gantly-text">{filtered.length}</span>
              </div>
              <div className="h-px bg-gantly-blue/10" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-gantly-muted">Precio medio</span>
                <span className="text-sm font-heading font-bold text-gantly-text">
                  {filtered.length > 0 ? (filtered.reduce((sum, a) => sum + (Number(a.price) || 0), 0) / filtered.length).toFixed(2) : '0.00'} &euro;
                </span>
              </div>
              <div className="h-px bg-gantly-blue/10" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-gantly-muted">Ingresos totales</span>
                <span className="text-sm font-heading font-bold text-gantly-blue">
                  {totalRevenue.toFixed(2)} &euro;
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters — pill style */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-1 py-1">
          <span className="material-symbols-outlined text-gantly-muted text-[18px] ml-2">calendar_month</span>
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="h-9 px-2 pr-8 rounded-lg border-none text-sm font-body text-gantly-text bg-transparent cursor-pointer outline-none appearance-none"
          >
            <option value="">Todos los meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-1 py-1">
          <span className="material-symbols-outlined text-gantly-muted text-[18px] ml-2">filter_list</span>
          <select
            value={filterPaymentStatus}
            onChange={e => setFilterPaymentStatus(e.target.value)}
            className="h-9 px-2 pr-8 rounded-lg border-none text-sm font-body text-gantly-text bg-transparent cursor-pointer outline-none appearance-none"
          >
            <option value="">Todos los estados</option>
            <option value="PAID">Pagado</option>
            <option value="PENDING">Pendiente</option>
            <option value="EXPIRED">Expirado</option>
          </select>
        </div>

        {(filterMonth || filterPaymentStatus) && (
          <button
            onClick={() => { setFilterMonth(''); setFilterPaymentStatus(''); }}
            className="h-9 px-3 rounded-lg text-xs font-heading font-semibold text-gantly-muted hover:text-gantly-text hover:bg-slate-100 cursor-pointer transition-all duration-200 border-none bg-transparent flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Appointment table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-12 gap-4 items-center">
            <span className="col-span-4 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest">Paciente</span>
            <span className="col-span-3 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest">Fecha y hora</span>
            <span className="col-span-2 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest text-right">Importe</span>
            <span className="col-span-3 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest text-right">Estado</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-gantly-cloud border-t-gantly-blue rounded-full animate-spin" />
            <p className="text-sm font-body text-gantly-muted mt-4 m-0">Cargando facturación...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gantly-cloud flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-gantly-muted">receipt_long</span>
            </div>
            <p className="text-sm font-heading font-semibold text-gantly-text m-0">Sin resultados</p>
            <p className="text-sm font-body text-gantly-muted m-0 mt-1">
              No hay citas para los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((a, idx) => (
              <div key={a.id}>
                <div
                  className={`grid grid-cols-12 gap-4 items-center px-6 py-4 cursor-pointer transition-all duration-200 hover:bg-gantly-cloud/50 group ${
                    idx !== filtered.length - 1 ? 'border-b border-slate-100/60' : ''
                  } ${expandedId === a.id ? 'bg-gantly-cloud/30' : ''}`}
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                >
                  {/* Patient */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gantly-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gantly-blue/20 transition-colors">
                      <span className="material-symbols-outlined text-gantly-blue text-base">person</span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-heading font-semibold text-sm text-gantly-text truncate block">
                        {a.user?.name || 'Paciente'}
                      </span>
                      {a.user?.email && (
                        <span className="text-[11px] font-body text-gantly-muted truncate block">{a.user.email}</span>
                      )}
                    </div>
                  </div>

                  {/* Date/Time */}
                  <div className="col-span-3">
                    <span className="text-sm font-body text-gantly-text block">{formatDate(a.startTime)}</span>
                    <span className="text-xs font-body text-gantly-muted">
                      {formatTime(a.startTime)} - {formatTime(a.endTime)}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <span className="font-heading font-bold text-sm text-gantly-text">
                      {a.price != null ? `${Number(a.price).toFixed(2)} \u20AC` : '--'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    {paymentBadge(a.paymentStatus)}
                    <span className={`material-symbols-outlined text-gantly-muted/40 text-lg transition-transform duration-200 ${expandedId === a.id ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === a.id && (
                  <div className="px-6 py-4 bg-gantly-cloud/20 border-b border-slate-100/60">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[11px] font-body text-gantly-muted uppercase tracking-widest block mb-1">Estado cita</span>
                        <span className="text-sm font-heading font-semibold text-gantly-text capitalize">{a.status?.toLowerCase() || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-body text-gantly-muted uppercase tracking-widest block mb-1">Confirmada</span>
                        <span className="text-sm font-body text-gantly-text">{a.confirmedAt ? formatDate(a.confirmedAt) : 'No confirmada'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-body text-gantly-muted uppercase tracking-widest block mb-1">Duración</span>
                        <span className="text-sm font-body text-gantly-text">
                          {Math.round((new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000)} min
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-body text-gantly-muted uppercase tracking-widest block mb-1">ID</span>
                        <span className="text-sm font-body text-gantly-muted">#{a.id}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
