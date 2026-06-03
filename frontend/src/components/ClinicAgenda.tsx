import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import {
  ChevronLeft, ChevronRight, Plus, X, Search, RefreshCw,
  Clock, User, CreditCard, FileText, Calendar, MapPin,
  Video, Building2, Trash2, Check, AlertTriangle, Repeat, CalendarOff, Shield,
} from 'lucide-react';

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
  taxExempt?: boolean;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
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

interface Absence {
  id: number;
  psychologistId: number;
  startTime: string;
  endTime: string;
  reason?: string;
}

interface ClinicServiceItem {
  id: number;
  name: string;
  defaultPrice: number | null;
  durationMinutes: number | null;
  active: boolean;
}

interface InsuranceCompanyBrief {
  id: number;
  name: string;
  active: boolean;
}

interface InsurancePolicyBrief {
  id: number;
  patientId: number;
  patientName?: string;
  insuranceCompanyId: number;
  insuranceCompanyName?: string;
  policyNumber: string;
  holderName?: string;
  expirationDate?: string;
  active: boolean;
}

interface Props {
  psychologists: Array<{ id: number; name: string; avatarUrl?: string }>;
  onAppointmentChange: () => void;
}

// --- Constants ---

const HOUR_START = 8;
const HOUR_END = 21;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;
const PX_PER_MINUTE = 1.1;
const GRID_HEIGHT = TOTAL_MINUTES * PX_PER_MINUTE;
const COL_WIDTH = 200;
const TIME_COL_WIDTH = 52;

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
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

const STATUS_CONFIG: Record<string, { bg: string; accent: string; text: string; label: string }> = {
  CONFIRMED: { bg: 'bg-emerald-50', accent: 'bg-emerald-500', text: 'text-emerald-800', label: 'Confirmada' },
  BOOKED:    { bg: 'bg-emerald-50', accent: 'bg-emerald-500', text: 'text-emerald-800', label: 'Reservada' },
  CANCELLED: { bg: 'bg-red-50',     accent: 'bg-red-400',     text: 'text-red-700',     label: 'Cancelada' },
  FREE:      { bg: 'bg-sky-50',     accent: 'bg-sky-400',     text: 'text-sky-800',     label: 'Libre' },
  DEFAULT:   { bg: 'bg-slate-50',   accent: 'bg-slate-400',   text: 'text-slate-700',   label: 'Pendiente' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;
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

// --- Avatar ---

function Avatar({ name, avatarUrl, size = 32, className = '' }: { name: string; avatarUrl?: string; size?: number; className?: string }) {
  const [imgErr, setImgErr] = useState(false);
  if (avatarUrl && !imgErr) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgErr(true)}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`rounded-full bg-gradient-to-br from-gantly-blue to-cyan-500 text-white flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

// --- Mini Calendar ---

function MiniCalendar({ selectedDate, onSelectDate }: { selectedDate: Date; onSelectDate: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const today = new Date();
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <button onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-0.5 rounded hover:bg-slate-100 cursor-pointer text-slate-500 bg-transparent border-none transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-slate-700 capitalize">
          {viewMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-0.5 rounded hover:bg-slate-100 cursor-pointer text-slate-500 bg-transparent border-none transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-0.5">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="text-center text-[9px] text-slate-400 font-semibold py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const thisDate = new Date(year, month, day);
          const isSelected = isSameDay(thisDate, selectedDate);
          const isToday = isSameDay(thisDate, today);
          return (
            <button
              key={day}
              onClick={() => { onSelectDate(thisDate); setViewMonth(new Date(year, month, 1)); }}
              className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center text-[10px] cursor-pointer border-none transition-all ${
                isSelected
                  ? 'bg-gantly-blue text-white font-bold'
                  : isToday
                    ? 'bg-gantly-blue/10 text-gantly-blue font-bold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
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

// --- Main Component ---

export default function ClinicAgenda({ psychologists, onAppointmentChange }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visiblePsychIds, setVisiblePsychIds] = useState<Set<number>>(() => new Set(psychologists.map((p) => p.id)));
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [patientFilter, setPatientFilter] = useState('');

  // Form state
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
  const [formTaxExempt, setFormTaxExempt] = useState(true);
  const [formTaxRate, setFormTaxRate] = useState('0.21');
  const [formRecurrenceRule, setFormRecurrenceRule] = useState<string>('');
  const [formRecurrenceCount, setFormRecurrenceCount] = useState<number>(4);
  const [formServiceId, setFormServiceId] = useState<number | null>(null);
  const [formBillingType, setFormBillingType] = useState<'PRIVATE' | 'INSURANCE'>('PRIVATE');
  const [formInsurancePolicyId, setFormInsurancePolicyId] = useState<number | null>(null);

  // Dynamic services
  const [clinicServices, setClinicServices] = useState<ClinicServiceItem[]>([]);

  // Insurance data
  const [insuranceCompanies, setInsuranceCompanies] = useState<InsuranceCompanyBrief[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicyBrief[]>([]);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<PatientSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // --- Data loading ---

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let from: Date, to: Date;
      if (viewMode === 'day') {
        from = new Date(currentDate); from.setHours(0, 0, 0, 0);
        to = new Date(currentDate); to.setHours(23, 59, 59, 999);
      } else {
        from = startOfWeek(currentDate);
        to = addDays(from, 6); to.setHours(23, 59, 59, 999);
      }
      const res = await api.get<Appointment[]>('/clinic/agenda', {
        params: { from: from.toISOString(), to: to.toISOString() },
      });
      setAppointments(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  useEffect(() => {
    api.get<Room[]>('/clinic/rooms')
      .then(res => setRooms(res.data || []))
      .catch(() => setRooms([]));
    api.get<ClinicServiceItem[]>('/clinic/services')
      .then(res => setClinicServices((res.data || []).filter(s => s.active)))
      .catch(() => setClinicServices([]));
    api.get<InsuranceCompanyBrief[]>('/clinic/insurance-companies')
      .then(res => setInsuranceCompanies((res.data || []).filter(c => c.active)))
      .catch(() => setInsuranceCompanies([]));
    api.get<InsurancePolicyBrief[]>('/clinic/insurance-policies')
      .then(res => setInsurancePolicies(res.data || []))
      .catch(() => setInsurancePolicies([]));
  }, []);

  // Fetch absences for all visible psychologists
  useEffect(() => {
    const ids = Array.from(visiblePsychIds);
    if (ids.length === 0) { setAbsences([]); return; }
    Promise.all(
      ids.map(id =>
        api.get<Absence[]>(`/clinic/psychologists/${id}/absences`)
          .then(res => (res.data || []).map(a => ({ ...a, psychologistId: id })))
          .catch(() => [] as Absence[])
      )
    ).then(results => setAbsences(results.flat()));
  }, [visiblePsychIds, currentDate]);

  useEffect(() => {
    if (formModality === 'PRESENCIAL' && formPsychId) {
      const assigned = rooms.find(r => r.assignedPsychologistId === formPsychId && r.active);
      if (assigned) setFormRoomId(assigned.id);
    }
  }, [formPsychId, formModality, rooms]);

  // Patient search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!patientSearch.trim()) { setPatientResults([]); setShowPatientDropdown(false); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get<PatientSummary[]>('/clinic/patients', { params: { search: patientSearch } });
        setPatientResults(res.data || []);
        setShowPatientDropdown(true);
      } catch { setPatientResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [patientSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && patientInputRef.current && !patientInputRef.current.contains(e.target as Node)) setShowPatientDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // --- Panel helpers ---

  function openCreate(psychId: number, date: Date, timeStr: string) {
    setEditingAppointment(null);
    setFormPatientId(null); setFormPatientName(''); setPatientSearch(''); setPatientResults([]);
    setFormDate(formatDateLocal(date)); setFormTime(timeStr); setFormDuration(60);
    setFormPsychId(psychId); setFormService('Psicoterapia'); setFormPrice('');
    setFormPaymentStatus('PENDING'); setFormNotes(''); setFormModality('ONLINE');
    setFormRoomId(null); setFormPaymentMethod('STRIPE'); setFormTaxExempt(true); setFormTaxRate('0.21');
    setFormRecurrenceRule(''); setFormRecurrenceCount(4); setFormServiceId(null);
    setFormBillingType('PRIVATE'); setFormInsurancePolicyId(null);
    setShowCancelConfirm(false); setPanelOpen(true);
  }

  function openEdit(appt: Appointment) {
    setEditingAppointment(appt);
    setFormPatientId(appt.patientId ?? null); setFormPatientName(appt.patientName ?? '');
    setPatientSearch(appt.patientName ?? ''); setPatientResults([]);
    const start = new Date(appt.startTime);
    setFormDate(formatDateLocal(start));
    setFormTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
    setFormDuration(Math.max(30, durationMinutes(appt.startTime, appt.endTime)));
    setFormPsychId(appt.psychologistId); setFormService(appt.service ?? 'Psicoterapia');
    setFormPrice(appt.price != null ? String(appt.price) : '');
    setFormPaymentStatus(appt.paymentStatus ?? 'PENDING'); setFormNotes(appt.notes ?? '');
    setFormModality((appt.modality as 'ONLINE' | 'PRESENCIAL') ?? 'ONLINE');
    setFormRoomId(appt.roomId ?? null);
    setFormPaymentMethod((appt.paymentMethod as 'STRIPE' | 'CASH') ?? 'STRIPE');
    setFormTaxExempt(appt.taxExempt !== false);
    setFormTaxRate(appt.taxRate != null ? String(appt.taxRate) : '0.21');
    setFormRecurrenceRule(''); setFormRecurrenceCount(4); setFormServiceId(null);
    setFormBillingType((appt as any).billingType === 'INSURANCE' ? 'INSURANCE' : 'PRIVATE');
    setFormInsurancePolicyId((appt as any).insurancePolicyId ?? null);
    setShowCancelConfirm(false); setPanelOpen(true);
  }

  function closePanel() { setPanelOpen(false); setEditingAppointment(null); setShowCancelConfirm(false); }

  // --- CRUD ---

  async function handleSave() {
    if (!formDate || !formTime || !formPsychId) return;
    setSaving(true);
    try {
      const startISO = toISOLocal(formDate, formTime);
      const endDate = new Date(parseLocalDate(formDate));
      const [hh, mm] = formTime.split(':').map(Number);
      endDate.setHours(hh, mm + formDuration, 0, 0);
      const body: Record<string, any> = {
        psychologistId: formPsychId, startTime: startISO, endTime: endDate.toISOString(),
        service: formService, serviceId: formServiceId || undefined,
        price: formPrice !== '' ? Number(formPrice) : null,
        paymentStatus: formPaymentStatus, notes: formNotes || null, modality: formModality,
        paymentMethod: formModality === 'PRESENCIAL' ? formPaymentMethod : 'STRIPE',
        roomId: formModality === 'PRESENCIAL' ? formRoomId : null,
        taxExempt: formTaxExempt, taxRate: !formTaxExempt ? Number(formTaxRate) : undefined,
        billingType: formBillingType,
        insurancePolicyId: formBillingType === 'INSURANCE' ? formInsurancePolicyId : null,
      };
      if (formPatientId) body.patientId = formPatientId;
      if (!editingAppointment && formRecurrenceRule) {
        body.recurrenceRule = formRecurrenceRule;
        body.recurrenceCount = formRecurrenceCount;
      }
      if (editingAppointment) {
        await api.put(`/clinic/appointments/${editingAppointment.id}`, body);
      } else {
        await api.post('/clinic/appointments', body);
      }
      closePanel(); await loadAppointments(); onAppointmentChange();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al guardar la cita');
    } finally { setSaving(false); }
  }

  async function handleCancel() {
    if (!editingAppointment) return;
    setCancelling(true);
    try {
      await api.delete(`/clinic/appointments/${editingAppointment.id}`);
      closePanel(); await loadAppointments(); onAppointmentChange();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al cancelar la cita');
    } finally { setCancelling(false); setShowCancelConfirm(false); }
  }

  // --- Derived ---

  const visiblePsychs = psychologists.filter((p) => visiblePsychIds.has(p.id));
  const filteredAppointments = appointments.filter((a) => {
    if (!visiblePsychIds.has(a.psychologistId)) return false;
    if (patientFilter.trim()) {
      if (!(a.patientName || '').toLowerCase().includes(patientFilter.toLowerCase())) return false;
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

  function handleSlotClick(psychId: number, day: Date, minutes: number) {
    const snapped = Math.floor(minutes / 30) * 30;
    const hh = Math.floor((snapped + HOUR_START * 60) / 60);
    const mm = (snapped + HOUR_START * 60) % 60;
    openCreate(psychId, day, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }

  const hours: number[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h);

  function getAppsForColumn(psychId: number, day: Date) {
    return filteredAppointments.filter((a) => a.psychologistId === psychId && isSameDay(new Date(a.startTime), day));
  }

  /** Get absences overlapping a given day for a psychologist */
  function getAbsencesForColumn(psychId: number, day: Date): Absence[] {
    const dayStart = new Date(day); dayStart.setHours(HOUR_START, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(HOUR_END, 0, 0, 0);
    return absences.filter(a =>
      a.psychologistId === psychId &&
      new Date(a.startTime) < dayEnd &&
      new Date(a.endTime) > dayStart
    );
  }

  // --- Shared input styles ---
  const inputCls = "w-full h-8 px-2 rounded-md border border-slate-200 text-[13px] text-slate-700 outline-none bg-white focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 transition-all";
  const labelCls = "text-[11px] font-semibold text-slate-500 block mb-0.5";

  // --- Column render ---

  function renderColumn(psychId: number, day: Date, colAppts: Appointment[]) {
    const colAbsences = getAbsencesForColumn(psychId, day);
    const dayStart = new Date(day); dayStart.setHours(HOUR_START, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(HOUR_END, 0, 0, 0);

    return (
      <div
        key={`${psychId}-${formatDateLocal(day)}`}
        className="border-r border-slate-100 relative"
        style={{ width: COL_WIDTH, minWidth: COL_WIDTH, height: GRID_HEIGHT, flexShrink: 0, cursor: 'cell' }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-appt]') || (e.target as HTMLElement).closest('[data-absence]')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const offsetY = e.clientY - rect.top + e.currentTarget.scrollTop;
          handleSlotClick(psychId, day, Math.max(0, Math.min(TOTAL_MINUTES - 30, offsetY / PX_PER_MINUTE)));
        }}
      >
        {/* Hour lines */}
        {hours.map((h) => (
          <div key={h} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE }} />
        ))}
        {/* Half-hour dashed lines */}
        {hours.slice(0, -1).map((h) => (
          <div key={`${h}h`} className="absolute left-0 right-0 border-t border-dashed border-slate-50" style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE + 30 * PX_PER_MINUTE }} />
        ))}
        {/* Absence blocks */}
        {colAbsences.map((ab) => {
          const abStart = new Date(ab.startTime) < dayStart ? dayStart : new Date(ab.startTime);
          const abEnd = new Date(ab.endTime) > dayEnd ? dayEnd : new Date(ab.endTime);
          const topMin = (abStart.getHours() * 60 + abStart.getMinutes()) - HOUR_START * 60;
          const durMin = (abEnd.getTime() - abStart.getTime()) / 60000;
          const topPx = Math.max(0, topMin * PX_PER_MINUTE);
          const heightPx = Math.max(22, durMin * PX_PER_MINUTE);
          return (
            <div
              key={`abs-${ab.id}`}
              data-absence="1"
              className="absolute left-0 right-0 z-[1] pointer-events-auto"
              style={{
                top: topPx,
                height: heightPx,
                background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(148,163,184,0.15) 4px, rgba(148,163,184,0.15) 8px)',
              }}
              title={ab.reason ? `Ausencia: ${ab.reason}` : 'Ausencia'}
            >
              <div className="flex items-center gap-1 px-1.5 py-1 opacity-60">
                <CalendarOff size={11} className="text-slate-400 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-slate-400 truncate">
                  Ausencia{ab.reason ? ` - ${ab.reason}` : ''}
                </span>
              </div>
            </div>
          );
        })}
        {/* Now line */}
        {showNowLine && isSameDay(day, now) && (
          <div className="absolute left-0 right-0 z-[5] pointer-events-none flex items-center" style={{ top: nowMinutes * PX_PER_MINUTE }}>
            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
            <div className="flex-1 h-px bg-red-500" />
          </div>
        )}
        {/* Appointment blocks */}
        {colAppts.map((appt) => {
          const topMin = minutesFromStartOfDay(appt.startTime);
          const durMin = Math.max(20, durationMinutes(appt.startTime, appt.endTime));
          const cfg = getStatusConfig(appt.status);
          const topPx = Math.max(0, topMin * PX_PER_MINUTE);
          const heightPx = Math.max(22, durMin * PX_PER_MINUTE);
          return (
            <button
              type="button"
              key={appt.id}
              data-appt="1"
              onClick={(e) => { e.stopPropagation(); openEdit(appt); }}
              className={`absolute left-1 right-1 w-full text-left focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 cursor-pointer ${cfg.bg} rounded-md overflow-hidden z-[2] hover:ring-2 hover:ring-gantly-blue/30 transition-all group`}
              style={{ top: topPx, height: heightPx }}
            >
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.accent} rounded-l-md`} />
              <div className="pl-2 pr-1.5 py-1">
                <div className={`text-[11px] font-semibold leading-tight ${cfg.text} truncate`}>
                  {appt.patientName || 'Sin paciente'}
                </div>
                {heightPx >= 38 && (
                  <div className={`text-[10px] ${cfg.text} opacity-70 truncate mt-0.5`}>
                    {new Date(appt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {appt.service || ''}
                  </div>
                )}
                {heightPx >= 54 && appt.modality === 'PRESENCIAL' && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <MapPin size={9} className={`${cfg.text} opacity-50`} />
                    <span className={`text-[9px] ${cfg.text} opacity-50`}>{appt.roomName || 'Presencial'}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ====================== RENDER ======================

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-slate-100 flex-shrink-0 bg-white">
        {/* Date nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentDate(new Date())} className="h-7 px-2.5 rounded-md bg-gantly-blue text-white text-[12px] font-semibold cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors">
            Hoy
          </button>
          <button onClick={() => setCurrentDate(d => addDays(d, viewMode === 'day' ? -1 : -7))} className="p-1 rounded-md hover:bg-slate-100 cursor-pointer text-slate-500 bg-transparent border-none transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(d => addDays(d, viewMode === 'day' ? 1 : 7))} className="p-1 rounded-md hover:bg-slate-100 cursor-pointer text-slate-500 bg-transparent border-none transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Date label */}
        <h3 className="text-sm font-bold text-slate-800 capitalize m-0">
          {viewMode === 'day'
            ? currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
            : (() => {
                const ws = startOfWeek(currentDate);
                const we = addDays(ws, 6);
                return `${ws.getDate()} ${ws.toLocaleDateString('es-ES', { month: 'long' })} – ${we.getDate()} ${we.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
              })()
          }
        </h3>

        <div className="flex-1" />

        {/* Psychologist pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[400px]">
          {psychologists.map((p) => {
            const active = visiblePsychIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setVisiblePsychIds(prev => {
                  const next = new Set(prev);
                  if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                  return next;
                })}
                className={`flex items-center gap-1.5 h-7 px-2 rounded-full text-[11px] font-semibold cursor-pointer border transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gantly-blue/10 border-gantly-blue/30 text-gantly-blue'
                    : 'bg-transparent border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <Avatar name={p.name} avatarUrl={p.avatarUrl} size={18} />
                <span className="max-w-[80px] truncate">{p.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex h-7 rounded-md border border-slate-200 overflow-hidden">
          {(['day', 'week'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-2.5 text-[11px] font-semibold cursor-pointer border-none transition-all ${
                viewMode === m ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m === 'day' ? 'Día' : 'Semana'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar..."
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="h-7 w-[120px] pl-7 pr-2 rounded-md border border-slate-200 text-[12px] text-slate-600 outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 focus:w-[160px] transition-all"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={loadAppointments}
          disabled={loading}
          className={`p-1.5 rounded-md hover:bg-slate-100 cursor-pointer text-slate-400 bg-transparent border-none transition-colors ${loading ? 'animate-spin' : ''}`}
          title="Recargar"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-1.5 bg-red-50 text-red-600 text-[12px] flex items-center gap-2 border-b border-red-100">
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* === LEFT: Mini-calendar (narrow) === */}
        <div className="w-[200px] min-w-[200px] border-r border-slate-100 flex flex-col bg-slate-50/50 flex-shrink-0 overflow-hidden">
          <MiniCalendar selectedDate={currentDate} onSelectDate={setCurrentDate} />

          <div className="border-t border-slate-100 px-3 py-2 flex-1 overflow-y-auto">
            {/* Today summary */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hoy</div>
            {(() => {
              const todayAppts = appointments.filter(a => isSameDay(new Date(a.startTime), new Date()));
              if (todayAppts.length === 0) return <p className="text-[11px] text-slate-400 italic">Sin citas</p>;
              return (
                <div className="space-y-1">
                  {todayAppts.slice(0, 6).map(a => {
                    const cfg = getStatusConfig(a.status);
                    return (
                      <div
                        key={a.id}
                        onClick={() => openEdit(a)}
                        className="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-white cursor-pointer transition-colors"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.accent} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-slate-700 truncate">{a.patientName || 'Sin paciente'}</div>
                          <div className="text-[9px] text-slate-400">
                            {new Date(a.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {todayAppts.length > 6 && <p className="text-[10px] text-slate-400 pl-1">+{todayAppts.length - 6} más</p>}
                </div>
              );
            })()}
          </div>

          {/* New appointment button */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => openCreate(psychologists[0]?.id || 0, currentDate, `${String(new Date().getHours()).padStart(2, '0')}:00`)}
              className="w-full h-8 rounded-md bg-gantly-blue text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors"
            >
              <Plus size={14} /> Nueva cita
            </button>
          </div>
        </div>

        {/* === CENTER: Calendar grid === */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 pointer-events-none">
              <div className="w-7 h-7 border-[2.5px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
            </div>
          )}

          <div className="flex-1 overflow-auto" ref={gridRef}>
            {viewMode === 'day' ? (
              <div style={{ display: 'flex', minWidth: TIME_COL_WIDTH + visiblePsychs.length * COL_WIDTH, minHeight: GRID_HEIGHT + 40 }}>
                {/* Time axis */}
                <div className="sticky left-0 z-[4] bg-white" style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH }}>
                  <div className="h-10" />
                  <div className="relative" style={{ height: GRID_HEIGHT }}>
                    {hours.map((h) => (
                      <div key={h} className="absolute right-2 text-[10px] text-slate-400 font-medium select-none" style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE - 6 }}>
                        {String(h).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Columns */}
                <div className="flex flex-col flex-1">
                  <div className="flex sticky top-0 z-[3] bg-white border-b border-slate-100 h-10">
                    {visiblePsychs.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 px-3 border-r border-slate-100" style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}>
                        <Avatar name={p.name} avatarUrl={p.avatarUrl} size={22} />
                        <span className="text-[12px] font-semibold text-slate-700 truncate">{p.name}</span>
                      </div>
                    ))}
                    {visiblePsychs.length === 0 && <div className="px-4 text-[12px] text-slate-400 flex items-center">Selecciona profesionales arriba</div>}
                  </div>
                  <div className="flex flex-1">
                    {visiblePsychs.map((p) => renderColumn(p.id, currentDate, getAppsForColumn(p.id, currentDate)))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', minWidth: TIME_COL_WIDTH + weekDays.length * 160, minHeight: GRID_HEIGHT + 52 }}>
                <div className="sticky left-0 z-[4] bg-white" style={{ width: TIME_COL_WIDTH, minWidth: TIME_COL_WIDTH }}>
                  <div className="h-[52px]" />
                  <div className="relative" style={{ height: GRID_HEIGHT }}>
                    {hours.map((h) => (
                      <div key={h} className="absolute right-2 text-[10px] text-slate-400 font-medium select-none" style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE - 6 }}>
                        {String(h).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-1">
                  {weekDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const dayAppts = filteredAppointments.filter((a) => isSameDay(new Date(a.startTime), day));
                    // Collect absences for all visible psychologists on this day
                    const weekDayStart = new Date(day); weekDayStart.setHours(HOUR_START, 0, 0, 0);
                    const weekDayEnd = new Date(day); weekDayEnd.setHours(HOUR_END, 0, 0, 0);
                    const dayAbsences = absences.filter(a =>
                      visiblePsychIds.has(a.psychologistId) &&
                      new Date(a.startTime) < weekDayEnd &&
                      new Date(a.endTime) > weekDayStart
                    );
                    return (
                      <div key={formatDateLocal(day)} className="flex flex-col border-r border-slate-100 flex-shrink-0" style={{ width: 160, minWidth: 160 }}>
                        <div
                          className={`h-[52px] flex flex-col items-center justify-center border-b border-slate-100 sticky top-0 z-[3] cursor-pointer transition-colors ${isToday ? 'bg-gantly-blue/5' : 'bg-white hover:bg-slate-50'}`}
                          onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                        >
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                          </span>
                          <span className={`text-lg font-bold mt-[-2px] ${isToday ? 'text-gantly-blue' : 'text-slate-700'}`}>
                            {day.getDate()}
                          </span>
                        </div>
                        <div
                          className="relative"
                          style={{ height: GRID_HEIGHT, cursor: 'cell' }}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('[data-appt]') || (e.target as HTMLElement).closest('[data-absence]')) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const offsetY = e.clientY - rect.top;
                            const psychId = visiblePsychs[0]?.id;
                            if (psychId) handleSlotClick(psychId, day, Math.max(0, Math.min(TOTAL_MINUTES - 30, offsetY / PX_PER_MINUTE)));
                          }}
                        >
                          {hours.map((h) => (
                            <div key={h} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: (h - HOUR_START) * 60 * PX_PER_MINUTE }} />
                          ))}
                          {/* Absence blocks (week view) */}
                          {dayAbsences.map((ab) => {
                            const abStart = new Date(ab.startTime) < weekDayStart ? weekDayStart : new Date(ab.startTime);
                            const abEnd = new Date(ab.endTime) > weekDayEnd ? weekDayEnd : new Date(ab.endTime);
                            const topMin = (abStart.getHours() * 60 + abStart.getMinutes()) - HOUR_START * 60;
                            const durMin = (abEnd.getTime() - abStart.getTime()) / 60000;
                            return (
                              <div
                                key={`wabs-${ab.id}`}
                                data-absence="1"
                                className="absolute left-0 right-0 z-[1]"
                                style={{
                                  top: Math.max(0, topMin * PX_PER_MINUTE),
                                  height: Math.max(20, durMin * PX_PER_MINUTE),
                                  background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(148,163,184,0.15) 4px, rgba(148,163,184,0.15) 8px)',
                                }}
                                title={ab.reason ? `Ausencia: ${ab.reason}` : 'Ausencia'}
                              >
                                <div className="flex items-center gap-0.5 px-1 py-0.5 opacity-60">
                                  <CalendarOff size={9} className="text-slate-400 flex-shrink-0" />
                                  <span className="text-[9px] font-semibold text-slate-400 truncate">Ausencia</span>
                                </div>
                              </div>
                            );
                          })}
                          {showNowLine && isToday && (
                            <div className="absolute left-0 right-0 z-[5] pointer-events-none flex items-center" style={{ top: nowMinutes * PX_PER_MINUTE }}>
                              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                              <div className="flex-1 h-px bg-red-500" />
                            </div>
                          )}
                          {dayAppts.map((appt) => {
                            const topMin = minutesFromStartOfDay(appt.startTime);
                            const durMin = Math.max(20, durationMinutes(appt.startTime, appt.endTime));
                            const cfg = getStatusConfig(appt.status);
                            return (
                              <button
                                type="button"
                                key={appt.id}
                                data-appt="1"
                                onClick={(e) => { e.stopPropagation(); openEdit(appt); }}
                                className={`absolute left-1 right-1 w-full text-left focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 cursor-pointer ${cfg.bg} rounded-md overflow-hidden z-[2] hover:ring-2 hover:ring-gantly-blue/30 transition-all`}
                                style={{ top: Math.max(0, topMin * PX_PER_MINUTE), height: Math.max(20, durMin * PX_PER_MINUTE) }}
                              >
                                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.accent} rounded-l-md`} />
                                <div className="pl-2 pr-1 py-0.5">
                                  <div className={`text-[10px] font-semibold ${cfg.text} truncate`}>{appt.patientName || 'Libre'}</div>
                                </div>
                              </button>
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

        {/* === RIGHT: Detail / form panel === */}
        <div
          className={`bg-white border-l border-slate-100 flex flex-col overflow-hidden transition-all duration-200 ease-out flex-shrink-0 ${
            panelOpen ? 'w-[340px] min-w-[340px]' : 'w-0 min-w-0'
          }`}
        >
          {panelOpen && (
            <div className="w-[340px] flex flex-col h-full">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 h-12 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${editingAppointment ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="text-[14px] font-bold text-slate-800">
                    {editingAppointment ? 'Editar cita' : 'Nueva cita'}
                  </span>
                </div>
                <button onClick={closePanel} className="p-1 rounded-md hover:bg-slate-100 cursor-pointer text-slate-400 bg-transparent border-none transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto">
                {/* Patient section */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <User size={13} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paciente</span>
                  </div>
                  <div className="relative">
                    <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <input
                      ref={patientInputRef}
                      type="text"
                      placeholder="Buscar paciente..."
                      value={patientSearch}
                      onChange={(e) => { setPatientSearch(e.target.value); if (!e.target.value) { setFormPatientId(null); setFormPatientName(''); } }}
                      onFocus={() => { if (patientResults.length > 0) setShowPatientDropdown(true); }}
                      className={`${inputCls} pl-7`}
                    />
                    {searchLoading && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />}
                    {showPatientDropdown && patientResults.length > 0 && (
                      <div ref={dropdownRef} className="absolute top-full left-0 right-0 bg-white rounded-md shadow-lg border border-slate-200 z-[100] max-h-[160px] overflow-y-auto mt-0.5">
                        {patientResults.map((pt) => (
                          <button type="button" key={pt.id} onClick={() => { setFormPatientId(pt.id); setFormPatientName(pt.name); setPatientSearch(pt.name); setShowPatientDropdown(false); }} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 cursor-pointer px-2.5 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 bg-transparent border-x-0 border-t-0">
                            <div className="text-[12px] font-semibold text-slate-700">{pt.name}</div>
                            <div className="text-[10px] text-slate-400">{pt.patientNumber != null ? `#${pt.patientNumber} · ` : ''}{pt.phone || pt.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showPatientDropdown && patientResults.length === 0 && !searchLoading && patientSearch.trim().length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white rounded-md border border-slate-200 p-2 text-[11px] text-slate-400 mt-0.5 z-[100]">Sin resultados</div>
                    )}
                  </div>
                  {formPatientId && (
                    <div className="mt-1.5 flex items-center gap-2 px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md">
                      <Check size={12} className="text-emerald-600 flex-shrink-0" />
                      <span className="text-[12px] font-medium text-emerald-800 flex-1 truncate">{formPatientName}</span>
                      <button onClick={() => { setFormPatientId(null); setFormPatientName(''); setPatientSearch(''); }} className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-100 mx-4" />

                {/* Schedule section */}
                <div className="px-4 pt-2.5 pb-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={13} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Horario</span>
                  </div>

                  {/* Modality */}
                  <div className="flex gap-1.5 mb-2.5">
                    {([
                      { val: 'ONLINE' as const, icon: Video, label: 'Online' },
                      { val: 'PRESENCIAL' as const, icon: Building2, label: 'Presencial' },
                    ]).map(({ val, icon: Icon, label }) => (
                      <button
                        key={val}
                        onClick={() => { setFormModality(val); if (val === 'ONLINE') { setFormRoomId(null); setFormPaymentMethod('STRIPE'); } }}
                        className={`flex-1 h-8 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-semibold cursor-pointer border transition-all ${
                          formModality === val
                            ? 'bg-slate-800 border-slate-800 text-white'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Fecha</label>
                      <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Hora</label>
                      <select value={formTime} onChange={(e) => setFormTime(e.target.value)} className={inputCls}>
                        <option value="">--:--</option>
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Duración</label>
                      <select value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value))} className={inputCls}>
                        {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Profesional</label>
                      <select value={formPsychId ?? ''} onChange={(e) => setFormPsychId(e.target.value ? Number(e.target.value) : null)} className={inputCls}>
                        <option value="">Seleccionar</option>
                        {psychologists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {formModality === 'PRESENCIAL' && (
                    <div className="mt-2">
                      <label className={labelCls}>Despacho</label>
                      <select value={formRoomId ?? ''} onChange={(e) => setFormRoomId(e.target.value ? Number(e.target.value) : null)} className={inputCls}>
                        <option value="">Sin despacho</option>
                        {rooms.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Recurrence — only for new appointments */}
                  {!editingAppointment && (
                    <div className="mt-2.5">
                      <label className={labelCls}>
                        <Repeat size={11} className="inline-block mr-1 -mt-px text-slate-400" />
                        Repetir
                      </label>
                      <select
                        value={formRecurrenceRule}
                        onChange={(e) => setFormRecurrenceRule(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">No repetir</option>
                        <option value="WEEKLY">Semanal</option>
                        <option value="BIWEEKLY">Quincenal</option>
                        <option value="MONTHLY">Mensual</option>
                      </select>
                      {formRecurrenceRule && (
                        <div className="mt-1.5">
                          <label className={labelCls}>Repeticiones (1-52)</label>
                          <input
                            type="number"
                            min={1}
                            max={52}
                            value={formRecurrenceCount}
                            onChange={(e) => setFormRecurrenceCount(Math.max(1, Math.min(52, Number(e.target.value) || 1)))}
                            className={inputCls}
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5 m-0">
                            Se crean {formRecurrenceCount} citas {formRecurrenceRule === 'WEEKLY' ? 'semanales' : formRecurrenceRule === 'BIWEEKLY' ? 'quincenales' : 'mensuales'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-100 mx-4" />

                {/* Service & Billing */}
                <div className="px-4 pt-2.5 pb-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard size={13} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Facturacion</span>
                  </div>

                  {/* Billing type toggle */}
                  <div className="flex gap-1.5 mb-2.5">
                    {([
                      { val: 'PRIVATE' as const, icon: CreditCard, label: 'Privado' },
                      { val: 'INSURANCE' as const, icon: Shield, label: 'Aseguradora' },
                    ]).map(({ val, icon: Icon, label }) => (
                      <button
                        key={val}
                        onClick={() => { setFormBillingType(val); if (val === 'PRIVATE') setFormInsurancePolicyId(null); }}
                        className={`flex-1 h-8 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-semibold cursor-pointer border transition-all ${
                          formBillingType === val
                            ? 'bg-slate-800 border-slate-800 text-white'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>

                  {/* Insurance selectors */}
                  {formBillingType === 'INSURANCE' && (
                    <div className="space-y-2 mb-2.5">
                      <div>
                        <label className={labelCls}>Poliza del paciente</label>
                        <select
                          value={formInsurancePolicyId ?? ''}
                          onChange={e => setFormInsurancePolicyId(e.target.value ? Number(e.target.value) : null)}
                          className={inputCls}
                        >
                          <option value="">Seleccionar poliza</option>
                          {insurancePolicies
                            .filter(p => !formPatientId || p.patientId === formPatientId)
                            .filter(p => p.active)
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                {p.insuranceCompanyName} - {p.policyNumber}{p.patientName ? ` (${p.patientName})` : ''}
                              </option>
                            ))
                          }
                        </select>
                        {formPatientId && insurancePolicies.filter(p => p.patientId === formPatientId && p.active).length === 0 && (
                          <p className="text-[10px] text-amber-600 mt-0.5 m-0">Este paciente no tiene polizas activas</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>Servicio</label>
                    <select
                      value={formServiceId != null ? String(formServiceId) : '_custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '_custom') {
                          setFormServiceId(null);
                          setFormService('');
                          return;
                        }
                        const svc = clinicServices.find(s => s.id === Number(val));
                        if (svc) {
                          setFormServiceId(svc.id);
                          setFormService(svc.name);
                          if (svc.defaultPrice != null) setFormPrice(String(svc.defaultPrice));
                          if (svc.durationMinutes != null) setFormDuration(svc.durationMinutes);
                        }
                      }}
                      className={inputCls}
                    >
                      {clinicServices.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.name}{s.defaultPrice != null ? ` (${s.defaultPrice}\u00A0\u20AC)` : ''}</option>
                      ))}
                      <option value="_custom">Otro...</option>
                    </select>
                    {formServiceId == null && (
                      <input
                        type="text"
                        placeholder="Nombre del servicio"
                        value={formService}
                        onChange={(e) => setFormService(e.target.value)}
                        className={`${inputCls} mt-1.5`}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className={labelCls}>Importe</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]">&euro;</span>
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className={`${inputCls} pl-5`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Estado</label>
                      <select value={formPaymentStatus} onChange={(e) => setFormPaymentStatus(e.target.value)} className={inputCls}>
                        {PAYMENT_STATUSES.map((ps) => <option key={ps.value} value={ps.value}>{ps.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {formModality === 'PRESENCIAL' && (
                    <div className="flex gap-1.5 mt-2">
                      {([{ value: 'STRIPE' as const, label: 'Online' }, { value: 'CASH' as const, label: 'Efectivo' }]).map(pm => (
                        <button
                          key={pm.value}
                          onClick={() => setFormPaymentMethod(pm.value)}
                          className={`flex-1 h-7 rounded-md text-[11px] font-semibold cursor-pointer border transition-all ${
                            formPaymentMethod === pm.value
                              ? 'bg-slate-800 border-slate-800 text-white'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >{pm.label}</button>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 mt-2 cursor-pointer">
                    <input type="checkbox" checked={formTaxExempt} onChange={(e) => setFormTaxExempt(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-gantly-blue cursor-pointer accent-gantly-blue" />
                    <span className="text-[11px] text-slate-600">IVA exento (sanitario)</span>
                  </label>
                  {!formTaxExempt && (
                    <select value={formTaxRate} onChange={(e) => setFormTaxRate(e.target.value)} className={`${inputCls} mt-1.5`}>
                      <option value="0.21">21% General</option>
                      <option value="0.10">10% Reducido</option>
                      <option value="0.04">4% Superreducido</option>
                    </select>
                  )}
                </div>

                <div className="h-px bg-slate-100 mx-4" />

                {/* Notes */}
                <div className="px-4 pt-2.5 pb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText size={13} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notas</span>
                  </div>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Observaciones internas..."
                    rows={2}
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-[13px] text-slate-700 outline-none resize-y leading-relaxed focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 transition-all"
                  />
                </div>
              </div>

              {/* Panel footer / actions */}
              <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !formDate || !formTime || !formPsychId}
                  className={`w-full h-9 rounded-md text-[13px] font-bold flex items-center justify-center gap-1.5 border-none transition-all ${
                    saving || !formDate || !formTime || !formPsychId
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gantly-blue text-white cursor-pointer hover:bg-gantly-blue/90'
                  }`}
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {editingAppointment ? 'Guardar cambios' : 'Crear cita'}
                </button>

                {editingAppointment && !showCancelConfirm && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full h-8 rounded-md border border-red-200 bg-white text-red-500 text-[12px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={13} /> Cancelar cita
                  </button>
                )}

                {editingAppointment && showCancelConfirm && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-md space-y-2">
                    <p className="text-[12px] text-red-700 font-semibold m-0">¿Confirmar cancelación?</p>
                    <p className="text-[11px] text-slate-500 m-0">Esta acción no se puede deshacer.</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className={`flex-1 h-7 rounded-md text-[12px] font-bold flex items-center justify-center gap-1 border-none text-white transition-all ${cancelling ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 cursor-pointer hover:bg-red-600'}`}
                      >
                        {cancelling && <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                        Confirmar
                      </button>
                      <button onClick={() => setShowCancelConfirm(false)} className="flex-1 h-7 rounded-md border border-slate-200 bg-white text-slate-600 text-[12px] font-semibold cursor-pointer hover:bg-slate-50 transition-all">
                        Volver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
