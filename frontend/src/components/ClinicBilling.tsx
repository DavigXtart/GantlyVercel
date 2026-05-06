import { useState, useEffect, useCallback } from 'react';
import { clinicService } from '../services/api';
import type { ClinicBillingItem } from '../services/api';

interface Props {
  psychologists: Array<{ id: number; name: string }>;
  clinicName?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function today(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function fmtEuro(amount?: number): string {
  if (amount == null) return '—';
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// ---------------------------------------------------------------------------
// Payment status badge
// ---------------------------------------------------------------------------
function PaymentBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;
  const lc = status.toLowerCase();
  let cls = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ';
  let label = status;
  let dot = '';
  if (lc === 'paid' || lc === 'pagada' || lc === 'pagado') {
    cls += 'bg-emerald-50 text-emerald-700';
    label = 'Pagada';
    dot = 'bg-emerald-500';
  } else if (lc === 'pending' || lc === 'pendiente') {
    cls += 'bg-amber-50 text-amber-700';
    label = 'Pendiente';
    dot = 'bg-amber-500';
  } else if (lc === 'fractional' || lc === 'fraccionada') {
    cls += 'bg-orange-50 text-orange-700';
    label = 'Fraccionada';
    dot = 'bg-orange-500';
  } else if (lc === 'cancelled' || lc === 'cancelada' || lc === 'cancelado') {
    cls += 'bg-red-50 text-red-600';
    label = 'Cancelada';
    dot = 'bg-red-400';
  } else {
    cls += 'bg-slate-50 text-slate-600';
    dot = 'bg-slate-400';
  }
  return <span className={cls}><span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}</span>;
}

// ---------------------------------------------------------------------------
// PDF invoice generator
// ---------------------------------------------------------------------------
function generateInvoicePdf(item: {
  appointmentId: number;
  startTime: string;
  psychologistName: string;
  patientName?: string | null;
  service?: string | null;
  price?: number | null;
  paymentStatus?: string | null;
}, clinicName: string) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 20;

    doc.setFillColor(241, 245, 249);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('GANTLY', margin, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 147, 204);
    doc.text('Plataforma de Salud Mental', margin, 27);

    const invoiceNum = `FAC-${new Date(item.startTime).getFullYear()}-${String(item.appointmentId).padStart(5, '0')}`;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageW - margin - 40, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 147, 204);
    doc.text(invoiceNum, pageW - margin, 25, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 44, pageW - margin, 44);

    doc.setTextColor(15, 23, 42);
    let y = 54;
    const addRow = (label: string, value: string) => {
      doc.setFontSize(9);
      doc.setTextColor(46, 147, 204);
      doc.text(label.toUpperCase(), margin, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin, y + 5);
      doc.setFont('helvetica', 'normal');
      y += 14;
    };

    addRow('Clinica', clinicName);
    addRow('Psicologo', item.psychologistName);
    addRow('Paciente', item.patientName || '—');
    addRow('Servicio', item.service || 'Sesion de psicologia');
    addRow('Fecha', new Date(item.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }));

    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageW - margin * 2, 30, 4, 4, 'F');
    doc.setFontSize(9);
    doc.setTextColor(46, 147, 204);
    doc.text('BASE IMPONIBLE', margin + 6, y + 10);
    doc.text('IVA (21%)', pageW / 2, y + 10);
    doc.text('TOTAL', pageW - margin - 6, y + 10, { align: 'right' });

    const price = item.price ?? 0;
    const base = price / 1.21;
    const iva = price - base;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`\u20AC${base.toFixed(2)}`, margin + 6, y + 22);
    doc.text(`\u20AC${iva.toFixed(2)}`, pageW / 2, y + 22);
    doc.text(`\u20AC${price.toFixed(2)}`, pageW - margin - 6, y + 22, { align: 'right' });

    y += 38;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 147, 204);
    doc.text(`Estado de pago: ${item.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE'}`, margin, y);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Gantly · Plataforma de Salud Mental · gantly.com', pageW / 2, 285, { align: 'center' });

    doc.save(`${invoiceNum}.pdf`);
  }).catch(() => {
    alert('Error al generar la factura.');
  });
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
function exportCsv(items: ClinicBillingItem[]): void {
  const headers = ['Fecha', 'Hora inicio', 'Hora fin', 'Psicologo', 'Paciente', 'Servicio', 'Precio', 'Estado pago'];
  const rows = items.map((item) => [
    fmtDate(item.startTime),
    fmtTime(item.startTime),
    fmtTime(item.endTime),
    item.psychologistName,
    item.patientName ?? '',
    item.service ?? '',
    item.price != null ? item.price.toFixed(2) : '',
    item.paymentStatus ?? '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `facturacion_${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ClinicBilling({ psychologists, clinicName }: Props) {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(daysFromNow(365));
  const [psychologistId, setPsychologistId] = useState<number | undefined>(undefined);

  const [items, setItems] = useState<ClinicBillingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clinicService.getBilling(from || undefined, to || undefined, psychologistId);
      setItems(data);
    } catch {
      setError('No se pudo cargar la facturacion.');
    } finally {
      setLoading(false);
    }
  }, [from, to, psychologistId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPaid = items
    .filter((i) => { const lc = (i.paymentStatus ?? '').toLowerCase(); return lc === 'paid' || lc === 'pagada' || lc === 'pagado'; })
    .reduce((sum, i) => sum + (i.price ?? 0), 0);
  const totalPending = items
    .filter((i) => { const lc = (i.paymentStatus ?? '').toLowerCase(); return lc === 'pending' || lc === 'pendiente'; })
    .reduce((sum, i) => sum + (i.price ?? 0), 0);
  const totalCancelled = items
    .filter((i) => { const lc = (i.paymentStatus ?? '').toLowerCase(); return lc === 'cancelled' || lc === 'cancelada' || lc === 'cancelado'; })
    .reduce((sum, i) => sum + (i.price ?? 0), 0);

  const inputCls = "h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-gantly-blue transition-colors";

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Hero: total paid */}
        <div className="col-span-2 xl:col-span-1 bg-gradient-to-br from-gantly-navy via-gantly-blue to-gantly-cyan rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-5">
            <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-white text-lg">payments</span>
            </div>
            <div className="text-2xl font-heading font-bold text-white">{fmtEuro(totalPaid)}</div>
            <div className="text-[11px] font-heading font-bold uppercase tracking-widest text-white/60 mt-1">Cobrado</div>
          </div>
        </div>
        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-300 to-amber-400" />
          <div className="p-5">
            <div className="size-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-amber-500 text-lg">schedule</span>
            </div>
            <div className="text-2xl font-heading font-bold text-slate-900">{fmtEuro(totalPending)}</div>
            <div className="text-xs font-heading font-bold uppercase tracking-widest text-slate-500 mt-1">Pendiente</div>
          </div>
        </div>
        {/* Cancelled */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-300 to-red-400" />
          <div className="p-5">
            <div className="size-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-red-400 text-lg">block</span>
            </div>
            <div className="text-2xl font-heading font-bold text-slate-900">{fmtEuro(totalCancelled)}</div>
            <div className="text-xs font-heading font-bold uppercase tracking-widest text-slate-500 mt-1">Cancelado</div>
          </div>
        </div>
        {/* Count */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-gantly-blue to-gantly-cyan" />
          <div className="p-5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-gantly-blue text-lg">receipt_long</span>
            </div>
            <div className="text-2xl font-heading font-bold text-slate-900">{items.length}</div>
            <div className="text-xs font-heading font-bold uppercase tracking-widest text-slate-500 mt-1">Citas</div>
          </div>
        </div>
      </div>

      {/* Filters + table in one card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="material-symbols-outlined text-slate-400 text-lg">filter_list</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
            <span className="text-slate-300 text-sm">—</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
            <select
              value={psychologistId ?? ''}
              onChange={(e) => setPsychologistId(e.target.value ? Number(e.target.value) : undefined)}
              className={`${inputCls} cursor-pointer min-w-[160px]`}
            >
              <option value="">Todos los psicologos</option>
              {psychologists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={load} className="h-9 px-4 bg-gantly-blue text-white rounded-lg text-sm font-semibold hover:bg-gantly-blue/90 transition-colors cursor-pointer border-none">
              Filtrar
            </button>
          </div>
          <button
            onClick={() => exportCsv(items)}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-lg transition-colors cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-sm">{error}</div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-slate-300 text-3xl">receipt_long</span>
            </div>
            <p className="text-sm text-slate-500">No hay registros para este periodo</p>
            <p className="text-xs text-slate-400 mt-1">Ajusta los filtros o el rango de fechas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hora</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Psicologo</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paciente</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Servicio</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Importe</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => (
                  <tr key={item.appointmentId} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-5 py-3 text-sm text-slate-700 whitespace-nowrap">{fmtDate(item.startTime)}</td>
                    <td className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{fmtTime(item.startTime)}</td>
                    <td className="px-3 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{item.psychologistName}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">{item.patientName ?? '—'}</td>
                    <td className="px-3 py-3 text-sm text-slate-500">{item.service ?? '—'}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">{fmtEuro(item.price)}</td>
                    <td className="px-3 py-3 text-center"><PaymentBadge status={item.paymentStatus} /></td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => generateInvoicePdf(item, clinicName || 'Mi Clinica')}
                        title="Descargar factura"
                        className="text-slate-300 hover:text-gantly-blue hover:bg-gantly-blue/5 rounded-lg p-1.5 transition-colors cursor-pointer bg-transparent border-none"
                      >
                        <span className="material-symbols-outlined text-base">receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
