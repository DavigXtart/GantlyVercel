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
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      PAID: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a', label: 'Pagado' },
      PENDING: { bg: 'rgba(234,179,8,0.12)', color: '#ca8a04', label: 'Pendiente' },
      EXPIRED: { bg: 'rgba(156,163,175,0.12)', color: '#6b7280', label: 'Expirado' },
    };
    const st = styles[s] || styles.PENDING;
    return (
      <span style={{
        padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
        background: st.bg, color: st.color,
      }}>
        {st.label}
      </span>
    );
  };

  return (
    <div className="mt-10 w-full">
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="bg-white rounded-3xl p-6 border border-sage/10 soft-shadow">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '22px' }}>payments</span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Cobrado</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 600, color: '#16a34a', margin: 0 }}>
            {totals.paid.toFixed(2)} &euro;
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-sage/10 soft-shadow">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#ca8a04', fontSize: '22px' }}>schedule</span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Pendiente</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 600, color: '#ca8a04', margin: 0 }}>
            {totals.pending.toFixed(2)} &euro;
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-sage/10 soft-shadow">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#6b7280', fontSize: '22px' }}>timer_off</span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Expirado</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 600, color: '#6b7280', margin: 0 }}>
            {totals.expired.toFixed(2)} &euro;
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 border border-sage/10 soft-shadow mb-6">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(90,146,112,0.2)', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}
          >
            <option value="">Todos los meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>

          <select
            value={filterPaymentStatus}
            onChange={e => setFilterPaymentStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(90,146,112,0.2)', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}
          >
            <option value="">Todos los estados</option>
            <option value="PAID">Pagado</option>
            <option value="PENDING">Pendiente</option>
            <option value="EXPIRED">Expirado</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(90,146,112,0.2)',
              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '14px', color: '#5a9270', fontFamily: "'Inter', sans-serif",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
            Refrescar
          </button>

          <span style={{ fontSize: '13px', color: '#9ca3af', marginLeft: 'auto' }}>
            {filtered.length} cita{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Appointment list */}
      <div className="bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
        <h3 className="text-2xl font-normal text-forest mb-6">Detalle de citas</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(90,146,112,0.2)', borderTopColor: '#5a9270', borderRadius: '50%', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
            No hay citas para los filtros seleccionados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(a => (
              <div
                key={a.id}
                style={{
                  display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(90,146,112,0.1)',
                  background: 'rgba(90,146,112,0.02)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px' }}>
                  <span style={{ fontWeight: 500, fontSize: '15px', color: '#1f2937' }}>
                    {a.user?.name || 'Paciente'}
                  </span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    {formatDate(a.startTime)} &middot; {formatTime(a.startTime)} - {formatTime(a.endTime)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontWeight: 600, fontSize: '16px', color: '#1f2937' }}>
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
