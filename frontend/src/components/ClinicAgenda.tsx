import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const HOUR_START = 8;
const HOUR_END = 21;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;
const PX_PER_MINUTE = 1;
const GRID_HEIGHT = TOTAL_MINUTES * PX_PER_MINUTE; // 780px
const SLOT_HEIGHT = 30; // 30min = 30px
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISOLocal(dateStr: string, timeStr: string): string {
  // Returns ISO string using local timezone
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
      return { bg: '#d1e8dc', border: '#5a9270', text: '#2d6049' };
    case 'CANCELLED':
      return { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' };
    default:
      return { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563' };
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
  const dow = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - dow);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// ─── Mini Calendar ───────────────────────────────────────────────────────────

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
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = viewMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button
          onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: '#6b7280', fontSize: 14, borderRadius: 4 }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#f3f4f6')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'none')}
        >
          ‹
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{monthLabel}</span>
        <button
          onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: '#6b7280', fontSize: 14, borderRadius: 4 }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#f3f4f6')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'none')}
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#9ca3af', fontWeight: 600, padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
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
              style={{
                background: isSelected ? '#5a9270' : 'none',
                border: isToday && !isSelected ? '1px solid #5a9270' : '1px solid transparent',
                borderRadius: '50%',
                width: 26,
                height: 26,
                cursor: 'pointer',
                fontSize: 11,
                color: isSelected ? '#fff' : isToday ? '#5a9270' : '#374151',
                fontWeight: isToday || isSelected ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '1px auto',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.target as HTMLElement).style.background = '#f0f5f3';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.target as HTMLElement).style.background = 'none';
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl?: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  if (avatarUrl && !imgErr) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#5a9270',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClinicAgenda({ psychologists, onAppointmentChange }: Props) {
  // ── Date / view state ──
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // ── Data state ──
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Sidebar state ──
  const [visiblePsychIds, setVisiblePsychIds] = useState<Set<number>>(
    () => new Set(psychologists.map((p) => p.id))
  );
  const [trabajanHoy, setTrabajanHoy] = useState(false);

  // ── Panel state ──
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'cita' | 'bloqueo'>('cita');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ── Form state ──
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

  // ── Patient search ──
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<PatientSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Search bar ──
  const [patientFilter, setPatientFilter] = useState('');

  // ── Refs ──
  const gridRef = useRef<HTMLDivElement>(null);

  // ─── Load appointments ────────────────────────────────────────────────────

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

  // ─── Patient search debounce ──────────────────────────────────────────────

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

  // ─── Panel helpers ────────────────────────────────────────────────────────

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

  // ─── CRUD ─────────────────────────────────────────────────────────────────

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

  // ─── Derived data ─────────────────────────────────────────────────────────

  const visiblePsychs = psychologists.filter((p) => visiblePsychIds.has(p.id));

  // Appointments visible in grid
  const filteredAppointments = appointments.filter((a) => {
    if (!visiblePsychIds.has(a.psychologistId)) return false;
    if (patientFilter.trim()) {
      const q = patientFilter.toLowerCase();
      if (!(a.patientName || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // For week view: determine which days to show (Mon–Sun of currentDate week)
  const weekDays: Date[] = [];
  if (viewMode === 'week') {
    const ws = startOfWeek(currentDate);
    for (let i = 0; i < 7; i++) weekDays.push(addDays(ws, i));
  }

  // Current time indicator position
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
  const showNowLine = nowMinutes >= 0 && nowMinutes <= TOTAL_MINUTES;

  // Trabajan hoy filter: show psychologists who have at least one appointment today
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

  // ─── Grid slot click handler ──────────────────────────────────────────────

  function handleSlotClick(psychId: number, day: Date, minutes: number) {
    const snapped = Math.floor(minutes / 30) * 30;
    const hh = Math.floor((snapped + HOUR_START * 60) / 60);
    const mm = (snapped + HOUR_START * 60) % 60;
    const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    openCreatePanel(psychId, day, timeStr);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const hours: number[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h);

  // For a given day+psych combo, get appointments
  function getAppsForColumn(psychId: number, day: Date) {
    return filteredAppointments.filter((a) => {
      if (a.psychologistId !== psychId) return false;
      const d = new Date(a.startTime);
      return isSameDay(d, day);
    });
  }

  // ─── Grid column render ───────────────────────────────────────────────────

  function renderColumn(psychId: number, day: Date, colAppts: Appointment[]) {
    return (
      <div
        key={`${psychId}-${formatDateLocal(day)}`}
        style={{
          width: COL_WIDTH,
          minWidth: COL_WIDTH,
          position: 'relative',
          height: GRID_HEIGHT,
          borderRight: '1px solid #e5e7eb',
          flexShrink: 0,
          cursor: 'crosshair',
        }}
        onClick={(e) => {
          // Only trigger if clicking on the column bg (not an appointment)
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
            style={{
              position: 'absolute',
              top: (h - HOUR_START) * 60 * PX_PER_MINUTE,
              left: 0,
              right: 0,
              height: 1,
              background: '#f3f4f6',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Half-hour lines */}
        {hours.slice(0, -1).map((h) => (
          <div
            key={`${h}-half`}
            style={{
              position: 'absolute',
              top: (h - HOUR_START) * 60 * PX_PER_MINUTE + 30,
              left: 0,
              right: 0,
              height: 1,
              background: '#f9fafb',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Current time line */}
        {showNowLine && isSameDay(day, now) && (
          <div
            style={{
              position: 'absolute',
              top: nowMinutes * PX_PER_MINUTE,
              left: 0,
              right: 0,
              height: 2,
              background: '#ef4444',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -4,
                top: -4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#ef4444',
              }}
            />
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
              style={{
                position: 'absolute',
                top: topPx,
                left: 4,
                right: 4,
                height: heightPx,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                padding: '3px 5px',
                overflow: 'hidden',
                cursor: 'pointer',
                zIndex: 2,
                boxSizing: 'border-box',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {appt.patientName || 'Sin paciente'}
                </div>
                {appt.modality === 'PRESENCIAL' && (
                  <div style={{ fontSize: 8, fontWeight: 700, color: colors.text, opacity: 0.7, background: 'rgba(0,0,0,0.08)', borderRadius: 3, padding: '1px 4px', flexShrink: 0, letterSpacing: '0.03em' }}>
                    PRES
                  </div>
                )}
              </div>
              {heightPx >= 40 && (
                <div style={{ fontSize: 10, color: colors.text, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {appt.service || ''}
                </div>
              )}
              {heightPx >= 52 && (
                <div style={{ fontSize: 10, color: colors.text, opacity: 0.7 }}>
                  {new Date(appt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {new Date(appt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {heightPx >= 64 && appt.modality === 'PRESENCIAL' && appt.roomName && (
                <div style={{ fontSize: 9, color: colors.text, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {appt.roomName}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Layout ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ── Left sidebar ── */}
      <div
        style={{
          width: 260,
          minWidth: 260,
          background: '#fff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Mini calendar */}
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <MiniCalendar selectedDate={currentDate} onSelectDate={(d) => setCurrentDate(d)} />
        </div>

        {/* Sidebar scroll area */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
          {/* Trabajan hoy toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              padding: '8px 10px',
              background: '#f0f5f3',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onClick={() => setTrabajanHoy(!trabajanHoy)}
          >
            <div
              style={{
                width: 34,
                height: 18,
                borderRadius: 9,
                background: trabajanHoy ? '#5a9270' : '#d1d5db',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: trabajanHoy ? 18 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Trabajan hoy</span>
          </div>

          {/* Agendas */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 4px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f9fafb')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {/* Custom checkbox */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `2px solid ${checked ? '#5a9270' : '#d1d5db'}`,
                      background: checked ? '#5a9270' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {checked && (
                      <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                        <path d="M1 3.5L3.5 6L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <Avatar name={p.name} avatarUrl={p.avatarUrl} size={24} />
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Center ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          {/* Hoy */}
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = '#f0f5f3';
              (e.target as HTMLElement).style.borderColor = '#5a9270';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = '#fff';
              (e.target as HTMLElement).style.borderColor = '#e5e7eb';
            }}
          >
            Hoy
          </button>

          {/* Prev/Next arrows */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={() => {
                if (viewMode === 'day') setCurrentDate((d) => addDays(d, -1));
                else setCurrentDate((d) => addDays(d, -7));
              }}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}
            >
              ‹
            </button>
            <button
              onClick={() => {
                if (viewMode === 'day') setCurrentDate((d) => addDays(d, 1));
                else setCurrentDate((d) => addDays(d, 7));
              }}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}
            >
              ›
            </button>
          </div>

          {/* Date display */}
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', flex: 1, textTransform: 'capitalize' }}>
            {viewMode === 'day'
              ? formatDisplayDate(currentDate)
              : (() => {
                  const ws = startOfWeek(currentDate);
                  const we = addDays(ws, 6);
                  return `${ws.getDate()} ${ws.toLocaleDateString('es-ES', { month: 'short' })} – ${we.getDate()} ${we.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
                })()}
          </span>

          {/* Día / Semana toggle */}
          <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {(['day', 'week'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  background: viewMode === mode ? '#5a9270' : '#fff',
                  color: viewMode === mode ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'day' ? 'Día' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              style={{
                padding: '6px 10px 6px 32px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                color: '#374151',
                outline: 'none',
                width: 180,
              }}
            />
            <svg
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle cx="9" cy="9" r="6" stroke="#9ca3af" strokeWidth="2" />
              <path d="M14 14l3 3" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Reload */}
          <button
            onClick={loadAppointments}
            disabled={loading}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              fontSize: 16,
              opacity: loading ? 0.5 : 1,
            }}
            title="Recargar"
          >
            ↻
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ padding: '8px 16px', background: '#fee2e2', color: '#b91c1c', fontSize: 13, borderBottom: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', pointerEvents: 'none' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTop: '3px solid #5a9270', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* ── Grid ── */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }} ref={gridRef}>
          {viewMode === 'day' ? (
            /* ── Day view ── */
            <div style={{ display: 'flex', minWidth: TIME_COL_WIDTH + displayedPsychs.length * COL_WIDTH, minHeight: GRID_HEIGHT + 48 }}>
              {/* Time axis */}
              <div style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH, position: 'sticky', left: 0, zIndex: 4, background: '#fff', borderRight: '1px solid #e5e7eb' }}>
                {/* Header spacer */}
                <div style={{ height: 48, borderBottom: '1px solid #e5e7eb' }} />
                {/* Hours */}
                <div style={{ position: 'relative', height: GRID_HEIGHT }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      style={{
                        position: 'absolute',
                        top: (h - HOUR_START) * 60 * PX_PER_MINUTE - 8,
                        right: 8,
                        fontSize: 11,
                        color: '#9ca3af',
                        fontWeight: 500,
                        userSelect: 'none',
                      }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Columns wrapper */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Column headers */}
                <div
                  style={{
                    display: 'flex',
                    position: 'sticky',
                    top: 0,
                    zIndex: 3,
                    background: '#fff',
                    borderBottom: '1px solid #e5e7eb',
                    height: 48,
                  }}
                >
                  {displayedPsychs.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        width: COL_WIDTH,
                        minWidth: COL_WIDTH,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0 12px',
                        borderRight: '1px solid #e5e7eb',
                        flexShrink: 0,
                      }}
                    >
                      <Avatar name={p.name} avatarUrl={p.avatarUrl} size={28} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </span>
                    </div>
                  ))}
                  {displayedPsychs.length === 0 && (
                    <div style={{ padding: '0 16px', fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                      No hay psicólogos visibles
                    </div>
                  )}
                </div>

                {/* Columns */}
                <div style={{ display: 'flex', flex: 1 }}>
                  {displayedPsychs.map((p) => renderColumn(p.id, currentDate, getAppsForColumn(p.id, currentDate)))}
                  {displayedPsychs.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
                      Selecciona al menos una agenda del panel lateral
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Week view ── */
            <div style={{ display: 'flex', minWidth: TIME_COL_WIDTH + weekDays.length * (displayedPsychs.length > 0 ? Math.max(COL_WIDTH, 120) : 120), minHeight: GRID_HEIGHT + 80 }}>
              {/* Time axis */}
              <div style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH, position: 'sticky', left: 0, zIndex: 4, background: '#fff', borderRight: '1px solid #e5e7eb' }}>
                <div style={{ height: 80, borderBottom: '1px solid #e5e7eb' }} />
                <div style={{ position: 'relative', height: GRID_HEIGHT }}>
                  {hours.map((h) => (
                    <div key={h} style={{ position: 'absolute', top: (h - HOUR_START) * 60 * PX_PER_MINUTE - 8, right: 8, fontSize: 11, color: '#9ca3af', fontWeight: 500, userSelect: 'none' }}>
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Day columns */}
              <div style={{ display: 'flex', flex: 1 }}>
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const dayLabel = day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
                  // In week view: one column per day (merge all psychologists)
                  const dayAppts = filteredAppointments.filter((a) => isSameDay(new Date(a.startTime), day));
                  const dayWidth = Math.max(120, 160);
                  return (
                    <div key={formatDateLocal(day)} style={{ width: dayWidth, minWidth: dayWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb' }}>
                      {/* Day header */}
                      <div
                        style={{
                          height: 80,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: '1px solid #e5e7eb',
                          position: 'sticky',
                          top: 0,
                          background: '#fff',
                          zIndex: 3,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setCurrentDate(day);
                          setViewMode('day');
                        }}
                      >
                        <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize', fontWeight: 500 }}>
                          {dayLabel.split(' ')[0]}
                        </span>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: isToday ? '#5a9270' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ fontSize: 18, fontWeight: 700, color: isToday ? '#fff' : '#1f2937' }}>
                            {day.getDate()}
                          </span>
                        </div>
                      </div>
                      {/* Day body */}
                      <div
                        style={{ position: 'relative', height: GRID_HEIGHT, cursor: 'crosshair' }}
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
                          <div key={h} style={{ position: 'absolute', top: (h - HOUR_START) * 60, left: 0, right: 0, height: 1, background: '#f3f4f6', pointerEvents: 'none' }} />
                        ))}
                        {showNowLine && isToday && (
                          <div style={{ position: 'absolute', top: nowMinutes, left: 0, right: 0, height: 2, background: '#ef4444', zIndex: 5, pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
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
                              style={{
                                position: 'absolute',
                                top: Math.max(0, topMin),
                                left: 3,
                                right: 3,
                                height: Math.max(25, durMin),
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 5,
                                padding: '2px 4px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                zIndex: 2,
                                boxSizing: 'border-box',
                              }}
                            >
                              <div style={{ fontSize: 10, fontWeight: 700, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

      {/* ── Right slide-in panel ── */}
      <div
        style={{
          width: panelOpen ? 380 : 0,
          minWidth: 0,
          background: '#fff',
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.25s ease',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {panelOpen && (
          <div style={{ width: 380, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            {/* Panel header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid #e5e7eb',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1f2937' }}>
                {editingAppointment ? 'Editar cita' : 'Nueva cita'}
              </span>
              <button
                onClick={closePanel}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20, lineHeight: 1, padding: 4, borderRadius: 4 }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#374151')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#6b7280')}
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              {(['cita', 'bloqueo'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: activeTab === tab ? '#5a9270' : '#6b7280',
                    borderBottom: activeTab === tab ? '2px solid #5a9270' : '2px solid transparent',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'cita' ? 'Cita' : 'Bloqueo'}
                </button>
              ))}
            </div>

            {activeTab === 'bloqueo' ? (
              <div style={{ padding: 24, color: '#9ca3af', fontSize: 13, textAlign: 'center', paddingTop: 48 }}>
                La funcionalidad de bloqueo de horario estará disponible próximamente.
              </div>
            ) : (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Paciente ── */}
                <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                  <legend style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>
                    Paciente
                  </legend>

                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
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
                        style={{
                          width: '100%',
                          padding: '8px 10px 8px 32px',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          fontSize: 13,
                          color: '#374151',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <circle cx="9" cy="9" r="6" stroke="#9ca3af" strokeWidth="2" />
                        <path d="M14 14l3 3" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {searchLoading && (
                        <div style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, border: '2px solid #e5e7eb', borderTop: '2px solid #5a9270', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      )}
                    </div>

                    {/* Patient dropdown */}
                    {showPatientDropdown && patientResults.length > 0 && (
                      <div
                        ref={dropdownRef}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                          zIndex: 100,
                          maxHeight: 220,
                          overflowY: 'auto',
                          marginTop: 4,
                        }}
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
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f0f5f3')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#fff')}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{pt.name}</div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                              {pt.patientNumber != null ? `Nº ${pt.patientNumber} · ` : ''}
                              {pt.phone || pt.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showPatientDropdown && patientResults.length === 0 && !searchLoading && patientSearch.trim().length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px', fontSize: 13, color: '#9ca3af', marginTop: 4, zIndex: 100 }}>
                        No se encontraron pacientes
                      </div>
                    )}
                  </div>

                  {/* Selected patient */}
                  {formPatientId ? (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: '#f0f5f3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{formPatientName}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Paciente seleccionado</div>
                      </div>
                      <button
                        onClick={() => { setFormPatientId(null); setFormPatientName(''); setPatientSearch(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 2 }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Sin paciente asociado</div>
                  )}
                </fieldset>

                {/* ── Detalles ── */}
                <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                  <legend style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>
                    Detalles de la cita
                  </legend>

                  {/* Modalidad toggle */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Modalidad</label>
                    <div style={{ display: 'flex', gap: 0, borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                      {(['ONLINE', 'PRESENCIAL'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setFormModality(m);
                            if (m === 'ONLINE') { setFormRoomId(null); setFormPaymentMethod('STRIPE'); }
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            border: 'none',
                            background: formModality === m ? '#5a9270' : '#fff',
                            color: formModality === m ? '#fff' : '#374151',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                        >
                          {m === 'ONLINE' ? 'Online' : 'Presencial'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {/* Date */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Fecha</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Hora</label>
                      <select
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                      >
                        <option value="">-- Hora --</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Duración</label>
                      <select
                        value={formDuration}
                        onChange={(e) => setFormDuration(Number(e.target.value))}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                      >
                        {DURATIONS.map((d) => (
                          <option key={d} value={d}>{d} min</option>
                        ))}
                      </select>
                    </div>

                    {/* Psychologist */}
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Psicólogo</label>
                      <select
                        value={formPsychId ?? ''}
                        onChange={(e) => setFormPsychId(e.target.value ? Number(e.target.value) : null)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
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
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Despacho</label>
                      <select
                        value={formRoomId ?? ''}
                        onChange={(e) => setFormRoomId(e.target.value ? Number(e.target.value) : null)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                      >
                        <option value="">-- Sin despacho --</option>
                        {rooms.filter(r => r.active).map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      {rooms.length === 0 && (
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                          No hay despachos configurados. Ve a Configuración para añadirlos.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Service */}
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Servicio</label>
                    <select
                      value={formService}
                      onChange={(e) => setFormService(e.target.value)}
                      style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                    >
                      {SERVICES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                {/* ── Precio ── */}
                <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                  <legend style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>
                    Precio
                  </legend>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Importe</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          style={{ width: '100%', padding: '7px 9px 7px 22px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>€</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Estado pago</label>
                      <select
                        value={formPaymentStatus}
                        onChange={(e) => setFormPaymentStatus(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                      >
                        {PAYMENT_STATUSES.map((ps) => (
                          <option key={ps.value} value={ps.value}>{ps.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Método de pago — solo para PRESENCIAL */}
                  {formModality === 'PRESENCIAL' && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Método de cobro</label>
                      <div style={{ display: 'flex', gap: 0, borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        {([
                          { value: 'STRIPE', label: 'Pago online', desc: 'Link Stripe' },
                          { value: 'CASH', label: 'Efectivo', desc: 'En consulta' },
                        ] as const).map(pm => (
                          <button
                            key={pm.value}
                            type="button"
                            onClick={() => setFormPaymentMethod(pm.value)}
                            style={{
                              flex: 1,
                              padding: '8px 6px',
                              border: 'none',
                              background: formPaymentMethod === pm.value ? '#5a9270' : '#fff',
                              color: formPaymentMethod === pm.value ? '#fff' : '#374151',
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 600,
                              textAlign: 'center',
                              transition: 'all 0.15s',
                              lineHeight: 1.3,
                            }}
                          >
                            <div>{pm.label}</div>
                            <div style={{ fontSize: 9, opacity: 0.8, fontWeight: 400 }}>{pm.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </fieldset>

                {/* ── Notas ── */}
                <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                  <legend style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>
                    Notas internas
                  </legend>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Observaciones, instrucciones, notas clínicas..."
                    rows={3}
                    style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                  />
                </fieldset>

                {/* ── Actions ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formDate || !formTime || !formPsychId}
                    style={{
                      padding: '11px',
                      borderRadius: 9,
                      border: 'none',
                      background: saving || !formDate || !formTime || !formPsychId ? '#9ca3af' : '#5a9270',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: saving || !formDate || !formTime || !formPsychId ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (!saving && formDate && formTime && formPsychId)
                        (e.currentTarget as HTMLElement).style.background = '#4a7d60';
                    }}
                    onMouseLeave={(e) => {
                      if (!saving && formDate && formTime && formPsychId)
                        (e.currentTarget as HTMLElement).style.background = '#5a9270';
                    }}
                  >
                    {saving && (
                      <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    )}
                    {editingAppointment ? 'Guardar cambios' : 'Crear cita'}
                  </button>

                  {editingAppointment && !showCancelConfirm && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      style={{
                        padding: '10px',
                        borderRadius: 9,
                        border: '1px solid #fca5a5',
                        background: '#fff',
                        color: '#ef4444',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#fff';
                      }}
                    >
                      Cancelar cita
                    </button>
                  )}

                  {editingAppointment && showCancelConfirm && (
                    <div style={{ padding: '12px', background: '#fff3f3', border: '1px solid #fca5a5', borderRadius: 9 }}>
                      <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600, marginBottom: 8 }}>
                        ¿Confirmar cancelación?
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                        Esta acción no se puede deshacer. La cita quedará marcada como cancelada.
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 7,
                            border: 'none',
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: cancelling ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          {cancelling && (
                            <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          )}
                          Sí, cancelar
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          style={{ flex: 1, padding: '8px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Volver
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={closePanel}
                    style={{
                      padding: '9px',
                      borderRadius: 9,
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      color: '#6b7280',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f9fafb')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#fff')}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spinner keyframes injected once */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
