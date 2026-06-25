import { useMemo, useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { ChevronLeft, ChevronRight, CalendarCheck, CheckCircle, Clock, CreditCard, Calendar, UserPlus, Pencil, X, PlusCircle, Plus, Info, CalendarOff, Repeat, FileText, Search, Check, Wallet, Video, Building2 } from 'lucide-react';
import { toast } from './ui/Toast';
import { calendarNotesService } from '../services/api';

type Slot = { id: number; startTime: string; endTime: string; status: 'FREE'|'REQUESTED'|'CONFIRMED'|'BOOKED'|'CANCELLED'; user?: { name: string }; price?: number; paymentStatus?: string; recurrenceGroupId?: string | null; recurrenceRule?: string | null };

type SessionPrices = {
  individual?: number;
  pareja?: number;
  menores?: number;
  [key: string]: number | undefined;
};

type Patient = { id: number; name: string; email: string };

type Absence = { id: number; startTime: string; endTime: string; reason?: string };

type Props = {
  mode: 'PSYCHO' | 'USER';
  slots: Slot[];
  myAppointments?: Array<{ id: number; startTime: string; endTime: string; status: string }>; // Citas reservadas por el usuario
  onCreateSlot?: (startIso: string, endIso: string, price?: number, recurrenceRule?: string, recurrenceCount?: number, extras?: { service?: string; modality?: string; notes?: string; paymentMethod?: string; patientId?: number }) => void;
  onCreateSlotsRange?: (slots: Array<{ start: string; end: string; price: number }>) => Promise<void>; // Para crear múltiples slots
  onBook?: (appointmentId: number) => void;
  onDeleteSlot?: (appointmentId: number) => void;
  onDeleteRecurrenceGroup?: (groupId: string) => Promise<void>; // Eliminar serie recurrente
  onUpdateSlot?: (appointmentId: number, updates: { price?: number; startTime?: string; endTime?: string }) => void;
  onAssignToPatient?: (appointmentId: number, userId: number) => Promise<void>; // Para asignar cita directamente a paciente
  initialWeekStart?: Date; // Semana inicial controlada desde el padre
  onWeekChange?: (weekStart: Date) => void; // Callback cuando cambia la semana
  sessionPrices?: SessionPrices | null; // Precios predefinidos del psicólogo
  patients?: Patient[]; // Lista de pacientes para asignar citas directamente
  absences?: Absence[]; // Periodos de ausencia del psicologo
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0,0,0,0);
  return date;
}

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export default function CalendarWeek({ mode, slots, myAppointments = [], onCreateSlot, onCreateSlotsRange, onBook, onDeleteSlot, onDeleteRecurrenceGroup, onUpdateSlot, onAssignToPatient, initialWeekStart, onWeekChange, sessionPrices, patients = [], absences = [] }: Props) {
  const [weekStart, setWeekStart] = useState(initialWeekStart || startOfWeek(new Date()));
  const [savedWeekStart, setSavedWeekStart] = useState<Date | null>(null); // Guardar semana al abrir modal (solo para cancelar)

  // --- Mobile responsive state ---
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOffset, setMobileOffset] = useState(0); // 0-based offset within the week for 3-day chunks

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, []);

  // Reset mobile offset when week changes
  useEffect(() => {
    setMobileOffset(0);
  }, [weekStart]);

  // Sincronizar con prop inicial si cambia
  useEffect(() => {
    if (initialWeekStart) {
      const initialWeek = startOfWeek(initialWeekStart);
      const currentWeek = startOfWeek(weekStart);
      if (initialWeek.getTime() !== currentWeek.getTime()) {
        setWeekStart(initialWeek);
      }
    }
  }, [initialWeekStart]);

  // Notificar al padre cuando cambia la semana
  const handleWeekChange = (newWeek: Date) => {
    setWeekStart(newWeek);
    if (onWeekChange) {
      onWeekChange(newWeek);
    }
  };
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = useState<{ start: string; end: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: Date; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: Date; hour: number } | null>(null);
  // USER book modal (kept)
  const [showConfirmBookModal, setShowConfirmBookModal] = useState(false);
  const [pendingBookSlot, setPendingBookSlot] = useState<Slot | null>(null);
  // Side panel state (replaces price, edit, assign, notes modals)
  const [panelMode, setPanelMode] = useState<'create' | 'edit' | null>(null);
  const [panelSlot, setPanelSlot] = useState<Slot | null>(null);
  const [panelRange, setPanelRange] = useState<{ start: string; end: string; count: number } | null>(null);
  const [panelSessionType, setPanelSessionType] = useState('');
  const [panelPrice, setPanelPrice] = useState('');
  const [panelPatientId, setPanelPatientId] = useState('');
  const [panelPatientSearch, setPanelPatientSearch] = useState('');
  const [panelPaymentMethod, setPanelPaymentMethod] = useState<'stripe' | 'efectivo'>('stripe');
  const [panelModality, setPanelModality] = useState<'ONLINE' | 'PRESENCIAL'>('ONLINE');
  const [panelService, setPanelService] = useState('');
  const [panelCreateNotes, setPanelCreateNotes] = useState('');
  const [panelRecurrence, setPanelRecurrence] = useState('');
  const [panelRecurrenceCount, setPanelRecurrenceCount] = useState('4');
  const [panelNotes, setPanelNotes] = useState('');
  const [panelNotesLoading, setPanelNotesLoading] = useState(false);
  const [panelNotesSaving, setPanelNotesSaving] = useState(false);
  const hours = Array.from({ length: 13 }).map((_, i) => 8 + i); // 8:00 - 20:00
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  // Visible days: 3 on mobile, 7 on desktop
  const visibleDays = useMemo(() => {
    if (!isMobile) return days;
    const start = mobileOffset;
    return days.slice(start, Math.min(start + 3, 7));
  }, [days, isMobile, mobileOffset]);

  // Check if "Hoy" button should show
  const todayDate = new Date();
  const todayWeekStart = startOfWeek(todayDate);
  const showTodayButton = useMemo(() => {
    if (isMobile) {
      // On mobile, show if today is not in the current visible 3-day window
      const todayStr = todayDate.toDateString();
      return !visibleDays.some(d => d.toDateString() === todayStr);
    }
    return todayWeekStart.getTime() !== startOfWeek(weekStart).getTime();
  }, [weekStart, isMobile, visibleDays, todayWeekStart]);

  // Jump to today
  const goToToday = useCallback(() => {
    const tw = startOfWeek(new Date());
    handleWeekChange(tw);
    if (isMobile) {
      // Find which 3-day chunk today falls in
      const today = new Date();
      const dayOfWeek = (today.getDay() + 6) % 7; // Monday=0
      const chunk = Math.floor(dayOfWeek / 3) * 3;
      setMobileOffset(chunk);
    }
  }, [isMobile, onWeekChange]);

  // Refs for touch drag
  const gridRef = useRef<HTMLDivElement>(null);
  const touchDragRef = useRef<{ startDay: Date; startHour: number; active: boolean }>({ startDay: new Date(), startHour: 0, active: false });

  const bookModalRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Current time indicator - update every minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const slotByDayHour = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const s of slots) {
      const start = new Date(s.startTime);
      const key = `${start.toDateString()}-${start.getHours()}`;
      (map[key] ||= []).push(s);
    }
    return map;
  }, [slots]);

  // Mapear las citas del usuario por dia/hora para identificarlas facilmente
  const myAppointmentsByDayHour = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const apt of myAppointments) {
      const start = new Date(apt.startTime);
      const key = `${start.toDateString()}-${start.getHours()}`;
      map[key] = true;
    }
    return map;
  }, [myAppointments]);

  // Mapa de horas con ausencia: para cada celda dia/hora, determina si hay una ausencia activa
  const absenceByDayHour = useMemo(() => {
    const map: Record<string, Absence> = {};
    for (const ab of absences) {
      const abStart = new Date(ab.startTime);
      const abEnd = new Date(ab.endTime);
      // Iterate over all days and hours that this absence covers
      for (const d of days) {
        for (const h of [8,9,10,11,12,13,14,15,16,17,18,19,20]) {
          const cellStart = new Date(d);
          cellStart.setHours(h, 0, 0, 0);
          const cellEnd = new Date(d);
          cellEnd.setHours(h + 1, 0, 0, 0);
          // Check overlap: absence overlaps cell if abStart < cellEnd AND abEnd > cellStart
          if (abStart < cellEnd && abEnd > cellStart) {
            const key = `${d.toDateString()}-${h}`;
            map[key] = ab;
          }
        }
      }
    }
    return map;
  }, [absences, days]);

  // Obtener precio segun tipo de sesión
  const getPriceForSessionType = (sessionType: string): number | null => {
    if (!sessionPrices || !sessionType) return null;
    return sessionPrices[sessionType] ?? null;
  };

  // Obtener tipos de sesion disponibles
  const availableSessionTypes = useMemo(() => {
    if (!sessionPrices) return [];
    return Object.keys(sessionPrices).filter(key => sessionPrices[key] != null && sessionPrices[key]! > 0);
  }, [sessionPrices]);

  const createAt = (day: Date, hour: number) => {
    if (!onCreateSlot) return;
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    if (mode === 'PSYCHO') {
      setSavedWeekStart(new Date(weekStart));
      setPendingSlot({ start: start.toISOString(), end: end.toISOString() });
      openPanel('create', null, null);
    } else {
      onCreateSlot(start.toISOString(), end.toISOString());
    }
  };

  // Iniciar arrastre
  const handleMouseDown = (day: Date, hour: number) => {
    if (mode === 'PSYCHO' && onCreateSlot && !isPast(day, hour)) {
      setIsDragging(true);
      setDragStart({ day, hour });
      setDragEnd({ day, hour });
    }
  };

  // Actualizar arrastre
  const handleMouseMove = (day: Date, hour: number) => {
    if (isDragging && dragStart) {
      setDragEnd({ day, hour });
    }
  };

  // Finalizar arrastre
  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && mode === 'PSYCHO') {
      // Solo permitir arrastrar en el mismo dia (horizontalmente)
      const isSameDay = dragStart.day.toDateString() === dragEnd.day.toDateString();

      if (!isSameDay) {
        // Si es diferente dia, crear solo una cita en el punto inicial
        createAt(dragStart.day, dragStart.hour);
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      }

      // Mismo dia: determinar inicio y fin del rango
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour);
      const totalSlots = endHour - startHour + 1;

      if (totalSlots > 1) {
        // Crear rango de citas
        const start = new Date(dragStart.day);
        start.setHours(startHour, 0, 0, 0);
        const end = new Date(dragStart.day);
        end.setHours(endHour + 1, 0, 0, 0);

        setSavedWeekStart(new Date(weekStart));
        setPendingSlot(null);
        openPanel('create', null, { start: start.toISOString(), end: end.toISOString(), count: totalSlots });
      } else {
        // Crear una sola cita
        createAt(dragStart.day, dragStart.hour);
      }

      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  };

  // --- Touch handlers for drag-to-create ---
  const getCellFromTouch = useCallback((touch: React.Touch): { day: Date; hour: number } | null => {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return null;
    const cell = el.closest('[data-day-idx][data-hour]') as HTMLElement | null;
    if (!cell) return null;
    const dayIdx = parseInt(cell.dataset.dayIdx || '0', 10);
    const hour = parseInt(cell.dataset.hour || '0', 10);
    if (isNaN(dayIdx) || isNaN(hour)) return null;
    // Use visibleDays for the index mapping
    if (dayIdx < 0 || dayIdx >= visibleDays.length) return null;
    return { day: visibleDays[dayIdx], hour };
  }, [visibleDays]);

  const handleTouchStart = useCallback((day: Date, hour: number) => {
    if (mode !== 'PSYCHO' || !onCreateSlot || isPast(day, hour)) return;
    touchDragRef.current = { startDay: day, startHour: hour, active: true };
    setIsDragging(true);
    setDragStart({ day, hour });
    setDragEnd({ day, hour });
  }, [mode, onCreateSlot]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchDragRef.current.active) return;
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    const result = getCellFromTouch(touch);
    if (result) {
      setDragEnd(result);
    }
  }, [getCellFromTouch]);

  const handleTouchEnd = useCallback(() => {
    if (!touchDragRef.current.active) return;
    touchDragRef.current.active = false;
    handleMouseUp();
  }, [isDragging, dragStart, dragEnd, mode]);

  // Filtered patients for panel search
  const filteredPatients = useMemo(() => {
    if (!panelPatientSearch.trim()) return patients;
    const term = panelPatientSearch.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term));
  }, [patients, panelPatientSearch]);

  const openPanel = useCallback(async (mode: 'create' | 'edit', slot?: Slot | null, range?: { start: string; end: string; count: number } | null) => {
    setPanelMode(mode);
    setPanelSlot(slot || null);
    setPanelRange(range || null);
    setPanelPatientSearch('');
    setPanelPatientId('');
    setPanelPaymentMethod('stripe');
    setPanelModality('ONLINE');
    setPanelService('');
    setPanelCreateNotes('');
    setPanelNotesSaving(false);

    if (mode === 'create') {
      setPanelSessionType('');
      setPanelPrice('');
      setPanelRecurrence('');
      setPanelRecurrenceCount('4');
      setPanelNotes('');
      setPanelNotesLoading(false);
      // Auto-select if single session type
      if (availableSessionTypes.length === 1 && sessionPrices) {
        const singleType = availableSessionTypes[0];
        setPanelSessionType(singleType);
        const price = sessionPrices[singleType];
        if (price) setPanelPrice(price.toString());
      }
    } else if (mode === 'edit' && slot) {
      setPanelPrice(slot.price?.toString() || '');
      setPanelRecurrence('');
      setPanelRecurrenceCount('4');
      // Load notes for booked/confirmed slots
      if ((slot.status === 'BOOKED' || slot.status === 'CONFIRMED') && slot.user) {
        setPanelNotesLoading(true);
        setPanelNotes('');
        try {
          const { notes } = await calendarNotesService.getNotes(slot.id);
          setPanelNotes(notes || '');
        } catch {
          // No notes yet
        } finally {
          setPanelNotesLoading(false);
        }
      } else {
        setPanelNotes('');
        setPanelNotesLoading(false);
      }
    }
    // Scroll to show the panel — scroll the calendar container top into view
    setTimeout(() => {
      if (isMobile) return; // mobile uses fixed overlay, no scroll needed
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [availableSessionTypes, sessionPrices]);

  const closePanel = useCallback(() => {
    setPanelMode(null);
    setPanelSlot(null);
    setPanelRange(null);
    setPanelSessionType('');
    setPanelPrice('');
    setPanelPatientId('');
    setPanelPatientSearch('');
    setPanelPaymentMethod('stripe');
    setPanelModality('ONLINE');
    setPanelService('');
    setPanelCreateNotes('');
    setPanelRecurrence('');
    setPanelRecurrenceCount('4');
    setPanelNotes('');
    setPanelNotesLoading(false);
    setPanelNotesSaving(false);
    setPendingSlot(null);
    if (savedWeekStart) {
      setWeekStart(savedWeekStart);
      setSavedWeekStart(null);
    }
  }, [savedWeekStart]);

  const handlePanelSave = useCallback(async () => {
    if (panelMode === 'create') {
      // Determine price
      let price: number | null = null;
      if (panelSessionType) {
        price = getPriceForSessionType(panelSessionType);
        if (price === null) {
          toast.warning('No se encontró precio para el tipo de sesión seleccionado');
          return;
        }
      } else {
        const priceStr = panelPrice.trim();
        if (priceStr === '') {
          toast.warning('Por favor, selecciona un tipo de sesión o ingresa un precio');
          return;
        }
        price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) {
          toast.warning('Por favor, ingresa un precio válido');
          return;
        }
      }

      if (panelRange && onCreateSlotsRange) {
        const start = new Date(panelRange.start);
        const end = new Date(panelRange.end);
        const slotsToCreate: Array<{ start: string; end: string; price: number }> = [];
        let current = new Date(start);
        while (current < end) {
          const slotStart = new Date(current);
          const slotEnd = new Date(current);
          slotEnd.setHours(slotEnd.getHours() + 1);
          slotsToCreate.push({ start: slotStart.toISOString(), end: slotEnd.toISOString(), price: price! });
          current.setHours(current.getHours() + 1);
          if (current >= end) break;
        }
        if (slotsToCreate.length > 0) {
          try {
            await onCreateSlotsRange(slotsToCreate);
            closePanel();
          } catch {
            // Error handled in parent
          }
        }
      } else if (pendingSlot && onCreateSlot) {
        const rRule = panelRecurrence || undefined;
        const rCount = panelRecurrence && panelRecurrenceCount ? parseInt(panelRecurrenceCount, 10) : undefined;
        const extras: { service?: string; modality?: string; notes?: string; paymentMethod?: string; patientId?: number } = {};
        if (panelModality) extras.modality = panelModality;
        if (panelService.trim()) extras.service = panelService.trim();
        if (panelCreateNotes.trim()) extras.notes = panelCreateNotes.trim();
        if (panelPaymentMethod === 'efectivo') extras.paymentMethod = 'CASH';
        if (panelPatientId) extras.patientId = parseInt(panelPatientId);
        onCreateSlot(pendingSlot.start, pendingSlot.end, price!, rRule, rCount, extras);
        closePanel();
      }
    } else if (panelMode === 'edit' && panelSlot) {
      // Update price for FREE/REQUESTED slots
      if ((panelSlot.status === 'FREE' || panelSlot.status === 'REQUESTED') && onUpdateSlot) {
        const priceStr = panelPrice.trim();
        if (priceStr !== '') {
          const price = parseFloat(priceStr);
          if (!isNaN(price) && price > 0 && price !== panelSlot.price) {
            onUpdateSlot(panelSlot.id, { price });
          }
        }
      }
      // Assign patient for FREE/REQUESTED slots
      if (panelPatientId && (panelSlot.status === 'FREE' || panelSlot.status === 'REQUESTED') && onAssignToPatient) {
        try {
          await onAssignToPatient(panelSlot.id, parseInt(panelPatientId));
          toast.success('Cita asignada exitosamente');
        } catch (error: any) {
          toast.error('No se pudo asignar la cita. Inténtalo de nuevo.');
          return;
        }
      }
      closePanel();
    }
  }, [panelMode, panelSlot, panelRange, panelSessionType, panelPrice, panelPatientId, panelRecurrence, panelRecurrenceCount, panelModality, panelService, panelCreateNotes, panelPaymentMethod, pendingSlot, onCreateSlot, onCreateSlotsRange, onUpdateSlot, onAssignToPatient, closePanel]);

  const handlePanelSaveNotes = useCallback(async () => {
    if (!panelSlot) return;
    setPanelNotesSaving(true);
    try {
      await calendarNotesService.updateNotes(panelSlot.id, panelNotes);
      toast.success('Notas guardadas');
    } catch (err: any) {
      toast.error('No se pudieron guardar las notas. Inténtalo de nuevo.');
    } finally {
      setPanelNotesSaving(false);
    }
  }, [panelSlot, panelNotes]);

  const getStatusClasses = (status: string, isMyAppointment: boolean = false, paymentStatus?: string) => {
    if (isMyAppointment && (status === 'BOOKED' || status === 'CONFIRMED')) {
      if (paymentStatus === 'PAID') {
        return 'bg-gantly-emerald/10 border-gantly-emerald text-gantly-emerald';
      }
      return 'bg-gantly-gold/10 border-gantly-gold text-yellow-700';
    }

    switch (status) {
      case 'FREE':
        return 'bg-gantly-cloud border-gantly-blue text-gantly-blue';
      case 'REQUESTED':
        return 'bg-gantly-gold/10 border-gantly-gold text-yellow-700';
      case 'CONFIRMED':
        if (paymentStatus === 'PAID') {
          return 'bg-gantly-emerald/10 border-gantly-emerald text-gantly-emerald';
        }
        return 'bg-gantly-gold/10 border-gantly-gold text-yellow-700';
      case 'BOOKED':
        return 'bg-gantly-emerald/10 border-gantly-emerald text-gantly-emerald';
      case 'CANCELLED':
        return 'bg-slate-100 border-slate-300 text-slate-500';
      default:
        return 'bg-slate-50 border-slate-300 text-slate-600';
    }
  };

  const getStatusColor = (status: string, isMyAppointment: boolean = false, paymentStatus?: string) => {
    // Keep for the book button background color
    if (isMyAppointment && (status === 'BOOKED' || status === 'CONFIRMED')) {
      if (paymentStatus === 'PAID') {
        return { border: '#059669' };
      }
      return { border: '#F0C930' };
    }

    switch (status) {
      case 'FREE':
        return { border: '#2E93CC' };
      case 'REQUESTED':
        return { border: '#F0C930' };
      case 'CONFIRMED':
        if (paymentStatus === 'PAID') {
          return { border: '#059669' };
        }
        return { border: '#F0C930' };
      case 'BOOKED':
        return { border: '#059669' };
      case 'CANCELLED':
        return { border: '#94a3b8' };
      default:
        return { border: '#d1d5db' };
    }
  };

  const getStatusDot = (status: string, isMyAppointment: boolean = false, paymentStatus?: string) => {
    if (isMyAppointment && (status === 'BOOKED' || status === 'CONFIRMED')) {
      if (paymentStatus === 'PAID') return 'bg-gantly-emerald';
      return 'bg-gantly-gold';
    }
    switch (status) {
      case 'FREE': return 'bg-gantly-blue';
      case 'REQUESTED': return 'bg-gantly-gold';
      case 'CONFIRMED': return paymentStatus === 'PAID' ? 'bg-gantly-emerald' : 'bg-gantly-gold';
      case 'BOOKED': return 'bg-gantly-emerald';
      case 'CANCELLED': return 'bg-slate-300';
      default: return 'bg-slate-300';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date, hour: number) => {
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    return slotTime < new Date();
  };

  // --- Modal Escape key handler ---
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent, closeHandler: () => void) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeHandler();
    }
  }, []);

  // Compute weekly stats for the premium header
  const weekStats = useMemo(() => {
    let free = 0, booked = 0, revenue = 0, pending = 0;
    for (const s of slots) {
      const start = new Date(s.startTime);
      if (start >= days[0] && start < addDays(days[6], 1)) {
        if (s.status === 'FREE') free++;
        else if (s.status === 'BOOKED' || (s.status === 'CONFIRMED' && s.paymentStatus === 'PAID')) {
          booked++;
          if (s.price) revenue += s.price;
        }
        else if (s.status === 'REQUESTED' || (s.status === 'CONFIRMED' && s.paymentStatus !== 'PAID')) pending++;
      }
    }
    return { free, booked, revenue, pending, total: free + booked + pending };
  }, [slots, days]);

  // Mobile navigation: move 3 days forward/back within the week, or jump to next/prev week
  const handleMobilePrev = () => {
    if (mobileOffset >= 3) {
      setMobileOffset(mobileOffset - 3);
    } else {
      // Go to previous week, last chunk
      handleWeekChange(addDays(weekStart, -7));
      setMobileOffset(3); // Show Thu-Sun of prev week
    }
  };

  const handleMobileNext = () => {
    if (mobileOffset + 3 < 7) {
      setMobileOffset(mobileOffset + 3);
    } else {
      // Go to next week, first chunk
      handleWeekChange(addDays(weekStart, 7));
      setMobileOffset(0);
    }
  };

  // Close handlers for modals
  const closeBookModal = useCallback(() => {
    setShowConfirmBookModal(false);
    setPendingBookSlot(null);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Gradient accent strip */}
      <div className="h-1.5 bg-gradient-to-r from-gantly-blue via-gantly-cyan to-gantly-emerald"></div>

      {/* Premium Summary Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-slate-100">
        {/* Top row: navigation + date */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <button
            aria-label="Semana anterior"
            onClick={() => {
              if (isMobile) {
                handleMobilePrev();
              } else {
                handleWeekChange(addDays(weekStart, -7));
              }
            }}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-gantly-cloud hover:bg-gantly-blue hover:text-white cursor-pointer transition-all duration-200 text-gantly-muted border-none shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-gantly-blue focus-visible:ring-offset-2 outline-none"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {showTodayButton && (
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-full bg-gantly-blue/10 text-gantly-blue font-body text-xs font-semibold border-none cursor-pointer transition-all duration-200 hover:bg-gantly-blue hover:text-white focus-visible:ring-2 focus-visible:ring-gantly-blue focus-visible:ring-offset-2 outline-none"
              >
                Hoy
              </button>
            )}
            <div className="text-center">
              {isMobile ? (
                <span className="font-heading text-base font-bold text-gantly-text tracking-tight">
                  {visibleDays[0]?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} &ndash; {visibleDays[visibleDays.length - 1]?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </span>
              ) : (
                <span className="font-heading text-xl font-bold text-gantly-text tracking-tight">
                  {days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} &ndash; {days[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          <button
            aria-label="Semana siguiente"
            onClick={() => {
              if (isMobile) {
                handleMobileNext();
              } else {
                handleWeekChange(addDays(weekStart, 7));
              }
            }}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-gantly-cloud hover:bg-gantly-blue hover:text-white cursor-pointer transition-all duration-200 text-gantly-muted border-none shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-gantly-blue focus-visible:ring-offset-2 outline-none"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          <div className="bg-gantly-cloud/60 rounded-xl px-3 md:px-4 py-2 md:py-3 border border-gantly-blue/10 group hover:border-gantly-blue/30 transition-all duration-200">
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <CalendarCheck size={14} className="text-gantly-blue md:w-4 md:h-4" />
              <span className="font-body text-[10px] md:text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Disponibles</span>
            </div>
            <div className="font-heading text-xl md:text-2xl font-bold text-gantly-blue">{weekStats.free}</div>
          </div>
          <div className="bg-gantly-emerald/5 rounded-xl px-3 md:px-4 py-2 md:py-3 border border-gantly-emerald/10 group hover:border-gantly-emerald/30 transition-all duration-200">
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <CheckCircle size={14} className="text-gantly-emerald md:w-4 md:h-4" />
              <span className="font-body text-[10px] md:text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Reservadas</span>
            </div>
            <div className="font-heading text-xl md:text-2xl font-bold text-gantly-emerald">{weekStats.booked}</div>
          </div>
          <div className="bg-gantly-gold/5 rounded-xl px-3 md:px-4 py-2 md:py-3 border border-gantly-gold/10 group hover:border-gantly-gold/30 transition-all duration-200">
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <Clock size={14} className="text-gantly-gold md:w-4 md:h-4" />
              <span className="font-body text-[10px] md:text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Pendientes</span>
            </div>
            <div className="font-heading text-xl md:text-2xl font-bold text-yellow-700">{weekStats.pending}</div>
          </div>
          {mode === 'PSYCHO' && (
            <div className="rounded-xl px-3 md:px-4 py-2 md:py-3 border border-gantly-blue/10 relative overflow-hidden bg-gradient-brand">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                <CreditCard size={14} className="text-white/80 md:w-4 md:h-4" />
                <span className="font-body text-[10px] md:text-[11px] uppercase tracking-wider text-white/70 font-medium">Ingresos sem.</span>
              </div>
              <div className="font-heading text-xl md:text-2xl font-bold text-white">{weekStats.revenue.toFixed(0)}&euro;</div>
            </div>
          )}
          {mode === 'USER' && (
            <div className="bg-slate-50 rounded-xl px-3 md:px-4 py-2 md:py-3 border border-slate-100">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                <Calendar size={14} className="text-gantly-muted md:w-4 md:h-4" />
                <span className="font-body text-[10px] md:text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Total</span>
              </div>
              <div className="font-heading text-xl md:text-2xl font-bold text-gantly-text">{weekStats.total}</div>
            </div>
          )}
        </div>

        {/* Occupancy progress bar (psycho mode) */}
        {mode === 'PSYCHO' && weekStats.total > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="font-body text-xs text-gantly-muted font-medium">Ocupaci&oacute;n:</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gantly-blue to-gantly-cyan transition-all duration-500"
                style={{ width: `${Math.min(((weekStats.booked + weekStats.pending) / weekStats.total) * 100, 100)}%` }}
              />
            </div>
            <span className="font-body text-xs font-semibold text-gantly-text">
              {Math.round(((weekStats.booked + weekStats.pending) / weekStats.total) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Calendar Grid + Side Panel */}
      <div className="flex overflow-hidden">
      <div
        ref={gridRef}
        className="flex-1 grid overflow-x-auto min-w-0"
        style={{ gridTemplateColumns: isMobile ? `56px repeat(${visibleDays.length}, 1fr)` : '72px repeat(7, 1fr)' }}
      >
        {/* Hour header */}
        <div className="bg-slate-50/60 px-2 py-3 border-r border-slate-100/80 flex items-end justify-center">
          <Clock size={isMobile ? 14 : 16} className="text-gantly-muted/60" />
        </div>

        {/* Day headers */}
        {visibleDays.map((d, i) => {
          const todayCol = isToday(d);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          // Count slots for this day
          const daySlots = slots.filter(s => new Date(s.startTime).toDateString() === d.toDateString());
          const dayFree = daySlots.filter(s => s.status === 'FREE').length;
          const dayBooked = daySlots.filter(s => s.status === 'BOOKED' || (s.status === 'CONFIRMED' && s.paymentStatus === 'PAID')).length;

          return (
            <div
              key={i}
              className={`px-1 md:px-2 py-2 md:py-3 text-center border-b ${i < visibleDays.length - 1 ? 'border-r border-slate-100/80' : ''} ${todayCol ? 'bg-gradient-to-b from-gantly-blue/8 to-gantly-blue/3 border-b-2 border-b-gantly-blue' : 'bg-slate-50/50 border-slate-100/80'} transition-colors duration-200`}
            >
              <div className={`font-body text-[10px] uppercase tracking-widest font-semibold ${isWeekend ? 'text-slate-500' : todayCol ? 'text-gantly-blue' : 'text-gantly-muted'}`}>
                {d.toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
              <div className="mt-1 flex items-center justify-center">
                {todayCol ? (
                  <span className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full text-white font-heading font-bold text-sm md:text-base shadow-lg shadow-gantly-blue/25 mx-auto bg-gradient-brand-alt">
                    {d.toLocaleDateString('es-ES', { day: 'numeric' })}
                  </span>
                ) : (
                  <span className={`font-heading font-bold text-base md:text-lg ${isWeekend ? 'text-slate-500' : 'text-gantly-text'}`}>
                    {d.toLocaleDateString('es-ES', { day: 'numeric' })}
                  </span>
                )}
              </div>
              {todayCol && (
                <div className="text-[9px] text-gantly-blue mt-1 font-heading font-bold uppercase tracking-wider">
                  Hoy
                </div>
              )}
              {/* Mini slot indicators */}
              {(dayFree > 0 || dayBooked > 0) && (
                <div className="mt-1.5 flex items-center justify-center gap-1.5">
                  {dayFree > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-semibold text-gantly-blue bg-gantly-blue/8 px-1.5 py-0.5 rounded-full">
                      {dayFree}
                    </span>
                  )}
                  {dayBooked > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-semibold text-gantly-emerald bg-gantly-emerald/8 px-1.5 py-0.5 rounded-full">
                      {dayBooked}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Time slots */}
        {hours.map((h) => (
          <Fragment key={`row-${h}`}>
            <div
              className="px-1 md:px-2 py-2 border-r border-slate-100/80 border-b border-slate-100/80 bg-slate-50/40 text-[10px] md:text-[11px] text-gantly-muted/80 font-body font-semibold flex items-center justify-center tabular-nums"
            >
              {String(h).padStart(2, '0')}:00
            </div>
            {visibleDays.map((d, ci) => {
              const key = `${d.toDateString()}-${h}`;
              const list = slotByDayHour[key] || [];
              const cellKey = `${ci}-${h}`;
              const isPastTime = isPast(d, h);
              const isHovered = hoveredCell === cellKey;
              const isTodayCol = isToday(d);
              const isCurrentHour = isTodayCol && now.getHours() === h;
              const minuteOffset = isCurrentHour ? (now.getMinutes() / 60) * 100 : 0;
              const cellAbsence = absenceByDayHour[key];

              return (
                <div
                  key={`c-${ci}-${h}`}
                  data-day-idx={ci}
                  data-hour={h}
                  className={`border-b border-slate-100/80 ${ci < visibleDays.length - 1 ? 'border-r border-slate-100/80' : ''} p-1 md:p-1.5 min-h-[56px] md:min-h-[68px] relative transition-colors duration-200 ${
                    cellAbsence
                      ? ''
                      : isPastTime
                        ? 'bg-slate-50/60'
                        : isTodayCol
                          ? 'bg-gantly-cloud/40'
                          : isHovered && mode === 'PSYCHO' && onCreateSlot
                            ? 'bg-gantly-blue/5'
                            : 'bg-white'
                  } ${onCreateSlot && mode === 'PSYCHO' && !isPastTime && !cellAbsence ? 'cursor-pointer' : ''}`}
                  style={cellAbsence
                    ? { background: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 5px, rgba(148,163,184,0.18) 5px, rgba(148,163,184,0.18) 10px)' }
                    : mode === 'PSYCHO' && onCreateSlot && !isPastTime ? { touchAction: 'none' } : undefined
                  }
                  onMouseEnter={() => {
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime && !cellAbsence) {
                      setHoveredCell(cellKey);
                    }
                    if (isDragging && dragStart) {
                      handleMouseMove(d, h);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isDragging) {
                      setHoveredCell(null);
                    }
                  }}
                  onMouseDown={() => {
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime && !cellAbsence && list.length === 0 && !isDragging) {
                      handleMouseDown(d, h);
                    }
                  }}
                  onMouseUp={() => {
                    if (isDragging) {
                      handleMouseUp();
                    }
                  }}
                  onTouchStart={() => {
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime && !cellAbsence && list.length === 0) {
                      handleTouchStart(d, h);
                    }
                  }}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => {
                    if (isDragging) {
                      handleTouchEnd();
                    }
                  }}
                  onClick={(e) => {
                    // Solo crear slot si no se hizo clic en un boton o slot existente
                    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime && !cellAbsence && list.length === 0 && !isDragging) {
                      createAt(d, h);
                    }
                  }}
                >
                  {/* Current time indicator */}
                  {isCurrentHour && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${minuteOffset}%` }}>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0 shadow-sm shadow-red-500/40" />
                        <div className="flex-1 h-[2px] bg-red-500 shadow-sm shadow-red-500/30" />
                      </div>
                    </div>
                  )}
                  {list.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {list.map(s => {
                        const isMyAppointment = myAppointmentsByDayHour[`${new Date(s.startTime).toDateString()}-${new Date(s.startTime).getHours()}`] && (s.status === 'BOOKED' || s.status === 'CONFIRMED' || s.status === 'REQUESTED');
                        const statusClasses = getStatusClasses(s.status, isMyAppointment, s.paymentStatus);
                        const colors = getStatusColor(s.status, isMyAppointment, s.paymentStatus);
                        const dotClass = getStatusDot(s.status, isMyAppointment, s.paymentStatus);
                        return (
                          <div
                            key={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className={`${statusClasses} border rounded-xl px-1.5 md:px-2.5 py-1.5 md:py-2 text-xs font-medium transition-all duration-200 relative group/slot ${
                              (s.status === 'FREE' || s.status === 'REQUESTED') && mode === 'USER' && onBook ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : 'hover:shadow-md'
                            } ${mode === 'PSYCHO' ? 'md:pr-8' : ''}`}
                          >
                            {/* Mobile: compact view with dot + time */}
                            {isMobile ? (
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                                <div className="font-body font-semibold text-[10px] truncate flex items-center gap-0.5">
                                  {new Date(s.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  {s.recurrenceGroupId && <Repeat size={8} className="text-gantly-blue/60 shrink-0" />}
                                </div>
                                {mode === 'PSYCHO' && s.price != null && (
                                  <span className="text-[9px] opacity-70 ml-auto shrink-0">{s.price.toFixed(0)}&euro;</span>
                                )}
                                {mode === 'USER' && (s.status === 'FREE' || s.status === 'REQUESTED') && onBook && !isMyAppointment && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setPendingBookSlot(s);
                                      setShowConfirmBookModal(true);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="text-white border-none rounded px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer ml-auto shrink-0"
                                    style={{ background: colors.border }}
                                  >
                                    {s.price != null ? `${s.price.toFixed(0)}\u20AC` : 'Res.'}
                                  </button>
                                )}
                                {mode === 'PSYCHO' && (
                                  <div className="flex gap-0.5 ml-auto shrink-0">
                                    {onAssignToPatient && patients.length > 0 && (s.status === 'FREE' || s.status === 'REQUESTED') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          openPanel('edit', s);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="w-[18px] h-[18px] flex items-center justify-center rounded bg-gantly-emerald/10 text-gantly-emerald border-none cursor-pointer"
                                        title="Asignar a paciente"
                                      >
                                        <UserPlus size={10} />
                                      </button>
                                    )}
                                    {onDeleteSlot && (s.status === 'FREE' || s.status === 'REQUESTED') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (onDeleteSlot) onDeleteSlot(s.id);
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="w-[18px] h-[18px] flex items-center justify-center rounded bg-red-500/10 text-red-500 border-none cursor-pointer"
                                      >
                                        <X size={10} />
                                      </button>
                                    )}
                                    {s.recurrenceGroupId && onDeleteRecurrenceGroup && s.status === 'FREE' && (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (s.recurrenceGroupId) {
                                            try {
                                              await onDeleteRecurrenceGroup(s.recurrenceGroupId);
                                              toast.success('Serie eliminada');
                                            } catch (err: any) {
                                              toast.error('No se pudo eliminar la serie. Inténtalo de nuevo.');
                                            }
                                          }
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="w-[18px] h-[18px] flex items-center justify-center rounded bg-orange-500/10 text-orange-600 border-none cursor-pointer"
                                        title="Eliminar serie"
                                      >
                                        <Repeat size={10} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Desktop: full view */
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-body font-semibold text-[11px] flex items-center gap-1">
                                    {new Date(s.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    {s.recurrenceGroupId && (
                                      <Repeat size={10} className="text-gantly-blue/60 shrink-0" aria-label={`Serie ${s.recurrenceRule === 'WEEKLY' ? 'semanal' : s.recurrenceRule === 'BIWEEKLY' ? 'quincenal' : s.recurrenceRule === 'MONTHLY' ? 'mensual' : 'recurrente'}`} />
                                    )}
                                  </div>
                                  {s.user?.name && (
                                    <div className="text-[10px] opacity-80 mt-0.5">
                                      {s.user.name}
                                    </div>
                                  )}
                                  {!s.user && s.status === 'FREE' && (
                                    <div className="text-[10px] opacity-80 mt-0.5">
                                      {mode === 'USER' ? 'Disponible' : 'Libre'}
                                    </div>
                                  )}
                                  {s.status === 'REQUESTED' && (
                                    <div className="text-[10px] opacity-80 font-semibold mt-0.5">
                                      Solicitud pendiente
                                    </div>
                                  )}
                                  {s.status === 'CONFIRMED' && (
                                    <div className="text-[10px] opacity-80 font-semibold mt-0.5">
                                      {s.paymentStatus === 'PAID' ? 'Pagada' : 'Pago pendiente'}
                                    </div>
                                  )}
                                  {s.status === 'BOOKED' && (
                                    <div className="text-[10px] opacity-80 font-semibold mt-0.5">
                                      Pagada
                                    </div>
                                  )}
                                  {isMyAppointment && (
                                    <div className="text-[10px] opacity-80 font-semibold mt-0.5">
                                      Mi cita
                                    </div>
                                  )}
                                </div>
                                {mode === 'USER' && (s.status === 'FREE' || s.status === 'REQUESTED') && onBook && !isMyAppointment && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setPendingBookSlot(s);
                                      setShowConfirmBookModal(true);
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="text-white border-none rounded-md px-2.5 py-1 text-[10px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap relative z-10 hover:scale-105 hover:shadow-md"
                                    style={{ background: colors.border }}
                                  >
                                    {s.price !== undefined && s.price !== null
                                      ? `Reservar ${s.price.toFixed(2)}\u20AC`
                                      : 'Reservar'}
                                  </button>
                                )}
                                {mode === 'PSYCHO' && s.price !== undefined && s.price !== null && (
                                  <div className="text-[10px] opacity-80 mt-1 font-semibold">
                                    {s.price.toFixed(2)}&euro;
                                  </div>
                                )}
                                {mode === 'PSYCHO' && (
                                  <div className="absolute top-1 right-1 flex gap-0.5 z-10 flex-wrap">
                                    {onAssignToPatient && patients.length > 0 && (s.status === 'FREE' || s.status === 'REQUESTED') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          openPanel('edit', s);
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                        }}
                                        className="w-[18px] h-[18px] flex items-center justify-center rounded bg-gantly-emerald/10 text-gantly-emerald border-none text-[10px] cursor-pointer transition-all duration-200 hover:bg-gantly-emerald/20 hover:scale-110"
                                        title="Asignar a paciente"
                                      >
                                        <UserPlus size={12} />
                                      </button>
                                    )}
                                    {onUpdateSlot && (s.status === 'FREE' || s.status === 'REQUESTED') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          openPanel('edit', s);
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                        }}
                                        className="w-[18px] h-[18px] flex items-center justify-center rounded bg-gantly-blue/10 text-gantly-blue border-none text-[11px] cursor-pointer transition-all duration-200 hover:bg-gantly-blue/20 hover:scale-110"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    )}
                                    {onDeleteSlot && (s.status === 'FREE' || s.status === 'REQUESTED') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (onDeleteSlot) {
                                            onDeleteSlot(s.id);
                                          }
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                        }}
                                        className="w-[18px] h-[18px] flex items-center justify-center rounded bg-red-500/10 text-red-500 border-none text-sm font-bold cursor-pointer transition-all duration-200 hover:bg-red-500/20 hover:scale-110 leading-none"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                    {s.recurrenceGroupId && onDeleteRecurrenceGroup && s.status === 'FREE' && (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          if (s.recurrenceGroupId) {
                                            try {
                                              await onDeleteRecurrenceGroup(s.recurrenceGroupId);
                                              toast.success('Serie eliminada');
                                            } catch (err: any) {
                                              toast.error('No se pudo eliminar la serie. Inténtalo de nuevo.');
                                            }
                                          }
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                        }}
                                        className="w-[18px] h-[18px] flex items-center justify-center rounded bg-orange-500/10 text-orange-600 border-none text-sm cursor-pointer transition-all duration-200 hover:bg-orange-500/20 hover:scale-110"
                                        title="Eliminar serie"
                                      >
                                        <Repeat size={12} />
                                      </button>
                                    )}
                                    {(s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          openPanel('edit', s);
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                        }}
                                        className="w-[18px] h-[18px] flex items-center justify-center rounded bg-violet-500/10 text-violet-600 border-none text-[10px] cursor-pointer transition-all duration-200 hover:bg-violet-500/20 hover:scale-110"
                                        title="Notas de sesion"
                                      >
                                        <FileText size={12} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : cellAbsence ? (
                    <div className="flex items-center justify-center h-full min-h-[44px] md:min-h-[52px]" title={cellAbsence.reason || 'Ausencia'}>
                      <div className="flex items-center gap-1 opacity-60">
                        <CalendarOff size={isMobile ? 12 : 14} className="text-slate-400" />
                        <span className="text-[9px] md:text-[10px] font-semibold text-slate-400 hidden md:block">Ausencia</span>
                      </div>
                    </div>
                  ) : (
                    mode === 'PSYCHO' && onCreateSlot && !isPastTime && (
                      <div className={`flex items-center justify-center h-full min-h-[44px] md:min-h-[52px] rounded-xl transition-all duration-200 ${
                        isHovered ? 'bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/5 border border-dashed border-gantly-blue/30 scale-[0.97]' : ''
                      }`}>
                        {isHovered ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <PlusCircle size={isMobile ? 16 : 18} className="text-gantly-blue" />
                            <span className="text-[9px] font-semibold text-gantly-blue/70 hidden md:block">Nueva</span>
                          </div>
                        ) : (
                          <Plus size={isMobile ? 14 : 16} className="text-slate-200" />
                        )}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Side Panel */}
      {mode === 'PSYCHO' && (
        <>
          {/* Mobile overlay */}
          {isMobile && panelMode && (
            <div className="fixed inset-0 bg-black/40 z-[999]" onClick={closePanel} />
          )}
          <div
            ref={panelRef}
            className={`bg-white border-l border-slate-100 flex-col overflow-hidden transition-all duration-200 ease-out flex-shrink-0 ${
              isMobile
                ? panelMode
                  ? 'fixed inset-x-0 bottom-0 z-[1000] w-full border-l-0 border-t rounded-t-2xl shadow-2xl max-h-[85vh] flex'
                  : 'hidden'
                : panelMode
                  ? 'w-[320px] min-w-[320px] flex'
                  : 'w-0 min-w-0 hidden'
            }`}
          >
            {panelMode && (
              <div className={`${isMobile ? 'w-full' : 'w-[320px]'} flex flex-col h-full`}>
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 h-11 border-b border-slate-100 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${panelMode === 'create' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-[14px] font-bold text-slate-800 font-heading">
                      {panelMode === 'create'
                        ? panelRange ? `Crear ${panelRange.count} citas` : 'Nueva cita'
                        : panelSlot && (panelSlot.status === 'BOOKED' || panelSlot.status === 'CONFIRMED')
                          ? 'Detalles de cita'
                          : 'Editar cita'}
                    </span>
                  </div>
                  <button onClick={closePanel} className="p-1 rounded-md hover:bg-slate-100 cursor-pointer text-slate-400 bg-transparent border-none transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {/* Panel body */}
                <div className="flex-1 overflow-y-auto" onKeyDown={(e) => { if (e.key === 'Escape') closePanel(); }}>
                  {/* Date/time info */}
                  {(pendingSlot || panelRange || panelSlot) && (
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Calendar size={13} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Horario</span>
                      </div>
                      <div className="text-[12px] text-slate-600 font-body">
                        {(() => {
                          const src = panelSlot || (pendingSlot ? { startTime: pendingSlot.start, endTime: pendingSlot.end } : panelRange ? { startTime: panelRange.start, endTime: panelRange.end } : null);
                          if (!src) return null;
                          const st = new Date(src.startTime);
                          const en = new Date(src.endTime);
                          return (
                            <>
                              <div className="font-semibold text-slate-700">
                                {st.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </div>
                              <div className="text-slate-500 mt-0.5">
                                {st.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {en.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                {panelRange && <span className="ml-1 text-gantly-blue font-semibold">({panelRange.count} citas)</span>}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Modality — create mode only */}
                  {panelMode === 'create' && (
                    <>
                      <div className="h-px bg-slate-100 mx-4" />
                      <div className="px-4 pt-2.5 pb-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Video size={13} className="text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modalidad</span>
                        </div>
                        <div className="flex gap-1.5">
                          {([
                            { val: 'ONLINE' as const, icon: Video, label: 'Online' },
                            { val: 'PRESENCIAL' as const, icon: Building2, label: 'Presencial' },
                          ]).map(({ val, icon: Icon, label }) => (
                            <button
                              key={val}
                              onClick={() => setPanelModality(val)}
                              className={`flex-1 h-8 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-semibold cursor-pointer border transition-all ${
                                panelModality === val
                                  ? 'bg-slate-800 border-slate-800 text-white'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <Icon size={13} /> {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="h-px bg-slate-100 mx-4" />

                  {/* Patient section — create mode or edit FREE/REQUESTED */}
                  {panelMode === 'edit' && panelSlot && (panelSlot.status === 'BOOKED' || panelSlot.status === 'CONFIRMED') && panelSlot.user ? (
                    <div className="px-4 pt-2.5 pb-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <UserPlus size={13} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paciente</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md">
                        <Check size={12} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-[12px] font-medium text-emerald-800 flex-1 truncate">{panelSlot.user.name}</span>
                      </div>
                    </div>
                  ) : ((panelMode === 'create' || (panelMode === 'edit' && panelSlot && (panelSlot.status === 'FREE' || panelSlot.status === 'REQUESTED'))) && (panelMode === 'create' ? patients.length > 0 : onAssignToPatient && patients.length > 0)) ? (
                    <div className="px-4 pt-2.5 pb-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <UserPlus size={13} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paciente {panelMode === 'create' && <span className="normal-case text-slate-400 font-normal">(opcional)</span>}</span>
                      </div>
                      <div className="relative">
                        <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <input
                          type="text"
                          placeholder="Buscar paciente..."
                          value={panelPatientSearch}
                          onChange={(e) => { setPanelPatientSearch(e.target.value); if (!e.target.value) setPanelPatientId(''); }}
                          className="w-full h-8 pl-7 pr-2 rounded-md border border-slate-200 text-[13px] font-body outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 transition-all"
                        />
                      </div>
                      {panelPatientSearch.trim() && filteredPatients.length > 0 && !panelPatientId && (
                        <div className="mt-1 bg-white rounded-md border border-slate-200 max-h-[120px] overflow-y-auto shadow-sm">
                          {filteredPatients.slice(0, 8).map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setPanelPatientId(p.id.toString()); setPanelPatientSearch(p.name); }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 transition-colors bg-transparent border-none cursor-pointer border-b border-slate-50 last:border-0"
                            >
                              <div className="text-[12px] font-semibold text-slate-700">{p.name}</div>
                              <div className="text-[10px] text-slate-400">{p.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      {panelPatientId && (
                        <div className="mt-1.5 flex items-center gap-2 px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md">
                          <Check size={12} className="text-emerald-600 flex-shrink-0" />
                          <span className="text-[12px] font-medium text-emerald-800 flex-1 truncate">{panelPatientSearch}</span>
                          <button onClick={() => { setPanelPatientId(''); setPanelPatientSearch(''); }} className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Session type + Price — create mode or edit FREE/REQUESTED */}
                  {(panelMode === 'create' || (panelMode === 'edit' && panelSlot && (panelSlot.status === 'FREE' || panelSlot.status === 'REQUESTED'))) && (
                    <>
                      <div className="h-px bg-slate-100 mx-4" />
                      <div className="px-4 pt-2.5 pb-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CreditCard size={13} className="text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Precio</span>
                        </div>
                        {panelMode === 'create' && availableSessionTypes.length > 0 && (
                          <div className="mb-2">
                            <label className="text-[11px] text-slate-500 font-medium mb-1 block">Tipo de sesion</label>
                            <select
                              value={panelSessionType}
                              onChange={(e) => {
                                const t = e.target.value;
                                setPanelSessionType(t);
                                if (t && sessionPrices) {
                                  const p = sessionPrices[t];
                                  setPanelPrice(p != null && p > 0 ? p.toString() : '');
                                } else {
                                  setPanelPrice('');
                                }
                              }}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-[13px] font-body outline-none focus:border-gantly-blue cursor-pointer bg-white"
                            >
                              <option value="">-- Seleccionar --</option>
                              {availableSessionTypes.map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} - {sessionPrices![t]}&euro;</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium mb-1 block">
                            Precio (&euro;) {panelMode === 'create' && !panelSessionType && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={panelPrice}
                            onChange={(e) => { setPanelPrice(e.target.value); if (e.target.value) setPanelSessionType(''); }}
                            placeholder="Ej: 45.00"
                            disabled={!!panelSessionType}
                            className={`w-full h-8 px-2 rounded-md border border-slate-200 text-[13px] font-body outline-none focus:border-gantly-blue transition-all ${panelSessionType ? 'bg-slate-50 text-slate-400' : 'bg-white'}`}
                          />
                        </div>
                        {panelMode === 'create' && (
                          <div className="mt-2">
                            <label className="text-[11px] text-slate-500 font-medium mb-1 block">Servicio</label>
                            <input
                              type="text"
                              value={panelService}
                              onChange={(e) => setPanelService(e.target.value)}
                              placeholder="Ej: Psicoterapia individual"
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-[13px] font-body outline-none focus:border-gantly-blue bg-white transition-all"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Payment method — create mode */}
                  {panelMode === 'create' && (
                    <>
                      <div className="h-px bg-slate-100 mx-4" />
                      <div className="px-4 pt-2.5 pb-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Wallet size={13} className="text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pago</span>
                        </div>
                        <div className="flex gap-1.5">
                          {([
                            { val: 'stripe' as const, label: 'Tarjeta' },
                            { val: 'efectivo' as const, label: 'Efectivo' },
                          ]).map(({ val, label }) => (
                            <button
                              key={val}
                              onClick={() => setPanelPaymentMethod(val)}
                              className={`flex-1 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold cursor-pointer border transition-all ${
                                panelPaymentMethod === val
                                  ? 'bg-slate-800 border-slate-800 text-white'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Recurrence — create mode, single slot only */}
                  {panelMode === 'create' && !panelRange && (
                    <>
                      <div className="h-px bg-slate-100 mx-4" />
                      <div className="px-4 pt-2.5 pb-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Repeat size={13} className="text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Repetir</span>
                        </div>
                        <select
                          value={panelRecurrence}
                          onChange={(e) => setPanelRecurrence(e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 text-[13px] font-body outline-none focus:border-gantly-blue cursor-pointer bg-white"
                        >
                          <option value="">No repetir</option>
                          <option value="WEEKLY">Semanal</option>
                          <option value="BIWEEKLY">Quincenal</option>
                          <option value="MONTHLY">Mensual</option>
                        </select>
                        {panelRecurrence && (
                          <div className="mt-2">
                            <label className="text-[11px] text-slate-500 font-medium mb-1 block">Repeticiones (1-52)</label>
                            <input
                              type="number"
                              min="2"
                              max="52"
                              value={panelRecurrenceCount}
                              onChange={(e) => setPanelRecurrenceCount(e.target.value)}
                              className="w-full h-8 px-2 rounded-md border border-slate-200 text-[13px] font-body outline-none focus:border-gantly-blue bg-white"
                            />
                            <p className="mt-1 text-[10px] text-slate-400 font-body">
                              {panelRecurrenceCount || '0'} citas {panelRecurrence === 'WEEKLY' ? 'semanales' : panelRecurrence === 'BIWEEKLY' ? 'quincenales' : 'mensuales'}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Notes — create mode */}
                  {panelMode === 'create' && (
                    <>
                      <div className="h-px bg-slate-100 mx-4" />
                      <div className="px-4 pt-2.5 pb-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FileText size={13} className="text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notas</span>
                        </div>
                        <textarea
                          value={panelCreateNotes}
                          onChange={(e) => setPanelCreateNotes(e.target.value)}
                          placeholder="Observaciones internas..."
                          rows={2}
                          className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-[13px] font-body outline-none resize-y leading-relaxed focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20 transition-all"
                        />
                      </div>
                    </>
                  )}

                  {/* Notes — edit mode for booked/confirmed */}
                  {panelMode === 'edit' && panelSlot && (panelSlot.status === 'BOOKED' || panelSlot.status === 'CONFIRMED') && panelSlot.user && (
                    <>
                      <div className="h-px bg-slate-100 mx-4" />
                      <div className="px-4 pt-2.5 pb-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FileText size={13} className="text-violet-500" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notas de sesion</span>
                        </div>
                        {panelNotesLoading ? (
                          <div className="h-20 flex items-center justify-center text-[11px] text-slate-400">Cargando notas...</div>
                        ) : (
                          <>
                            <textarea
                              value={panelNotes}
                              onChange={(e) => setPanelNotes(e.target.value.slice(0, 500))}
                              placeholder="Escribe aqui las notas de la sesion..."
                              maxLength={500}
                              rows={4}
                              className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-[13px] font-body outline-none focus:border-gantly-blue resize-none transition-all"
                            />
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-slate-400">{panelNotes.length}/500</span>
                              <button
                                onClick={handlePanelSaveNotes}
                                disabled={panelNotesSaving}
                                className="text-[11px] font-semibold text-gantly-blue hover:text-gantly-blue/80 bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {panelNotesSaving ? 'Guardando...' : 'Guardar notas'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Panel footer */}
                <div className="px-4 py-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
                  <button
                    onClick={closePanel}
                    className="flex-1 h-9 rounded-md border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold font-body cursor-pointer hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  {/* Show save button for create mode, or edit mode on FREE/REQUESTED slots */}
                  {(panelMode === 'create' || (panelMode === 'edit' && panelSlot && (panelSlot.status === 'FREE' || panelSlot.status === 'REQUESTED'))) && (
                    <button
                      onClick={handlePanelSave}
                      className="flex-1 h-9 rounded-md border-none bg-gantly-blue text-white text-[13px] font-semibold font-heading cursor-pointer hover:bg-gantly-blue/90 transition-all shadow-sm"
                    >
                      {panelMode === 'create'
                        ? panelRange ? `Crear ${panelRange.count} citas` : panelRecurrence ? `Crear ${panelRecurrenceCount || '1'} citas` : 'Crear cita'
                        : panelPatientId ? 'Asignar y guardar' : 'Guardar'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      </div>

      {/* Legend + quick actions footer */}
      <div className="px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-slate-50/80 to-gantly-cloud/30 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 md:gap-3 rounded-b-2xl">
        <div className="flex gap-1.5 md:gap-2 flex-wrap items-center">
          <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg bg-gantly-cloud/80 border border-gantly-blue/15">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-gantly-blue rounded-full shadow-sm shadow-gantly-blue/30"></div>
            <span className="font-body text-[10px] md:text-[11px] text-gantly-muted font-medium">Disponible</span>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg bg-gantly-emerald/5 border border-gantly-emerald/15">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-gantly-emerald rounded-full shadow-sm shadow-gantly-emerald/30"></div>
            <span className="font-body text-[10px] md:text-[11px] text-gantly-muted font-medium">Reservada</span>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg bg-gantly-gold/5 border border-gantly-gold/15">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-gantly-gold rounded-full shadow-sm shadow-gantly-gold/30"></div>
            <span className="font-body text-[10px] md:text-[11px] text-gantly-muted font-medium">{mode === 'USER' ? 'Mi cita' : 'Pendiente'}</span>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-300 rounded-full"></div>
            <span className="font-body text-[10px] md:text-[11px] text-gantly-muted font-medium">Cancelada</span>
          </div>
          {absences.length > 0 && (
            <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border border-slate-200/80" style={{ background: 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 3px, rgba(148,163,184,0.15) 3px, rgba(148,163,184,0.15) 6px)' }}>
              <CalendarOff size={10} className="text-slate-400" />
              <span className="font-body text-[10px] md:text-[11px] text-gantly-muted font-medium">Ausencia</span>
            </div>
          )}
        </div>
        {mode === 'PSYCHO' && (
          <div className="hidden md:flex items-center gap-2 text-[11px] text-gantly-muted font-body">
            <Info size={16} className="text-gantly-blue/60" />
            <span>Arrastra para crear varias citas a la vez</span>
          </div>
        )}
      </div>

      {/* Modal de confirmación para reservar cita */}
      {showConfirmBookModal && pendingBookSlot && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          role="dialog"
          aria-modal="true"
          aria-label="Reservar cita"
          onKeyDown={(e) => handleModalKeyDown(e, closeBookModal)}
          onClick={closeBookModal}
        >
          <div
            ref={bookModalRef}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-[450px] w-[92%] shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-5 font-heading text-xl font-bold text-gantly-text">
              Reservar esta cita?
            </h3>
            <div className="bg-gantly-cloud/50 rounded-xl p-4 mb-5 border border-slate-100">
              <div className="mb-3">
                <div className="font-body text-xs text-gantly-muted mb-1 uppercase tracking-wider font-medium">Fecha</div>
                <div className="font-body text-base font-semibold text-gantly-text">
                  {new Date(pendingBookSlot.startTime).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="mb-3">
                <div className="font-body text-xs text-gantly-muted mb-1 uppercase tracking-wider font-medium">Hora</div>
                <div className="font-body text-base font-semibold text-gantly-text">
                  {new Date(pendingBookSlot.startTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {new Date(pendingBookSlot.endTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {pendingBookSlot.price !== undefined && pendingBookSlot.price !== null && (
                <div>
                  <div className="font-body text-xs text-gantly-muted mb-1 uppercase tracking-wider font-medium">Precio</div>
                  <div className="font-heading text-xl font-bold text-gantly-blue">
                    {pendingBookSlot.price.toFixed(2)}&euro;
                  </div>
                </div>
              )}
            </div>
            <p className="m-0 mb-6 font-body text-sm text-gantly-muted leading-relaxed">
              Una vez que reserves esta cita, el psicólogo la revisará y confirmará.
              No podrás cancelar la solicitud desde aquí, pero el psicólogo podrá gestionarla.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeBookModal}
                className="px-5 h-11 border-none rounded-xl bg-transparent text-gantly-muted font-body text-sm font-medium cursor-pointer transition-all duration-200 hover:text-gantly-text hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                autoFocus
                onClick={() => {
                  if (onBook && pendingBookSlot) {
                    onBook(pendingBookSlot.id);
                    setShowConfirmBookModal(false);
                    setPendingBookSlot(null);
                  }
                }}
                className="px-6 h-11 border-none rounded-xl bg-gantly-blue text-white font-heading text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25"
              >
                Si, reservar cita
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
