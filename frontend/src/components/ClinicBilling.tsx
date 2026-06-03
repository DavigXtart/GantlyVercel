import { useState, useEffect, useCallback, useMemo } from 'react';
import { clinicService } from '../services/api';
import type { ClinicBillingItem } from '../services/api';
import { toast } from './ui/Toast';
import {
  ArrowUpRight, ArrowDownRight, Calendar, ChevronDown, Download,
  FileText, Search, TrendingUp, Wallet, X, Shield, CreditCard,
} from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';

interface Props {
  psychologists: Array<{ id: number; name: string }>;
  clinicName?: string;
  clinicNif?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicRazonSocial?: string;
  clinicDireccionFiscal?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function today(): string {
  return new Date().toISOString().split('T')[0];
}

function startOfMonth(offset = 0): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().split('T')[0];
}

function endOfMonth(offset = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1 + offset, 0);
  return d.toISOString().split('T')[0];
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
  } catch {
    return iso;
  }
}

function fmtDateFull(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
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
  if (amount == null) return '0,00 \u20AC';
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function fmtCompact(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1).replace('.0', '')}k \u20AC`;
  return `${amount.toFixed(0)} \u20AC`;
}

type PeriodKey = 'this_month' | 'last_month' | '3_months' | '6_months' | 'custom';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'this_month', label: 'Este mes' },
  { key: 'last_month', label: 'Mes anterior' },
  { key: '3_months', label: '3 meses' },
  { key: '6_months', label: '6 meses' },
  { key: 'custom', label: 'Personalizado' },
];

function periodDates(key: PeriodKey): { from: string; to: string } {
  switch (key) {
    case 'this_month': return { from: startOfMonth(), to: endOfMonth() };
    case 'last_month': return { from: startOfMonth(-1), to: endOfMonth(-1) };
    case '3_months': return { from: startOfMonth(-2), to: endOfMonth() };
    case '6_months': return { from: startOfMonth(-5), to: endOfMonth() };
    case 'custom': return { from: startOfMonth(-2), to: today() };
  }
}

// ---------------------------------------------------------------------------
// Payment status helpers
// ---------------------------------------------------------------------------
function paymentCategory(status?: string | null): 'paid' | 'pending' | 'cancelled' | 'other' {
  const lc = (status ?? '').toLowerCase();
  if (lc === 'paid' || lc === 'pagada' || lc === 'pagado') return 'paid';
  if (lc === 'pending' || lc === 'pendiente') return 'pending';
  if (lc === 'cancelled' || lc === 'cancelada' || lc === 'cancelado') return 'cancelled';
  return 'other';
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  paid:      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Cobrada' },
  pending:   { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pendiente' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400', label: 'Cancelada' },
  other:     { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400', label: 'Otro' },
};

function PaymentBadge({ status }: { status?: string }) {
  const cat = paymentCategory(status);
  const s = STATUS_STYLES[cat];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Revenue mini-bar (proportional horizontal bar)
// ---------------------------------------------------------------------------
function RevenueBar({ paid, pending, cancelled }: { paid: number; pending: number; cancelled: number }) {
  const total = paid + pending + cancelled;
  if (total === 0) return <div className="h-1.5 rounded-full bg-slate-100 w-full" />;
  const pPaid = (paid / total) * 100;
  const pPending = (pending / total) * 100;
  const pCancelled = (cancelled / total) * 100;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 w-full">
      {pPaid > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${pPaid}%` }} />}
      {pPending > 0 && <div className="bg-amber-400 transition-all duration-500" style={{ width: `${pPending}%` }} />}
      {pCancelled > 0 && <div className="bg-slate-300 transition-all duration-500" style={{ width: `${pCancelled}%` }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PDF invoice generator (unchanged logic)
// ---------------------------------------------------------------------------
function generateInvoicePdf(item: {
  appointmentId: number;
  startTime: string;
  psychologistName: string;
  patientName?: string | null;
  service?: string | null;
  price?: number | null;
  paymentStatus?: string | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  taxExempt?: boolean | null;
}, clinicName: string, clinicNif?: string, razonSocial?: string, direccionFiscal?: string, clinicAddress?: string, clinicPhone?: string) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 20;

    doc.setFillColor(241, 245, 249);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(clinicName || 'GANTLY', margin, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 147, 204);
    doc.text('Plataforma de Salud Mental', margin, 27);
    const invoiceAddress = direccionFiscal || clinicAddress;
    let infoY = 27;
    if (clinicNif) {
      doc.setTextColor(100, 116, 139);
      doc.text('NIF: ' + clinicNif, margin, infoY + 6);
      infoY += 5;
    }
    if (invoiceAddress) {
      doc.setTextColor(100, 116, 139);
      doc.text(invoiceAddress, margin, infoY + 6);
      infoY += 5;
    }
    if (clinicPhone) {
      doc.setTextColor(100, 116, 139);
      doc.text('Tel: ' + clinicPhone, margin, infoY + 6);
    }

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

    addRow('Clínica', razonSocial || clinicName);
    addRow('Psicólogo', item.psychologistName);
    addRow('Paciente', item.patientName || '—');
    addRow('Servicio', item.service || 'Sesión de psicología');
    addRow('Fecha', new Date(item.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }));

    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageW - margin * 2, 30, 4, 4, 'F');
    doc.setFontSize(9);
    doc.setTextColor(46, 147, 204);
    doc.text('BASE IMPONIBLE', margin + 6, y + 10);
    const ivaLabel = item.taxExempt ? 'IVA (Exento)' : `IVA (${item.taxRate != null ? (item.taxRate * 100).toFixed(0) : '21'}%)`;
    doc.text(ivaLabel, pageW / 2, y + 10);
    doc.text('TOTAL', pageW - margin - 6, y + 10, { align: 'right' });

    const base = item.price ?? 0;
    const iva = item.taxExempt ? 0 : (item.taxAmount ?? 0);
    const total = item.totalAmount ?? base;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`\u20AC${base.toFixed(2)}`, margin + 6, y + 22);
    doc.text(item.taxExempt ? 'Exento' : `\u20AC${iva.toFixed(2)}`, pageW / 2, y + 22);
    doc.text(`\u20AC${total.toFixed(2)}`, pageW - margin - 6, y + 22, { align: 'right' });

    y += 38;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(46, 147, 204);
    doc.text(`Estado de pago: ${item.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE'}`, margin, y);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text((clinicName || 'Gantly') + ' · Plataforma de Salud Mental · gantly.com', pageW / 2, 285, { align: 'center' });

    doc.save(`${invoiceNum}.pdf`);
  }).catch(() => {
    toast.error('No se pudo generar la factura. Inténtalo de nuevo.');
  });
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
function exportCsv(items: ClinicBillingItem[]): void {
  const headers = ['Fecha', 'Hora inicio', 'Hora fin', 'Psicólogo', 'Paciente', 'Servicio', 'Tipo facturación', 'Aseguradora', 'Base', 'IVA exento', 'Tipo IVA', 'IVA', 'Total', 'Estado pago'];
  const rows = items.map((item) => [
    fmtDateFull(item.startTime),
    fmtTime(item.startTime),
    fmtTime(item.endTime),
    item.psychologistName,
    item.patientName ?? '',
    item.service ?? '',
    item.billingType === 'INSURANCE' ? 'Aseguradora' : 'Privado',
    item.insuranceCompanyName ?? '',
    item.price != null ? item.price.toFixed(2) : '',
    item.taxExempt ? 'Si' : 'No',
    item.taxExempt ? 'Exento' : (item.taxRate != null ? `${(item.taxRate * 100).toFixed(0)}%` : ''),
    item.taxAmount != null ? item.taxAmount.toFixed(2) : '0.00',
    (item.totalAmount ?? item.price ?? 0).toFixed(2),
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
type BillingFilter = 'ALL' | 'PRIVATE' | 'INSURANCE';

export default function ClinicBilling({ psychologists, clinicName, clinicNif, clinicAddress, clinicPhone, clinicRazonSocial, clinicDireccionFiscal }: Props) {
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(endOfMonth());
  const [psychologistId, setPsychologistId] = useState<number | undefined>(undefined);
  const [showCustom, setShowCustom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('ALL');

  const [items, setItems] = useState<ClinicBillingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectPeriod = (key: PeriodKey) => {
    setPeriod(key);
    if (key === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const d = periodDates(key);
      setFrom(d.from);
      setTo(d.to);
    }
  };

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

  // Computed totals
  const totals = useMemo(() => {
    let paid = 0, pending = 0, cancelled = 0, paidCount = 0, pendingCount = 0;
    for (const i of items) {
      const cat = paymentCategory(i.paymentStatus);
      const amount = i.totalAmount ?? i.price ?? 0;
      if (cat === 'paid') { paid += amount; paidCount++; }
      else if (cat === 'pending') { pending += amount; pendingCount++; }
      else if (cat === 'cancelled') { cancelled += amount; }
    }
    return { paid, pending, cancelled, paidCount, pendingCount, total: paid + pending };
  }, [items]);

  // Billing type totals
  const billingTypeTotals = useMemo(() => {
    let privateTotal = 0, insuranceTotal = 0, privateCount = 0, insuranceCount = 0;
    for (const i of items) {
      const amount = i.totalAmount ?? i.price ?? 0;
      if (i.billingType === 'INSURANCE') { insuranceTotal += amount; insuranceCount++; }
      else { privateTotal += amount; privateCount++; }
    }
    return { privateTotal, insuranceTotal, privateCount, insuranceCount };
  }, [items]);

  // Filtered items by search and billing type
  const filteredItems = useMemo(() => {
    let filtered = items;
    if (billingFilter !== 'ALL') {
      filtered = filtered.filter(i =>
        billingFilter === 'INSURANCE' ? i.billingType === 'INSURANCE' : i.billingType !== 'INSURANCE'
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        (i.psychologistName ?? '').toLowerCase().includes(q) ||
        (i.patientName ?? '').toLowerCase().includes(q) ||
        (i.service ?? '').toLowerCase().includes(q) ||
        (i.insuranceCompanyName ?? '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, searchQuery, billingFilter]);

  // Totals for the footer
  const tableFooter = useMemo(() => {
    let base = 0, tax = 0, total = 0;
    for (const i of filteredItems) {
      base += i.price ?? 0;
      tax += i.taxExempt ? 0 : (i.taxAmount ?? 0);
      total += i.totalAmount ?? i.price ?? 0;
    }
    return { base, tax, total };
  }, [filteredItems]);

  return (
    <div className="space-y-5">
      {/* ─── Top bar: period pills + psychologist + exports ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => selectPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-none ${
                period === p.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range (collapsible) */}
        {showCustom && (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-gantly-blue/50 transition-colors"
            />
            <span className="text-slate-400 text-xs">a</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-gantly-blue/50 transition-colors"
            />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Billing type filter */}
          <div className="relative">
            <select
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value as BillingFilter)}
              className="h-8 pl-3 pr-7 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-gantly-blue/50 transition-colors cursor-pointer appearance-none"
            >
              <option value="ALL">Todos</option>
              <option value="PRIVATE">Privado</option>
              <option value="INSURANCE">Aseguradora</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Psychologist filter */}
          <div className="relative">
            <select
              value={psychologistId ?? ''}
              onChange={(e) => setPsychologistId(e.target.value ? Number(e.target.value) : undefined)}
              className="h-8 pl-3 pr-7 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-gantly-blue/50 transition-colors cursor-pointer appearance-none"
            >
              <option value="">Todos</option>
              {psychologists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* CSV */}
          <button
            onClick={() => exportCsv(items)}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} />
            CSV
          </button>
        </div>
      </div>

      {/* ─── Metrics row ─── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Revenue summary - wide card */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Ingresos periodo</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{fmtEuro(totals.paid)}</p>
            </div>
            <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
          </div>
          <RevenueBar paid={totals.paid} pending={totals.pending} cancelled={totals.cancelled} />
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-500">Cobrado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] text-slate-500">Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[11px] text-slate-500">Cancelado</span>
            </div>
          </div>
        </div>

        {/* 3 compact metric cards */}
        <div className="col-span-4 lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Wallet size={15} className="text-amber-500" />
            {totals.pendingCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                <ArrowUpRight size={10} />
                {totals.pendingCount}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-slate-900">{fmtCompact(totals.pending)}</p>
            <p className="text-[11px] text-slate-500">Por cobrar</p>
          </div>
        </div>

        <div className="col-span-4 lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Calendar size={15} className="text-gantly-blue" />
            <span className="text-[10px] font-medium text-slate-400">{items.length} total</span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-slate-900">{totals.paidCount}</p>
            <p className="text-[11px] text-slate-500">Sesiones cobradas</p>
          </div>
        </div>

        <div className="col-span-4 lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <ArrowDownRight size={15} className="text-slate-400" />
            <span className="text-[10px] font-medium text-slate-400">{fmtCompact(totals.cancelled)}</span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-slate-900">
              {items.length > 0
                ? `${((totals.paidCount / items.length) * 100).toFixed(0)}%`
                : '—'
              }
            </p>
            <p className="text-[11px] text-slate-500">Tasa de cobro</p>
          </div>
        </div>
      </div>

      {/* ─── Billing type breakdown ─── */}
      {(billingTypeTotals.privateCount > 0 || billingTypeTotals.insuranceCount > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
              <CreditCard size={16} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-500 mb-0.5">Privado</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{fmtEuro(billingTypeTotals.privateTotal)}</p>
            </div>
            <span className="text-xs text-slate-400">{billingTypeTotals.privateCount} sesiones</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-500 mb-0.5">Aseguradora</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{fmtEuro(billingTypeTotals.insuranceTotal)}</p>
            </div>
            <span className="text-xs text-slate-400">{billingTypeTotals.insuranceCount} sesiones</span>
          </div>
        </div>
      )}

      {/* ─── Transactions table ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Transacciones</h3>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="h-8 pl-8 pr-3 w-48 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:bg-white focus:border-gantly-blue/50 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-400">{filteredItems.length} registros</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs">{error}</div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
              <FileText className="text-slate-300" size={22} />
            </div>
            <p className="text-sm font-medium text-slate-400">Sin transacciones</p>
            <p className="text-xs text-slate-400 mt-0.5">Cambia el periodo o los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pl-4 pr-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Profesional</th>
                  <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Paciente</th>
                  <th className="text-left px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Servicio</th>
                  <th className="text-center px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
                  <th className="text-right px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Base</th>
                  <th className="text-right px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">IVA</th>
                  <th className="text-right px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="text-center px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="w-9 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const cat = paymentCategory(item.paymentStatus);
                  const borderColor = cat === 'paid' ? 'border-l-emerald-400' : cat === 'pending' ? 'border-l-amber-400' : 'border-l-slate-200';
                  return (
                    <tr
                      key={item.appointmentId}
                      className={`border-l-2 ${borderColor} transition-colors duration-100 hover:bg-slate-50/60 ${
                        idx < filteredItems.length - 1 ? 'border-b border-b-slate-50' : ''
                      }`}
                    >
                      <td className="pl-4 pr-2 py-2.5">
                        <div className="text-xs font-medium text-slate-800">{fmtDate(item.startTime)}</div>
                        <div className="text-[11px] text-slate-400">{fmtTime(item.startTime)}</div>
                      </td>
                      <td className="px-2 py-2.5 text-xs font-medium text-slate-700 whitespace-nowrap">{item.psychologistName}</td>
                      <td className="px-2 py-2.5 text-xs text-slate-600">{item.patientName ?? '—'}</td>
                      <td className="px-2 py-2.5 text-xs text-slate-500">{item.service ?? '--'}</td>
                      <td className="px-2 py-2.5 text-center">
                        {item.billingType === 'INSURANCE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700">
                            <Shield size={10} />
                            {item.insuranceCompanyName || 'Seguro'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-500">
                            <CreditCard size={10} />
                            Privado
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-slate-700 text-right whitespace-nowrap tabular-nums">{fmtEuro(item.price)}</td>
                      <td className="px-2 py-2.5 text-xs text-right whitespace-nowrap tabular-nums">
                        {item.taxExempt ? (
                          <span className="text-[10px] text-slate-400">Exento</span>
                        ) : (
                          <span className="text-slate-600">
                            {fmtEuro(item.taxAmount)}
                            {item.taxRate != null && item.taxRate > 0 && (
                              <span className="text-[10px] text-slate-400 ml-0.5">({(item.taxRate * 100).toFixed(0)}%)</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-xs font-semibold text-slate-900 text-right whitespace-nowrap tabular-nums">
                        {fmtEuro(item.totalAmount ?? item.price)}
                      </td>
                      <td className="px-2 py-2.5 text-center"><PaymentBadge status={item.paymentStatus} /></td>
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => generateInvoicePdf(item, clinicName || 'Clínica', clinicNif, clinicRazonSocial, clinicDireccionFiscal, clinicAddress, clinicPhone)}
                          title="Descargar factura"
                          className="text-slate-400 hover:text-gantly-blue rounded-md p-1 transition-colors cursor-pointer bg-transparent border-none"
                        >
                          <FileText size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/40">
                  <td colSpan={5} className="pl-4 pr-2 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total ({filteredItems.length})
                  </td>
                  <td className="px-2 py-2.5 text-xs font-semibold text-slate-700 text-right tabular-nums">{fmtEuro(tableFooter.base)}</td>
                  <td className="px-2 py-2.5 text-xs font-semibold text-slate-700 text-right tabular-nums">{fmtEuro(tableFooter.tax)}</td>
                  <td className="px-2 py-2.5 text-xs font-bold text-slate-900 text-right tabular-nums">{fmtEuro(tableFooter.total)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
