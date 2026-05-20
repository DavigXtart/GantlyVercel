import { useState, useMemo } from 'react';
import { Wallet, RefreshCw, TrendingUp, Hourglass, TimerOff, Calendar, ListFilter, X, Receipt, User, ChevronDown, CheckCircle, Clock, FileText, Download } from 'lucide-react';

interface Appointment {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  price: number | null;
  paymentStatus: string | null;
  confirmedAt: string | null;
  user: { id: number; name: string; email: string } | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  taxExempt?: boolean | null;
}

interface Props {
  appointments: Appointment[];
  loading: boolean;
  onRefresh: () => void;
  psychologistName?: string;
}

// ---------------------------------------------------------------------------
// PDF invoice generator for psychologists
// ---------------------------------------------------------------------------
function generatePsychInvoicePdf(
  items: Appointment[],
  psychologistName: string,
  filterMonth: string
) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 20;

    // Header
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(psychologistName || 'Psicólogo', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 147, 204);
    const periodLabel = filterMonth
      ? new Date(Number(filterMonth.split('-')[0]), Number(filterMonth.split('-')[1]) - 1)
          .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      : 'Todas las citas';
    doc.text('Informe de facturación — ' + periodLabel, margin, 26);

    const invoiceDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('Generado: ' + invoiceDate, pageW - margin, 18, { align: 'right' });

    // Separator
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 40, pageW - margin, 40);

    // Table header
    let y = 48;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('FECHA', margin + 2, y);
    doc.text('PACIENTE', margin + 35, y);
    doc.text('BASE', margin + 95, y, { align: 'right' });
    doc.text('IVA', margin + 120, y, { align: 'right' });
    doc.text('TOTAL', margin + 145, y, { align: 'right' });
    doc.text('ESTADO', margin + 168, y, { align: 'right' });

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    let totalBase = 0;
    let totalIva = 0;
    let totalAmount = 0;

    for (const a of items) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const base = Number(a.price) || 0;
      const iva = a.taxExempt ? 0 : (Number(a.taxAmount) || 0);
      const total = a.totalAmount != null ? Number(a.totalAmount) : base;

      totalBase += base;
      totalIva += iva;
      totalAmount += total;

      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const dateStr = new Date(a.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.text(dateStr, margin + 2, y);
      doc.text((a.user?.name || 'Paciente').substring(0, 30), margin + 35, y);
      doc.text(base.toFixed(2) + ' \u20AC', margin + 95, y, { align: 'right' });
      doc.text(a.taxExempt ? 'Exento' : (iva.toFixed(2) + ' \u20AC'), margin + 120, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(total.toFixed(2) + ' \u20AC', margin + 145, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(a.paymentStatus === 'PAID' ? 5 : 180, a.paymentStatus === 'PAID' ? 150 : 130, a.paymentStatus === 'PAID' ? 105 : 0);
      doc.text(a.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente', margin + 168, y, { align: 'right' });
      doc.setTextColor(15, 23, 42);
      y += 6;
      // separator line
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y - 2, pageW - margin, y - 2);
    }

    // Totals
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageW - margin * 2, 16, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(46, 147, 204);
    doc.text('TOTAL BASE', margin + 6, y + 6);
    doc.text('TOTAL IVA', pageW / 2 - 10, y + 6);
    doc.text('TOTAL', pageW - margin - 6, y + 6, { align: 'right' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(totalBase.toFixed(2) + ' \u20AC', margin + 6, y + 13);
    doc.text(totalIva.toFixed(2) + ' \u20AC', pageW / 2 - 10, y + 13);
    doc.text(totalAmount.toFixed(2) + ' \u20AC', pageW - margin - 6, y + 13, { align: 'right' });

    // Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Gantly \u00B7 Plataforma de Salud Mental \u00B7 gantly.com', pageW / 2, 285, { align: 'center' });

    const fileName = filterMonth
      ? `facturacion_${psychologistName.replace(/\s+/g, '_')}_${filterMonth}.pdf`
      : `facturacion_${psychologistName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }).catch(() => {
    // fallback
  });
}

// ---------------------------------------------------------------------------
// CSV export for psychologists
// ---------------------------------------------------------------------------
function exportPsychCsv(items: Appointment[], psychologistName: string) {
  const headers = ['Fecha', 'Hora inicio', 'Hora fin', 'Paciente', 'Base', 'IVA exento', 'Tipo IVA', 'IVA', 'Total', 'Estado pago'];
  const rows = items.map(a => [
    new Date(a.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
    new Date(a.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    new Date(a.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    a.user?.name ?? '',
    a.price != null ? Number(a.price).toFixed(2) : '',
    a.taxExempt ? 'Si' : 'No',
    a.taxExempt ? 'Exento' : (a.taxRate != null ? `${(Number(a.taxRate) * 100).toFixed(0)}%` : ''),
    a.taxAmount != null ? Number(a.taxAmount).toFixed(2) : '0.00',
    (a.totalAmount != null ? Number(a.totalAmount) : a.price != null ? Number(a.price) : 0).toFixed(2),
    a.paymentStatus ?? '',
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `facturacion_${psychologistName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function PsychBillingTab({ appointments, loading, onRefresh, psychologistName }: Props) {
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

  const paymentBadgeIcons: Record<string, React.ReactNode> = {
    PAID: <CheckCircle size={13} />,
    PENDING: <Clock size={13} />,
    EXPIRED: <TimerOff size={13} />,
  };

  const paymentBadge = (status: string | null) => {
    const s = status || 'PENDING';
    const styles: Record<string, { classes: string; label: string }> = {
      PAID: { classes: 'bg-gantly-emerald/10 text-gantly-emerald border border-gantly-emerald/20', label: 'Pagado' },
      PENDING: { classes: 'bg-gantly-gold/10 text-gantly-gold border border-gantly-gold/20', label: 'Pendiente' },
      EXPIRED: { classes: 'bg-slate-100 text-slate-500 border border-slate-200', label: 'Expirado' },
    };
    const st = styles[s] || styles.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold ${st.classes}`}>
        {paymentBadgeIcons[s] || paymentBadgeIcons.PENDING}
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
            <Wallet className="text-gantly-emerald" size={20} />
          </div>
          <div>
            <h3 className="m-0 text-2xl font-heading font-bold text-gantly-text">Facturación</h3>
            <p className="text-sm font-body text-gantly-muted m-0 mt-0.5">{filtered.length} cita{filtered.length !== 1 ? 's' : ''} en el período</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generatePsychInvoicePdf(filtered, psychologistName || 'Psicólogo', filterMonth)}
            disabled={filtered.length === 0}
            className="h-10 px-4 rounded-xl bg-gantly-blue text-white cursor-pointer flex items-center gap-1.5 text-sm font-heading font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 border-none hover:bg-gantly-blue/90"
          >
            <FileText size={16} />
            Generar PDF
          </button>
          <button
            onClick={() => exportPsychCsv(filtered, psychologistName || 'Psicólogo')}
            disabled={filtered.length === 0}
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 cursor-pointer flex items-center gap-1.5 text-sm font-heading font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:bg-slate-50"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-gantly-cloud hover:bg-gantly-blue hover:text-white text-gantly-blue cursor-pointer flex items-center gap-1.5 text-sm font-heading font-semibold disabled:opacity-60 transition-all duration-300 border-none"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Revenue overview — asymmetric bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Main revenue card — large */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl p-6 shadow-sm border border-gantly-emerald/20 bg-gradient-emerald">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="text-white/70" size={18} />
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
                <Hourglass className="text-gantly-gold" size={20} />
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-body font-semibold text-gantly-muted uppercase tracking-widest">Expirado</span>
                <p className="text-2xl font-heading font-extrabold text-slate-500 m-0 mt-1">
                  {totals.expired.toFixed(2)} &euro;
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TimerOff className="text-slate-500" size={20} />
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
          <Calendar className="text-gantly-muted ml-2" size={18} />
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
          <ListFilter className="text-gantly-muted ml-2" size={18} />
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
            <X size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Appointment table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-12 gap-4 items-center">
            <span className="col-span-3 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest">Paciente</span>
            <span className="col-span-2 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest">Fecha y hora</span>
            <span className="col-span-1 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest text-right">Base</span>
            <span className="col-span-2 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest text-right">IVA</span>
            <span className="col-span-1 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest text-right">Total</span>
            <span className="col-span-3 text-[11px] font-heading font-semibold text-gantly-muted uppercase tracking-widest text-right">Estado</span>
          </div>
        </div>

        {loading ? (
          <div className="py-6 px-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 items-center py-3">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="animate-pulse bg-slate-200 rounded-full w-8 h-8 shrink-0" />
                  <div className="animate-pulse bg-slate-200 rounded h-3.5 w-24" />
                </div>
                <div className="col-span-2"><div className="animate-pulse bg-slate-100 rounded h-3 w-20" /></div>
                <div className="col-span-1"><div className="animate-pulse bg-slate-100 rounded h-3 w-10 ml-auto" /></div>
                <div className="col-span-2"><div className="animate-pulse bg-slate-100 rounded h-3 w-12 ml-auto" /></div>
                <div className="col-span-1"><div className="animate-pulse bg-slate-100 rounded h-3 w-10 ml-auto" /></div>
                <div className="col-span-3"><div className="animate-pulse bg-slate-200 rounded-full h-6 w-16 ml-auto" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gantly-cloud flex items-center justify-center mb-4">
              <Receipt className="text-gantly-muted" size={28} />
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
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gantly-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gantly-blue/20 transition-colors">
                      <User className="text-gantly-blue" size={16} />
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
                  <div className="col-span-2">
                    <span className="text-sm font-body text-gantly-text block">{formatDate(a.startTime)}</span>
                    <span className="text-xs font-body text-gantly-muted">
                      {formatTime(a.startTime)} - {formatTime(a.endTime)}
                    </span>
                  </div>

                  {/* Base (price) */}
                  <div className="col-span-1 text-right">
                    <span className="font-heading font-semibold text-sm text-gantly-text">
                      {a.price != null ? `${Number(a.price).toFixed(2)} \u20AC` : '--'}
                    </span>
                  </div>

                  {/* IVA */}
                  <div className="col-span-2 text-right">
                    {a.taxExempt ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-heading font-semibold bg-slate-100 text-slate-500">Exento</span>
                    ) : (
                      <span className="font-heading font-semibold text-sm text-gantly-text">
                        {a.taxAmount != null ? `${Number(a.taxAmount).toFixed(2)} \u20AC` : '--'}
                        {a.taxRate != null && a.taxRate > 0 && (
                          <span className="text-[10px] text-gantly-muted ml-1">({(Number(a.taxRate) * 100).toFixed(0)}%)</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Total */}
                  <div className="col-span-1 text-right">
                    <span className="font-heading font-bold text-sm text-gantly-text">
                      {(a.totalAmount != null ? Number(a.totalAmount).toFixed(2) : a.price != null ? Number(a.price).toFixed(2) : '--') + (a.totalAmount != null || a.price != null ? ' \u20AC' : '')}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    {paymentBadge(a.paymentStatus)}
                    <ChevronDown className={`text-gantly-muted/40 transition-transform duration-200 ${expandedId === a.id ? 'rotate-180' : ''}`} size={18} />
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
