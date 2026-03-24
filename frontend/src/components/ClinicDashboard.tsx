import { useState, useEffect, useCallback } from 'react';
import { clinicService } from '../services/api';
import ClinicAgenda from './ClinicAgenda';
import ClinicPatients from './ClinicPatients';
import ClinicBilling from './ClinicBilling';
import ClinicStats from './ClinicStats';

type NavTab = 'inicio' | 'estadisticas' | 'agenda' | 'equipo' | 'pacientes' | 'facturacion' | 'configuracion';

interface ClinicInfo {
  id: number;
  name: string;
  email: string;
  referralCode: string;
}

interface Psychologist {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

// ---------------------------------------------------------------------------
// KPI card — matches UserDashboard card style
// ---------------------------------------------------------------------------
function KpiCard({
  icon,
  label,
  value,
  subtitle,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left w-full relative overflow-hidden group"
    >
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-6xl text-sage">{icon}</span>
      </div>
      <div className="size-12 bg-mint flex items-center justify-center rounded-2xl text-sage mb-6">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="text-2xl font-normal mb-1">{label}</h3>
      <p className="text-sm text-sage/60 font-light">{value} {subtitle}</p>
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
  return (
    <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-6">
      {/* Hero banner — mirrors UserDashboard's header */}
      <header className="bg-sage/10 rounded-[4rem] p-8 lg:p-10 mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <path
              className="line-art"
              d="M150 40 Q180 80 160 120 T100 160 T40 100 Q60 40 150 40"
            />
            <circle cx="100" cy="100" r="2" fill="#8da693" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div
            className="size-20 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0"
          >
            <span className="material-symbols-outlined text-4xl text-forest">business</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-normal mb-2">
              <span className="italic text-sage">{clinicInfo?.name ?? 'Tu clínica'}</span>
            </h1>
            <p className="text-sage/70 font-light mb-4">{clinicInfo?.email}</p>
            {clinicInfo?.referralCode && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-sage/60 uppercase tracking-widest">Código de empresa</span>
                <span className="font-mono text-sm font-bold text-forest bg-white/80 px-3 py-1 rounded-xl">
                  {clinicInfo.referralCode}
                </span>
                <button
                  onClick={onCopyReferral}
                  className="px-4 py-1.5 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon="groups"
          label="Psicólogos"
          value={String(psychologists.length)}
          subtitle="en la clínica"
          onClick={() => onNavigate('agenda')}
        />
        <KpiCard
          icon="calendar_month"
          label="Agenda"
          value="Ver citas"
          subtitle="y horarios"
          onClick={() => onNavigate('agenda')}
        />
        <KpiCard
          icon="people"
          label="Pacientes"
          value="Ver listado"
          subtitle="y expedientes"
          onClick={() => onNavigate('pacientes')}
        />
        <KpiCard
          icon="receipt_long"
          label="Facturación"
          value="Ver informe"
          subtitle="mensual"
          onClick={() => onNavigate('facturacion')}
        />
      </div>
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
      setSuccess('Invitación enviada a ' + email.trim());
      setEmail('');
      loadInvitations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la invitación');
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
    <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current psychologists */}
        <div>
          <h2 className="text-base font-medium text-forest mb-4 uppercase tracking-widest text-[10px] text-sage/40">
            Psicólogos del equipo
          </h2>
          <div className="space-y-3">
            {psychologists.length === 0 && (
              <div className="bg-white rounded-[2rem] border border-sage/10 soft-shadow p-6 text-center text-sage/50 text-sm">
                Aún no hay psicólogos en tu clínica
              </div>
            )}
            {psychologists.map(p => (
              <div key={p.id}>
                <button
                  onClick={() => handleSelectPsych(p.id)}
                  className="w-full bg-white rounded-[2rem] border border-sage/10 soft-shadow p-4 flex items-center gap-4 hover:bg-mint/30 transition text-left"
                  style={{ borderColor: selectedPsychId === p.id ? '#7b9f86' : undefined }}
                >
                  <div className="size-10 rounded-full bg-mint flex items-center justify-center text-sage font-medium flex-shrink-0">
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} className="size-10 rounded-full object-cover" alt={p.name} />
                      : <span className="material-symbols-outlined">person</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-forest">{p.name}</p>
                    <p className="text-xs text-sage/60">{p.email}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-mint text-[10px] font-medium text-forest uppercase tracking-wider">
                      Activo
                    </span>
                    <span className="material-symbols-outlined text-sage/40 text-base">
                      {selectedPsychId === p.id ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>
                {/* Schedule panel */}
                {selectedPsychId === p.id && (
                  <div className="bg-white rounded-b-[2rem] border border-t-0 border-sage/10 soft-shadow px-4 pb-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-sage/40 py-3">
                      Agenda próximos 30 días
                    </p>
                    {loadingSchedule ? (
                      <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-sage/20 border-t-sage rounded-full animate-spin mx-auto" /></div>
                    ) : schedule.length === 0 ? (
                      <p className="text-sm text-sage/50 text-center py-3">Sin citas programadas</p>
                    ) : (
                      <div className="space-y-2">
                        {schedule.map(slot => {
                          const isFree = slot.status === 'FREE';
                          const isConfirmed = slot.status === 'CONFIRMED' || slot.status === 'BOOKED';
                          return (
                            <div key={slot.id} className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-xl" style={{ background: isFree ? '#f0f9f5' : isConfirmed ? '#f3f4f6' : '#fff7ed' }}>
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: isFree ? '#22c55e' : isConfirmed ? '#6b7280' : '#f59e0b' }}
                              />
                              <span className="text-forest text-xs">
                                {new Date(slot.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                                {' · '}
                                {new Date(slot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                {' – '}
                                {new Date(slot.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {slot.patientName && (
                                <span className="ml-auto text-xs text-sage/60 truncate max-w-[120px]">{slot.patientName}</span>
                              )}
                              {isFree && (
                                <span className="ml-auto text-[10px] text-green-600 font-medium">Libre</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite section */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-4">
            Invitar psicólogo
          </h2>
          <div className="bg-white rounded-[2.5rem] border border-sage/10 soft-shadow p-6 mb-4">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 border border-sage/20 rounded-xl px-4 py-2 text-sm text-forest placeholder-sage/40 focus:outline-none focus:border-sage/60"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-sage text-white rounded-xl text-sm font-medium hover:bg-forest transition disabled:opacity-50 inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">send</span>
                {sending ? 'Enviando...' : 'Invitar'}
              </button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {success && <p className="text-sage text-xs mt-2">{success}</p>}
          </div>

          {/* Pending invitations */}
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-sage/40 mb-3">
            Invitaciones pendientes
          </h3>
          {loadingInvites ? (
            <div className="text-center py-4"><div className="w-6 h-6 border-2 border-sage/20 border-t-sage rounded-full animate-spin mx-auto" /></div>
          ) : invitations.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-sage/10 soft-shadow p-4 text-center text-sage/50 text-sm">
              No hay invitaciones pendientes
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="bg-white rounded-[2rem] border border-sage/10 soft-shadow px-4 py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-sage/40 text-base">mail</span>
                  <span className="text-sm text-forest flex-1">{inv.email}</span>
                  <span className="text-[10px] text-sage/50">
                    Expira {new Date(inv.expiresAt).toLocaleDateString('es-ES')}
                  </span>
                  <button
                    onClick={() => handleCancel(inv.id)}
                    className="text-sage/40 hover:text-red-400 transition"
                    title="Cancelar invitación"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config tab
// ---------------------------------------------------------------------------
function ConfigTab({ clinicInfo }: { clinicInfo: ClinicInfo | null }) {
  return (
    <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-6">
      <div className="max-w-lg">
        <h2 className="text-xl font-medium text-forest mb-6">Configuración</h2>
        <div className="bg-white rounded-[2.5rem] border border-sage/10 soft-shadow p-8 space-y-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-sage/40">
              Nombre de la clínica
            </span>
            <p className="text-base font-medium text-forest mt-1">{clinicInfo?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-sage/40">
              Correo electrónico
            </span>
            <p className="text-base font-medium text-forest mt-1">{clinicInfo?.email ?? '—'}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-sage/40">
              Código de empresa
            </span>
            <p className="text-base font-mono font-bold text-forest mt-1">
              {clinicInfo?.referralCode ?? '—'}
            </p>
            <p className="text-xs text-sage/50 mt-1">
              Comparte este código con tus psicólogos para que se unan a la clínica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
export default function ClinicDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
    { id: 'inicio',         icon: 'home',          label: 'Inicio' },
    { id: 'estadisticas',   icon: 'bar_chart',     label: 'Stats' },
    { id: 'agenda',         icon: 'calendar_month', label: 'Agenda' },
    { id: 'equipo',         icon: 'group',          label: 'Equipo' },
    { id: 'pacientes',      icon: 'people',         label: 'Pacientes' },
    { id: 'facturacion',    icon: 'receipt_long',   label: 'Facturac.' },
    { id: 'configuracion',  icon: 'settings',       label: 'Config' },
  ];

  return (
    // height: calc(100vh - nav_height). The App.tsx nav is ~72px tall.
    <div
      className="flex bg-cream text-forest"
      style={{ height: 'calc(100vh - 72px)', overflow: 'hidden' }}
    >
      {/* Sidebar — identical pattern to UserDashboard / PsychDashboard */}
      <aside className="w-24 bg-cream flex flex-col items-center pt-2 pb-4 z-10 border-r border-sage/10">
        <nav className="flex flex-col gap-4 w-full px-3 pt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined font-light text-lg">
                {item.icon}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-tighter">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-9 h-9 border-[3px] border-sage/20 border-t-sage rounded-full animate-spin" />
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
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <ClinicAgenda psychologists={psychologists} />
              </div>
            )}
            {activeTab === 'equipo' && (
              <EquipoTab psychologists={psychologists} onRefresh={loadData} />
            )}
            {activeTab === 'pacientes' && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <ClinicPatients />
              </div>
            )}
            {activeTab === 'facturacion' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <ClinicBilling psychologists={psychologists} />
              </div>
            )}
            {activeTab === 'configuracion' && (
              <ConfigTab clinicInfo={clinicInfo} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
