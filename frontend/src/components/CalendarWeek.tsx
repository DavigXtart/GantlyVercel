import { useMemo, useState, useEffect } from 'react';
import { toast } from './ui/Toast';

type Slot = { id: number; startTime: string; endTime: string; status: 'FREE'|'REQUESTED'|'CONFIRMED'|'BOOKED'|'CANCELLED'; user?: { name: string }; price?: number };

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
  const [selectedSessionType, setSelectedSessionType] = useState<string>(''); // Tipo de sesión seleccionado
  const [pendingSlot, setPendingSlot] = useState<{ start: string; end: string } | null>(null);
  const [pendingRange, setPendingRange] = useState<{ start: string; end: string; count: number } | null>(null); // Para arrastrar múltiples citas
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

  // Mapear las citas del usuario por día/hora para identificarlas fácilmente
  const myAppointmentsByDayHour = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const apt of myAppointments) {
      const start = new Date(apt.startTime);
      const key = `${start.toDateString()}-${start.getHours()}`;
      map[key] = true;
    }
    return map;
  }, [myAppointments]);

  // Obtener precio según tipo de sesión
  const getPriceForSessionType = (sessionType: string): number | null => {
    if (!sessionPrices || !sessionType) return null;
    return sessionPrices[sessionType] ?? null;
  };

  // Obtener tipos de sesión disponibles
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
      // Para psicólogos, pedir el precio o tipo de sesión
      setPendingSlot({ start: start.toISOString(), end: end.toISOString() });
      setPendingRange(null);
      setShowPriceModal(true);
      setPriceInput('');
      setSelectedSessionType('');
      // Si hay un solo tipo de sesión disponible, seleccionarlo automáticamente
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
      // Solo permitir arrastrar en el mismo día (horizontalmente)
      const isSameDay = dragStart.day.toDateString() === dragEnd.day.toDateString();
      
      if (!isSameDay) {
        // Si es diferente día, crear solo una cita en el punto inicial
        createAt(dragStart.day, dragStart.hour);
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      }
      
      // Mismo día: determinar inicio y fin del rango
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
      // Si hay un solo tipo de sesión disponible, seleccionarlo automáticamente
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
        toast.warning('No se encontró precio para el tipo de sesión seleccionado');
        return;
      }
    } else {
      const priceStr = priceInput.trim();
      if (priceStr === '') {
        toast.warning('Por favor, selecciona un tipo de sesión o ingresa un precio');
        return;
      }
      price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) {
        toast.warning('Por favor, ingresa un precio válido (número mayor a 0)');
        return;
      }
    }
    
    if (pendingRange && onCreateSlotsRange) {
      // Crear múltiples citas (mismo día, horas consecutivas)
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
      toast.warning('Por favor, ingresa un precio válido (número mayor a 0)');
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

  const getStatusColor = (status: string, isMyAppointment: boolean = false) => {
    // Si es una cita del usuario, usar color especial (amarillo/dorado)
    if (isMyAppointment && (status === 'BOOKED' || status === 'CONFIRMED')) {
      return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', hover: '#fde68a' };
    }
    
    switch (status) {
      case 'FREE':
        return { bg: '#e0f2fe', border: '#0ea5e9', text: '#0369a1', hover: '#bae6fd' };
      case 'REQUESTED':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', hover: '#fde68a' };
      case 'CONFIRMED':
        return { bg: '#d1fae5', border: '#10b981', text: '#065f46', hover: '#a7f3d0' };
      case 'BOOKED':
        return { bg: '#dcfce7', border: '#22c55e', text: '#15803d', hover: '#bbf7d0' };
      case 'CANCELLED':
        return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', hover: '#fee2e2' };
      default:
        return { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280', hover: '#e5e7eb' };
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

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      border: '1px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 24px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => handleWeekChange(addDays(weekStart, -7))}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          ← Semana anterior
        </button>
        <div style={{ fontWeight: 600, fontSize: '18px' }}>
          {days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} - {days[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={() => handleWeekChange(addDays(weekStart, 7))}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          Semana siguiente →
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '100px repeat(7, 1fr)',
        overflowX: 'auto'
      }}>
        {/* Hour header */}
        <div style={{
          background: '#f9fafb',
          padding: '12px',
          borderRight: '2px solid #e5e7eb',
          fontWeight: 600,
          fontSize: '12px',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Hora
        </div>
        
        {/* Day headers */}
        {days.map((d, i) => (
          <div
            key={i}
            style={{
              background: isToday(d) ? 'rgba(102, 126, 234, 0.1)' : '#f9fafb',
              padding: '12px',
              borderRight: i === 6 ? 'none' : '1px solid #e5e7eb',
              borderBottom: '2px solid #e5e7eb',
              textAlign: 'center',
              fontWeight: isToday(d) ? 700 : 600,
              fontSize: '14px',
              color: isToday(d) ? '#667eea' : '#1f2937'
            }}
          >
            <div>{d.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
            <div style={{ fontSize: '18px', marginTop: '4px' }}>
              {d.toLocaleDateString('es-ES', { day: 'numeric' })}
            </div>
            {isToday(d) && (
              <div style={{
                fontSize: '10px',
                color: '#667eea',
                marginTop: '4px',
                fontWeight: 600
              }}>
                HOY
              </div>
            )}
          </div>
        ))}

        {/* Time slots */}
        {hours.map((h) => (
          <>
            <div
              key={`h-${h}`}
              style={{
                padding: '8px 12px',
                borderRight: '2px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb',
                fontSize: '13px',
                fontWeight: 500,
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map((d, ci) => {
              const key = `${d.toDateString()}-${h}`;
              const list = slotByDayHour[key] || [];
              const cellKey = `${ci}-${h}`;
              const isPastTime = isPast(d, h);
              const isHovered = hoveredCell === cellKey;
              
              return (
                <div
                  key={`c-${ci}-${h}`}
                  style={{
                    borderRight: ci === 6 ? 'none' : '1px solid #e5e7eb',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '8px',
                    minHeight: '70px',
                    background: isPastTime 
                      ? '#f9fafb' 
                      : isHovered && mode === 'PSYCHO' && onCreateSlot
                      ? '#f3f4f6'
                      : '#ffffff',
                    cursor: onCreateSlot && mode === 'PSYCHO' && !isPastTime ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
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
                  onMouseDown={(e) => {
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
                    // Solo crear slot si no se hizo clic en un botón o slot existente
                    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime && list.length === 0 && !isDragging) {
                      createAt(d, h);
                    }
                  }}
                >
                  {list.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {list.map(s => {
                        const isMyAppointment = myAppointmentsByDayHour[`${new Date(s.startTime).toDateString()}-${new Date(s.startTime).getHours()}`] && (s.status === 'BOOKED' || s.status === 'CONFIRMED' || s.status === 'REQUESTED');
                        const colors = getStatusColor(s.status, isMyAppointment);
                        return (
                          <div
                            key={s.id}
                            onClick={(e) => {
                              // Prevenir que el clic en el slot se propague al contenedor
                              e.stopPropagation();
                            }}
                            style={{
                              background: colors.bg,
                              border: `2px solid ${colors.border}`,
                              borderRadius: '8px',
                              padding: '8px 10px',
                              fontSize: '12px',
                              color: colors.text,
                              fontWeight: 500,
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                              position: 'relative',
                              zIndex: 5,
                              paddingRight: mode === 'PSYCHO' ? '32px' : '10px'
                            }}
                            onMouseEnter={(e) => {
                              if ((s.status === 'FREE' || s.status === 'REQUESTED') && mode === 'USER' && onBook) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                                  {new Date(s.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {s.user?.name && (
                                  <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                    👤 {s.user.name}
                                  </div>
                                )}
                                {!s.user && s.status === 'FREE' && (
                                  <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                    {mode === 'USER' ? '✅ Disponible' : '⏳ Libre'}
                                  </div>
                                )}
                                {s.status === 'REQUESTED' && (
                                  <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 600 }}>
                                    ⏳ Solicitud pendiente
                                  </div>
                                )}
                                {s.status === 'CONFIRMED' && (
                                  <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 600 }}>
                                    ✅ Confirmada
                                  </div>
                                )}
                                {isMyAppointment && (
                                  <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 600 }}>
                                    ⭐ Mi cita
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
                                  style={{
                                    background: colors.border,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    position: 'relative',
                                    zIndex: 10
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  {s.price !== undefined && s.price !== null 
                                    ? `Reservar ${s.price.toFixed(2)}€` 
                                    : 'Reservar'}
                                </button>
                              )}
                              {mode === 'PSYCHO' && s.price !== undefined && s.price !== null && (
                                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', fontWeight: 600 }}>
                                  {s.price.toFixed(2)}€
                                </div>
                              )}
                              {mode === 'PSYCHO' && (
                                <div style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  display: 'flex',
                                  gap: '4px',
                                  zIndex: 10,
                                  flexWrap: 'wrap'
                                }}>
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
                                      style={{
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        color: '#22c55e',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0',
                                        fontSize: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        lineHeight: '1',
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                      title="Asignar a paciente"
                                    >
                                      👤
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
                                      style={{
                                        background: 'rgba(102, 126, 234, 0.1)',
                                        color: '#667eea',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        lineHeight: '1',
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                    >
                                      ✏️
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
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        lineHeight: '1',
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                      }}
                                    >
                                      ×
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
                      <div style={{
                        color: isHovered ? '#667eea' : '#d1d5db',
                        fontSize: '11px',
                        textAlign: 'center',
                        padding: '8px',
                        borderRadius: '6px',
                        transition: 'all 0.2s',
                        background: isHovered ? 'rgba(102, 126, 234, 0.05)' : 'transparent'
                      }}>
                        {isHovered ? '✨ Click para crear' : '➕'}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>

          {/* Legend */}
          <div style={{
            padding: '16px 24px',
            background: '#f9fafb',
            borderTop: '2px solid #e5e7eb',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginRight: '8px' }}>Leyenda:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '16px', background: '#e0f2fe', border: '2px solid #0ea5e9', borderRadius: '4px' }}></div>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Disponible</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '16px', background: '#dcfce7', border: '2px solid #22c55e', borderRadius: '4px' }}></div>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Reservado</span>
            </div>
            {mode === 'USER' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '16px', background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '4px' }}></div>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Mi cita</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '16px', background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '4px' }}></div>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Cancelado</span>
            </div>
          </div>

      {/* Modal para ingresar precio */}
      {showPriceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => {
          setShowPriceModal(false);
          setPendingSlot(null);
          setPendingRange(null);
          setPriceInput('');
          setSelectedSessionType('');
          // Restaurar la semana guardada si existe
          if (savedWeekStart) {
            setWeekStart(savedWeekStart);
            setSavedWeekStart(null);
          }
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              {pendingRange ? `Crear ${pendingRange.count} citas` : 'Establecer precio de la cita'}
            </h3>
            {pendingRange && (
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
                Se crearán {pendingRange.count} citas consecutivas de 1 hora cada una.
              </p>
            )}
            {availableSessionTypes.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Tipo de sesión <span style={{ color: '#059669', fontSize: '12px' }}>(recomendado)</span>
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
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: 'white'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value="">-- Seleccionar tipo de sesión --</option>
                  {availableSessionTypes.map(type => {
                    const price = sessionPrices![type];
                    return (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} - {price}€
                      </option>
                    );
                  })}
                </select>
                {selectedSessionType && sessionPrices && sessionPrices[selectedSessionType] && (
                  <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: 500 }}>
                    ✓ Precio predefinido: {sessionPrices[selectedSessionType]}€
                  </div>
                )}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Precio (€) {!selectedSessionType && <span style={{ color: '#dc2626' }}>*</span>}
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  if (e.target.value) {
                    setSelectedSessionType(''); // Limpiar selección si se ingresa precio manual
                  }
                }}
                placeholder={selectedSessionType ? "Precio del tipo de sesión" : "Ej: 45.00"}
                required={!selectedSessionType}
                disabled={!!selectedSessionType}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: selectedSessionType ? '#f9fafb' : 'white'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                style={{
                  padding: '10px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'white';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPrice}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#667eea',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#5568d3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#667eea';
                }}
              >
                {pendingRange ? `Crear ${pendingRange.count} citas` : 'Crear cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar cita */}
      {showEditModal && editingSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => {
          setShowEditModal(false);
          setEditingSlot(null);
          setEditPriceInput('');
          // Restaurar la semana guardada si existe
          if (savedWeekStart) {
            setWeekStart(savedWeekStart);
            setSavedWeekStart(null);
          }
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Editar cita
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
              Fecha: {new Date(editingSlot.startTime).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
              Hora: {new Date(editingSlot.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(editingSlot.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Precio (€) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editPriceInput}
                onChange={(e) => setEditPriceInput(e.target.value)}
                placeholder="Ej: 45.00"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                style={{
                  padding: '10px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'white';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEdit}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#667eea',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#5568d3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#667eea';
                }}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para reservar cita */}
      {showConfirmBookModal && pendingBookSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => {
          setShowConfirmBookModal(false);
          setPendingBookSlot(null);
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
              ¿Estás seguro de querer reservar esta cita?
            </h3>
            <div style={{
              background: '#f9fafb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha:</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                  {new Date(pendingBookSlot.startTime).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Hora:</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
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
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Precio:</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#667eea' }}>
                    {pendingBookSlot.price.toFixed(2)}€
                  </div>
                </div>
              )}
            </div>
            <p style={{ 
              margin: '0 0 20px 0', 
              fontSize: '14px', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Una vez que reserves esta cita, el psicólogo la revisará y confirmará. 
              No podrás cancelar la solicitud desde aquí, pero el psicólogo podrá gestionarla.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowConfirmBookModal(false);
                  setPendingBookSlot(null);
                }}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'white';
                }}
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
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#667eea',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#5568d3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#667eea';
                }}
              >
                Sí, reservar cita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para asignar cita a paciente */}
      {showAssignModal && slotToAssign && mode === 'PSYCHO' && onAssignToPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => {
          setShowAssignModal(false);
          setSlotToAssign(null);
          setSelectedPatientId('');
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Asignar cita a paciente
            </h3>
            <div style={{
              background: '#f9fafb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha:</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                  {new Date(slotToAssign.startTime).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Hora:</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Seleccionar paciente <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: 'white'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSlotToAssign(null);
                  setSelectedPatientId('');
                }}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'white';
                }}
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
                    toast.success('Cita asignada exitosamente');
                  } catch (error: any) {
                    toast.error(error?.response?.data?.error || 'Error al asignar la cita');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#667eea',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#5568d3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#667eea';
                }}
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
