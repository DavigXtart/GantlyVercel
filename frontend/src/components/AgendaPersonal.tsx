import { useState, useEffect } from 'react';
import { personalAgendaService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';

interface AgendaPersonalProps {
  onComplete?: () => void;
}

interface DailyEntry {
  id: number;
  entryDate: string;
  moodRating: number;
  emotions: string;
  activities: string;
  companions: string;
  location: string;
  notes: string;
}

export default function AgendaPersonal({ onComplete: _onComplete }: AgendaPersonalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Inicializar con la fecha de hoy en formato YYYY-MM-DD
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [entryData, setEntryData] = useState({
    moodRating: 0,
    emotions: [] as string[],
    activities: [] as string[],
    companions: [] as string[],
    location: '',
    notes: ''
  });

  useEffect(() => {
    checkTodayEntry();
  }, []);

  useEffect(() => {
    if (showCalendar) {
      loadEntries();
    }
  }, [showCalendar, currentWeekStart]);

  // Ajustar currentWeekStart cuando cambia el modo de vista
  useEffect(() => {
    if (showCalendar && viewMode === 'month') {
      // Asegurarse de que currentWeekStart esté en el primer día del mes
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const firstDay = firstDayOfMonth.getDay();
      const startOfWeek = new Date(firstDayOfMonth);
      startOfWeek.setDate(startOfWeek.getDate() - firstDay);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Solo actualizar si es diferente
      if (startOfWeek.getTime() !== currentWeekStart.getTime()) {
        setCurrentWeekStart(startOfWeek);
      }
    }
  }, [viewMode, showCalendar]);

  const checkTodayEntry = async () => {
    try {
      setLoading(true);
      const todayResponse = await personalAgendaService.getTodayEntry();
      const allEntriesResponse = await personalAgendaService.getUserEntries();
      setEntries(allEntriesResponse.entries || []);
      
      if (todayResponse.entry) {
        // Ya hay entrada de hoy, mostrar calendario directamente
        setShowCalendar(true);
      } else {
        // No hay entrada de hoy, mostrar formulario
        setShowCalendar(false);
      }
    } catch (error: any) {
      console.error('Error verificando entrada de hoy:', error);
      // Si hay error, mostrar formulario por defecto
      setShowCalendar(false);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      const response = await personalAgendaService.getUserEntries();
      setEntries(response.entries || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar entradas');
    }
  };

  const moods = [
    { value: 1, emoji: '😢', label: 'Muy triste', color: '#667eea' },
    { value: 2, emoji: '😔', label: 'Triste', color: '#7c8fd4' },
    { value: 3, emoji: '😐', label: 'Neutral', color: '#4fd1c7' },
    { value: 4, emoji: '🙂', label: 'Feliz', color: '#48bb78' },
    { value: 5, emoji: '😄', label: 'Muy feliz', color: '#f6ad55' }
  ];

  const getEmotions = (moodRating: number): string[] => {
    if (moodRating === 1 || moodRating === 2) {
      // Emociones negativas para estados tristes
      return ['Enojado', 'Aterrorizado', 'Pánico', 'Celoso', 'Furioso', 'Asustado',
        'Deprimido', 'Disgustado', 'Avergonzado', 'Sin esperanza', 'Vacío', 'Herido'];
    } else if (moodRating === 3) {
      // Emociones neutrales
      return ['Tranquilo', 'Indiferente', 'Pensativo', 'Reflexivo', 'Sereno', 'Calmado'];
    } else {
      // Emociones positivas para estados felices
      return ['Contento', 'Alegre', 'Entusiasmado', 'Animado', 'Optimista', 'Eufórico',
        'Agradecido', 'Satisfecho', 'Tranquilo', 'Enérgico', 'Inspirado', 'Motivado'];
    }
  };

  const emotions = getEmotions(entryData.moodRating);

  const activities = ['Comiendo', 'Ejercicio', 'Pasatiempos', 'Relajándome', 'Durmiendo', 'Viajando', 'Trabajando'];
  const companions = ['Familia', 'Amigos', 'Solo', 'Pareja'];
  const locations = ['Casa', 'Exterior', 'Escuela', 'Trabajo'];

  const toggleSelection = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const handleSave = async () => {
    if (!entryData.moodRating || entryData.moodRating === 0) {
      toast.error('Por favor selecciona un estado de ánimo');
      return;
    }
    
    // Validar fecha seleccionada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    
    if (selectedDateObj > today) {
      toast.error('No se pueden crear entradas con fechas futuras');
      return;
    }
    
    if (selectedDateObj < twoDaysAgo) {
      toast.error('Solo se pueden crear entradas para hoy o máximo 2 días atrás');
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = {
        entryDate: selectedDate,
        moodRating: entryData.moodRating
      };
      
      // Solo incluir campos si tienen valor
      if (entryData.emotions && entryData.emotions.length > 0) {
        payload.emotions = JSON.stringify(entryData.emotions);
      }
      if (entryData.activities && entryData.activities.length > 0) {
        payload.activities = JSON.stringify(entryData.activities);
      }
      if (entryData.companions && entryData.companions.length > 0) {
        payload.companions = JSON.stringify(entryData.companions);
      }
      if (entryData.location && entryData.location.trim() !== '') {
        payload.location = entryData.location;
      }
      if (entryData.notes && entryData.notes.trim() !== '') {
        payload.notes = entryData.notes;
      }
      
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      
      const response = await personalAgendaService.saveEntry(payload);
      console.log('Response received:', response);
      toast.success('Entrada guardada correctamente');
      await loadEntries(); // Recargar entradas después de guardar
      setShowCalendar(true);
    } catch (error: any) {
      console.error('Error saving entry:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response data (stringified):', JSON.stringify(error.response?.data, null, 2));
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Error al guardar la entrada';
      console.error('Error message to show:', errorMessage);
      toast.error(errorMessage);
      setSaving(false);
    }
  };

  const getWeekDates = () => {
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const getMonthDates = () => {
    // currentWeekStart debería ser el domingo de la primera semana del mes que queremos mostrar
    // Encontrar el mes que estamos mostrando buscando el primer día del mes en la semana actual
    const startDate = new Date(currentWeekStart);
    startDate.setHours(0, 0, 0, 0);
    
    // Buscar el primer día del mes en las próximas 7 fechas
    let targetMonth = startDate.getMonth();
    let targetYear = startDate.getFullYear();
    
    // Si el inicio de la semana es del mes anterior, usar el mes siguiente
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      if (checkDate.getDate() === 1) {
        targetMonth = checkDate.getMonth();
        targetYear = checkDate.getFullYear();
        break;
      }
    }
    
    const firstDay = new Date(targetYear, targetMonth, 1);
    const lastDay = new Date(targetYear, targetMonth + 1, 0);
    const startOfCalendar = new Date(firstDay);
    startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());
    startOfCalendar.setHours(0, 0, 0, 0);
    
    const dates = [];
    const currentDate = new Date(startOfCalendar);
    while (currentDate <= lastDay || dates.length < 35) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      if (dates.length >= 42) break; // 6 semanas máximo
    }
    return dates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    newDate.setHours(0, 0, 0, 0);
    setCurrentWeekStart(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    // Determinar el mes que estamos mostrando actualmente
    // Buscar el primer día del mes en las próximas fechas desde currentWeekStart
    const startDate = new Date(currentWeekStart);
    startDate.setHours(0, 0, 0, 0);
    
    let targetMonth = startDate.getMonth();
    let targetYear = startDate.getFullYear();
    
    // Buscar el primer día del mes en las próximas 7 fechas
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      if (checkDate.getDate() === 1) {
        targetMonth = checkDate.getMonth();
        targetYear = checkDate.getFullYear();
        break;
      }
    }
    
    // Crear nueva fecha con el mes siguiente/anterior
    const newMonth = targetMonth + (direction === 'next' ? 1 : -1);
    const newYear = targetYear + Math.floor(newMonth / 12);
    const adjustedMonth = ((newMonth % 12) + 12) % 12;
    
    const firstDayOfNewMonth = new Date(newYear, adjustedMonth, 1);
    firstDayOfNewMonth.setHours(0, 0, 0, 0);
    
    // Calcular el domingo de la semana que contiene el primer día del mes
    const firstDay = firstDayOfNewMonth.getDay();
    const startOfWeek = new Date(firstDayOfNewMonth);
    startOfWeek.setDate(startOfWeek.getDate() - firstDay);
    startOfWeek.setHours(0, 0, 0, 0);
    
    setCurrentWeekStart(startOfWeek);
  };

  const goToToday = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    setCurrentWeekStart(startOfWeek);
  };

  const getEntryForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(e => e.entryDate === dateStr);
  };

  const isDateValidForEntry = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    
    return dateToCheck <= today && dateToCheck >= twoDaysAgo;
  };

  const handleDateClick = (date: Date) => {
    const entry = getEntryForDate(date);
    if (entry) {
      // Si hay entrada, mostrar los detalles
      setSelectedEntry(entry);
    } else if (isDateValidForEntry(date)) {
      // Si no hay entrada pero la fecha es válida, abrir formulario con esa fecha
      const dateStr = date.toISOString().split('T')[0];
      setSelectedDate(dateStr);
      setShowCalendar(false);
      setStep(1);
      setEntryData({
        moodRating: 0,
        emotions: [],
        activities: [],
        companions: [],
        location: '',
        notes: ''
      });
    }
  };

  const getMoodEmoji = (rating: number) => {
    const mood = moods.find(m => m.value === rating);
    return mood ? mood.emoji : '😐';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (showCalendar) {
    const weekDates = getWeekDates();
    const monthDates = viewMode === 'month' ? getMonthDates() : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
        padding: '40px',
        border: '1px solid rgba(90, 146, 112, 0.15)',
        maxWidth: viewMode === 'month' ? '1200px' : '900px',
        margin: '0 auto',
        animation: 'fadeIn 0.5s ease-in'
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
        
        {/* Header con navegación */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#1a2e22', 
            margin: 0,
            fontFamily: "'Inter', sans-serif"
          }}>
            Mi Agenda {viewMode === 'week' ? 'Semanal' : 'Mensual'}
          </h2>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Selector de vista */}
            <div style={{
              display: 'flex',
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px'
            }}>
              <button
                onClick={() => setViewMode('week')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'week' ? 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)' : 'transparent',
                  color: viewMode === 'week' ? '#fff' : '#3a5a4a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'month' ? 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)' : 'transparent',
                  color: viewMode === 'month' ? '#fff' : '#3a5a4a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                Mes
              </button>
            </div>
            
            {/* Botón de hoy */}
            <button
              onClick={goToToday}
              style={{
                padding: '8px 16px',
                background: '#e5e7eb',
                color: '#3a5a4a',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d1d5db';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Hoy
            </button>
            
            {/* Botón nueva entrada */}
            <button
              onClick={() => {
                setShowCalendar(false);
                setStep(1);
                // Resetear fecha a hoy al crear nueva entrada
                const today = new Date();
                setSelectedDate(today.toISOString().split('T')[0]);
                setEntryData({
                  moodRating: 0,
                  emotions: [],
                  activities: [],
                  companions: [],
                  location: '',
                  notes: ''
                });
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
              }}
            >
              + Nueva Entrada
            </button>
          </div>
        </div>

        {/* Navegación de fecha */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '16px',
          background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(90, 146, 112, 0.2)'
        }}>
          <button
            onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
            style={{
              padding: '10px 16px',
              background: '#fff',
              color: '#5a9270',
              border: '2px solid #5a9270',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '16px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a9270';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#5a9270';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ← Anterior
          </button>
          
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1a2e22',
            textAlign: 'center',
            flex: 1
          }}>
            {viewMode === 'week' ? (
              <>
                {weekDates[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} - {weekDates[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </>
            ) : (
              (() => {
                const monthDates = getMonthDates();
                if (monthDates.length === 0) return '';
                
                // Encontrar el primer día del mes actual en el array
                const firstDayOfMonth = monthDates.find(d => d.getDate() === 1);
                if (firstDayOfMonth) {
                  return firstDayOfMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                }
                
                // Fallback: usar el mes del primer día del array
                return monthDates[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
              })()
            )}
          </div>
          
          <button
            onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
            style={{
              padding: '10px 16px',
              background: '#fff',
              color: '#5a9270',
              border: '2px solid #5a9270',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '16px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a9270';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#5a9270';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Siguiente →
          </button>
        </div>

        {selectedEntry ? (
          <div>
            <button
              onClick={() => setSelectedEntry(null)}
              style={{
                padding: '8px 16px',
                background: '#f8f9fa',
                color: '#3a5a4a',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '24px',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              ← Volver al calendario
            </button>
            <div style={{
              padding: '24px',
              background: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: '#1a2e22', 
                marginBottom: '24px',
                fontFamily: "'Inter', sans-serif"
              }}>
                {new Date(selectedEntry.entryDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#3a5a4a', marginBottom: '12px' }}>
                  Estado de Ánimo
                </div>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                  {getMoodEmoji(selectedEntry.moodRating)}
                </div>
                <div style={{ fontSize: '16px', color: '#1a2e22' }}>
                  {moods.find(m => m.value === selectedEntry.moodRating)?.label || 'N/A'}
                </div>
              </div>

              {selectedEntry.emotions && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3a5a4a', marginBottom: '12px' }}>
                    Emociones
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {JSON.parse(selectedEntry.emotions).map((emotion: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 600
                        }}
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.activities && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3a5a4a', marginBottom: '12px' }}>
                    Actividades
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {JSON.parse(selectedEntry.activities).map((activity: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                          color: '#fff',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 600
                        }}
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.companions && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3a5a4a', marginBottom: '12px' }}>
                    Con quién
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {JSON.parse(selectedEntry.companions).map((companion: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          padding: '8px 16px',
                          background: '#5a9270',
                          color: '#fff',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 600
                        }}
                      >
                        {companion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.location && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3a5a4a', marginBottom: '12px' }}>
                    Ubicación
                  </div>
                  <div style={{ fontSize: '16px', color: '#1a2e22' }}>
                    {selectedEntry.location}
                  </div>
                </div>
              )}

              {selectedEntry.notes && (
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3a5a4a', marginBottom: '12px' }}>
                    Notas
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#1a2e22', 
                    lineHeight: '1.6',
                    padding: '16px',
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {selectedEntry.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ animation: 'slideIn 0.4s ease-out' }}>
            {viewMode === 'week' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {weekDates.map((date, index) => {
                  const entry = getEntryForDate(date);
                  const dateStr = date.toDateString();
                  const todayStr = today.toDateString();
                  const isToday = dateStr === todayStr;
                  const isValidDate = isDateValidForEntry(date);
                  const isClickable = entry || isValidDate;
                  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                  const dayNumber = date.getDate();
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      style={{
                        padding: '20px',
                        background: entry 
                          ? 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)' 
                          : isToday 
                            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                            : isValidDate
                              ? '#e8f5e9'
                              : '#f8f9fa',
                        borderRadius: '16px',
                        border: isToday ? '3px solid #f59e0b' : entry ? '2px solid rgba(255,255,255,0.3)' : isValidDate ? '2px dashed #5a9270' : '1px solid #e5e7eb',
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'center',
                        color: entry ? '#fff' : isToday ? '#92400e' : '#3a5a4a',
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: entry ? '0 4px 12px rgba(90, 146, 112, 0.2)' : isToday ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (entry) {
                          e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(90, 146, 112, 0.4)';
                        } else if (isToday) {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.3)';
                        } else if (isValidDate) {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(90, 146, 112, 0.3)';
                          e.currentTarget.style.background = '#c8e6c9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = entry ? '0 4px 12px rgba(90, 146, 112, 0.2)' : isToday ? '0 4px 12px rgba(245, 158, 11, 0.2)' : isValidDate ? '0 4px 12px rgba(90, 146, 112, 0.1)' : 'none';
                        if (isValidDate && !entry && !isToday) {
                          e.currentTarget.style.background = '#e8f5e9';
                        }
                      }}
                    >
                      {isToday && !entry && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#f59e0b',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          !
                        </div>
                      )}
                      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', opacity: 0.9 }}>
                        {dayName.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>
                        {dayNumber}
                      </div>
                      {entry ? (
                        <div style={{ fontSize: '40px', animation: 'fadeIn 0.5s ease-in' }}>
                          {getMoodEmoji(entry.moodRating)}
                        </div>
                      ) : isValidDate ? (
                        <div style={{ fontSize: '14px', opacity: 0.8, fontWeight: 600 }}>
                          Clic para crear
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', opacity: 0.6 }}>
                          Sin registro
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '8px',
                marginBottom: '24px'
              }}>
                {/* Días de la semana */}
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#5a9270',
                    fontSize: '14px',
                    background: '#f0f5f3',
                    borderRadius: '8px'
                  }}>
                    {day}
                  </div>
                ))}
                
                {/* Días del mes */}
                {monthDates.map((date, index) => {
                  const entry = getEntryForDate(date);
                  const dateStr = date.toDateString();
                  const todayStr = today.toDateString();
                  const isToday = dateStr === todayStr;
                  // Determinar si el día pertenece al mes que estamos mostrando
                  const monthDatesFirstDay = monthDates.find(d => d.getDate() === 1);
                  const targetMonth = monthDatesFirstDay ? monthDatesFirstDay.getMonth() : currentWeekStart.getMonth();
                  const isCurrentMonth = date.getMonth() === targetMonth;
                  const isValidDate = isDateValidForEntry(date);
                  const isClickable = entry || (isValidDate && isCurrentMonth);
                  const dayNumber = date.getDate();
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      style={{
                        padding: '12px 8px',
                        background: entry 
                          ? 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)' 
                          : isToday 
                            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                            : isValidDate && isCurrentMonth
                              ? '#e8f5e9'
                              : isCurrentMonth ? '#f8f9fa' : '#f0f0f0',
                        borderRadius: '12px',
                        border: isToday ? '2px solid #f59e0b' : entry ? '2px solid rgba(255,255,255,0.3)' : isValidDate && isCurrentMonth ? '2px dashed #5a9270' : '1px solid #e5e7eb',
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                        color: entry ? '#fff' : isToday ? '#92400e' : isCurrentMonth ? '#3a5a4a' : '#9ca3af',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        gap: '4px',
                        position: 'relative'
                      }}
                        onMouseEnter={(e) => {
                          if (entry) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.zIndex = '10';
                          } else if (isValidDate && isCurrentMonth) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.zIndex = '10';
                            e.currentTarget.style.background = '#c8e6c9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.zIndex = '1';
                          if (isValidDate && isCurrentMonth && !entry) {
                            e.currentTarget.style.background = '#e8f5e9';
                          }
                        }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>
                        {dayNumber}
                      </div>
                      {entry ? (
                        <div style={{ fontSize: '24px' }}>
                          {getMoodEmoji(entry.moodRating)}
                        </div>
                      ) : isValidDate && isCurrentMonth ? (
                        <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 600 }}>
                          +
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
      padding: '40px',
      border: '1px solid rgba(90, 146, 112, 0.15)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Paso 1: Estado de ánimo */}
      {step === 1 && (
        <div>
          {/* Selector de fecha */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '16px',
              fontWeight: 600,
              color: '#3a5a4a',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              Selecciona la fecha
            </label>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                min={(() => {
                  const today = new Date();
                  const twoDaysAgo = new Date(today);
                  twoDaysAgo.setDate(today.getDate() - 2);
                  return twoDaysAgo.toISOString().split('T')[0];
                })()}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #5a9270',
                  fontSize: '16px',
                  color: '#3a5a4a',
                  fontWeight: 600,
                  background: '#fff',
                  cursor: 'pointer',
                  minWidth: '200px'
                }}
              />
            </div>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              Solo puedes crear entradas para hoy o máximo 2 días atrás
            </p>
          </div>
          
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#1a2e22', 
            marginBottom: '40px',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }}>
            ¿Cómo te sientes esta tarde?
          </h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px',
            flexWrap: 'nowrap'
          }}>
            {moods.map(mood => (
              <button
                key={mood.value}
                onClick={() => {
                  setEntryData({ ...entryData, moodRating: mood.value });
                  setTimeout(() => setStep(2), 300);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '24px 20px',
                  background: entryData.moodRating === mood.value 
                    ? `linear-gradient(135deg, ${mood.color} 0%, ${mood.color}dd 100%)`
                    : '#f8f9fa',
                  border: entryData.moodRating === mood.value 
                    ? `2px solid ${mood.color}`
                    : '2px solid transparent',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '64px',
                  minWidth: '120px',
                  flex: '1'
                }}
                onMouseEnter={(e) => {
                  if (entryData.moodRating !== mood.value) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = `${mood.color}22`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (entryData.moodRating !== mood.value) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
              >
                <span>{mood.emoji}</span>
                <span style={{ 
                  fontSize: '14px', 
                  color: entryData.moodRating === mood.value ? '#fff' : '#3a5a4a',
                  fontWeight: 600
                }}>
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2: Emociones */}
      {step === 2 && (
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#1a2e22', 
            marginBottom: '24px',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }}>
            ¿Qué emociones estás experimentando?
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            {emotions.map(emotion => (
              <button
                key={emotion}
                onClick={() => toggleSelection(entryData.emotions, emotion, (arr) => 
                  setEntryData({ ...entryData, emotions: arr }))}
                style={{
                  padding: '16px',
                  background: entryData.emotions.includes(emotion) 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#f8f9fa',
                  color: entryData.emotions.includes(emotion) ? '#fff' : '#3a5a4a',
                  border: entryData.emotions.includes(emotion) 
                    ? '2px solid #667eea'
                    : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                {emotion}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '12px 24px',
                background: '#e5e7eb',
                color: '#3a5a4a',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Actividades, compañeros y ubicación */}
      {step === 3 && (
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#1a2e22', 
            marginBottom: '24px',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }}>
            ¿Qué estás haciendo?
          </h2>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginBottom: '32px',
            justifyContent: 'center'
          }}>
            {activities.map(activity => (
              <button
                key={activity}
                onClick={() => toggleSelection(entryData.activities, activity, (arr) => 
                  setEntryData({ ...entryData, activities: arr }))}
                style={{
                  padding: '12px 20px',
                  background: entryData.activities.includes(activity) 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                    : '#f8f9fa',
                  color: entryData.activities.includes(activity) ? '#fff' : '#3a5a4a',
                  border: entryData.activities.includes(activity) 
                    ? '2px solid #f59e0b'
                    : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                {activity}
              </button>
            ))}
          </div>

          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#1a2e22', 
            marginBottom: '16px',
            fontFamily: "'Inter', sans-serif"
          }}>
            ¿Con quién estás?
          </h3>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginBottom: '32px',
            justifyContent: 'center'
          }}>
            {companions.map(companion => (
              <button
                key={companion}
                onClick={() => toggleSelection(entryData.companions, companion, (arr) => 
                  setEntryData({ ...entryData, companions: arr }))}
                style={{
                  padding: '12px 20px',
                  background: entryData.companions.includes(companion) 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                    : '#f8f9fa',
                  color: entryData.companions.includes(companion) ? '#fff' : '#3a5a4a',
                  border: entryData.companions.includes(companion) 
                    ? '2px solid #f59e0b'
                    : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                {companion}
              </button>
            ))}
          </div>

          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#1a2e22', 
            marginBottom: '16px',
            fontFamily: "'Inter', sans-serif"
          }}>
            ¿Dónde estás?
          </h3>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginBottom: '32px',
            justifyContent: 'center'
          }}>
            {locations.map(location => (
              <button
                key={location}
                onClick={() => setEntryData({ ...entryData, location })}
                style={{
                  padding: '12px 20px',
                  background: entryData.location === location 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                    : '#f8f9fa',
                  color: entryData.location === location ? '#fff' : '#3a5a4a',
                  border: entryData.location === location 
                    ? '2px solid #f59e0b'
                    : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                {location}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: '12px 24px',
                background: '#e5e7eb',
                color: '#3a5a4a',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(4)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Notas */}
      {step === 4 && (
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#1a2e22', 
            marginBottom: '24px',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }}>
            ¿Qué está haciendo que tu tarde sea {entryData.moodRating <= 2 ? 'difícil' : entryData.moodRating >= 4 ? 'genial' : 'así'}?
          </h2>
          <textarea
            value={entryData.notes}
            onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
            placeholder="Escribe aquí..."
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontSize: '16px',
              fontFamily: "'Inter', sans-serif",
              resize: 'vertical',
              marginBottom: '24px'
            }}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setStep(3)}
              style={{
                padding: '12px 24px',
                background: '#e5e7eb',
                color: '#3a5a4a',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Atrás
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: saving 
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
