import { useState, useEffect } from 'react';
import { clinicService } from '../services/api';

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

function pct(value: number, prev: number): string {
  if (!prev) return '';
  const diff = ((value - prev) / prev) * 100;
  return (diff >= 0 ? '+' : '') + diff.toFixed(0) + '%';
}

export default function ClinicStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clinicService.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center flex-1 py-20"><div className="w-9 h-9 border-[3px] border-sage/20 border-t-sage rounded-full animate-spin" /></div>;
  }
  if (!stats) return <div className="px-8 py-6 text-sage/50">No hay datos disponibles.</div>;

  const revenueChange = pct(stats.revenueThisMonth, stats.revenuePrevMonth);
  const maxCount = Math.max(...stats.appointmentsByPsychologist.map(p => p.count), 1);
  const maxTrend = Math.max(...stats.monthlyTrend.map(m => m.appointments), 1);

  const MONTH_NAMES: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
  };
  const monthLabel = (m: string) => {
    const parts = m.split('-');
    return (MONTH_NAMES[parts[1]] || parts[1]) + ' ' + parts[0]?.slice(2);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: 'groups', label: 'Psicólogos', value: stats.totalPsychologists, sub: 'en la clínica' },
          { icon: 'people', label: 'Pacientes', value: stats.totalPatients, sub: 'activos' },
          { icon: 'calendar_month', label: 'Citas este mes', value: stats.appointmentsThisMonth, sub: 'confirmadas' },
          { icon: 'euro', label: 'Facturación', value: '€' + stats.revenueThisMonth.toFixed(0), sub: revenueChange ? revenueChange + ' vs mes anterior' : 'este mes' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-[2.5rem] border border-sage/10 soft-shadow p-6">
            <div className="size-10 bg-mint flex items-center justify-center rounded-xl text-sage mb-3">
              <span className="material-symbols-outlined text-base">{kpi.icon}</span>
            </div>
            <div className="text-2xl font-semibold text-forest mb-0.5">{kpi.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-sage/40">{kpi.label}</div>
            <div className="text-xs text-sage/50 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Occupancy */}
      <div className="bg-white rounded-[2.5rem] border border-sage/10 soft-shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-sage/40">Tasa de ocupación este mes</span>
          <span className="text-sm font-semibold text-forest">{(stats.occupancyRate * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-sage/10 rounded-full overflow-hidden">
          <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${(stats.occupancyRate * 100).toFixed(0)}%` }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart by psychologist */}
        <div className="bg-white rounded-[2.5rem] border border-sage/10 soft-shadow p-6">
          <div className="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-4">Citas por psicólogo (este mes)</div>
          {stats.appointmentsByPsychologist.length === 0 ? (
            <div className="text-center text-sage/40 text-sm py-4">Sin datos</div>
          ) : (
            <div className="space-y-3">
              {stats.appointmentsByPsychologist.map(p => (
                <div key={p.id}>
                  <div className="flex justify-between text-xs text-forest mb-1">
                    <span className="truncate max-w-[160px]">{p.name}</span>
                    <span className="text-sage/60">{p.count} citas · €{p.revenue.toFixed(0)}</span>
                  </div>
                  <div className="h-2 bg-sage/10 rounded-full overflow-hidden">
                    <div className="h-full bg-sage rounded-full" style={{ width: `${(p.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly trend chart */}
        <div className="bg-white rounded-[2.5rem] border border-sage/10 soft-shadow p-6">
          <div className="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-4">Tendencia mensual (6 meses)</div>
          <div className="flex items-end gap-2 h-32">
            {stats.monthlyTrend.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-sage/70 rounded-t-md transition-all"
                  style={{ height: `${Math.max(4, (m.appointments / maxTrend) * 112)}px` }}
                  title={`${m.appointments} citas`}
                />
                <span className="text-[9px] text-sage/50 truncate w-full text-center">{monthLabel(m.month)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
