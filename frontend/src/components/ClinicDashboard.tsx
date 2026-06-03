import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clinicService } from '../services/api';
import type { ClinicAdmin } from '../services/api';
import ClinicAgenda from './ClinicAgenda';
import ClinicPatients from './ClinicPatients';
import ClinicBilling from './ClinicBilling';
import ClinicStats from './ClinicStats';
import ClinicInsuranceTab from './ClinicInsuranceTab';
import ClinicWaitingList from './ClinicWaitingList';
import ClinicReports from './ClinicReports';
import AuditLogViewer from './AuditLogViewer';
import ConfirmDialog from './ui/ConfirmDialog';
import LogoSvg from '../assets/logo-gantly.svg';
import {
  Building2, Users, Calendar, UsersRound, Receipt, BarChart3, Settings, Home,
  ChevronDown, ChevronUp, Check, Copy, Clock, LogOut, X, Send, Tag, DoorOpen,
  UserX, Plus, Mail, Stethoscope, Package, Flower2, Timer, Trash2, Menu, Shield,
  Globe, Eye, EyeOff, ListOrdered, FileBarChart,
} from 'lucide-react';

const kpiIconMap: Record<string, (size: number) => React.ReactNode> = {
  groups: (s) => <Users size={s} />,
  calendar_month: (s) => <Calendar size={s} />,
  people: (s) => <UsersRound size={s} />,
  receipt_long: (s) => <Receipt size={s} />,
  bar_chart: (s) => <BarChart3 size={s} />,
};

const navIconMap: Record<string, React.ReactNode> = {
  home: <Home size={20} />,
  bar_chart: <BarChart3 size={20} />,
  calendar_month: <Calendar size={20} />,
  group: <Users size={20} />,
  people: <UsersRound size={20} />,
  receipt_long: <Receipt size={20} />,
  shield_check: <Shield size={20} />,
  shield: <Shield size={20} />,
  settings: <Settings size={20} />,
  list_ordered: <ListOrdered size={20} />,
  file_bar_chart: <FileBarChart size={20} />,
};

type NavTab = 'inicio' | 'estadisticas' | 'agenda' | 'equipo' | 'pacientes' | 'facturacion' | 'reportes' | 'lista-espera' | 'seguros' | 'auditoria' | 'configuracion';

interface ClinicInfo {
  id: number;
  name: string;
  email: string;
  referralCode: string;
  address?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  weeklySchedule?: string;
  nif?: string;
  publicVisible?: boolean;
  slug?: string;
  description?: string;
  razonSocial?: string;
  direccionFiscal?: string;
}

interface ClinicServiceItem {
  id: number;
  name: string;
  defaultPrice: number | null;
  durationMinutes: number | null;
  active: boolean;
  psychologistPrices?: string | null;
}

interface DaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  closed: boolean;
}

interface Psychologist {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------
type KpiColor = 'blue' | 'emerald' | 'gold' | 'cyan' | 'violet';

const KPI_ICON_COLOR: Record<KpiColor, string> = {
  blue: 'text-gantly-blue',
  emerald: 'text-emerald-500',
  gold: 'text-amber-500',
  cyan: 'text-cyan-500',
  violet: 'text-violet-500',
};

function KpiCard({
  icon,
  label,
  value,
  subtitle,
  onClick,
  color = 'blue',
}: {
  icon: string;
  label: string;
  value: string;
  subtitle: string;
  onClick: () => void;
  color?: KpiColor;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200/80 text-left w-full p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      <div className={`${KPI_ICON_COLOR[color]} mb-3`}>
        {kpiIconMap[icon]?.(16)}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label} · {subtitle}</p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Home / overview tab
// ---------------------------------------------------------------------------
function HomeTab({
  clinicInfo,
  psychologists,
  copied,
  onCopyReferral,
  onNavigate,
}: {
  clinicInfo: ClinicInfo | null;
  psychologists: Psychologist[];
  copied: boolean;
  onCopyReferral: () => void;
  onNavigate: (tab: NavTab) => void;
}) {
  const [stats, setStats] = useState<{
    totalPatients: number;
    appointmentsThisMonth: number;
    revenueThisMonth: number;
    appointmentsByPsychologist: Array<{ id: number; name: string; count: number; revenue: number }>;
  } | null>(null);
  const [psychRatings, setPsychRatings] = useState<Record<number, { avg: number; total: number }>>({});
  useEffect(() => {
    clinicService.getStats()
      .then(s => {
        setStats({
          totalPatients: s.totalPatients,
          appointmentsThisMonth: s.appointmentsThisMonth,
          revenueThisMonth: s.revenueThisMonth,
          appointmentsByPsychologist: s.appointmentsByPsychologist ?? [],
        });
        // Load ratings for each psychologist (fire & forget, non-blocking)
        for (const ps of (s.appointmentsByPsychologist ?? [])) {
          import('../services/api').then(({ calendarService: calSvc }) => {
            calSvc.getPsychologistRating(ps.id)
              .then((r: any) => {
                if (r && r.totalRatings > 0) {
                  setPsychRatings(prev => ({ ...prev, [ps.id]: { avg: r.averageRating, total: r.totalRatings } }));
                }
              })
              .catch(() => {});
          });
        }
      })
      .catch(() => {});
  }, []);

  const fmtEuro = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-5">
      {/* Clinic header card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5">
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-lg bg-gantly-blue/10 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-gantly-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{clinicInfo?.name ?? 'Tu clínica'}</h2>
            <p className="text-xs text-slate-500">{clinicInfo?.email}</p>
          </div>
          {clinicInfo?.referralCode && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-slate-400">Código</span>
              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {clinicInfo.referralCode}
              </span>
              <button
                onClick={onCopyReferral}
                className="h-7 px-2.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition inline-flex items-center gap-1 bg-white cursor-pointer"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon="groups"
          label="Psicólogos"
          value={String(psychologists.length)}
          subtitle="en la clínica"
          onClick={() => onNavigate('equipo')}
          color="emerald"
        />
        <KpiCard
          icon="calendar_month"
          label="Citas"
          value={stats ? String(stats.appointmentsThisMonth) : '—'}
          subtitle="este mes"
          onClick={() => onNavigate('agenda')}
          color="gold"
        />
        <KpiCard
          icon="people"
          label="Pacientes"
          value={stats ? String(stats.totalPatients) : '—'}
          subtitle="registrados"
          onClick={() => onNavigate('pacientes')}
          color="cyan"
        />
        <KpiCard
          icon="receipt_long"
          label="Facturación"
          value={stats ? fmtEuro(stats.revenueThisMonth) : '—'}
          subtitle="este mes"
          onClick={() => onNavigate('facturacion')}
          color="blue"
        />
        <KpiCard
          icon="bar_chart"
          label="Estadísticas"
          value="Ver"
          subtitle="de la clínica"
          onClick={() => onNavigate('estadisticas')}
          color="violet"
        />
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('agenda')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="size-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Calendar size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Agenda</p>
            <p className="text-[11px] text-slate-500">Gestionar citas y horarios</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate('equipo')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="size-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <UsersRound size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Equipo</p>
            <p className="text-[11px] text-slate-500">Invitar y gestionar psicólogos</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate('configuracion')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="size-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Settings size={16} className="text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Configuración</p>
            <p className="text-[11px] text-slate-500">Horarios, servicios y datos fiscales</p>
          </div>
        </button>
      </div>

      {/* Per-psychologist performance */}
      {stats && stats.appointmentsByPsychologist.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <BarChart3 size={16} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900">Rendimiento por profesional</h3>
            <span className="text-[11px] text-slate-400 ml-auto">Este mes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pl-5 pr-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Profesional</th>
                  <th className="text-center px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Citas</th>
                  <th className="text-right px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Ingresos</th>
                  <th className="text-center px-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Valoración</th>
                  <th className="text-right pr-5 pl-2 py-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">% carga</th>
                </tr>
              </thead>
              <tbody>
                {stats.appointmentsByPsychologist
                  .slice()
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((ps, idx) => {
                    const maxCount = Math.max(...stats.appointmentsByPsychologist.map(p => p.count), 1);
                    const loadPercent = maxCount > 0 ? Math.round((ps.count / maxCount) * 100) : 0;
                    const rating = psychRatings[ps.id];
                    return (
                      <tr key={ps.id} className={`transition-colors hover:bg-slate-50/60 ${idx < stats.appointmentsByPsychologist.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <td className="pl-5 pr-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-bold text-violet-600">
                                {ps.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-slate-800 truncate">{ps.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">{ps.count}</span>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                            {fmtEuro(ps.revenue)}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-center">
                          {rating ? (
                            <span className="inline-flex items-center gap-1 text-sm text-amber-600 font-medium">
                              <span className="text-amber-400">&#9733;</span>
                              {rating.avg.toFixed(1)}
                              <span className="text-[10px] text-slate-400">({rating.total})</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Sin datos</span>
                          )}
                        </td>
                        <td className="pr-5 pl-2 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-400 rounded-full transition-all duration-500" style={{ width: `${loadPercent}%` }} />
                            </div>
                            <span className="text-[11px] font-medium text-slate-500 tabular-nums w-8 text-right">{loadPercent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equipo tab
// ---------------------------------------------------------------------------
type PsychScheduleSlot = { id: number; startTime: string; endTime: string; status: string; patientName: string | null };

function EquipoTab({ psychologists, onRefresh }: { psychologists: Psychologist[]; onRefresh: () => void }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<Array<{ id: number; email: string; status: string; createdAt: string; expiresAt: string }>>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Schedule panel
  const [selectedPsychId, setSelectedPsychId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<PsychScheduleSlot[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const handleSelectPsych = async (id: number) => {
    if (selectedPsychId === id) { setSelectedPsychId(null); return; }
    setSelectedPsychId(id);
    setLoadingSchedule(true);
    try {
      const data = await clinicService.getPsychologistSchedule(id);
      setSchedule(data as PsychScheduleSlot[]);
    } catch { setSchedule([]); } finally { setLoadingSchedule(false); }
  };

  useEffect(() => { loadInvitations(); }, []);

  const loadInvitations = async () => {
    setLoadingInvites(true);
    try {
      const list = await clinicService.listInvitations();
      setInvitations(list.filter(i => i.status === 'PENDING'));
    } catch { /* ignore */ } finally { setLoadingInvites(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true); setError(''); setSuccess('');
    try {
      await clinicService.sendInvitation(email.trim());
      setSuccess('Invitacion enviada a ' + email.trim());
      setEmail('');
      loadInvitations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la invitacion');
    } finally { setSending(false); }
  };

  const handleCancel = async (id: number) => {
    try {
      await clinicService.cancelInvitation(id);
      setInvitations(prev => prev.filter(i => i.id !== id));
    } catch { /* ignore */ }
  };

  // onRefresh is available for external callers
  void onRefresh;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left column — Psychologist list card */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Users size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Psicólogos del equipo</h2>
        </div>
        <div className="p-4 space-y-2">
          {psychologists.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
              <Users size={28} strokeWidth={1.5} />
              <p className="text-sm">Aún no hay psicólogos en tu clínica</p>
            </div>
          ) : (
            psychologists.map(p => (
              <div key={p.id}>
                <button
                  onClick={() => handleSelectPsych(p.id)}
                  className={`w-full rounded-lg border p-3 flex items-center gap-3 hover:bg-slate-50 transition text-left cursor-pointer ${selectedPsychId === p.id ? 'border-gantly-blue ring-1 ring-gantly-blue/20 bg-gantly-blue/[0.02]' : 'border-slate-200 bg-white'}`}
                >
                  <div className="size-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} className="size-9 rounded-full object-cover" alt={p.name} />
                      : <div className="size-9 rounded-full bg-gantly-blue flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">{p.name.charAt(0).toUpperCase()}</span>
                        </div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 truncate">{p.email}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-gantly-emerald-50 text-[10px] font-medium text-gantly-emerald-700">
                      Activo
                    </span>
                    {selectedPsychId === p.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </button>
                {/* Schedule panel */}
                {selectedPsychId === p.id && (
                  <div className="border border-t-0 border-slate-200 rounded-b-lg px-3 pb-3 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-500 py-2.5">
                      Agenda proximos 30 dias
                    </p>
                    {loadingSchedule ? (
                      <div className="py-4 text-center"><div className="w-4 h-4 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin mx-auto" /></div>
                    ) : schedule.length === 0 ? (
                      <div className="py-4 flex flex-col items-center gap-1 text-slate-400">
                        <Calendar size={20} strokeWidth={1.5} />
                        <p className="text-xs">Sin citas programadas</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {schedule.map(slot => {
                          const isFree = slot.status === 'FREE';
                          const isConfirmed = slot.status === 'CONFIRMED' || slot.status === 'BOOKED';
                          return (
                            <div
                              key={slot.id}
                              className={`flex items-center gap-2.5 text-sm px-2.5 py-1.5 rounded-md ${isFree ? 'bg-gantly-blue-50' : isConfirmed ? 'bg-gantly-emerald-50' : 'bg-gantly-gold-50'}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFree ? 'bg-gantly-blue' : isConfirmed ? 'bg-gantly-emerald' : 'bg-gantly-gold'}`}
                              />
                              <span className="text-slate-700 text-xs">
                                {new Date(slot.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'long' })}
                                {' · '}
                                {new Date(slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                {' – '}
                                {new Date(slot.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {slot.patientName && (
                                <span className="ml-auto text-xs text-slate-500 truncate max-w-[120px]">{slot.patientName}</span>
                              )}
                              {isFree && (
                                <span className="ml-auto text-[10px] text-gantly-blue font-medium">Libre</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right column — Invite + Pending invitations card */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden self-start">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Send size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Invitar psicólogo</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="flex-1 h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 transition"
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="h-8 px-4 bg-gantly-blue text-white rounded-md text-xs font-semibold hover:bg-gantly-blue-600 transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer border-none self-center"
            >
              <Send size={13} />
              {sending ? 'Enviando...' : 'Invitar'}
            </button>
          </form>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          {success && <p className="text-gantly-blue text-xs mt-2">{success}</p>}
        </div>

        {/* Pending invitations */}
        <div className="border-t border-slate-100">
          <div className="px-5 py-3 flex items-center gap-2">
            <Mail size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800">Invitaciones pendientes</h3>
          </div>
          <div className="px-4 pb-4">
            {loadingInvites ? (
              <div className="text-center py-4"><div className="w-4 h-4 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin mx-auto" /></div>
            ) : invitations.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-slate-400">
                <Mail size={24} strokeWidth={1.5} />
                <p className="text-xs">No hay invitaciones pendientes</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {invitations.map(inv => (
                  <div key={inv.id} className="rounded-md border border-gantly-gold/20 bg-gantly-gold/5 px-3 py-2 flex items-center gap-2.5">
                    <Mail size={14} className="text-gantly-gold flex-shrink-0" />
                    <span className="text-sm text-slate-900 flex-1 truncate">{inv.email}</span>
                    <span className="text-[10px] text-slate-500 bg-gantly-gold/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      Expira {new Date(inv.expiresAt).toLocaleDateString('es-ES')}
                    </span>
                    <button
                      onClick={() => handleCancel(inv.id)}
                      className="text-slate-400 hover:text-red-400 transition cursor-pointer bg-transparent border-none flex-shrink-0"
                      title="Cancelar invitacion"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config tab
// ---------------------------------------------------------------------------
const ROOM_COLORS = [
  '#2E93CC', '#22D3EE', '#059669', '#F0C930',
  '#9c7cc5', '#7cc5bc', '#c57ca0', '#6b8fad',
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: 'Lunes', openTime: '09:00', closeTime: '18:00', closed: false },
  { day: 'Martes', openTime: '09:00', closeTime: '18:00', closed: false },
  { day: 'Miercoles', openTime: '09:00', closeTime: '18:00', closed: false },
  { day: 'Jueves', openTime: '09:00', closeTime: '18:00', closed: false },
  { day: 'Viernes', openTime: '09:00', closeTime: '18:00', closed: false },
  { day: 'Sabado', openTime: '10:00', closeTime: '14:00', closed: true },
  { day: 'Domingo', openTime: '10:00', closeTime: '14:00', closed: true },
];

function ConfigTab({ clinicInfo, psychologists, onClinicInfoUpdate }: { clinicInfo: ClinicInfo | null; psychologists: Psychologist[]; onClinicInfoUpdate: (info: ClinicInfo) => void }) {
  // --- Clinic info form ---
  const [infoForm, setInfoForm] = useState({ name: '', address: '', phone: '', website: '', logoUrl: '', nif: '', publicVisible: false, slug: '', description: '', razonSocial: '', direccionFiscal: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  // --- Admins ---
  const [admins, setAdmins] = useState<ClinicAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<'ADMIN' | 'VIEWER'>('ADMIN');
  const [invitingAdmin, setInvitingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // --- Schedule ---
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // --- Services ---
  const [services, setServices] = useState<ClinicServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newService, setNewService] = useState({ name: '', defaultPrice: '', durationMinutes: '' });
  const [savingService, setSavingService] = useState(false);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);

  // --- Rooms ---
  const [rooms, setRooms] = useState<Array<{ id: number; name: string; color: string; assignedPsychologistId?: number; active: boolean }>>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [addingForPsychId, setAddingForPsychId] = useState<number | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomColor, setNewRoomColor] = useState(ROOM_COLORS[0]);
  const [savingRoom, setSavingRoom] = useState(false);

  // Confirm dialog state
  const [deleteAdminId, setDeleteAdminId] = useState<number | null>(null);
  const [deleteServiceId, setDeleteServiceId] = useState<number | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);

  // Initialize form from clinicInfo
  useEffect(() => {
    if (clinicInfo) {
      setInfoForm({
        name: clinicInfo.name || '',
        address: clinicInfo.address || '',
        phone: clinicInfo.phone || '',
        website: clinicInfo.website || '',
        logoUrl: clinicInfo.logoUrl || '',
        nif: clinicInfo.nif || '',
        razonSocial: clinicInfo.razonSocial || '',
        direccionFiscal: clinicInfo.direccionFiscal || '',
        publicVisible: clinicInfo.publicVisible ?? false,
        slug: clinicInfo.slug || '',
        description: clinicInfo.description || '',
      });
      if (clinicInfo.weeklySchedule) {
        try { setSchedule(JSON.parse(clinicInfo.weeklySchedule)); } catch { /* keep default */ }
      }
    }
  }, [clinicInfo]);

  // Load services + rooms + admins
  useEffect(() => {
    setLoadingServices(true);
    clinicService.getServices()
      .then(data => setServices(data))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
    setLoadingRooms(true);
    clinicService.getRooms()
      .then(data => setRooms(data))
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoadingAdmins(true);
    try {
      const data = await clinicService.getAdmins();
      setAdmins(data);
    } catch { setAdmins([]); }
    finally { setLoadingAdmins(false); }
  }

  async function handleInviteAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminEmail.trim()) return;
    setInvitingAdmin(true); setAdminError(''); setAdminSuccess('');
    try {
      const admin = await clinicService.inviteAdmin(adminEmail.trim(), adminRole);
      setAdmins(prev => [...prev, admin]);
      setAdminSuccess('Invitacion enviada a ' + adminEmail.trim());
      setAdminEmail('');
      setTimeout(() => setAdminSuccess(''), 3000);
    } catch (err: any) {
      setAdminError(err.response?.data?.message || 'Error al invitar administrador');
    } finally { setInvitingAdmin(false); }
  }

  async function handleUpdateAdminRole(id: number, role: string) {
    try {
      const updated = await clinicService.updateAdmin(id, role);
      setAdmins(prev => prev.map(a => a.id === id ? updated : a));
    } catch { /* ignore */ }
  }

  async function handleRemoveAdmin(id: number) {
    setDeleteAdminId(id);
  }

  async function confirmRemoveAdmin() {
    if (deleteAdminId === null) return;
    try {
      await clinicService.removeAdmin(deleteAdminId);
      setAdmins(prev => prev.filter(a => a.id !== deleteAdminId));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al eliminar administrador');
    }
  }

  // --- Handlers: Clinic info ---
  async function handleSaveInfo() {
    setSavingInfo(true);
    setInfoSaved(false);
    try {
      const updated = await clinicService.updateClinicInfo({
        name: infoForm.name,
        address: infoForm.address,
        phone: infoForm.phone,
        website: infoForm.website,
        logoUrl: infoForm.logoUrl,
        nif: infoForm.nif,
        razonSocial: infoForm.razonSocial,
        direccionFiscal: infoForm.direccionFiscal,
        publicVisible: infoForm.publicVisible,
        slug: infoForm.slug,
        description: infoForm.description,
      } as any);
      onClinicInfoUpdate(updated as ClinicInfo);
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSavingInfo(false); }
  }

  // --- Handlers: Schedule ---
  function updateDay(idx: number, field: keyof DaySchedule, value: string | boolean) {
    setSchedule(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  }

  async function handleSaveSchedule() {
    setSavingSchedule(true);
    setScheduleSaved(false);
    try {
      const updated = await clinicService.updateClinicInfo({ weeklySchedule: JSON.stringify(schedule) });
      onClinicInfoUpdate(updated as ClinicInfo);
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSavingSchedule(false); }
  }

  // --- Handlers: Services ---
  async function handleCreateService() {
    if (!newService.name.trim()) return;
    setSavingService(true);
    try {
      const svc = await clinicService.createService({
        name: newService.name.trim(),
        defaultPrice: newService.defaultPrice ? parseFloat(newService.defaultPrice) : undefined,
        durationMinutes: newService.durationMinutes ? parseInt(newService.durationMinutes) : undefined,
      });
      setServices(prev => [...prev, svc]);
      setNewService({ name: '', defaultPrice: '', durationMinutes: '' });
      setShowServiceForm(false);
    } catch { /* ignore */ }
    finally { setSavingService(false); }
  }

  async function handleDeleteService(id: number) {
    setDeleteServiceId(id);
  }

  async function confirmDeleteService() {
    if (deleteServiceId === null) return;
    await clinicService.deleteService(deleteServiceId);
    setServices(prev => prev.filter(s => s.id !== deleteServiceId));
  }

  // --- Handlers: Rooms ---
  function startAdding(psychId: number, defaultName: string) {
    setAddingForPsychId(psychId);
    setNewRoomName(defaultName);
    setNewRoomColor(ROOM_COLORS[psychologists.findIndex(p => p.id === psychId) % ROOM_COLORS.length]);
  }

  function cancelAdding() {
    setAddingForPsychId(null);
    setNewRoomName('');
  }

  async function handleSaveRoom(psychId: number) {
    if (!newRoomName.trim()) return;
    setSavingRoom(true);
    try {
      const room = await clinicService.createRoom({
        name: newRoomName.trim(),
        color: newRoomColor,
        assignedPsychologistId: psychId,
      });
      setRooms(prev => [...prev, room]);
      setAddingForPsychId(null);
      setNewRoomName('');
    } catch {
      alert('Error al crear el despacho');
    } finally {
      setSavingRoom(false);
    }
  }

  async function handleDeleteRoom(id: number) {
    setDeleteRoomId(id);
  }

  async function confirmDeleteRoom() {
    if (deleteRoomId === null) return;
    await clinicService.deleteRoom(deleteRoomId);
    setRooms(prev => prev.filter(r => r.id !== deleteRoomId));
  }

  const [copiedCode, setCopiedCode] = useState(false);
  const inputCls = "w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-gantly-blue/50 focus:bg-white transition-all placeholder:text-slate-400";
  const timeCls = "h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-gantly-blue/50 transition-all w-[100px]";

  return (
    <div className="space-y-5">
      {/* Row 1: Datos + Horario side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Card 1 — Clinic data */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-gantly-blue" />
              <h3 className="text-sm font-semibold text-slate-900">Datos de la clínica</h3>
            </div>
            {infoSaved && (
              <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Check size={10} /> Guardado
              </span>
            )}
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Nombre</label>
                <input type="text" value={infoForm.name} onChange={e => setInfoForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Teléfono</label>
                <input type="tel" value={infoForm.phone} onChange={e => setInfoForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+34 600 000 000" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Dirección</label>
                <input type="text" value={infoForm.address} onChange={e => setInfoForm(p => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="Calle, número, ciudad" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Website</label>
                <input type="url" value={infoForm.website} onChange={e => setInfoForm(p => ({ ...p, website: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Logo URL</label>
                <input type="url" value={infoForm.logoUrl} onChange={e => setInfoForm(p => ({ ...p, logoUrl: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">NIF / CIF</label>
                <input type="text" value={infoForm.nif} onChange={e => setInfoForm(p => ({ ...p, nif: e.target.value }))} className={inputCls} placeholder="B12345678" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Razón social (facturación)</label>
                <input type="text" value={infoForm.razonSocial} onChange={e => setInfoForm(p => ({ ...p, razonSocial: e.target.value }))} className={inputCls} placeholder="Nombre legal de la empresa" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Dirección fiscal</label>
                <input type="text" value={infoForm.direccionFiscal} onChange={e => setInfoForm(p => ({ ...p, direccionFiscal: e.target.value }))} className={inputCls} placeholder="Dirección completa para facturas" />
              </div>
            </div>

            {/* Referral code + save */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5">
                  <Tag size={12} className="text-slate-400" />
                  <span className="text-xs font-mono font-semibold text-slate-700">{clinicInfo?.referralCode ?? '—'}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(clinicInfo?.referralCode ?? ''); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1500); }}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">Código de invitación</span>
              </div>
              <button onClick={handleSaveInfo} disabled={savingInfo} className="h-8 px-4 rounded-md bg-gantly-blue text-white text-xs font-semibold hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none">
                {savingInfo ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2 — Weekly schedule */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-900">Horario semanal</h3>
            </div>
            {scheduleSaved && (
              <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Check size={10} /> Guardado
              </span>
            )}
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex-1 space-y-1">
              {schedule.map((day, idx) => (
                <div key={day.day} className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${
                  day.closed ? 'bg-slate-50/60' : 'hover:bg-slate-50/60'
                }`}>
                  <span className={`w-[72px] text-xs font-medium ${day.closed ? 'text-slate-400' : 'text-slate-700'}`}>{day.day}</span>
                  <button
                    type="button"
                    onClick={() => updateDay(idx, 'closed', !day.closed)}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer border-none flex-shrink-0 ${day.closed ? 'bg-slate-200' : 'bg-emerald-500'}`}
                  >
                    <span className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${day.closed ? 'left-[2px]' : 'left-[18px]'}`} />
                  </button>
                  {!day.closed ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input type="time" value={day.openTime} onChange={e => updateDay(idx, 'openTime', e.target.value)} className={timeCls} />
                      <span className="text-slate-400 text-[10px]">a</span>
                      <input type="time" value={day.closeTime} onChange={e => updateDay(idx, 'closeTime', e.target.value)} className={timeCls} />
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">Cerrado</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button onClick={handleSaveSchedule} disabled={savingSchedule} className="h-8 px-4 rounded-md bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer border-none">
                {savingSchedule ? 'Guardando...' : 'Guardar horario'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Services + Rooms side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Card 3 — Services catalog */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Stethoscope size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900">Catálogo de servicios</h3>
              <span className="text-[11px] text-slate-400">{services.length} configurados</span>
            </div>
            {!showServiceForm && (
              <button onClick={() => setShowServiceForm(true)} className="flex items-center gap-1 text-[11px] text-gantly-blue font-medium cursor-pointer bg-transparent hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md transition-colors">
                <Plus size={12} />
                Nuevo
              </button>
            )}
          </div>
          <div className="p-5 flex-1 flex flex-col">
            {showServiceForm && (
              <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5 bg-slate-50/50 mb-4">
                <input type="text" placeholder="Ej: Psicoterapia individual" value={newService.name}
                  onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && newService.name.trim()) handleCreateService(); if (e.key === 'Escape') { setShowServiceForm(false); setNewService({ name: '', defaultPrice: '', durationMinutes: '' }); } }}
                  className={inputCls} autoFocus />
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium mb-1 block">Precio (EUR)</label>
                    <input type="number" step="0.01" min="0" placeholder="60.00" value={newService.defaultPrice}
                      onChange={e => setNewService(p => ({ ...p, defaultPrice: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium mb-1 block">Duración (min)</label>
                    <input type="number" min="5" step="5" placeholder="50" value={newService.durationMinutes}
                      onChange={e => setNewService(p => ({ ...p, durationMinutes: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleCreateService} disabled={savingService || !newService.name.trim()}
                    className="h-8 px-3.5 rounded-md bg-gantly-blue text-white text-xs font-semibold hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none">
                    {savingService ? 'Creando...' : 'Crear servicio'}
                  </button>
                  <button onClick={() => { setShowServiceForm(false); setNewService({ name: '', defaultPrice: '', durationMinutes: '' }); }}
                    className="h-8 px-3.5 rounded-md text-slate-500 text-xs hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-none">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1">
              {loadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
                </div>
              ) : services.length === 0 && !showServiceForm ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package size={24} className="text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-400">Sin servicios</p>
                  <p className="text-xs text-slate-400 mt-0.5">Añade tu primer servicio</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {services.map((svc) => {
                    const isExpanded = expandedServiceId === svc.id;
                    const pricesMap: Record<string, number> = (() => {
                      try { return svc.psychologistPrices ? JSON.parse(svc.psychologistPrices) : {}; } catch { return {}; }
                    })();
                    const hasPriceOverrides = Object.keys(pricesMap).length > 0;
                    return (
                      <div key={svc.id} className="rounded-lg hover:bg-slate-50 group transition-colors">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => setExpandedServiceId(isExpanded ? null : svc.id)}
                            className="flex items-center gap-2.5 min-w-0 bg-transparent border-none cursor-pointer p-0 text-left"
                          >
                            <ChevronDown size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            <span className="text-sm font-medium text-slate-800 truncate">{svc.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {svc.defaultPrice != null && (
                                <span className="text-xs tabular-nums font-medium text-emerald-600">{svc.defaultPrice} €</span>
                              )}
                              {svc.durationMinutes != null && (
                                <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                                  <Timer size={10} />
                                  {svc.durationMinutes}min
                                </span>
                              )}
                              {hasPriceOverrides && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 font-medium">
                                  {Object.keys(pricesMap).length} precio{Object.keys(pricesMap).length !== 1 ? 's' : ''} custom
                                </span>
                              )}
                            </div>
                          </button>
                          <button onClick={() => handleDeleteService(svc.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-md cursor-pointer bg-transparent border-none hover:bg-red-50">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {/* Per-psychologist pricing panel */}
                        {isExpanded && (
                          <div className="px-3 pb-3">
                            <div className="bg-white border border-slate-100 rounded-lg p-3 space-y-2">
                              <p className="text-[11px] font-medium text-slate-500">Precios por profesional (vacio = precio base)</p>
                              {psychologists.length === 0 ? (
                                <p className="text-xs text-slate-400">Sin profesionales en la clinica</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {psychologists.map((psych) => {
                                    const customPrice = pricesMap[String(psych.id)];
                                    return (
                                      <div key={psych.id} className="flex items-center gap-2">
                                        <span className="text-xs text-slate-700 w-32 truncate" title={psych.name}>{psych.name}</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder={svc.defaultPrice != null ? `${svc.defaultPrice}` : '---'}
                                          value={customPrice != null ? customPrice : ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const newMap = { ...pricesMap };
                                            if (val === '' || val === undefined) {
                                              delete newMap[String(psych.id)];
                                            } else {
                                              newMap[String(psych.id)] = parseFloat(val);
                                            }
                                            const json = Object.keys(newMap).length > 0 ? JSON.stringify(newMap) : null;
                                            clinicService.updateService(svc.id, { psychologistPrices: json || undefined })
                                              .then((updated) => {
                                                setServices(prev => prev.map(s => s.id === svc.id ? { ...s, psychologistPrices: updated.psychologistPrices ?? null } : s));
                                              })
                                              .catch(() => { /* error saving price */ });
                                          }}
                                          className="h-7 w-20 px-2 rounded border border-slate-200 text-xs tabular-nums focus:ring-1 focus:ring-gantly-blue/20 focus:border-gantly-blue outline-none"
                                        />
                                        <span className="text-[11px] text-slate-400">€</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 4 — Rooms */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <DoorOpen size={16} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900">Despachos</h3>
            <span className="text-[11px] text-slate-400">Un despacho por profesional</span>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex-1">
              {loadingRooms ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
                </div>
              ) : psychologists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <UserX size={24} className="text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-400">Sin profesionales</p>
                  <p className="text-xs text-slate-400 mt-0.5">Invita desde la pestaña Equipo</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {psychologists.map((psych, idx) => {
                    const room = rooms.find(r => r.assignedPsychologistId === psych.id);
                    const isAdding = addingForPsychId === psych.id;

                    return (
                      <div key={psych.id} className="rounded-lg border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors group/room">
                        <div className="flex items-center gap-3 px-3.5 py-2.5">
                          <div
                            className="size-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: room ? room.color : '#94a3b8' }}
                          >
                            {psych.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-slate-800 block truncate">{psych.name}</span>
                            {room ? (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: room.color }} />
                                {room.name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 mt-0.5">Sin despacho</span>
                            )}
                          </div>

                          {room ? (
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="opacity-0 group-hover/room:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all p-1.5 rounded-md cursor-pointer bg-transparent border-none"
                              title="Eliminar despacho"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : !isAdding ? (
                            <button
                              onClick={() => startAdding(psych.id, `Consulta ${idx + 1}`)}
                              className="flex items-center gap-1 text-[10px] text-gantly-blue border border-dashed border-slate-200 hover:border-gantly-blue/40 hover:bg-gantly-blue/5 px-2 py-1 rounded-md transition-colors cursor-pointer bg-transparent"
                            >
                              <Plus size={12} />
                              Asignar
                            </button>
                          ) : null}
                        </div>

                        {isAdding && (
                          <div className="px-3.5 py-3 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
                            <input
                              type="text"
                              placeholder="Nombre del despacho"
                              value={newRoomName}
                              onChange={e => setNewRoomName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveRoom(psych.id); if (e.key === 'Escape') cancelAdding(); }}
                              autoFocus
                              className={inputCls}
                            />
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1.5">
                                {ROOM_COLORS.map(c => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setNewRoomColor(c)}
                                    className="w-5 h-5 rounded-full flex-shrink-0 cursor-pointer border-2 p-0 transition-all duration-150"
                                    style={{ background: c, borderColor: newRoomColor === c ? '#0f172a' : 'transparent' }}
                                  />
                                ))}
                              </div>
                              <div className="flex gap-1.5 flex-1 justify-end">
                                <button
                                  onClick={() => handleSaveRoom(psych.id)}
                                  disabled={savingRoom || !newRoomName.trim()}
                                  className="h-7 px-3 rounded-md bg-gantly-blue text-white text-[11px] font-semibold hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none"
                                >
                                  {savingRoom ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                  onClick={cancelAdding}
                                  className="h-7 px-3 rounded-md text-slate-500 text-[11px] hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-none"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Administradores + Pagina publica side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Card 5 — Administradores */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <Users size={16} className="text-gantly-blue" />
            <h3 className="text-sm font-semibold text-slate-900">Administradores</h3>
            <span className="text-[11px] text-slate-400">{admins.length} registrados</span>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            {/* Invite form */}
            <form onSubmit={handleInviteAdmin} className="flex gap-2 mb-4">
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className={inputCls}
                required
              />
              <select
                value={adminRole}
                onChange={e => setAdminRole(e.target.value as 'ADMIN' | 'VIEWER')}
                className="h-9 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-gantly-blue/50 transition-all cursor-pointer"
              >
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={invitingAdmin}
                className="h-8 px-4 bg-gantly-blue text-white rounded-md text-xs font-semibold hover:bg-gantly-blue/90 transition disabled:opacity-50 cursor-pointer border-none self-center flex-shrink-0"
              >
                {invitingAdmin ? 'Enviando...' : 'Invitar'}
              </button>
            </form>
            {adminError && <p className="text-red-500 text-xs mb-2">{adminError}</p>}
            {adminSuccess && <p className="text-gantly-blue text-xs mb-2">{adminSuccess}</p>}

            {/* Admin list */}
            {loadingAdmins ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
              </div>
            ) : admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users size={24} className="text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-400">Sin administradores</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Nombre / Email</th>
                      <th className="text-center py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Rol</th>
                      <th className="text-center py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="text-right py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => {
                      const isOwner = admin.role === 'OWNER';
                      const currentIsOwner = admins.some(a => a.role === 'OWNER' && a.email === clinicInfo?.email);
                      const roleBg = admin.role === 'OWNER' ? 'bg-gantly-blue/10 text-gantly-blue' : admin.role === 'ADMIN' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600';
                      const statusBg = admin.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : admin.status === 'INVITED' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600';
                      return (
                        <tr key={admin.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5">
                            <div className="text-xs font-medium text-slate-800">{admin.name || admin.email}</div>
                            {admin.name && <div className="text-[11px] text-slate-400">{admin.email}</div>}
                          </td>
                          <td className="py-2.5 text-center">
                            {isOwner || !currentIsOwner ? (
                              <span className={`inline-flex items-center rounded-full text-[11px] font-medium px-2.5 py-0.5 ${roleBg}`}>
                                {admin.role}
                              </span>
                            ) : (
                              <select
                                value={admin.role}
                                onChange={e => handleUpdateAdminRole(admin.id, e.target.value)}
                                className="h-7 px-2 rounded-full border border-slate-200 text-[11px] font-medium text-slate-700 cursor-pointer outline-none bg-white"
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="VIEWER">VIEWER</option>
                              </select>
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`inline-flex items-center rounded-full text-[11px] font-medium px-2.5 py-0.5 ${statusBg}`}>
                              {admin.status === 'ACTIVE' ? 'Activo' : admin.status === 'INVITED' ? 'Invitado' : 'Desactivado'}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            {!isOwner && currentIsOwner && (
                              <button
                                onClick={() => handleRemoveAdmin(admin.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all cursor-pointer bg-transparent border-none"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Card 6 — Pagina publica */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
            <Globe size={16} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900">Pagina publica</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            {/* Visibility toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {infoForm.publicVisible ? <Eye size={14} className="text-emerald-500" /> : <EyeOff size={14} className="text-slate-400" />}
                <span className="text-sm text-slate-700">
                  {infoForm.publicVisible ? 'Pagina visible' : 'Pagina oculta'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInfoForm(p => ({ ...p, publicVisible: !p.publicVisible }))}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer border-none flex-shrink-0 ${
                  infoForm.publicVisible ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                  infoForm.publicVisible ? 'left-[18px]' : 'left-[2px]'
                }`} />
              </button>
            </div>

            {/* Slug */}
            <div className="mb-3">
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">URL personalizada (slug)</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">/clinica/</span>
                <input
                  type="text"
                  value={infoForm.slug}
                  onChange={e => setInfoForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="mi-clinica"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-3 flex-1">
              <label className="text-[11px] font-medium text-slate-500 mb-1 block">Descripcion publica</label>
              <textarea
                value={infoForm.description}
                onChange={e => setInfoForm(p => ({ ...p, description: e.target.value }))}
                rows={4}
                placeholder="Describe tu clinica para los pacientes..."
                className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-gantly-blue/50 transition-all resize-y placeholder:text-slate-400"
              />
            </div>

            <div className="mt-auto pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveInfo}
                disabled={savingInfo}
                className="h-8 px-4 rounded-md bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50 cursor-pointer border-none"
              >
                {savingInfo ? 'Guardando...' : 'Guardar pagina'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={deleteAdminId !== null}
        onClose={() => setDeleteAdminId(null)}
        onConfirm={confirmRemoveAdmin}
        title="Eliminar administrador"
        message="¿Estás seguro de que deseas eliminar este administrador? Esta acción no se puede deshacer."
        variant="danger"
        confirmLabel="Eliminar"
      />
      <ConfirmDialog
        open={deleteServiceId !== null}
        onClose={() => setDeleteServiceId(null)}
        onConfirm={confirmDeleteService}
        title="Eliminar servicio"
        message="¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer."
        variant="danger"
        confirmLabel="Eliminar"
      />
      <ConfirmDialog
        open={deleteRoomId !== null}
        onClose={() => setDeleteRoomId(null)}
        onConfirm={confirmDeleteRoom}
        title="Eliminar despacho"
        message="¿Estás seguro de que deseas eliminar este despacho? Esta acción no se puede deshacer."
        variant="danger"
        confirmLabel="Eliminar"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
export default function ClinicDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [me, psychs] = await Promise.all([
        clinicService.getMe(),
        clinicService.getPsychologists(),
      ]);
      setClinicInfo(me);
      setPsychologists(psychs);
    } catch {
      // backend unavailable — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyReferral = () => {
    if (clinicInfo?.referralCode) {
      navigator.clipboard.writeText(clinicInfo.referralCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const navItems: { id: NavTab; icon: string; label: string }[] = [
    { id: 'inicio',         icon: 'home',           label: 'Inicio' },
    { id: 'estadisticas',   icon: 'bar_chart',      label: 'Estadísticas' },
    { id: 'agenda',         icon: 'calendar_month',  label: 'Agenda' },
    { id: 'equipo',         icon: 'group',           label: 'Equipo' },
    { id: 'pacientes',      icon: 'people',          label: 'Pacientes' },
    { id: 'facturacion',    icon: 'receipt_long',    label: 'Facturación' },
    { id: 'reportes',       icon: 'file_bar_chart',  label: 'Reportes' },
    { id: 'lista-espera',  icon: 'list_ordered',    label: 'Lista de espera' },
    { id: 'seguros',        icon: 'shield_check',    label: 'Seguros' },
    { id: 'auditoria',     icon: 'shield',           label: 'Auditoría' },
    { id: 'configuracion',  icon: 'settings',        label: 'Configuración' },
  ];

  const currentTabLabel = navItems.find(t => t.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-slate-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[55] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Light Sidebar */}
      <aside className={`w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 fixed inset-y-0 left-0 z-[60] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo + close on mobile */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <img src={LogoSvg} alt="Gantly" className="h-7 cursor-pointer" onClick={() => navigate('/')} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium cursor-pointer transition-all duration-200 border-none ${
                activeTab === item.id
                  ? 'bg-gantly-blue text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {navIconMap[item.icon]}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info + logout at bottom */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gantly-blue/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-gantly-blue">
                {clinicInfo?.name ? clinicInfo.name.charAt(0).toUpperCase() : 'C'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{clinicInfo?.name || 'Clínica'}</div>
              <div className="text-xs text-slate-500 truncate">{clinicInfo?.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.reload();
            }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-all duration-200 border-none bg-transparent"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-gantly-blue outline-none"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-heading font-bold text-gantly-text">
            {currentTabLabel}
          </h2>
          <div className="flex-1" />
        </header>

        {/* Pacientes renders full-bleed (no padding wrapper) */}
        {!loading && activeTab === 'pacientes' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <ClinicPatients />
          </div>
        )}

        <div className={`px-4 sm:px-8 py-6 flex-1 overflow-y-auto ${activeTab === 'pacientes' ? 'hidden' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-9 h-9 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'inicio' && (
                <HomeTab
                  clinicInfo={clinicInfo}
                  psychologists={psychologists}
                  copied={copied}
                  onCopyReferral={handleCopyReferral}
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === 'estadisticas' && (
                <div className="flex-1 overflow-hidden flex flex-col"><ClinicStats /></div>
              )}
              {activeTab === 'agenda' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <ClinicAgenda psychologists={psychologists} onAppointmentChange={loadData} />
                </div>
              )}
              {activeTab === 'equipo' && (
                <EquipoTab psychologists={psychologists} onRefresh={loadData} />
              )}
              {activeTab === 'facturacion' && (
                <div className="flex-1 overflow-y-auto">
                  <ClinicBilling psychologists={psychologists} clinicName={clinicInfo?.name} clinicNif={clinicInfo?.nif} clinicAddress={clinicInfo?.address} clinicPhone={clinicInfo?.phone} clinicRazonSocial={clinicInfo?.razonSocial} clinicDireccionFiscal={clinicInfo?.direccionFiscal} />
                </div>
              )}
              {activeTab === 'reportes' && (
                <ClinicReports />
              )}
              {activeTab === 'lista-espera' && (
                <ClinicWaitingList />
              )}
              {activeTab === 'seguros' && (
                <ClinicInsuranceTab />
              )}
              {activeTab === 'auditoria' && (
                <AuditLogViewer />
              )}
              {activeTab === 'configuracion' && (
                <ConfigTab clinicInfo={clinicInfo} psychologists={psychologists} onClinicInfoUpdate={setClinicInfo} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
