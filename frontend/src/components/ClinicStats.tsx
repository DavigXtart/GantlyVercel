import { useState, useEffect } from 'react';
import { clinicService } from '../services/api';
import {
  ArrowUpRight, ArrowDownRight, Calendar, TrendingUp,
  Users, UserCheck, Activity, Minus,
} from 'lucide-react';

type StatsData = {
  totalPsychologists: number;
  totalPatients: number;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  revenuePrevMonth: number;
  occupancyRate: number;
  appointmentsByPsychologist: Array<{ id: number; name: string; count: number; revenue: number }>;
  monthlyTrend: Array<{ month: string; appointments: number; revenue: number }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtEuro(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pctChange(cur: number, prev: number): { label: string; positive: boolean } | null {
  if (!prev) return null;
  const diff = ((cur - prev) / prev) * 100;
  return { label: (diff >= 0 ? '+' : '') + diff.toFixed(0) + '%', positive: diff >= 0 };
}

const MONTH_SHORT: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

function monthLabel(m: string): string {
  const parts = m.split('-');
  return (MONTH_SHORT[parts[1]] || parts[1]) + ' ' + (parts[0]?.slice(2) ?? '');
}

// Bar colors for psychologist list
const PSYCH_COLORS = [
  'bg-gantly-blue',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-rose-500',
];

export default function ClinicStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clinicService.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
      </div>
    );
  }
  if (!stats) return <div className="px-6 py-10 text-sm text-slate-400 text-center">No hay datos disponibles.</div>;

  const revenueChange = pctChange(stats.revenueThisMonth, stats.revenuePrevMonth);
  const maxCount = Math.max(...stats.appointmentsByPsychologist.map(p => p.count), 1);
  const maxTrend = Math.max(...stats.monthlyTrend.map(m => m.appointments), 1);
  const occupancyPct = Math.round(stats.occupancyRate * 100);

  return (
    <div className="space-y-5">
      {/* ─── Top metrics ─── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Revenue — large card */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Facturación este mes</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{fmtEuro(stats.revenueThisMonth)}</p>
            </div>
            <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
          </div>
          {revenueChange ? (
            <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              revenueChange.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              {revenueChange.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {revenueChange.label} vs mes anterior
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">Sin datos del mes anterior</span>
          )}
        </div>

        {/* 4 compact stat tiles */}
        <div className="col-span-6 lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
          <Users size={15} className="text-gantly-blue" />
          <div className="mt-3">
            <p className="text-xl font-bold text-slate-900">{stats.totalPsychologists}</p>
            <p className="text-[11px] text-slate-500">Profesionales</p>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
          <UserCheck size={15} className="text-emerald-500" />
          <div className="mt-3">
            <p className="text-xl font-bold text-slate-900">{stats.totalPatients}</p>
            <p className="text-[11px] text-slate-500">Pacientes activos</p>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
          <Calendar size={15} className="text-amber-500" />
          <div className="mt-3">
            <p className="text-xl font-bold text-slate-900">{stats.appointmentsThisMonth}</p>
            <p className="text-[11px] text-slate-500">Citas este mes</p>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col justify-between">
          <Activity size={15} className="text-violet-500" />
          <div className="mt-3">
            <p className="text-xl font-bold text-slate-900">{occupancyPct}%</p>
            <p className="text-[11px] text-slate-500">Ocupación</p>
          </div>
        </div>
      </div>

      {/* ─── Charts row ─── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Monthly trend — bar chart */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Tendencia mensual</h3>
            <span className="text-[11px] text-slate-400">Últimos 6 meses</span>
          </div>
          <div className="p-5">
            {stats.monthlyTrend.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-slate-400">Sin datos</div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {stats.monthlyTrend.map((m, i) => {
                  const isLast = i === stats.monthlyTrend.length - 1;
                  const barH = Math.max(6, (m.appointments / maxTrend) * 130);
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[11px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {fmtEuro(m.revenue)}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{m.appointments}</span>
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${
                          isLast ? 'bg-gantly-blue' : 'bg-slate-200 group-hover:bg-slate-300'
                        }`}
                        style={{ height: `${barH}px` }}
                        title={`${m.appointments} citas · ${fmtEuro(m.revenue)}`}
                      />
                      <span className="text-[11px] text-slate-500">{monthLabel(m.month)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Appointments by psychologist — list */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Citas por profesional</h3>
            <span className="text-[11px] text-slate-400">Este mes</span>
          </div>
          <div className="p-5">
            {stats.appointmentsByPsychologist.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400">Sin datos</div>
            ) : (
              <div className="space-y-4">
                {stats.appointmentsByPsychologist.map((p, i) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${PSYCH_COLORS[i % PSYCH_COLORS.length]}`} />
                        <span className="text-xs font-medium text-slate-800 truncate max-w-[160px]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs tabular-nums text-slate-500">{p.count} citas</span>
                        <span className="text-xs tabular-nums font-medium text-slate-700">{fmtEuro(p.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${PSYCH_COLORS[i % PSYCH_COLORS.length]}`}
                        style={{ width: `${Math.max(2, (p.count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Occupancy bar ─── */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-900">Tasa de ocupación</span>
          </div>
          <span className="text-sm font-bold text-slate-900">{occupancyPct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              occupancyPct >= 70 ? 'bg-emerald-500' : occupancyPct >= 40 ? 'bg-amber-400' : 'bg-slate-300'
            }`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-400">Buena (&ge;70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] text-slate-400">Media (40-70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-[11px] text-slate-400">Baja (&lt;40%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
