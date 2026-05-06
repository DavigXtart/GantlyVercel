import { useState, useEffect, useCallback } from 'react';
import { clinicService } from '../services/api';
import ClinicAgenda from './ClinicAgenda';
import ClinicPatients from './ClinicPatients';
import ClinicBilling from './ClinicBilling';
import ClinicStats from './ClinicStats';
import LogoSvg from '../assets/logo-gantly.svg';

type NavTab = 'inicio' | 'estadisticas' | 'agenda' | 'equipo' | 'pacientes' | 'facturacion' | 'configuracion';

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
}

interface ClinicServiceItem {
  id: number;
  name: string;
  defaultPrice: number | null;
  durationMinutes: number | null;
  active: boolean;
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
function KpiCard({
  icon,
  label,
  value,
  subtitle,
  onClick,
  span2,
}: {
  icon: string;
  label: string;
  value: string;
  subtitle: string;
  onClick: () => void;
  span2?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-soft text-left w-full relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${span2 ? 'col-span-2' : ''}`}
    >
      <div className="h-1 bg-gradient-to-r from-gantly-blue to-gantly-cyan rounded-t-xl" />
      <div className="p-8">
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-6xl text-gantly-blue">{icon}</span>
        </div>
        <div className="size-12 bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/10 flex items-center justify-center rounded-xl text-gantly-blue mb-6">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h3 className="text-3xl font-bold text-gantly-text mb-1">{value}</h3>
        <p className="text-base font-medium text-slate-700 mb-0.5">{label}</p>
        <p className="text-sm text-slate-500 font-light">{subtitle}</p>
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
  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <header className="bg-gradient-to-br from-gantly-navy via-gantly-blue to-gantly-cyan rounded-2xl p-8 lg:p-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="size-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-4xl text-white">business</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 text-white">
              {clinicInfo?.name ?? 'Tu clinica'}
            </h1>
            <p className="text-white/70 font-light mb-4">{clinicInfo?.email}</p>
            {clinicInfo?.referralCode && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-white/60 uppercase tracking-widest">Codigo de empresa</span>
                <span className="font-mono text-sm font-bold text-white bg-white/15 backdrop-blur-sm px-3 py-1 rounded-xl">
                  {clinicInfo.referralCode}
                </span>
                <button
                  onClick={onCopyReferral}
                  className="px-4 py-1.5 rounded-full border border-white/30 text-sm text-white hover:bg-white/20 transition inline-flex items-center gap-1.5 bg-transparent cursor-pointer"
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

      {/* KPI grid — bento-style asymmetric */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon="groups"
          label="Psicologos"
          value={String(psychologists.length)}
          subtitle="en la clinica"
          onClick={() => onNavigate('equipo')}
          span2
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
          label="Facturacion"
          value="Ver informe"
          subtitle="mensual"
          onClick={() => onNavigate('facturacion')}
        />
        <KpiCard
          icon="bar_chart"
          label="Estadisticas"
          value="Ver datos"
          subtitle="de la clinica"
          onClick={() => onNavigate('estadisticas')}
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
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current psychologists */}
        <div>
          <h2 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-4">
            Psicologos del equipo
          </h2>
          <div className="space-y-3">
            {psychologists.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 text-center text-slate-500 text-sm">
                Aun no hay psicologos en tu clinica
              </div>
            )}
            {psychologists.map(p => (
              <div key={p.id}>
                <button
                  onClick={() => handleSelectPsych(p.id)}
                  className={`w-full bg-white rounded-xl border shadow-soft p-4 flex items-center gap-4 hover:bg-slate-50 transition text-left cursor-pointer ${selectedPsychId === p.id ? 'border-gantly-blue ring-2 ring-gantly-blue/20' : 'border-slate-200'}`}
                >
                  <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} className="size-10 rounded-full object-cover" alt={p.name} />
                      : <div className="size-10 rounded-full bg-gradient-to-br from-gantly-blue to-gantly-cyan flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">{p.name.charAt(0).toUpperCase()}</span>
                        </div>}
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
                    <p className="text-xs font-heading font-bold text-slate-500 uppercase tracking-widest py-3">
                      Agenda proximos 30 dias
                    </p>
                    {loadingSchedule ? (
                      <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin mx-auto" /></div>
                    ) : schedule.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-3">Sin citas programadas</p>
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
          <h2 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-4">
            Invitar psicologo
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-6 mb-4">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="flex-1 h-12 border-2 border-slate-200 rounded-xl px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="px-5 h-12 bg-gantly-blue text-white rounded-xl text-sm font-medium hover:bg-gantly-blue-600 transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-base">send</span>
                {sending ? 'Enviando...' : 'Invitar'}
              </button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {success && <p className="text-gantly-blue text-xs mt-2">{success}</p>}
          </div>

          {/* Pending invitations */}
          <h3 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-widest mb-3">
            Invitaciones pendientes
          </h3>
          {loadingInvites ? (
            <div className="text-center py-4"><div className="w-6 h-6 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin mx-auto" /></div>
          ) : invitations.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-4 text-center text-slate-500 text-sm">
              No hay invitaciones pendientes
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="bg-gantly-gold/5 rounded-xl border border-gantly-gold/20 shadow-soft px-4 py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gantly-gold text-base">mail</span>
                  <span className="text-sm text-slate-900 flex-1">{inv.email}</span>
                  <span className="text-[10px] text-slate-500 bg-gantly-gold/10 px-2 py-0.5 rounded-full">
                    Expira {new Date(inv.expiresAt).toLocaleDateString('es-ES')}
                  </span>
                  <button
                    onClick={() => handleCancel(inv.id)}
                    className="text-slate-400 hover:text-red-400 transition cursor-pointer bg-transparent border-none"
                    title="Cancelar invitacion"
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
  const [infoForm, setInfoForm] = useState({ name: '', address: '', phone: '', website: '', logoUrl: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

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

  // --- Rooms ---
  const [rooms, setRooms] = useState<Array<{ id: number; name: string; color: string; assignedPsychologistId?: number; active: boolean }>>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [addingForPsychId, setAddingForPsychId] = useState<number | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomColor, setNewRoomColor] = useState(ROOM_COLORS[0]);
  const [savingRoom, setSavingRoom] = useState(false);

  // Initialize form from clinicInfo
  useEffect(() => {
    if (clinicInfo) {
      setInfoForm({
        name: clinicInfo.name || '',
        address: clinicInfo.address || '',
        phone: clinicInfo.phone || '',
        website: clinicInfo.website || '',
        logoUrl: clinicInfo.logoUrl || '',
      });
      if (clinicInfo.weeklySchedule) {
        try { setSchedule(JSON.parse(clinicInfo.weeklySchedule)); } catch { /* keep default */ }
      }
    }
  }, [clinicInfo]);

  // Load services + rooms
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
  }, []);

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
      });
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
    if (!confirm('Eliminar este servicio?')) return;
    try {
      await clinicService.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch { /* ignore */ }
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
    if (!confirm('Eliminar este despacho?')) return;
    try {
      await clinicService.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Error al eliminar el despacho');
    }
  }

  const [copiedCode, setCopiedCode] = useState(false);
  const inputCls = "w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 focus:bg-white transition-all duration-200 placeholder:text-slate-400";

  return (
    <div className="space-y-6">
      {/* Row 1: Datos + Horario side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Card 1 — Clinic data */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
          <div className="h-1 bg-gradient-to-r from-gantly-blue to-gantly-cyan" />
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gantly-blue text-lg">business</span>
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-slate-900">Datos de la clinica</h3>
                  <p className="text-xs text-slate-500">Informacion general y contacto</p>
                </div>
              </div>
              {infoSaved && (
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">Guardado</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Nombre</label>
                <input type="text" value={infoForm.name} onChange={e => setInfoForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Telefono</label>
                <input type="tel" value={infoForm.phone} onChange={e => setInfoForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+34 600 000 000" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Direccion</label>
                <input type="text" value={infoForm.address} onChange={e => setInfoForm(p => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="Calle, numero, ciudad" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Website</label>
                <input type="url" value={infoForm.website} onChange={e => setInfoForm(p => ({ ...p, website: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Logo URL</label>
                <input type="url" value={infoForm.logoUrl} onChange={e => setInfoForm(p => ({ ...p, logoUrl: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
            </div>

            {/* Referral code + save */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">tag</span>
                  <span className="text-sm font-mono font-bold text-slate-700">{clinicInfo?.referralCode ?? '—'}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(clinicInfo?.referralCode ?? ''); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1500); }}
                    className="text-gantly-blue hover:text-gantly-blue/70 cursor-pointer bg-transparent border-none p-0.5"
                    title="Copiar codigo"
                  >
                    <span className="material-symbols-outlined text-sm">{copiedCode ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:inline">Codigo para invitar psicologos</span>
              </div>
              <button onClick={handleSaveInfo} disabled={savingInfo} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gantly-blue to-gantly-cyan text-white text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 cursor-pointer border-none">
                {savingInfo ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2 — Weekly schedule */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
          <div className="h-1 bg-gradient-to-r from-gantly-cyan to-emerald-400" />
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-gantly-cyan/10 to-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gantly-cyan text-lg">schedule</span>
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-slate-900">Horario semanal</h3>
                  <p className="text-xs text-slate-500">Horario de apertura de la clinica</p>
                </div>
              </div>
              {scheduleSaved && (
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">Guardado</span>
              )}
            </div>

            <div className="flex-1 space-y-1">
              {schedule.map((day, idx) => (
                <div key={day.day} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-200 ${day.closed ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'}`}>
                  <span className={`w-20 text-sm font-medium ${day.closed ? 'text-slate-500' : 'text-slate-700'}`}>{day.day}</span>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => updateDay(idx, 'closed', !day.closed)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 cursor-pointer border-none flex-shrink-0 ${day.closed ? 'bg-slate-200' : 'bg-gantly-blue'}`}
                  >
                    <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${day.closed ? 'left-[3px]' : 'left-[21px]'}`} />
                  </button>
                  {!day.closed ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={day.openTime} onChange={e => updateDay(idx, 'openTime', e.target.value)}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-gantly-blue transition-colors w-[110px]" />
                      <span className="text-slate-300 text-sm">—</span>
                      <input type="time" value={day.closeTime} onChange={e => updateDay(idx, 'closeTime', e.target.value)}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-gantly-blue transition-colors w-[110px]" />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Cerrado</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={handleSaveSchedule} disabled={savingSchedule} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gantly-cyan to-emerald-400 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 cursor-pointer border-none">
                {savingSchedule ? 'Guardando...' : 'Guardar horario'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Services + Rooms side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Card 3 — Services catalog */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-gantly-gold" />
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-amber-50 to-gantly-gold/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500 text-lg">medical_services</span>
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-slate-900">Catalogo de servicios</h3>
                  <p className="text-xs text-slate-500">{services.length} servicio{services.length !== 1 ? 's' : ''} configurado{services.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {!showServiceForm && (
                <button onClick={() => setShowServiceForm(true)} className="flex items-center gap-1.5 text-xs text-gantly-blue font-semibold cursor-pointer bg-gantly-blue/5 hover:bg-gantly-blue/10 border-none px-3 py-2 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Nuevo
                </button>
              )}
            </div>

            {showServiceForm && (
              <div className="border border-gantly-blue/20 rounded-xl p-4 space-y-3 bg-gantly-blue/[0.02] mb-4">
                <input type="text" placeholder="Ej: Psicoterapia individual" value={newService.name}
                  onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && newService.name.trim()) handleCreateService(); if (e.key === 'Escape') { setShowServiceForm(false); setNewService({ name: '', defaultPrice: '', durationMinutes: '' }); } }}
                  className={inputCls} autoFocus />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium mb-1 block">Precio (EUR)</label>
                    <input type="number" step="0.01" min="0" placeholder="60.00" value={newService.defaultPrice}
                      onChange={e => setNewService(p => ({ ...p, defaultPrice: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium mb-1 block">Duracion (min)</label>
                    <input type="number" min="5" step="5" placeholder="50" value={newService.durationMinutes}
                      onChange={e => setNewService(p => ({ ...p, durationMinutes: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleCreateService} disabled={savingService || !newService.name.trim()}
                    className="px-4 py-2 rounded-lg bg-gantly-blue text-white text-xs font-semibold hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none">
                    {savingService ? 'Creando...' : 'Crear servicio'}
                  </button>
                  <button onClick={() => { setShowServiceForm(false); setNewService({ name: '', defaultPrice: '', durationMinutes: '' }); }}
                    className="px-4 py-2 rounded-lg text-slate-500 text-xs hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-none">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1">
              {loadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
                </div>
              ) : services.length === 0 && !showServiceForm ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-slate-300 text-2xl">inventory_2</span>
                  </div>
                  <p className="text-sm text-slate-500">Sin servicios configurados</p>
                  <p className="text-xs text-slate-400 mt-1">Anade tu primer servicio para empezar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {services.map(svc => (
                    <div key={svc.id} className="flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-slate-50 group transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-amber-500 text-sm">spa</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-900">{svc.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {svc.defaultPrice != null && (
                              <span className="text-xs font-semibold text-emerald-600">{svc.defaultPrice}€</span>
                            )}
                            {svc.durationMinutes != null && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[11px]">timer</span>
                                {svc.durationMinutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteService(svc.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-1.5 rounded-lg cursor-pointer bg-transparent border-none hover:bg-red-50">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 4 — Rooms */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
          <div className="h-1 bg-gradient-to-r from-violet-400 to-purple-400" />
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="size-9 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-gantly-blue text-lg">meeting_room</span>
              </div>
              <div>
                <h3 className="text-sm font-heading font-bold text-slate-900">Despachos</h3>
                <p className="text-xs text-slate-500">Un despacho por psicologo para citas presenciales</p>
              </div>
            </div>

            <div className="flex-1">
              {loadingRooms ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : psychologists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-slate-300 text-2xl">group_off</span>
                  </div>
                  <p className="text-sm text-slate-500">No hay psicologos en la clinica</p>
                  <p className="text-xs text-slate-400 mt-1">Invita psicologos desde la pestana Equipo</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {psychologists.map((psych, idx) => {
                    const room = rooms.find(r => r.assignedPsychologistId === psych.id);
                    const isAdding = addingForPsychId === psych.id;

                    return (
                      <li key={psych.id} className="rounded-xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-all duration-200">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div
                            className="size-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                            style={{ background: room ? room.color : '#94a3b8' }}
                          >
                            {psych.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-slate-900 block truncate">{psych.name}</span>
                            {room && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: room.color }} />
                                {room.name}
                              </span>
                            )}
                          </div>

                          {room ? (
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all p-1.5 rounded-lg cursor-pointer bg-transparent border-none"
                              title="Eliminar despacho"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          ) : !isAdding ? (
                            <button
                              onClick={() => startAdding(psych.id, `Consulta ${idx + 1}`)}
                              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-gantly-blue border border-dashed border-slate-200 hover:border-gantly-blue/40 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer bg-transparent"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                              Asignar
                            </button>
                          ) : null}
                        </div>

                        {isAdding && (
                          <div className="px-4 py-3 border-t border-slate-100 space-y-3 bg-slate-50/50">
                            <input
                              type="text"
                              placeholder="Nombre del despacho"
                              value={newRoomName}
                              onChange={e => setNewRoomName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveRoom(psych.id); if (e.key === 'Escape') cancelAdding(); }}
                              autoFocus
                              className={inputCls}
                            />
                            <div className="flex items-center gap-4">
                              <div className="flex gap-1.5">
                                {ROOM_COLORS.map(c => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setNewRoomColor(c)}
                                    className="w-5 h-5 rounded-full flex-shrink-0 cursor-pointer border-2 p-0 transition-all duration-150"
                                    style={{ background: c, borderColor: newRoomColor === c ? '#0f172a' : 'transparent', transform: newRoomColor === c ? 'scale(1.15)' : 'scale(1)' }}
                                  />
                                ))}
                              </div>
                              <div className="flex gap-2 flex-1 justify-end">
                                <button
                                  onClick={() => handleSaveRoom(psych.id)}
                                  disabled={savingRoom || !newRoomName.trim()}
                                  className="px-3 py-1.5 rounded-lg bg-gantly-blue text-white text-xs font-semibold hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 cursor-pointer border-none"
                                >
                                  {savingRoom ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                  onClick={cancelAdding}
                                  className="px-3 py-1.5 rounded-lg text-slate-500 text-xs hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-none"
                                >
                                  Cancelar
                                </button>
                              </div>
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
    { id: 'inicio',         icon: 'home',           label: 'Inicio' },
    { id: 'estadisticas',   icon: 'bar_chart',      label: 'Estadisticas' },
    { id: 'agenda',         icon: 'calendar_month',  label: 'Agenda' },
    { id: 'equipo',         icon: 'group',           label: 'Equipo' },
    { id: 'pacientes',      icon: 'people',          label: 'Pacientes' },
    { id: 'facturacion',    icon: 'receipt_long',    label: 'Facturacion' },
    { id: 'configuracion',  icon: 'settings',        label: 'Configuracion' },
  ];

  const currentTabLabel = navItems.find(t => t.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gantly-navy to-[#0d1f3c] flex-shrink-0 fixed inset-y-0 left-0 z-50 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <img src={LogoSvg} alt="Gantly" className="h-7 brightness-0 invert" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium cursor-pointer transition-all duration-200 border-none ${
                activeTab === item.id
                  ? 'bg-gantly-blue/20 text-white border-l-2 border-l-gantly-cyan font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info + logout at bottom */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {clinicInfo?.name ? clinicInfo.name.charAt(0).toUpperCase() : 'C'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{clinicInfo?.name || 'Clinica'}</div>
              <div className="text-xs text-slate-400 truncate">{clinicInfo?.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.reload();
            }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-200 border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-8 py-4 flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-gantly-text">
            {currentTabLabel}
          </h2>
        </header>

        <div className="px-8 py-6">
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
                <ConfigTab clinicInfo={clinicInfo} psychologists={psychologists} onClinicInfoUpdate={setClinicInfo} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
