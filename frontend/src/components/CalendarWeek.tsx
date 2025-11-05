import { useEffect, useMemo, useState } from 'react';

type Slot = { id: number; startTime: string; endTime: string; status: 'FREE'|'BOOKED'|'CANCELLED'; user?: { name: string } };

type Props = {
  mode: 'PSYCHO' | 'USER';
  slots: Slot[];
  myAppointments?: Array<{ id: number; startTime: string; endTime: string; status: string }>; // Citas reservadas por el usuario
  onCreateSlot?: (startIso: string, endIso: string) => void;
  onBook?: (appointmentId: number) => void;
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0,0,0,0);
  return date;
}

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export default function CalendarWeek({ mode, slots, myAppointments = [], onCreateSlot, onBook }: Props) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
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

  const createAt = (day: Date, hour: number) => {
    if (!onCreateSlot) return;
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    onCreateSlot(start.toISOString(), end.toISOString());
  };

  const getStatusColor = (status: string, isMyAppointment: boolean = false) => {
    // Si es una cita del usuario, usar color especial (amarillo/dorado)
    if (isMyAppointment && status === 'BOOKED') {
      return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', hover: '#fde68a' };
    }
    
    switch (status) {
      case 'FREE':
        return { bg: '#e0f2fe', border: '#0ea5e9', text: '#0369a1', hover: '#bae6fd' };
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
          onClick={() => setWeekStart(addDays(weekStart, -7))}
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
          onClick={() => setWeekStart(addDays(weekStart, 7))}
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
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={(e) => {
                    // Solo crear slot si no se hizo clic en un botón o slot existente
                    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    if (mode === 'PSYCHO' && onCreateSlot && !isPastTime && list.length === 0) {
                      createAt(d, h);
                    }
                  }}
                >
                  {list.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {list.map(s => {
                        const isMyAppointment = myAppointmentsByDayHour[`${new Date(s.startTime).toDateString()}-${new Date(s.startTime).getHours()}`] && s.status === 'BOOKED';
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
                              zIndex: 5
                            }}
                            onMouseEnter={(e) => {
                              if (s.status === 'FREE' && mode === 'USER' && onBook) {
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
                                {isMyAppointment && (
                                  <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 600 }}>
                                    ⭐ Mi cita
                                  </div>
                                )}
                              </div>
                              {mode === 'USER' && s.status === 'FREE' && onBook && !isMyAppointment && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (onBook) {
                                      onBook(s.id);
                                    }
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
                                  Reservar
                                </button>
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
    </div>
  );
}
