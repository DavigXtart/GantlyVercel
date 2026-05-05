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

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-9 h-9 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment status badge
// ---------------------------------------------------------------------------
function PaymentBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-400 text-[13px]">—</span>;
  const lc = status.toLowerCase();
  let classes = 'px-2.5 py-0.5 rounded-xl text-xs font-semibold whitespace-nowrap ';
  let label = status;
  if (lc === 'paid' || lc === 'pagada' || lc === 'pagado') {
    classes += 'bg-gantly-emerald-50 text-gantly-emerald-700';
    label = 'Pagada';
  } else if (lc === 'pending' || lc === 'pendiente') {
    classes += 'bg-gantly-gold-50 text-gantly-gold-700';
    label = 'Pendiente';
  } else if (lc === 'fractional' || lc === 'fraccionada') {
    classes += 'bg-orange-50 text-orange-700';
    label = 'Fraccionada';
  } else if (lc === 'cancelled' || lc === 'cancelada' || lc === 'cancelado') {
    classes += 'bg-red-50 text-red-700';
    label = 'Cancelada';
  } else {
    classes += 'bg-slate-100 text-slate-600';
  }
  return <span className={classes}>{label}</span>;
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------
function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 flex-1 min-w-[160px]">
      <div className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
        {label}
      </div>
      <div className="text-[22px] font-bold" style={{ color: accent ?? '#0f172a' }}>{value}</div>
    </div>
  );
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

    // Header
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

    // Invoice number
    const invoiceNum = `FAC-${new Date(item.startTime).getFullYear()}-${String(item.appointmentId).padStart(5, '0')}`;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageW - margin - 40, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 147, 204);
    doc.text(invoiceNum, pageW - margin, 25, { align: 'right' });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 44, pageW - margin, 44);

    // Info section
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

    addRow('Clínica', clinicName);
    addRow('Psicólogo', item.psychologistName);
    addRow('Paciente', item.patientName || '—');
    addRow('Servicio', item.service || 'Sesión de psicología');
    addRow('Fecha', new Date(item.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }));

    // Price table
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
    doc.text(`€${base.toFixed(2)}`, margin + 6, y + 22);
    doc.text(`€${iva.toFixed(2)}`, pageW / 2, y + 22);
    doc.text(`€${price.toFixed(2)}`, pageW - margin - 6, y + 22, { align: 'right' });

    // Payment status
    y += 38;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 147, 204);
    doc.text(`Estado de pago: ${item.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE'}`, margin, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Gantly · Plataforma de Salud Mental · gantly.com', pageW / 2, 285, { align: 'center' });

    doc.save(`${invoiceNum}.pdf`);
  }).catch(() => {
    alert('Error al generar la factura. Asegúrate de tener conexión.');
  });
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
function exportCsv(items: ClinicBillingItem[]): void {
  const headers = ['Fecha', 'Hora inicio', 'Hora fin', 'Psicólogo', 'Paciente', 'Servicio', 'Precio', 'Estado pago'];
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
      setError('No se pudo cargar la facturación.');
    } finally {
      setLoading(false);
    }
  }, [from, to, psychologistId]);

  useEffect(() => {
    load();
  }, [load]);

  // Summary calculations
  const totalPaid = items
    .filter((i) => {
      const lc = (i.paymentStatus ?? '').toLowerCase();
      return lc === 'paid' || lc === 'pagada' || lc === 'pagado';
    })
    .reduce((sum, i) => sum + (i.price ?? 0), 0);

  const totalPending = items
    .filter((i) => {
      const lc = (i.paymentStatus ?? '').toLowerCase();
      return lc === 'pending' || lc === 'pendiente';
    })
    .reduce((sum, i) => sum + (i.price ?? 0), 0);

  const totalCancelled = items
    .filter((i) => {
      const lc = (i.paymentStatus ?? '').toLowerCase();
      return lc === 'cancelled' || lc === 'cancelada' || lc === 'cancelado';
    })
    .reduce((sum, i) => sum + (i.price ?? 0), 0);

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900">Facturación</h2>
        <button
          onClick={() => exportCsv(items)}
          disabled={items.length === 0}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
            items.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gantly-blue text-white hover:bg-gantly-blue-600 cursor-pointer'
          }`}
        >
          <span className="material-symbols-outlined text-base">download</span>
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 px-5 flex flex-wrap gap-4 items-end">
        <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-900 outline-none focus:border-gantly-blue-300 bg-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-900 outline-none focus:border-gantly-blue-300 bg-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-700">
          Psicólogo
          <select
            value={psychologistId ?? ''}
            onChange={(e) => setPsychologistId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-900 outline-none focus:border-gantly-blue-300 bg-white cursor-pointer"
          >
            <option value="">Todos los psicólogos</option>
            {psychologists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={load}
          className="self-end px-4 py-2 bg-gantly-blue text-white rounded-lg text-[13px] font-semibold hover:bg-gantly-blue-600 transition-colors cursor-pointer"
        >
          Aplicar filtros
        </button>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4 flex-wrap">
        <SummaryCard label="Total facturado" value={fmtEuro(totalPaid)} accent="#059669" />
        <SummaryCard label="Total pendiente" value={fmtEuro(totalPending)} accent="#ca8a04" />
        <SummaryCard label="Total cancelado" value={fmtEuro(totalCancelled)} accent="#dc2626" />
        <SummaryCard label="N.º citas" value={String(items.length)} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          No hay registros para el rango de fechas seleccionado.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[110px_80px_1fr_1fr_1fr_80px_110px_44px] bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Fecha</span>
            <span>Hora</span>
            <span>Psicólogo</span>
            <span>Paciente</span>
            <span>Servicio</span>
            <span className="text-right">Precio</span>
            <span className="text-center">Estado pago</span>
            <span />
          </div>

          {/* Rows */}
          {items.map((item) => (
            <div
              key={item.appointmentId}
              className="grid grid-cols-[110px_80px_1fr_1fr_1fr_80px_110px_44px] px-4 py-3 border-t border-slate-100 text-[13px] items-center"
            >
              <span className="text-slate-700">{fmtDate(item.startTime)}</span>
              <span className="text-slate-500">{fmtTime(item.startTime)}</span>
              <span className="text-slate-900 font-medium">{item.psychologistName}</span>
              <span className="text-slate-700">{item.patientName ?? '—'}</span>
              <span className="text-slate-500">{item.service ?? '—'}</span>
              <span className="text-right font-semibold text-slate-900">{fmtEuro(item.price)}</span>
              <span className="text-center">
                <PaymentBadge status={item.paymentStatus} />
              </span>
              <span className="text-center">
                <button
                  onClick={() => generateInvoicePdf(item, clinicName || 'Mi Clinica')}
                  title="Descargar factura"
                  className="text-slate-400 hover:text-gantly-blue transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-lg">receipt</span>
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
