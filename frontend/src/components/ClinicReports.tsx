import { useState, useEffect, useMemo } from 'react';
import { clinicService } from '../services/api';
import type { ClinicBillingItem } from '../services/api';
import {
  BarChart3, TrendingUp, Users, Stethoscope, Loader2,
  Download, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StatsData {
  totalPsychologists: number;
  totalPatients: number;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  revenuePrevMonth: number;
  occupancyRate: number;
  appointmentsByPsychologist: Array<{ id: number; name: string; count: number; revenue: number }>;
  monthlyTrend: Array<{ month: string; appointments: number; revenue: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmtEuro = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MONTH_SHORT: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function monthLabel(m: string): string {
  const parts = m.split('-');
  return (MONTH_SHORT[parts[1]] || parts[1]) + ' ' + (parts[0]?.slice(2) ?? '');
}

const BAR_COLORS = ['#2E93CC', '#22D3EE', '#059669', '#F0C930', '#8b5cf6', '#ec4899'];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ClinicReports() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [billing, setBilling] = useState<ClinicBillingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clinicService.getStats(),
      clinicService.getBilling(),
    ])
      .then(([s, b]) => {
        setStats(s);
        setBilling(b);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // --- Revenue by service (computed from billing items) ---
  const revenueByService = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; count: number }>();
    for (const item of billing) {
      if (!item.service) continue;
      const price = item.totalAmount ?? item.price ?? 0;
      const existing = map.get(item.service);
      if (existing) {
        existing.revenue += price;
        existing.count += 1;
      } else {
        map.set(item.service, { name: item.service, revenue: price, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [billing]);

  // --- Chart data ---
  const chartData = useMemo(() => {
    if (!stats) return [];
    return stats.monthlyTrend.map(m => ({
      name: monthLabel(m.month),
      revenue: m.revenue,
      appointments: m.appointments,
    }));
  }, [stats]);

  // --- CSV export ---
  const exportCSV = () => {
    if (!stats) return;
    const rows: string[] = [];
    rows.push('Tipo,Concepto,Valor');
    rows.push(`Resumen,Ingresos este mes,${stats.revenueThisMonth}`);
    rows.push(`Resumen,Ingresos mes anterior,${stats.revenuePrevMonth}`);
    rows.push(`Resumen,Citas este mes,${stats.appointmentsThisMonth}`);
    rows.push('');
    rows.push('Mes,Citas,Ingresos');
    for (const m of stats.monthlyTrend) {
      rows.push(`${m.month},${m.appointments},${m.revenue}`);
    }
    rows.push('');
    rows.push('Profesional,Citas,Ingresos');
    for (const p of stats.appointmentsByPsychologist) {
      rows.push(`${p.name},${p.count},${p.revenue}`);
    }
    rows.push('');
    rows.push('Servicio,Sesiones,Ingresos');
    for (const s of revenueByService) {
      rows.push(`${s.name},${s.count},${s.revenue}`);
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-clinica-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-gantly-blue" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <BarChart3 size={32} strokeWidth={1.5} className="mb-3" />
        <p className="text-sm font-medium">No se pudieron cargar los reportes</p>
      </div>
    );
  }

  const revChange = stats.revenuePrevMonth > 0
    ? (((stats.revenueThisMonth - stats.revenuePrevMonth) / stats.revenuePrevMonth) * 100)
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-800">Reportes de la clinica</h2>
        </div>
        <button
          onClick={exportCSV}
          className="h-8 px-3.5 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <Download size={13} />
          Exportar CSV
        </button>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-[11px] text-slate-500 mb-1">Ingresos este mes</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{fmtEuro(stats.revenueThisMonth)}</p>
          {revChange !== null && (
            <p className={`text-[11px] mt-1 font-medium ${revChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {revChange >= 0 ? '+' : ''}{revChange.toFixed(0)}% vs mes anterior
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-[11px] text-slate-500 mb-1">Citas este mes</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{stats.appointmentsThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-[11px] text-slate-500 mb-1">Pacientes</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{stats.totalPatients}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-[11px] text-slate-500 mb-1">Tasa de ocupacion</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{(stats.occupancyRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Revenue chart (last 6 months) */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
          <TrendingUp size={15} className="text-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-900">Ingresos por mes</h3>
          <span className="text-[11px] text-slate-400 ml-auto">Ultimos 6 meses</span>
        </div>
        <div className="p-5">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `${v}€`} />
                <Tooltip
                  formatter={(value: number) => [fmtEuro(value), 'Ingresos']}
                  labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={idx === chartData.length - 1 ? '#2E93CC' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Sin datos de tendencia</p>
          )}
        </div>
      </div>

      {/* Two tables side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Revenue by psychologist */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <Users size={15} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900">Ingresos por profesional</h3>
            <span className="text-[11px] text-slate-400 ml-auto">Este mes</span>
          </div>
          {stats.appointmentsByPsychologist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Users size={24} strokeWidth={1.5} className="mb-2" />
              <p className="text-xs">Sin datos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5">Profesional</th>
                    <th className="text-center text-[11px] font-medium text-slate-500 px-4 py-2.5">Citas</th>
                    <th className="text-right text-[11px] font-medium text-slate-500 px-4 py-2.5">Ingresos</th>
                    <th className="text-right text-[11px] font-medium text-slate-500 px-4 py-2.5">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.appointmentsByPsychologist
                    .slice()
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((ps, idx) => {
                      const totalRevenue = stats.appointmentsByPsychologist.reduce((s, p) => s + p.revenue, 0);
                      const pct = totalRevenue > 0 ? ((ps.revenue / totalRevenue) * 100).toFixed(0) : '0';
                      return (
                        <tr key={ps.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="size-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                style={{ background: BAR_COLORS[idx % BAR_COLORS.length] }}
                              >
                                {ps.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-slate-800 truncate">{ps.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center tabular-nums text-slate-700">{ps.count}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-600">{fmtEuro(ps.revenue)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Revenue by service */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <Stethoscope size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900">Ingresos por servicio</h3>
          </div>
          {revenueByService.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Stethoscope size={24} strokeWidth={1.5} className="mb-2" />
              <p className="text-xs">Sin datos de servicios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5">Servicio</th>
                    <th className="text-center text-[11px] font-medium text-slate-500 px-4 py-2.5">Sesiones</th>
                    <th className="text-right text-[11px] font-medium text-slate-500 px-4 py-2.5">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByService.map((svc, idx) => (
                    <tr key={svc.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: BAR_COLORS[idx % BAR_COLORS.length] }} />
                          <span className="text-sm font-medium text-slate-800">{svc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center tabular-nums text-slate-700">{svc.count}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-600">{fmtEuro(svc.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
