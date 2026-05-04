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
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid #e5e7eb',
        borderTopColor: '#5a9270',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '60px auto',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Payment status badge
// ---------------------------------------------------------------------------
function PaymentBadge({ status }: { status?: string }) {
  if (!status) return <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>;
  const lc = status.toLowerCase();
  let bg = '#fef3c7';
  let color = '#92400e';
  let label = status;
  if (lc === 'paid' || lc === 'pagada' || lc === 'pagado') {
    bg = '#dcfce7';
    color = '#166534';
    label = 'Pagada';
  } else if (lc === 'pending' || lc === 'pendiente') {
    bg = '#fef3c7';
    color = '#92400e';
    label = 'Pendiente';
  } else if (lc === 'fractional' || lc === 'fraccionada') {
    bg = '#fff7ed';
    color = '#c2410c';
    label = 'Fraccionada';
  } else if (lc === 'cancelled' || lc === 'cancelada' || lc === 'cancelado') {
    bg = '#fee2e2';
    color = '#991b1b';
    label = 'Cancelada';
  }
  return (
    <span
      style={{
        background: bg,
        color,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
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
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '18px 24px',
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ?? '#111827' }}>{value}</div>
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
    doc.setFillColor(248, 251, 247);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(24, 56, 46);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('GANTLY', margin, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(123, 159, 134);
    doc.text('Plataforma de Salud Mental', margin, 27);

    // Invoice number
    const invoiceNum = `FAC-${new Date(item.startTime).getFullYear()}-${String(item.appointmentId).padStart(5, '0')}`;
    doc.setTextColor(24, 56, 46);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageW - margin - 40, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(123, 159, 134);
    doc.text(invoiceNum, pageW - margin, 25, { align: 'right' });

    // Divider
    doc.setDrawColor(224, 240, 230);
    doc.line(margin, 44, pageW - margin, 44);

    // Info section
    doc.setTextColor(24, 56, 46);
    let y = 54;
    const addRow = (label: string, value: string) => {
      doc.setFontSize(9);
      doc.setTextColor(123, 159, 134);
      doc.text(label.toUpperCase(), margin, y);
      doc.setTextColor(24, 56, 46);
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
    doc.setFillColor(248, 251, 247);
    doc.roundedRect(margin, y, pageW - margin * 2, 30, 4, 4, 'F');
    doc.setFontSize(9);
    doc.setTextColor(123, 159, 134);
    doc.text('BASE IMPONIBLE', margin + 6, y + 10);
    doc.text('IVA (21%)', pageW / 2, y + 10);
    doc.text('TOTAL', pageW - margin - 6, y + 10, { align: 'right' });

    const price = item.price ?? 0;
    const base = price / 1.21;
    const iva = price - base;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 56, 46);
    doc.text(`€${base.toFixed(2)}`, margin + 6, y + 22);
    doc.text(`€${iva.toFixed(2)}`, pageW / 2, y + 22);
    doc.text(`€${price.toFixed(2)}`, pageW - margin - 6, y + 22, { align: 'right' });

    // Payment status
    y += 38;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(123, 159, 134);
    doc.text(`Estado de pago: ${item.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE'}`, margin, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 185);
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

  // Inject keyframe
  if (typeof document !== 'undefined' && !document.getElementById('clinic-billing-spin')) {
    const style = document.createElement('style');
    style.id = 'clinic-billing-spin';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

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
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Facturación</h2>
        <button
          onClick={() => exportCsv(items)}
          disabled={items.length === 0}
          style={{
            background: items.length === 0 ? '#f3f4f6' : '#5a9270',
            color: items.length === 0 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: 13,
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'flex-end',
        }}
      >
        <label style={labelStyle}>
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Psicólogo
          <select
            value={psychologistId ?? ''}
            onChange={(e) => setPsychologistId(e.target.value ? Number(e.target.value) : undefined)}
            style={{ ...inputStyle, cursor: 'pointer' }}
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
          style={{
            background: '#5a9270',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            alignSelf: 'flex-end',
          }}
        >
          Aplicar filtros
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SummaryCard label="Total facturado" value={fmtEuro(totalPaid)} accent="#166534" />
        <SummaryCard label="Total pendiente" value={fmtEuro(totalPending)} accent="#92400e" />
        <SummaryCard label="Total cancelado" value={fmtEuro(totalCancelled)} accent="#991b1b" />
        <SummaryCard label="N.º citas" value={String(items.length)} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: 8, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          No hay registros para el rango de fechas seleccionado.
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 80px 1fr 1fr 1fr 80px 110px 44px',
              background: '#f9fafb',
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>Fecha</span>
            <span>Hora</span>
            <span>Psicólogo</span>
            <span>Paciente</span>
            <span>Servicio</span>
            <span style={{ textAlign: 'right' }}>Precio</span>
            <span style={{ textAlign: 'center' }}>Estado pago</span>
            <span />
          </div>

          {/* Rows */}
          {items.map((item) => (
            <div
              key={item.appointmentId}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 80px 1fr 1fr 1fr 80px 110px 44px',
                padding: '12px 16px',
                borderTop: '1px solid #f3f4f6',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#374151' }}>{fmtDate(item.startTime)}</span>
              <span style={{ color: '#6b7280' }}>{fmtTime(item.startTime)}</span>
              <span style={{ color: '#111827', fontWeight: 500 }}>{item.psychologistName}</span>
              <span style={{ color: '#374151' }}>{item.patientName ?? '—'}</span>
              <span style={{ color: '#6b7280' }}>{item.service ?? '—'}</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: '#111827' }}>{fmtEuro(item.price)}</span>
              <span style={{ textAlign: 'center' }}>
                <PaymentBadge status={item.paymentStatus} />
              </span>
              <span style={{ textAlign: 'center' }}>
                <button
                  onClick={() => generateInvoicePdf(item, clinicName || 'Mi Clinica')}
                  title="Descargar factura"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, lineHeight: 1 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#5a9270')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt</span>
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 13,
  outline: 'none',
  background: 'white',
  color: '#111827',
};
