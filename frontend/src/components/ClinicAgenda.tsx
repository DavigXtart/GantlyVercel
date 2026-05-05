import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

// --- Types ---

interface Appointment {
  id: number;
  psychologistId: number;
  psychologistName: string;
  psychologistAvatarUrl?: string;
  patientId?: number;
  patientName?: string;
  startTime: string;
  endTime: string;
  status: string;
  service?: string;
  price?: number;
  paymentStatus?: string;
  notes?: string;
  clinicNotes?: string;
  modality?: string;
  paymentMethod?: string;
  roomId?: number;
  roomName?: string;
}

interface Room {
  id: number;
  name: string;
  color: string;
  assignedPsychologistId?: number;
  active: boolean;
}

interface PatientSummary {
  id: number;
  name: string;
  email: string;
  phone?: string;
  patientNumber?: number;
  status: string;
  assignedPsychologistName: string;
  totalAppointments: number;
}

interface Props {
  psychologists: Array<{ id: number; name: string; avatarUrl?: string }>;
  onAppointmentChange: () => void;
}

// --- Constants ---

const HOUR_START = 8;
const HOUR_END = 21;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;
const PX_PER_MINUTE = 1;
const GRID_HEIGHT = TOTAL_MINUTES * PX_PER_MINUTE;
const COL_WIDTH = 200;
const TIME_COL_WIDTH = 56;

const SERVICES = ['Psicoterapia', 'Evaluación', 'Primera consulta', 'Seguimiento', 'Otro'];
const DURATIONS = [30, 45, 60, 90];
const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'No pagada' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'PARTIAL', label: 'Fraccionada' },
];

function generateTimeOptions() {
  const opts: string[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`);
    opts.push(`${String(h).padStart(2, '0')}:30`);
  }
  return opts;
}
const TIME_OPTIONS = generateTimeOptions();

// --- Helpers ---

function formatDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISOLocal(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
}

function minutesFromStartOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes() - HOUR_START * 60;
}

function durationMinutes(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60000;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function appointmentColor(status: string): { bg: string; border: string; text: string } {
  switch (status) {
    case 'CONFIRMED':
    case 'BOOKED':
      return { bg: '#d1fae5', border: '#059669', text: '#065f46' };
    case 'CANCELLED':
      return { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' };
    default:
      return { bg: '#ebf6fc', border: '#2E93CC', text: '#1c5b7c' };
  }
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const dow = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dow);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// --- Mini Calendar ---

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

function MiniCalendar({ selectedDate, onSelectDate }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const today = new Date();

  function prevMonth() {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = viewMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-slate-500 text-sm rounded hover:bg-slate-100"
        >
          &lsaquo;
        </button>
        <span className="text-xs font-semibold text-slate-700 capitalize">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-slate-500 text-sm rounded hover:bg-slate-100"
        >
          &rsaquo;
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-px mb-0.5">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="text-center text-[10px] text-slate-400 font-semibold py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const thisDate = new Date(year, month, day);
          const isSelected = isSameDay(thisDate, selectedDate);
          const isToday = isSameDay(thisDate, today);
          return (
            <button
              key={day}
              onClick={() => {
                onSelectDate(thisDate);
                setViewMonth(new Date(year, month, 1));
              }}
              className={`w-[26px] h-[26px] mx-auto rounded-full flex items-center justify-center text-[11px] cursor-pointer border transition-colors ${
                isSelected
                  ? 'bg-gantly-blue border-gantly-blue text-white font-bold'
                  : isToday
                    ? 'bg-transparent border-gantly-blue text-gantly-blue font-bold'
                    : 'bg-transparent border-transparent text-slate-700 font-normal hover:bg-slate-100'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Avatar ---

function Avatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl?: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  if (avatarUrl && !imgErr) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgErr(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gantly-blue text-white flex items-center justify-center font-bold flex-shrink-0"
    >
      {getInitials(name)}
    </div>
  );
}

// --- Main Component ---

export default function ClinicAgenda({ psychologists, onAppointmentChange }: Props) {
  // -- Date / view state --
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // -- Data state --
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -- Sidebar state --
  const [visiblePsychIds, setVisiblePsychIds] = useState<Set<number>>(
    () => new Set(psychologists.map((p) => p.id))
  );
  const [trabajanHoy, setTrabajanHoy] = useState(false);

  // -- Panel state --
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'cita' | 'bloqueo'>('cita');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // -- Form state --
  const [formPatientId, setFormPatientId] = useState<number | null>(null);
  const [formPatientName, setFormPatientName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState(60);
  const [formPsychId, setFormPsychId] = useState<number | null>(null);
  const [formService, setFormService] = useState('Psicoterapia');
  const [formPrice, setFormPrice] = useState('');
  const [formPaymentStatus, setFormPaymentStatus] = useState('PENDING');
  const [formNotes, setFormNotes] = useState('');
  const [formModality, setFormModality] = useState<'ONLINE' | 'PRESENCIAL'>('ONLINE');
  const [formRoomId, setFormRoomId] = useState<number | null>(null);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'STRIPE' | 'CASH'>('STRIPE');

  // -- Patient search --
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<PatientSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // -- Search bar --
  const [patientFilter, setPatientFilter] = useState('');

  // -- Refs --
  const gridRef = useRef<HTMLDivElement>(null);

  // --- Load appointments ---

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let from: Date, to: Date;
      if (viewMode === 'day') {
        from = new Date(currentDate);
        from.setHours(0, 0, 0, 0);
        to = new Date(currentDate);
        to.setHours(23, 59, 59, 999);
      } else {
        from = startOfWeek(currentDate);
        to = addDays(from, 6);
        to.setHours(23, 59, 59, 999);
      }
      const res = await axios.get<Appointment[]>(`${BASE}/clinic/agenda`, {
        params: { from: from.toISOString(), to: to.toISOString() },
        headers: authHeaders(),
      });
      setAppointments(res.data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al cargar la agenda';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Load rooms on mount
  useEffect(() => {
    axios.get<Room[]>(`${BASE}/clinic/rooms`, { headers: authHeaders() })
      .then(res => setRooms(res.data || []))
      .catch(() => setRooms([]));
  }, []);

  // Auto-fill room when psychologist changes (if assigned)
  useEffect(() => {
    if (formModality === 'PRESENCIAL' && formPsychId) {
      const assigned = rooms.find(r => r.assignedPsychologistId === formPsychId && r.active);
      if (assigned) setFormRoomId(assigned.id);
    }
  }, [formPsychId, formModality, rooms]);

  // --- Patient search debounce ---

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!patientSearch.trim()) {
      setPatientResults([]);
      setShowPatientDropdown(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get<PatientSummary[]>(`${BASE}/clinic/patients`, {
          params: { search: patientSearch },
          headers: authHeaders(),
        });
        setPatientResults(res.data || []);
        setShowPatientDropdown(true);
      } catch {
        setPatientResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [patientSearch]);

  // Close patient dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        patientInputRef.current &&
        !patientInputRef.current.contains(e.target as Node)
      ) {
        setShowPatientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // --- Panel helpers ---

  function openCreatePanel(psychId: number, date: Date, timeStr: string) {
    setEditingAppointment(null);
    setFormPatientId(null);
    setFormPatientName('');
    setPatientSearch('');
    setPatientResults([]);
    setFormDate(formatDateLocal(date));
    setFormTime(timeStr);
    setFormDuration(60);
    setFormPsychId(psychId);
    setFormService('Psicoterapia');
    setFormPrice('');
    setFormPaymentStatus('PENDING');
    setFormNotes('');
    setFormModality('ONLINE');
    setFormRoomId(null);
    setFormPaymentMethod('STRIPE');
    setActiveTab('cita');
    setShowCancelConfirm(false);
    setPanelOpen(true);
  }

  function openEditPanel(appt: Appointment) {
    setEditingAppointment(appt);
    setFormPatientId(appt.patientId ?? null);
    setFormPatientName(appt.patientName ?? '');
    setPatientSearch(appt.patientName ?? '');
    setPatientResults([]);
    const start = new Date(appt.startTime);
    setFormDate(formatDateLocal(start));
    setFormTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
    const dur = durationMinutes(appt.startTime, appt.endTime);
    setFormDuration(dur > 0 ? dur : 60);
    setFormPsychId(appt.psychologistId);
    setFormService(appt.service ?? 'Psicoterapia');
    setFormPrice(appt.price != null ? String(appt.price) : '');
    setFormPaymentStatus(appt.paymentStatus ?? 'PENDING');
    setFormNotes(appt.notes ?? '');
    setFormModality((appt.modality as 'ONLINE' | 'PRESENCIAL') ?? 'ONLINE');
    setFormRoomId(appt.roomId ?? null);
    setFormPaymentMethod((appt.paymentMethod as 'STRIPE' | 'CASH') ?? 'STRIPE');
    setActiveTab('cita');
    setShowCancelConfirm(false);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingAppointment(null);
    setShowCancelConfirm(false);
  }

  // --- CRUD ---

  async function handleSave() {
    if (!formDate || !formTime || !formPsychId) return;
    setSaving(true);
    try {
      const startISO = toISOLocal(formDate, formTime);
      const endDate = new Date(parseLocalDate(formDate));
      const [hh, mm] = formTime.split(':').map(Number);
      endDate.setHours(hh, mm + formDuration, 0, 0);
      const endISO = endDate.toISOString();

      const body: Record<string, any> = {
        psychologistId: formPsychId,
        startTime: startISO,
        endTime: endISO,
        service: formService,
        price: formPrice !== '' ? Number(formPrice) : null,
        paymentStatus: formPaymentStatus,
        notes: formNotes || null,
        modality: formModality,
        paymentMethod: formModality === 'PRESENCIAL' ? formPaymentMethod : 'STRIPE',
        roomId: formModality === 'PRESENCIAL' ? formRoomId : null,
      };
      if (formPatientId) body.patientId = formPatientId;

      if (editingAppointment) {
        await axios.put(`${BASE}/clinic/appointments/${editingAppointment.id}`, body, {
          headers: authHeaders(),
        });
      } else {
        await axios.post(`${BASE}/clinic/appointments`, body, {
          headers: authHeaders(),
        });
      }
      closePanel();
      await loadAppointments();
      onAppointmentChange();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar la cita';
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!editingAppointment) return;
    setCancelling(true);
    try {
      await axios.delete(`${BASE}/clinic/appointments/${editingAppointment.id}`, {
        headers: authHeaders(),
      });
      closePanel();
      await loadAppointments();
      onAppointmentChange();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al cancelar la cita';
      alert(msg);
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  }

  // --- Derived data ---

  const visiblePsychs = psychologists.filter((p) => visiblePsychIds.has(p.id));

  const filteredAppointments = appointments.filter((a) => {
    if (!visiblePsychIds.has(a.psychologistId)) return false;
    if (patientFilter.trim()) {
      const q = patientFilter.toLowerCase();
      if (!(a.patientName || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const weekDays: Date[] = [];
  if (viewMode === 'week') {
    const ws = startOfWeek(currentDate);
    for (let i = 0; i < 7; i++) weekDays.push(addDays(ws, i));
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
  const showNowLine = nowMinutes >= 0 && nowMinutes <= TOTAL_MINUTES;

  const psychsWorkingToday = new Set(
    appointments
      .filter((a) => {
        const d = new Date(a.startTime);
        return isSameDay(d, new Date());
      })
      .map((a) => a.psychologistId)
  );

  const displayedPsychs = trabajanHoy
    ? visiblePsychs.filter((p) => psychsWorkingToday.has(p.id))
    : visiblePsychs;

  // --- Grid slot click handler ---

  function handleSlotClick(psychId: number, day: Date, minutes: number) {
    const snapped = Math.floor(minutes / 30) * 30;
    const hh = Math.floor((snapped + HOUR_START * 60) / 60);
    const mm = (snapped + HOUR_START * 60) % 60;
    const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    openCreatePanel(psychId, day, timeStr);
  }

  // --- Render ---

  const hours: number[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h);

  function getAppsForColumn(psychId: number, day: Date) {
    return filteredAppointments.filter((a) => {
      if (a.psychologistId !== psychId) return false;
      const d = new Date(a.startTime);
      return isSameDay(d, day);
    });
  }

  // --- Grid column render ---

  function renderColumn(psychId: number, day: Date, colAppts: Appointment[]) {
    return (
      <div
        key={`${psychId}-${formatDateLocal(day)}`}
        style={{
          width: COL_WIDTH,
          minWidth: COL_WIDTH,
          position: 'relative',
          height: GRID_HEIGHT,
          flexShrink: 0,
          cursor: 'crosshair',
        }}
        className="border-r border-slate-200"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-appt]')) return;
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const offsetY = e.clientY - rect.top + (e.currentTarget as HTMLElement).scrollTop;
          const minutes = Math.max(0, Math.min(TOTAL_MINUTES - 30, offsetY));
          handleSlotClick(psychId, day, minutes);
        }}
      >
        {/* Hour grid lines */}
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 h-px bg-slate-100 pointer-events-none"
            style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE }}
          />
        ))}
        {/* Half-hour lines */}
        {hours.slice(0, -1).map((h) => (
          <div
            key={`${h}-half`}
            className="absolute left-0 right-0 h-px bg-slate-50 pointer-events-none"
            style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE + 30 }}
          />
        ))}

        {/* Current time line */}
        {showNowLine && isSameDay(day, now) && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-[5] pointer-events-none"
            style={{ top: nowMinutes * PX_PER_MINUTE }}
          >
            <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
        )}

        {/* Appointments */}
        {colAppts.map((appt) => {
          const topMin = minutesFromStartOfDay(appt.startTime);
          const durMin = Math.max(25, durationMinutes(appt.startTime, appt.endTime));
          const colors = appointmentColor(appt.status);
          const topPx = Math.max(0, topMin * PX_PER_MINUTE);
          const heightPx = Math.max(25, durMin * PX_PER_MINUTE);

          return (
            <div
              key={appt.id}
              data-appt="1"
              onClick={(e) => {
                e.stopPropagation();
                openEditPanel(appt);
              }}
              className="absolute cursor-pointer z-[2] rounded-md overflow-hidden transition-shadow hover:shadow-elevated"
              style={{
                top: topPx,
                left: 4,
                right: 4,
                height: heightPx,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                padding: '3px 5px',
                boxSizing: 'border-box',
              }}
            >
              <div className="flex items-center gap-0.5">
                <div className="text-[11px] font-bold flex-1 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: colors.text }}>
                  {appt.patientName || 'Sin paciente'}
                </div>
                {appt.modality === 'PRESENCIAL' && (
                  <div className="text-[8px] font-bold opacity-70 bg-black/[.08] rounded px-1 py-px flex-shrink-0 tracking-wide" style={{ color: colors.text }}>
                    PRES
                  </div>
                )}
              </div>
              {heightPx >= 40 && (
                <div className="text-[10px] opacity-80 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: colors.text }}>
                  {appt.service || ''}
                </div>
              )}
              {heightPx >= 52 && (
                <div className="text-[10px] opacity-70" style={{ color: colors.text }}>
                  {new Date(appt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {new Date(appt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {heightPx >= 64 && appt.modality === 'PRESENCIAL' && appt.roomName && (
                <div className="text-[9px] opacity-70 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: colors.text }}>
                  {appt.roomName}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // --- Layout ---

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* -- Left sidebar -- */}
      <div className="w-[260px] min-w-[260px] bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
        {/* Mini calendar */}
        <div className="border-b border-slate-200">
          <MiniCalendar selectedDate={currentDate} onSelectDate={(d) => setCurrentDate(d)} />
        </div>

        {/* Sidebar scroll area */}
        <div className="overflow-y-auto flex-1 p-3">
          {/* Trabajan hoy toggle */}
          <div
            className="flex items-center gap-2 mb-4 px-2.5 py-2 bg-slate-50 rounded-lg cursor-pointer"
            onClick={() => setTrabajanHoy(!trabajanHoy)}
          >
            <div
              className="w-[34px] h-[18px] rounded-full relative transition-colors flex-shrink-0"
              style={{ background: trabajanHoy ? '#2E93CC' : '#d1d5db' }}
            >
              <div
                className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-[left]"
                style={{ left: trabajanHoy ? 18 : 2 }}
              />
            </div>
            <span className="text-xs text-slate-700 font-medium">Trabajan hoy</span>
          </div>

          {/* Agendas */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Agendas
            </div>
            {psychologists.map((p) => {
              const checked = visiblePsychIds.has(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setVisiblePsychIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(p.id)) next.delete(p.id);
                      else next.add(p.id);
                      return next;
                    });
                  }}
                  className="flex items-center gap-2 px-1 py-1.5 rounded-md cursor-pointer mb-0.5 hover:bg-slate-50"
                >
                  {/* Custom checkbox */}
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all border-2 ${
                      checked ? 'border-gantly-blue bg-gantly-blue' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && (
                      <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                        <path d="M1 3.5L3.5 6L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <Avatar name={p.name} avatarUrl={p.avatarUrl} size={24} />
                  <span className="text-xs text-slate-700 font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* -- Center -- */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0">
          {/* Hoy */}
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-gantly-blue transition-colors"
          >
            Hoy
          </button>

          {/* Prev/Next arrows */}
          <div className="flex gap-0.5">
            <button
              onClick={() => {
                if (viewMode === 'day') setCurrentDate((d) => addDays(d, -1));
                else setCurrentDate((d) => addDays(d, -7));
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer text-sm text-slate-700"
            >
              &lsaquo;
            </button>
            <button
              onClick={() => {
                if (viewMode === 'day') setCurrentDate((d) => addDays(d, 1));
                else setCurrentDate((d) => addDays(d, 7));
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer text-sm text-slate-700"
            >
              &rsaquo;
            </button>
          </div>

          {/* Date display */}
          <span className="text-[15px] font-semibold text-slate-800 flex-1 capitalize">
            {viewMode === 'day'
              ? formatDisplayDate(currentDate)
              : (() => {
                  const ws = startOfWeek(currentDate);
                  const we = addDays(ws, 6);
                  return `${ws.getDate()} ${ws.toLocaleDateString('es-ES', { month: 'short' })} – ${we.getDate()} ${we.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
                })()}
          </span>

          {/* Dia / Semana toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['day', 'week'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 border-none cursor-pointer text-[13px] font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-gantly-blue text-white'
                    : 'bg-white text-slate-700'
                }`}
              >
                {mode === 'day' ? 'Día' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="py-1.5 pl-8 pr-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-700 outline-none w-[180px] focus:border-gantly-blue-300"
            />
            <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Reload */}
          <button
            onClick={loadAppointments}
            disabled={loading}
            className={`px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 text-base ${
              loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'
            }`}
            title="Recargar"
          >
            &#8635;
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-700 text-[13px] border-b border-red-200">
            {error}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 pointer-events-none">
            <div className="w-8 h-8 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
          </div>
        )}

        {/* -- Grid -- */}
        <div className="flex-1 overflow-auto relative" ref={gridRef}>
          {viewMode === 'day' ? (
            /* -- Day view -- */
            <div style={{ display: 'flex', minWidth: TIME_COL_WIDTH + displayedPsychs.length * COL_WIDTH, minHeight: GRID_HEIGHT + 48 }}>
              {/* Time axis */}
              <div className="sticky left-0 z-[4] bg-white border-r border-slate-200" style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH }}>
                {/* Header spacer */}
                <div className="h-12 border-b border-slate-200" />
                {/* Hours */}
                <div className="relative" style={{ height: GRID_HEIGHT }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute right-2 text-[11px] text-slate-400 font-medium select-none"
                      style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE - 8 }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Columns wrapper */}
              <div className="flex flex-col flex-1">
                {/* Column headers */}
                <div className="flex sticky top-0 z-[3] bg-white border-b border-slate-200 h-12">
                  {displayedPsychs.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 border-r border-slate-200 flex-shrink-0"
                      style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                    >
                      <Avatar name={p.name} avatarUrl={p.avatarUrl} size={28} />
                      <span className="text-xs font-semibold text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap">
                        {p.name}
                      </span>
                    </div>
                  ))}
                  {displayedPsychs.length === 0 && (
                    <div className="px-4 text-[13px] text-slate-400 flex items-center">
                      No hay psicólogos visibles
                    </div>
                  )}
                </div>

                {/* Columns */}
                <div className="flex flex-1">
                  {displayedPsychs.map((p) => renderColumn(p.id, currentDate, getAppsForColumn(p.id, currentDate)))}
                  {displayedPsychs.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                      Selecciona al menos una agenda del panel lateral
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* -- Week view -- */
            <div style={{ display: 'flex', minWidth: TIME_COL_WIDTH + weekDays.length * Math.max(COL_WIDTH, 120), minHeight: GRID_HEIGHT + 80 }}>
              {/* Time axis */}
              <div className="sticky left-0 z-[4] bg-white border-r border-slate-200" style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH }}>
                <div className="h-20 border-b border-slate-200" />
                <div className="relative" style={{ height: GRID_HEIGHT }}>
                  {hours.map((h) => (
                    <div key={h} className="absolute right-2 text-[11px] text-slate-400 font-medium select-none" style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE - 8 }}>
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Day columns */}
              <div className="flex flex-1">
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const dayLabel = day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
                  const dayAppts = filteredAppointments.filter((a) => isSameDay(new Date(a.startTime), day));
                  const dayWidth = Math.max(120, 160);
                  return (
                    <div key={formatDateLocal(day)} className="flex flex-col border-r border-slate-200 flex-shrink-0" style={{ width: dayWidth, minWidth: dayWidth }}>
                      {/* Day header */}
                      <div
                        className="h-20 flex flex-col items-center justify-center border-b border-slate-200 sticky top-0 bg-white z-[3] cursor-pointer"
                        onClick={() => {
                          setCurrentDate(day);
                          setViewMode('day');
                        }}
                      >
                        <span className="text-[11px] text-slate-500 capitalize font-medium">
                          {dayLabel.split(' ')[0]}
                        </span>
                        <div
                          className={`w-[34px] h-[34px] rounded-full flex items-center justify-center ${
                            isToday ? 'bg-gantly-blue' : 'bg-transparent'
                          }`}
                        >
                          <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-800'}`}>
                            {day.getDate()}
                          </span>
                        </div>
                      </div>
                      {/* Day body */}
                      <div
                        className="relative cursor-crosshair"
                        style={{ height: GRID_HEIGHT }}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('[data-appt]')) return;
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const offsetY = e.clientY - rect.top;
                          const minutes = Math.max(0, Math.min(TOTAL_MINUTES - 30, offsetY));
                          const psychId = displayedPsychs[0]?.id;
                          if (psychId) handleSlotClick(psychId, day, minutes);
                        }}
                      >
                        {hours.map((h) => (
                          <div key={h} className="absolute left-0 right-0 h-px bg-slate-100 pointer-events-none" style={{ top: (h - HOUR_START) * 60 }} />
                        ))}
                        {showNowLine && isToday && (
                          <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-[5] pointer-events-none" style={{ top: nowMinutes }}>
                            <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                          </div>
                        )}
                        {dayAppts.map((appt) => {
                          const topMin = minutesFromStartOfDay(appt.startTime);
                          const durMin = Math.max(25, durationMinutes(appt.startTime, appt.endTime));
                          const colors = appointmentColor(appt.status);
                          return (
                            <div
                              key={appt.id}
                              data-appt="1"
                              onClick={(e) => { e.stopPropagation(); openEditPanel(appt); }}
                              className="absolute rounded-[5px] overflow-hidden cursor-pointer z-[2]"
                              style={{
                                top: Math.max(0, topMin),
                                left: 3,
                                right: 3,
                                height: Math.max(25, durMin),
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                padding: '2px 4px',
                                boxSizing: 'border-box',
                              }}
                            >
                              <div className="text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: colors.text }}>
                                {appt.patientName || 'Sin paciente'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* -- Right slide-in panel -- */}
      <div
        className="bg-white border-l border-slate-200 flex flex-col overflow-hidden transition-[width] duration-[250ms] ease-in-out flex-shrink-0 relative"
        style={{ width: panelOpen ? 380 : 0, minWidth: 0 }}
      >
        {panelOpen && (
          <div className="w-[380px] flex flex-col h-full overflow-y-auto">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 flex-shrink-0">
              <span className="text-[15px] font-bold text-slate-800">
                {editingAppointment ? 'Editar cita' : 'Nueva cita'}
              </span>
              <button
                onClick={closePanel}
                className="bg-transparent border-none cursor-pointer text-slate-500 hover:text-slate-800 text-xl leading-none p-1 rounded"
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 flex-shrink-0">
              {(['cita', 'bloqueo'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2.5 border-none bg-transparent cursor-pointer text-[13px] font-semibold capitalize transition-all ${
                    activeTab === t
                      ? 'text-gantly-blue border-b-2 border-gantly-blue'
                      : 'text-slate-500 border-b-2 border-transparent'
                  }`}
                >
                  {t === 'cita' ? 'Cita' : 'Bloqueo'}
                </button>
              ))}
            </div>

            {activeTab === 'bloqueo' ? (
              <div className="p-6 text-slate-400 text-[13px] text-center pt-12">
                La funcionalidad de bloqueo de horario estará disponible próximamente.
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-4">

                {/* -- Paciente -- */}
                <fieldset className="border border-slate-200 rounded-xl p-3">
                  <legend className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                    Paciente
                  </legend>

                  <div className="relative">
                    <div className="relative">
                      <input
                        ref={patientInputRef}
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={patientSearch}
                        onChange={(e) => {
                          setPatientSearch(e.target.value);
                          if (!e.target.value) {
                            setFormPatientId(null);
                            setFormPatientName('');
                          }
                        }}
                        onFocus={() => { if (patientResults.length > 0) setShowPatientDropdown(true); }}
                        className="w-full py-2 pl-8 pr-2.5 rounded-lg border border-slate-200 text-[13px] text-slate-700 outline-none focus:border-gantly-blue-300"
                      />
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <circle cx="9" cy="9" r="6" stroke="#9ca3af" strokeWidth="2" />
                        <path d="M14 14l3 3" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {searchLoading && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Patient dropdown */}
                    {showPatientDropdown && patientResults.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-elevated z-[100] max-h-[220px] overflow-y-auto mt-1"
                      >
                        {patientResults.map((pt) => (
                          <div
                            key={pt.id}
                            onClick={() => {
                              setFormPatientId(pt.id);
                              setFormPatientName(pt.name);
                              setPatientSearch(pt.name);
                              setShowPatientDropdown(false);
                            }}
                            className="px-3 py-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                          >
                            <div className="text-[13px] font-semibold text-slate-800">{pt.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {pt.patientNumber != null ? `N.º ${pt.patientNumber} · ` : ''}
                              {pt.phone || pt.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showPatientDropdown && patientResults.length === 0 && !searchLoading && patientSearch.trim().length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg p-3 text-[13px] text-slate-400 mt-1 z-[100]">
                        No se encontraron pacientes
                      </div>
                    )}
                  </div>

                  {/* Selected patient */}
                  {formPatientId ? (
                    <div className="mt-2.5 px-2.5 py-2 bg-gantly-blue-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-semibold text-slate-800">{formPatientName}</div>
                        <div className="text-[11px] text-slate-500">Paciente seleccionado</div>
                      </div>
                      <button
                        onClick={() => { setFormPatientId(null); setFormPatientName(''); setPatientSearch(''); }}
                        className="bg-transparent border-none cursor-pointer text-slate-400 text-base p-0.5"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400 italic">Sin paciente asociado</div>
                  )}
                </fieldset>

                {/* -- Detalles -- */}
                <fieldset className="border border-slate-200 rounded-xl p-3">
                  <legend className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                    Detalles de la cita
                  </legend>

                  {/* Modalidad toggle */}
                  <div className="mb-3">
                    <label className="text-[11px] text-slate-500 font-semibold block mb-1.5">Modalidad</label>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                      {(['ONLINE', 'PRESENCIAL'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setFormModality(m);
                            if (m === 'ONLINE') { setFormRoomId(null); setFormPaymentMethod('STRIPE'); }
                          }}
                          className={`flex-1 py-2 border-none cursor-pointer text-xs font-semibold transition-colors ${
                            formModality === m
                              ? 'bg-gantly-blue text-white'
                              : 'bg-white text-slate-700'
                          }`}
                        >
                          {m === 'ONLINE' ? 'Online' : 'Presencial'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Date */}
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Fecha</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-2 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none focus:border-gantly-blue-300"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Hora</label>
                      <select
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full px-2 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none bg-white focus:border-gantly-blue-300"
                      >
                        <option value="">-- Hora --</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Duración</label>
                      <select
                        value={formDuration}
                        onChange={(e) => setFormDuration(Number(e.target.value))}
                        className="w-full px-2 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none bg-white focus:border-gantly-blue-300"
                      >
                        {DURATIONS.map((d) => (
                          <option key={d} value={d}>{d} min</option>
                        ))}
                      </select>
                    </div>

                    {/* Psychologist */}
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Psicólogo</label>
                      <select
                        value={formPsychId ?? ''}
                        onChange={(e) => setFormPsychId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none bg-white focus:border-gantly-blue-300"
                      >
                        <option value="">-- Seleccionar --</option>
                        {psychologists.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Despacho — solo para PRESENCIAL */}
                  {formModality === 'PRESENCIAL' && (
                    <div className="mt-2.5">
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Despacho</label>
                      <select
                        value={formRoomId ?? ''}
                        onChange={(e) => setFormRoomId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none bg-white focus:border-gantly-blue-300"
                      >
                        <option value="">-- Sin despacho --</option>
                        {rooms.filter(r => r.active).map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      {rooms.length === 0 && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          No hay despachos configurados. Ve a Configuración para añadirlos.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Service */}
                  <div className="mt-2.5">
                    <label className="text-[11px] text-slate-500 font-semibold block mb-1">Servicio</label>
                    <select
                      value={formService}
                      onChange={(e) => setFormService(e.target.value)}
                      className="w-full px-2 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none bg-white focus:border-gantly-blue-300"
                    >
                      {SERVICES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                {/* -- Precio -- */}
                <fieldset className="border border-slate-200 rounded-xl p-3">
                  <legend className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                    Precio
                  </legend>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative">
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Importe</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="w-full py-[7px] pl-5 pr-2 rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none focus:border-gantly-blue-300"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-semibold">&euro;</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Estado pago</label>
                      <select
                        value={formPaymentStatus}
                        onChange={(e) => setFormPaymentStatus(e.target.value)}
                        className="w-full px-2 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none bg-white focus:border-gantly-blue-300"
                      >
                        {PAYMENT_STATUSES.map((ps) => (
                          <option key={ps.value} value={ps.value}>{ps.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Método de pago — solo para PRESENCIAL */}
                  {formModality === 'PRESENCIAL' && (
                    <div className="mt-2.5">
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1.5">Método de cobro</label>
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        {([
                          { value: 'STRIPE', label: 'Pago online', desc: 'Link Stripe' },
                          { value: 'CASH', label: 'Efectivo', desc: 'En consulta' },
                        ] as const).map(pm => (
                          <button
                            key={pm.value}
                            type="button"
                            onClick={() => setFormPaymentMethod(pm.value)}
                            className={`flex-1 py-2 px-1.5 border-none cursor-pointer text-[11px] font-semibold text-center transition-colors leading-tight ${
                              formPaymentMethod === pm.value
                                ? 'bg-gantly-blue text-white'
                                : 'bg-white text-slate-700'
                            }`}
                          >
                            <div>{pm.label}</div>
                            <div className="text-[9px] opacity-80 font-normal">{pm.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </fieldset>

                {/* -- Notas -- */}
                <fieldset className="border border-slate-200 rounded-xl p-3">
                  <legend className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                    Notas internas
                  </legend>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Observaciones, instrucciones, notas clínicas..."
                    rows={3}
                    className="w-full px-2 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-700 outline-none resize-y leading-relaxed focus:border-gantly-blue-300"
                  />
                </fieldset>

                {/* -- Actions -- */}
                <div className="flex flex-col gap-2 pb-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !formDate || !formTime || !formPsychId}
                    className={`py-2.5 rounded-lg border-none text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      saving || !formDate || !formTime || !formPsychId
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : 'bg-gantly-blue text-white cursor-pointer hover:bg-gantly-blue-600'
                    }`}
                  >
                    {saving && (
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    )}
                    {editingAppointment ? 'Guardar cambios' : 'Crear cita'}
                  </button>

                  {editingAppointment && !showCancelConfirm && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="py-2.5 rounded-lg border border-red-300 bg-white text-red-500 text-[13px] font-semibold cursor-pointer hover:bg-red-50 transition-colors"
                    >
                      Cancelar cita
                    </button>
                  )}

                  {editingAppointment && showCancelConfirm && (
                    <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                      <div className="text-[13px] text-red-700 font-semibold mb-2">
                        ¿Confirmar cancelación?
                      </div>
                      <div className="text-xs text-slate-500 mb-2.5">
                        Esta acción no se puede deshacer. La cita quedará marcada como cancelada.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          className={`flex-1 py-2 rounded-[7px] border-none text-[13px] font-bold flex items-center justify-center gap-1.5 ${
                            cancelling ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 cursor-pointer'
                          } text-white`}
                        >
                          {cancelling && (
                            <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          )}
                          Sí, cancelar
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 py-2 rounded-[7px] border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold cursor-pointer"
                        >
                          Volver
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={closePanel}
                    className="py-2 rounded-lg border border-slate-200 bg-white text-slate-500 text-[13px] font-medium cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
