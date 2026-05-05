import { useMemo, useState, useEffect } from 'react';
import { toast } from './ui/Toast';

type Slot = { id: number; startTime: string; endTime: string; status: 'FREE'|'REQUESTED'|'CONFIRMED'|'BOOKED'|'CANCELLED'; user?: { name: string }; price?: number; paymentStatus?: string };

type SessionPrices = {
  individual?: number;
  pareja?: number;
  menores?: number;
  [key: string]: number | undefined;
};

type Patient = { id: number; name: string; email: string };

type Props = {
  mode: 'PSYCHO' | 'USER';
  slots: Slot[];
  myAppointments?: Array<{ id: number; startTime: string; endTime: string; status: string }>; // Citas reservadas por el usuario
  onCreateSlot?: (startIso: string, endIso: string, price?: number) => void;
  onCreateSlotsRange?: (slots: Array<{ start: string; end: string; price: number }>) => Promise<void>; // Para crear múltiples slots
  onBook?: (appointmentId: number) => void;
  onDeleteSlot?: (appointmentId: number) => void;
  onUpdateSlot?: (appointmentId: number, updates: { price?: number; startTime?: string; endTime?: string }) => void;
  onAssignToPatient?: (appointmentId: number, userId: number) => Promise<void>; // Para asignar cita directamente a paciente
  initialWeekStart?: Date; // Semana inicial controlada desde el padre
  onWeekChange?: (weekStart: Date) => void; // Callback cuando cambia la semana
  sessionPrices?: SessionPrices | null; // Precios predefinidos del psicólogo
  patients?: Patient[]; // Lista de pacientes para asignar citas directamente
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0,0,0,0);
  return date;
}

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export default function CalendarWeek({ mode, slots, myAppointments = [], onCreateSlot, onCreateSlotsRange, onBook, onDeleteSlot, onUpdateSlot, onAssignToPatient, initialWeekStart, onWeekChange, sessionPrices, patients = [] }: Props) {
  const [weekStart, setWeekStart] = useState(initialWeekStart || startOfWeek(new Date()));
  const [savedWeekStart, setSavedWeekStart] = useState<Date | null>(null); // Guardar semana al abrir modal (solo para cancelar)

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
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState<string>(''); // Tipo de sesion seleccionado
  const [pendingSlot, setPendingSlot] = useState<{ start: string; end: string } | null>(null);
  const [pendingRange, setPendingRange] = useState<{ start: string; end: string; count: number } | null>(null); // Para arrastrar multiples citas
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: Date; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: Date; hour: number } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [showConfirmBookModal, setShowConfirmBookModal] = useState(false);
  const [pendingBookSlot, setPendingBookSlot] = useState<Slot | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [slotToAssign, setSlotToAssign] = useState<Slot | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>('');
  const hours = Array.from({ length: 13 }).map((_, i) => 8 + i); // 8:00 - 20:00
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

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

  // Obtener precio segun tipo de sesion
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
      // Guardar la semana actual antes de abrir el modal
      setSavedWeekStart(new Date(weekStart));
      // Para psicologos, pedir el precio o tipo de sesion
      setPendingSlot({ start: start.toISOString(), end: end.toISOString() });
      setPendingRange(null);
      setShowPriceModal(true);
      setPriceInput('');
      setSelectedSessionType('');
      // Si hay un solo tipo de sesion disponible, seleccionarlo automaticamente
      if (availableSessionTypes.length === 1 && sessionPrices) {
        const singleType = availableSessionTypes[0];
        setSelectedSessionType(singleType);
        const price = sessionPrices[singleType];
        if (price) {
          setPriceInput(price.toString());
        }
      }
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
      setPendingRange({ start: start.toISOString(), end: end.toISOString(), count: totalSlots });
      setShowPriceModal(true);
      setPriceInput('');
      setSelectedSessionType('');
      // Si hay un solo tipo de sesion disponible, seleccionarlo automaticamente
      if (availableSessionTypes.length === 1 && sessionPrices) {
        const singleType = availableSessionTypes[0];
        setSelectedSessionType(singleType);
        const price = sessionPrices[singleType];
        if (price) {
          setPriceInput(price.toString());
        }
      }
      } else {
        // Crear una sola cita
        createAt(dragStart.day, dragStart.hour);
      }

      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  };

  const handleConfirmPrice = async () => {
    // Determinar precio
    let price: number | null = null;

    if (selectedSessionType) {
      price = getPriceForSessionType(selectedSessionType);
      if (price === null) {
        toast.warning('No se encontro precio para el tipo de sesion seleccionado');
        return;
      }
    } else {
      const priceStr = priceInput.trim();
      if (priceStr === '') {
        toast.warning('Por favor, selecciona un tipo de sesion o ingresa un precio');
        return;
      }
      price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) {
        toast.warning('Por favor, ingresa un precio valido (numero mayor a 0)');
        return;
      }
    }

    if (pendingRange && onCreateSlotsRange) {
      // Crear multiples citas (mismo dia, horas consecutivas)
      const start = new Date(pendingRange.start);
      const end = new Date(pendingRange.end);
      const slots: Array<{ start: string; end: string; price: number }> = [];

      let current = new Date(start);
      while (current < end) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current);
        slotEnd.setHours(slotEnd.getHours() + 1);

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          price: price!
        });

        current.setHours(current.getHours() + 1);
        if (current >= end) break;
      }

      if (slots.length > 0) {
        const slotDate = new Date(slots[0].start);
        const slotWeekStart = startOfWeek(slotDate);
        handleWeekChange(slotWeekStart);

        try {
          await onCreateSlotsRange(slots);
          setShowPriceModal(false);
          setPendingRange(null);
          setPendingSlot(null);
          setPriceInput('');
          setSelectedSessionType('');
          setSavedWeekStart(null);
        } catch (error) {
          // El error ya se maneja en el componente padre
        }
      } else {
        toast.warning('No se pudieron crear citas en el rango seleccionado');
      }
    } else if (pendingSlot && onCreateSlot) {
      // Crear una sola cita
      const slotDate = new Date(pendingSlot.start);
      const slotWeekStart = startOfWeek(slotDate);
      handleWeekChange(slotWeekStart);

      onCreateSlot(pendingSlot.start, pendingSlot.end, price!);
      setShowPriceModal(false);
      setPendingSlot(null);
      setPriceInput('');
      setSelectedSessionType('');
      setSavedWeekStart(null);
    }
  };

  const handleEditSlot = (slot: Slot) => {
    setEditingSlot(slot);
    setEditPriceInput(slot.price?.toString() || '');
    setSavedWeekStart(new Date(weekStart));
    setShowEditModal(true);
  };

  const handleConfirmEdit = () => {
    if (!onUpdateSlot || !editingSlot) return;

    const priceStr = editPriceInput.trim();

    if (priceStr === '') {
      toast.warning('El precio es obligatorio.');
      return;
    }

    const price = parseFloat(priceStr);

    if (isNaN(price) || price <= 0) {
      toast.warning('Por favor, ingresa un precio valido (numero mayor a 0)');
      return;
    }

    onUpdateSlot(editingSlot.id, { price });
    setShowEditModal(false);
    setEditingSlot(null);
    setEditPriceInput('');
    // Restaurar la semana guardada si existe
    if (savedWeekStart) {
      handleWeekChange(savedWeekStart);
      setSavedWeekStart(null);
    }
  };

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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date, hour: number) => {
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    return slotTime < new Date();
  };

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Gradient accent strip */}
      <div className="h-1.5 bg-gradient-to-r from-gantly-blue via-gantly-cyan to-gantly-emerald"></div>

      {/* Premium Summary Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        {/* Top row: navigation + date */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleWeekChange(addDays(weekStart, -7))}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gantly-cloud hover:bg-gantly-blue hover:text-white cursor-pointer transition-all duration-200 text-gantly-muted border-none shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <div className="text-center">
            <span className="font-heading text-xl font-bold text-gantly-text tracking-tight">
              {days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} &ndash; {days[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <button
            onClick={() => handleWeekChange(addDays(weekStart, 7))}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gantly-cloud hover:bg-gantly-blue hover:text-white cursor-pointer transition-all duration-200 text-gantly-muted border-none shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gantly-cloud/60 rounded-xl px-4 py-3 border border-gantly-blue/10 group hover:border-gantly-blue/30 transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-base text-gantly-blue">event_available</span>
              <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Disponibles</span>
            </div>
            <div className="font-heading text-2xl font-bold text-gantly-blue">{weekStats.free}</div>
          </div>
          <div className="bg-gantly-emerald/5 rounded-xl px-4 py-3 border border-gantly-emerald/10 group hover:border-gantly-emerald/30 transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-base text-gantly-emerald">check_circle</span>
              <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Reservadas</span>
            </div>
            <div className="font-heading text-2xl font-bold text-gantly-emerald">{weekStats.booked}</div>
          </div>
          <div className="bg-gantly-gold/5 rounded-xl px-4 py-3 border border-gantly-gold/10 group hover:border-gantly-gold/30 transition-all duration-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-base text-gantly-gold">pending</span>
              <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Pendientes</span>
            </div>
            <div className="font-heading text-2xl font-bold text-yellow-700">{weekStats.pending}</div>
          </div>
          {mode === 'PSYCHO' && (
            <div className="rounded-xl px-4 py-3 border border-gantly-blue/10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 30%, #48C6D4 65%, #78D4B0 100%)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-base text-white/80">payments</span>
                <span className="font-body text-[11px] uppercase tracking-wider text-white/70 font-medium">Ingresos sem.</span>
              </div>
              <div className="font-heading text-2xl font-bold text-white">{weekStats.revenue.toFixed(0)}&euro;</div>
            </div>
          )}
          {mode === 'USER' && (
            <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-base text-gantly-muted">calendar_month</span>
                <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Total</span>
              </div>
              <div className="font-heading text-2xl font-bold text-gantly-text">{weekStats.total}</div>
            </div>
          )}
        </div>

        {/* Occupancy progress bar (psycho mode) */}
        {mode === 'PSYCHO' && weekStats.total > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="font-body text-xs text-gantly-muted font-medium">Ocupación:</span>
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

      {/* Calendar Grid */}
      <div className="grid overflow-x-auto" style={{ gridTemplateColumns: '72px repeat(7, 1fr)' }}>
        {/* Hour header */}
        <div className="bg-slate-50/60 px-2 py-3 border-r border-slate-100/80 flex items-end justify-center">
          <span className="material-symbols-outlined text-base text-gantly-muted/60">schedule</span>
        </div>

        {/* Day headers */}
        {days.map((d, i) => {
          const todayCol = isToday(d);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          // Count slots for this day
          const daySlots = slots.filter(s => new Date(s.startTime).toDateString() === d.toDateString());
          const dayFree = daySlots.filter(s => s.status === 'FREE').length;
          const dayBooked = daySlots.filter(s => s.status === 'BOOKED' || (s.status === 'CONFIRMED' && s.paymentStatus === 'PAID')).length;

          return (
            <div
              key={i}
              className={`px-2 py-3 text-center border-b ${i < 6 ? 'border-r border-slate-100/80' : ''} ${todayCol ? 'bg-gradient-to-b from-gantly-blue/8 to-gantly-blue/3 border-b-2 border-b-gantly-blue' : 'bg-slate-50/50 border-slate-100/80'} transition-colors duration-200`}
            >
              <div className={`font-body text-[10px] uppercase tracking-widest font-semibold ${isWeekend ? 'text-slate-400' : todayCol ? 'text-gantly-blue' : 'text-gantly-muted'}`}>
                {d.toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
              <div className="mt-1 flex items-center justify-center">
                {todayCol ? (
                  <span className="w-9 h-9 flex items-center justify-center rounded-full text-white font-heading font-bold text-base shadow-lg shadow-gantly-blue/25 mx-auto" style={{ background: 'linear-gradient(135deg, #2E93CC, #22D3EE)' }}>
                    {d.toLocaleDateString('es-ES', { day: 'numeric' })}
                  </span>
                ) : (
                  <span className={`font-heading font-bold text-lg ${isWeekend ? 'text-slate-400' : 'text-gantly-text'}`}>
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
          <>
            <div
              key={`h-${h}`}
              className="px-2 py-2 border-r border-slate-100/80 border-b border-slate-100/80 bg-slate-50/40 text-[11px] text-gantly-muted/80 font-body font-semibold flex items-center justify-center tabular-nums"
            >
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map((d, ci) => {
              const key = `${d.toDateString()}-${h}`;
              const list = slotByDayHour[key] || [];
              const cellKey = `${ci}-${h}`;
              const isPastTime = isPast(d, h);
              const isHovered = hoveredCell === cellKey;
              const isTodayCol = isToday(d);

              return (
                <div
                  key={`c-${ci}-${h}`}
                  className={`border-b border-slate-100/80 ${ci < 6 ? 'border-r border-slate-100/80' : ''} p-1.5 min-h-[68px] relative transition-colors duration-200 ${
                    isPastTime
                      ? 'bg-slate-50/60'
                      : isTodayCol
                        ? 'bg-gantly-cloud/40'
                        : isHovered && mode === 'PSYCHO' && onCreateSlot
                          ? 'bg-gantly-blue/5'
                          : 'bg-white'
                  } ${onCreateSlot && mode === 'PSYCHO' && !isPastTime ? 'cursor-pointer' : ''}`}
                  onMouseEnter={() => {
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime) {
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
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime && list.length === 0 && !isDragging) {
                      handleMouseDown(d, h);
                    }
                  }}
                  onMouseUp={() => {
                    if (isDragging) {
                      handleMouseUp();
                    }
                  }}
                  onClick={(e) => {
                    // Solo crear slot si no se hizo clic en un boton o slot existente
                    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime && list.length === 0 && !isDragging) {
                      createAt(d, h);
                    }
                  }}
                >
                  {list.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {list.map(s => {
                        const isMyAppointment = myAppointmentsByDayHour[`${new Date(s.startTime).toDateString()}-${new Date(s.startTime).getHours()}`] && (s.status === 'BOOKED' || s.status === 'CONFIRMED' || s.status === 'REQUESTED');
                        const statusClasses = getStatusClasses(s.status, isMyAppointment, s.paymentStatus);
                        const colors = getStatusColor(s.status, isMyAppointment, s.paymentStatus);
                        return (
                          <div
                            key={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className={`${statusClasses} border rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-200 relative group/slot ${
                              (s.status === 'FREE' || s.status === 'REQUESTED') && mode === 'USER' && onBook ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : 'hover:shadow-md'
                            } ${mode === 'PSYCHO' ? 'pr-8' : ''}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-body font-semibold text-[11px]">
                                  {new Date(s.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
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
                                        setSlotToAssign(s);
                                        setSelectedPatientId('');
                                        setShowAssignModal(true);
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                      }}
                                      className="w-[18px] h-[18px] flex items-center justify-center rounded bg-gantly-emerald/10 text-gantly-emerald border-none text-[10px] cursor-pointer transition-all duration-200 hover:bg-gantly-emerald/20 hover:scale-110"
                                      title="Asignar a paciente"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">person_add</span>
                                    </button>
                                  )}
                                  {onUpdateSlot && (s.status === 'FREE' || s.status === 'REQUESTED') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleEditSlot(s);
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                      }}
                                      className="w-[18px] h-[18px] flex items-center justify-center rounded bg-gantly-blue/10 text-gantly-blue border-none text-[11px] cursor-pointer transition-all duration-200 hover:bg-gantly-blue/20 hover:scale-110"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">edit</span>
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
                                      <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    mode === 'PSYCHO' && onCreateSlot && !isPastTime && (
                      <div className={`flex items-center justify-center h-full min-h-[52px] rounded-xl transition-all duration-200 ${
                        isHovered ? 'bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/5 border border-dashed border-gantly-blue/30 scale-[0.97]' : ''
                      }`}>
                        {isHovered ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="material-symbols-outlined text-lg text-gantly-blue">add_circle</span>
                            <span className="text-[9px] font-semibold text-gantly-blue/70">Nueva</span>
                          </div>
                        ) : (
                          <span className="material-symbols-outlined text-sm text-slate-200">add</span>
                        )}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Legend + quick actions footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50/80 to-gantly-cloud/30 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3 rounded-b-2xl">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gantly-cloud/80 border border-gantly-blue/15">
            <div className="w-2.5 h-2.5 bg-gantly-blue rounded-full shadow-sm shadow-gantly-blue/30"></div>
            <span className="font-body text-[11px] text-gantly-muted font-medium">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gantly-emerald/5 border border-gantly-emerald/15">
            <div className="w-2.5 h-2.5 bg-gantly-emerald rounded-full shadow-sm shadow-gantly-emerald/30"></div>
            <span className="font-body text-[11px] text-gantly-muted font-medium">Reservada</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gantly-gold/5 border border-gantly-gold/15">
            <div className="w-2.5 h-2.5 bg-gantly-gold rounded-full shadow-sm shadow-gantly-gold/30"></div>
            <span className="font-body text-[11px] text-gantly-muted font-medium">{mode === 'USER' ? 'Mi cita' : 'Pendiente'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
            <span className="font-body text-[11px] text-gantly-muted font-medium">Cancelada</span>
          </div>
        </div>
        {mode === 'PSYCHO' && (
          <div className="flex items-center gap-2 text-[11px] text-gantly-muted font-body">
            <span className="material-symbols-outlined text-sm text-gantly-blue/60">info</span>
            <span>Arrastra para crear varias citas a la vez</span>
          </div>
        )}
      </div>

      {/* Modal para ingresar precio */}
      {showPriceModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => {
            setShowPriceModal(false);
            setPendingSlot(null);
            setPendingRange(null);
            setPriceInput('');
            setSelectedSessionType('');
            if (savedWeekStart) {
              setWeekStart(savedWeekStart);
              setSavedWeekStart(null);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-[450px] w-[90%] shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-5 font-heading text-xl font-bold text-gantly-text">
              {pendingRange ? `Crear ${pendingRange.count} citas` : 'Establecer precio de la cita'}
            </h3>
            {pendingRange && (
              <p className="m-0 mb-5 font-body text-sm text-gantly-muted leading-relaxed">
                Se crearan {pendingRange.count} citas consecutivas de 1 hora cada una.
              </p>
            )}
            {availableSessionTypes.length > 0 && (
              <div className="mb-5">
                <label className="block mb-2 font-body text-sm font-semibold text-gantly-text">
                  Tipo de sesion <span className="text-gantly-emerald text-xs font-medium">(recomendado)</span>
                </label>
                <select
                  value={selectedSessionType}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    setSelectedSessionType(selectedType);
                    if (selectedType && sessionPrices) {
                      const price = sessionPrices[selectedType];
                      if (price != null && price > 0) {
                        setPriceInput(price.toString());
                      } else {
                        setPriceInput('');
                      }
                    } else {
                      setPriceInput('');
                    }
                  }}
                  className="w-full h-12 px-3 border-2 border-slate-200 rounded-xl font-body text-base outline-none transition-all duration-200 bg-white focus:border-gantly-blue cursor-pointer"
                >
                  <option value="">-- Seleccionar tipo de sesion --</option>
                  {availableSessionTypes.map(type => {
                    const price = sessionPrices![type];
                    return (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} - {price}&euro;
                      </option>
                    );
                  })}
                </select>
                {selectedSessionType && sessionPrices && sessionPrices[selectedSessionType] && (
                  <div className="font-body text-xs text-gantly-emerald mt-1.5 font-medium">
                    Precio predefinido: {sessionPrices[selectedSessionType]}&euro;
                  </div>
                )}
              </div>
            )}
            <div className="mb-6">
              <label className="block mb-2 font-body text-sm font-semibold text-gantly-text">
                Precio (&euro;) {!selectedSessionType && <span className="text-red-600">*</span>}
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  if (e.target.value) {
                    setSelectedSessionType('');
                  }
                }}
                placeholder={selectedSessionType ? "Precio del tipo de sesion" : "Ej: 45.00"}
                required={!selectedSessionType}
                disabled={!!selectedSessionType}
                className={`w-full h-12 px-3 border-2 border-slate-200 rounded-xl font-body text-base outline-none transition-all duration-200 focus:border-gantly-blue ${selectedSessionType ? 'bg-slate-50' : 'bg-white'}`}
                autoFocus={!selectedSessionType}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmPrice();
                  } else if (e.key === 'Escape') {
                    setShowPriceModal(false);
                    setPendingSlot(null);
                    setPendingRange(null);
                    setPriceInput('');
                    setSelectedSessionType('');
                  }
                }}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setPendingSlot(null);
                  setPendingRange(null);
                  setPriceInput('');
                  setSelectedSessionType('');
                  if (savedWeekStart) {
                    setWeekStart(savedWeekStart);
                    setSavedWeekStart(null);
                  }
                }}
                className="px-5 h-11 border-none rounded-xl bg-transparent text-gantly-muted font-body text-sm font-medium cursor-pointer transition-all duration-200 hover:text-gantly-text hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPrice}
                className="px-6 h-11 border-none rounded-xl bg-gantly-blue text-white font-heading text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25"
              >
                {pendingRange ? `Crear ${pendingRange.count} citas` : 'Crear cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar cita */}
      {showEditModal && editingSlot && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => {
            setShowEditModal(false);
            setEditingSlot(null);
            setEditPriceInput('');
            if (savedWeekStart) {
              setWeekStart(savedWeekStart);
              setSavedWeekStart(null);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-[400px] w-[90%] shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-5 font-heading text-xl font-bold text-gantly-text">
              Editar cita
            </h3>
            <div className="bg-gantly-cloud/50 rounded-xl p-4 mb-5 border border-slate-100">
              <p className="m-0 mb-2 font-body text-sm text-gantly-muted">
                <span className="font-semibold text-gantly-text">Fecha:</span> {new Date(editingSlot.startTime).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="m-0 font-body text-sm text-gantly-muted">
                <span className="font-semibold text-gantly-text">Hora:</span> {new Date(editingSlot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(editingSlot.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-body text-sm font-semibold text-gantly-text">
                Precio (&euro;) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editPriceInput}
                onChange={(e) => setEditPriceInput(e.target.value)}
                placeholder="Ej: 45.00"
                required
                className="w-full h-12 px-3 border-2 border-slate-200 rounded-xl font-body text-base outline-none transition-all duration-200 focus:border-gantly-blue"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmEdit();
                  } else if (e.key === 'Escape') {
                    setShowEditModal(false);
                    setEditingSlot(null);
                    setEditPriceInput('');
                    if (savedWeekStart) {
                      setWeekStart(savedWeekStart);
                      setSavedWeekStart(null);
                    }
                  }
                }}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSlot(null);
                  setEditPriceInput('');
                  if (savedWeekStart) {
                    setWeekStart(savedWeekStart);
                    setSavedWeekStart(null);
                  }
                }}
                className="px-5 h-11 border-none rounded-xl bg-transparent text-gantly-muted font-body text-sm font-medium cursor-pointer transition-all duration-200 hover:text-gantly-text hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-6 h-11 border-none rounded-xl bg-gantly-blue text-white font-heading text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmacion para reservar cita */}
      {showConfirmBookModal && pendingBookSlot && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => {
            setShowConfirmBookModal(false);
            setPendingBookSlot(null);
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-[450px] w-[90%] shadow-2xl border border-slate-100"
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
              Una vez que reserves esta cita, el psicologo la revisara y confirmara.
              No podras cancelar la solicitud desde aqui, pero el psicologo podra gestionarla.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmBookModal(false);
                  setPendingBookSlot(null);
                }}
                className="px-5 h-11 border-none rounded-xl bg-transparent text-gantly-muted font-body text-sm font-medium cursor-pointer transition-all duration-200 hover:text-gantly-text hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
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

      {/* Modal para asignar cita a paciente */}
      {showAssignModal && slotToAssign && mode === 'PSYCHO' && onAssignToPatient && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => {
            setShowAssignModal(false);
            setSlotToAssign(null);
            setSelectedPatientId('');
            setPatientSearchTerm('');
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-[450px] w-[90%] shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-5 font-heading text-xl font-bold text-gantly-text">
              Asignar cita a paciente
            </h3>
            <div className="bg-gantly-cloud/50 rounded-xl p-4 mb-5 border border-slate-100">
              <div className="mb-3">
                <div className="font-body text-xs text-gantly-muted mb-1 uppercase tracking-wider font-medium">Fecha</div>
                <div className="font-body text-base font-semibold text-gantly-text">
                  {new Date(slotToAssign.startTime).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <div className="font-body text-xs text-gantly-muted mb-1 uppercase tracking-wider font-medium">Hora</div>
                <div className="font-body text-base font-semibold text-gantly-text">
                  {new Date(slotToAssign.startTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {new Date(slotToAssign.endTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-body text-sm font-semibold text-gantly-text">
                Seleccionar paciente <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full h-12 px-3 border-2 border-slate-200 rounded-xl font-body text-base outline-none transition-all duration-200 bg-white focus:border-gantly-blue cursor-pointer"
                autoFocus
              >
                <option value="">-- Seleccionar paciente --</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id.toString()}>
                    {patient.name} ({patient.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSlotToAssign(null);
                  setSelectedPatientId('');
                  setPatientSearchTerm('');
                }}
                className="px-5 h-11 border-none rounded-xl bg-transparent text-gantly-muted font-body text-sm font-medium cursor-pointer transition-all duration-200 hover:text-gantly-text hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!selectedPatientId) {
                    toast.warning('Por favor, selecciona un paciente');
                    return;
                  }
                  try {
                    await onAssignToPatient(slotToAssign.id, parseInt(selectedPatientId));
                    setShowAssignModal(false);
                    setSlotToAssign(null);
                    setSelectedPatientId('');
                    setPatientSearchTerm('');
                    toast.success('Cita asignada exitosamente');
                  } catch (error: any) {
                    toast.error(error?.response?.data?.error || 'Error al asignar la cita');
                  }
                }}
                className="px-6 h-11 border-none rounded-xl bg-gantly-blue text-white font-heading text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25"
              >
                Asignar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
