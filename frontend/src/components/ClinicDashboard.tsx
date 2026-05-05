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
// KPI card
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
      className="bg-white p-8 rounded-xl border border-slate-200 shadow-soft hover:-translate-y-1 transition-transform duration-300 text-left w-full relative overflow-hidden group"
    >
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-6xl text-gantly-blue">{icon}</span>
      </div>
      <div className="size-12 bg-gantly-blue-50 flex items-center justify-center rounded-xl text-gantly-blue mb-6">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="text-2xl font-normal text-slate-900 mb-1">{label}</h3>
      <p className="text-sm text-slate-500 font-light">{value} {subtitle}</p>
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
      {/* Hero banner */}
      <header className="bg-gantly-blue-50 rounded-2xl p-8 lg:p-10 mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <path
              className="line-art"
              d="M150 40 Q180 80 160 120 T100 160 T40 100 Q60 40 150 40"
            />
            <circle cx="100" cy="100" r="2" fill="#2E93CC" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="size-20 rounded-full bg-gantly-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-4xl text-gantly-blue">business</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-normal mb-2">
              <span className="italic text-gantly-blue-600">{clinicInfo?.name ?? 'Tu clínica'}</span>
            </h1>
            <p className="text-slate-500 font-light mb-4">{clinicInfo?.email}</p>
            {clinicInfo?.referralCode && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-400 uppercase tracking-widest">Código de empresa</span>
                <span className="font-mono text-sm font-bold text-gantly-blue-700 bg-white/80 px-3 py-1 rounded-xl">
                  {clinicInfo.referralCode}
                </span>
                <button
                  onClick={onCopyReferral}
                  className="px-4 py-1.5 rounded-full border border-slate-300 text-sm text-slate-600 hover:bg-gantly-blue hover:text-white hover:border-gantly-blue transition inline-flex items-center gap-1.5"
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
          <h2 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4">
            Psicólogos del equipo
          </h2>
          <div className="space-y-3">
            {psychologists.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 text-center text-slate-400 text-sm">
                Aún no hay psicólogos en tu clínica
              </div>
            )}
            {psychologists.map(p => (
              <div key={p.id}>
                <button
                  onClick={() => handleSelectPsych(p.id)}
                  className={`w-full bg-white rounded-xl border shadow-soft p-4 flex items-center gap-4 hover:bg-slate-50 transition text-left ${selectedPsychId === p.id ? 'border-gantly-blue' : 'border-slate-200'}`}
                >
                  <div className="size-10 rounded-full bg-gantly-blue-50 flex items-center justify-center text-gantly-blue font-medium flex-shrink-0">
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} className="size-10 rounded-full object-cover" alt={p.name} />
                      : <span className="material-symbols-outlined">person</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.email}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-gantly-emerald-50 text-[10px] font-medium text-gantly-emerald-700 uppercase tracking-wider">
                      Activo
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-base">
                      {selectedPsychId === p.id ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>
                {/* Schedule panel */}
                {selectedPsychId === p.id && (
                  <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-soft px-4 pb-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 py-3">
                      Agenda próximos 30 días
                    </p>
                    {loadingSchedule ? (
                      <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin mx-auto" /></div>
                    ) : schedule.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-3">Sin citas programadas</p>
                    ) : (
                      <div className="space-y-2">
                        {schedule.map(slot => {
                          const isFree = slot.status === 'FREE';
                          const isConfirmed = slot.status === 'CONFIRMED' || slot.status === 'BOOKED';
                          return (
                            <div
                              key={slot.id}
                              className={`flex items-center gap-3 text-sm px-2 py-1.5 rounded-xl ${isFree ? 'bg-gantly-blue-50' : isConfirmed ? 'bg-gantly-emerald-50' : 'bg-gantly-gold-50'}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${isFree ? 'bg-gantly-blue' : isConfirmed ? 'bg-gantly-emerald' : 'bg-gantly-gold'}`}
                              />
                              <span className="text-slate-700 text-xs">
                                {new Date(slot.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
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
            ))}
          </div>
        </div>

        {/* Invite section */}
        <div>
          <h2 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4">
            Invitar psicólogo
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 mb-4">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-gantly-blue-300"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-gantly-blue text-white rounded-lg text-sm font-medium hover:bg-gantly-blue-600 transition disabled:opacity-50 inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">send</span>
                {sending ? 'Enviando...' : 'Invitar'}
              </button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {success && <p className="text-gantly-blue text-xs mt-2">{success}</p>}
          </div>

          {/* Pending invitations */}
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
            Invitaciones pendientes
          </h3>
          {loadingInvites ? (
            <div className="text-center py-4"><div className="w-6 h-6 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin mx-auto" /></div>
          ) : invitations.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-4 text-center text-slate-400 text-sm">
              No hay invitaciones pendientes
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="bg-white rounded-xl border border-slate-200 shadow-soft px-4 py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-base">mail</span>
                  <span className="text-sm text-slate-900 flex-1">{inv.email}</span>
                  <span className="text-[10px] text-slate-400">
                    Expira {new Date(inv.expiresAt).toLocaleDateString('es-ES')}
                  </span>
                  <button
                    onClick={() => handleCancel(inv.id)}
                    className="text-slate-400 hover:text-red-400 transition"
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
const ROOM_COLORS = [
  '#2E93CC', '#22D3EE', '#059669', '#F0C930',
  '#9c7cc5', '#7cc5bc', '#c57ca0', '#6b8fad',
];

function ConfigTab({ clinicInfo, psychologists }: { clinicInfo: ClinicInfo | null; psychologists: Psychologist[] }) {
  const [rooms, setRooms] = useState<Array<{ id: number; name: string; color: string; assignedPsychologistId?: number; active: boolean }>>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  // addingForPsychId = psych.id for which we're showing the inline create form
  const [addingForPsychId, setAddingForPsychId] = useState<number | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomColor, setNewRoomColor] = useState(ROOM_COLORS[0]);
  const [savingRoom, setSavingRoom] = useState(false);

  useEffect(() => {
    setLoadingRooms(true);
    clinicService.getRooms()
      .then(data => setRooms(data))
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, []);

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
    if (!confirm('¿Eliminar este despacho?')) return;
    try {
      await clinicService.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Error al eliminar el despacho');
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-6">
      <div className="max-w-lg space-y-6">
        <h2 className="text-xl font-medium text-slate-900">Configuración</h2>

        {/* Clinic info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-8 space-y-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              Nombre de la clínica
            </span>
            <p className="text-base font-medium text-slate-900 mt-1">{clinicInfo?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              Correo electrónico
            </span>
            <p className="text-base font-medium text-slate-900 mt-1">{clinicInfo?.email ?? '—'}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              Código de empresa
            </span>
            <p className="text-base font-mono font-bold text-slate-900 mt-1">
              {clinicInfo?.referralCode ?? '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Comparte este código con tus psicólogos para que se unan a la clínica.
            </p>
          </div>
        </div>

        {/* Rooms — one per psychologist */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-8">
          <h3 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-gantly-blue">meeting_room</span>
            Despachos
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Un despacho por psicólogo. Se usa para asignar sala en citas presenciales.
          </p>

          {loadingRooms ? (
            <div className="text-sm text-slate-400 py-4 text-center">Cargando...</div>
          ) : psychologists.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No hay psicólogos en la clínica todavía.</p>
          ) : (
            <ul className="space-y-3">
              {psychologists.map((psych, idx) => {
                const room = rooms.find(r => r.assignedPsychologistId === psych.id);
                const isAdding = addingForPsychId === psych.id;

                return (
                  <li key={psych.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    {/* Psychologist header row */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                      <div
                        className="size-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: room ? room.color : '#94a3b8' }}
                      >
                        {psych.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900 flex-1">{psych.name}</span>

                      {room ? (
                        /* Has room — show name + delete */
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: room.color }} />
                          <span className="text-xs text-slate-500">{room.name}</span>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg"
                            title="Eliminar despacho"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      ) : !isAdding ? (
                        /* No room — add button */
                        <button
                          onClick={() => startAdding(psych.id, `Consulta ${idx + 1}`)}
                          className="text-xs text-slate-500 hover:text-gantly-blue border border-dashed border-slate-300 hover:border-gantly-blue px-3 py-1 rounded-lg transition-colors"
                        >
                          + Asignar despacho
                        </button>
                      ) : null}
                    </div>

                    {/* Inline create form */}
                    {isAdding && (
                      <div className="px-4 py-3 border-t border-slate-200 space-y-3 bg-white">
                        <input
                          type="text"
                          placeholder="Nombre del despacho"
                          value={newRoomName}
                          onChange={e => setNewRoomName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveRoom(psych.id); if (e.key === 'Escape') cancelAdding(); }}
                          autoFocus
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 outline-none focus:border-gantly-blue-300"
                        />
                        <div className="flex gap-2">
                          {ROOM_COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewRoomColor(c)}
                              className="w-5 h-5 rounded-full flex-shrink-0"
                              style={{ background: c, border: newRoomColor === c ? '2px solid #0f172a' : '2px solid transparent' }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveRoom(psych.id)}
                            disabled={savingRoom || !newRoomName.trim()}
                            className="flex-1 py-1.5 rounded-lg bg-gantly-blue-50 hover:bg-gantly-blue-100 text-gantly-blue-700 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {savingRoom ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={cancelAdding}
                            className="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
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
    <div
      className="flex bg-slate-50 text-slate-900"
      style={{ height: 'calc(100vh - 72px)', overflow: 'hidden' }}
    >
      {/* Sidebar */}
      <aside className="w-24 bg-white flex flex-col items-center pt-2 pb-4 z-10 border-r border-slate-200">
        <nav className="flex flex-col gap-4 w-full px-3 pt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
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
            {activeTab === 'pacientes' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <ClinicPatients />
              </div>
            )}
            {activeTab === 'facturacion' && (
              <div className="flex-1 overflow-y-auto">
                <ClinicBilling psychologists={psychologists} clinicName={clinicInfo?.name} />
              </div>
            )}
            {activeTab === 'configuracion' && (
              <ConfigTab clinicInfo={clinicInfo} psychologists={psychologists} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
