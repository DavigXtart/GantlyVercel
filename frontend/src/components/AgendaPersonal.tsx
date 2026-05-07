import { useState, useEffect } from 'react';
import { personalAgendaService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';

/** Formatea una fecha a YYYY-MM-DD usando hora local (evita el bug de toISOString en UTC) */
function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
    return formatDateLocal(new Date());
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

    // Validar fecha seleccionada (usar formato local para evitar problemas de zona horaria)
    const todayStr = formatDateLocal(new Date());
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const minDateStr = formatDateLocal(twoDaysAgo);

    if (selectedDate > todayStr) {
      toast.error('No se pueden crear entradas con fechas futuras');
      return;
    }

    if (selectedDate < minDateStr) {
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

      await personalAgendaService.saveEntry(payload);
      toast.success('Entrada guardada correctamente');
      await loadEntries(); // Recargar entradas después de guardar
      setShowCalendar(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Error al guardar la entrada';
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
    return entries.find(e => e.entryDate === formatDateLocal(date));
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
      setSelectedDate(formatDateLocal(date));
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
      <div className="flex justify-center items-center min-h-[400px]">
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
      <div className={`bg-white rounded-2xl shadow-card p-10 border border-gantly-blue-50 mx-auto animate-fade-in-up ${viewMode === 'month' ? 'max-w-[1200px]' : 'max-w-[900px]'}`}>
        {/* Header con navegacion */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h2 className="text-[28px] font-bold text-gantly-text font-heading m-0">
            Mi Agenda {viewMode === 'week' ? 'Semanal' : 'Mensual'}
          </h2>

          <div className="flex gap-3 items-center flex-wrap">
            {/* Selector de vista */}
            <div className="flex bg-slate-50 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 border-none rounded-lg cursor-pointer font-semibold text-sm transition-all duration-200 ${
                  viewMode === 'week'
                    ? 'bg-gantly-blue text-white'
                    : 'bg-transparent text-gantly-muted hover:bg-slate-100'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 border-none rounded-lg cursor-pointer font-semibold text-sm transition-all duration-200 ${
                  viewMode === 'month'
                    ? 'bg-gantly-blue text-white'
                    : 'bg-transparent text-gantly-muted hover:bg-slate-100'
                }`}
              >
                Mes
              </button>
            </div>

            {/* Boton de hoy */}
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-gray-200 text-gantly-muted border-none rounded-xl cursor-pointer font-semibold text-sm transition-all duration-300 hover:bg-gray-300 hover:scale-105"
            >
              Hoy
            </button>

            {/* Boton nueva entrada */}
            <button
              onClick={() => {
                setShowCalendar(false);
                setStep(1);
                setSelectedDate(formatDateLocal(new Date()));
                setEntryData({
                  moodRating: 0,
                  emotions: [],
                  activities: [],
                  companions: [],
                  location: '',
                  notes: ''
                });
              }}
              className="px-5 py-2.5 bg-gantly-blue text-white border-none rounded-xl cursor-pointer font-semibold text-sm transition-all duration-200 hover:bg-gantly-blue-600 hover:-translate-y-px"
            >
              + Nueva Entrada
            </button>
          </div>
        </div>

        {/* Navegacion de fecha */}
        <div className="flex justify-between items-center mb-6 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
          <button
            onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
            className="px-3.5 py-2 bg-transparent text-slate-500 border-none rounded-lg cursor-pointer font-semibold text-sm transition-all duration-200 flex items-center gap-1 hover:bg-slate-200 hover:text-slate-700"
          >
            &larr;
          </button>

          <div className="text-base font-semibold text-slate-800 text-center flex-1">
            {viewMode === 'week' ? (
              <>
                {weekDates[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} &ndash; {weekDates[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </>
            ) : (
              (() => {
                const monthDates = getMonthDates();
                if (monthDates.length === 0) return '';

                const firstDayOfMonth = monthDates.find(d => d.getDate() === 1);
                if (firstDayOfMonth) {
                  return firstDayOfMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                }

                return monthDates[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
              })()
            )}
          </div>

          <button
            onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
            className="px-3.5 py-2 bg-transparent text-slate-500 border-none rounded-lg cursor-pointer font-semibold text-sm transition-all duration-200 flex items-center gap-1 hover:bg-slate-200 hover:text-slate-700"
          >
            &rarr;
          </button>
        </div>

        {selectedEntry ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-slate-50 text-gantly-muted border border-gray-200 rounded-lg cursor-pointer font-semibold text-sm hover:bg-slate-100"
              >
                ← Volver al calendario
              </button>
              <div className="flex items-center gap-2">
                {isDateValidForEntry(new Date(selectedEntry.entryDate + 'T00:00:00')) && (
                  <button
                    onClick={() => {
                      // Pre-fill form with existing entry data for editing
                      setSelectedDate(selectedEntry.entryDate);
                      setEntryData({
                        moodRating: selectedEntry.moodRating,
                        emotions: selectedEntry.emotions ? JSON.parse(selectedEntry.emotions) : [],
                        activities: selectedEntry.activities ? JSON.parse(selectedEntry.activities) : [],
                        companions: selectedEntry.companions ? JSON.parse(selectedEntry.companions) : [],
                        location: selectedEntry.location || '',
                        notes: selectedEntry.notes || ''
                      });
                      setSelectedEntry(null);
                      setShowCalendar(false);
                      setStep(1);
                    }}
                    className="px-4 py-2 bg-gantly-blue/10 text-gantly-blue border border-gantly-blue/20 rounded-lg cursor-pointer font-semibold text-sm hover:bg-gantly-blue/20 transition-colors duration-200"
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!confirm('¿Seguro que quieres eliminar esta entrada?')) return;
                    try {
                      await personalAgendaService.deleteEntry(selectedEntry.id);
                      toast.success('Entrada eliminada');
                      setSelectedEntry(null);
                      const response = await personalAgendaService.getUserEntries();
                      setEntries(response.entries || []);
                    } catch (err: any) {
                      toast.error(err.response?.data?.error || 'Error al eliminar');
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg cursor-pointer font-semibold text-sm hover:bg-red-100 transition-colors duration-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-gray-200">
              <h3 className="text-2xl font-bold text-gantly-text mb-6 font-heading">
                {new Date(selectedEntry.entryDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>

              <div className="mb-6">
                <div className="text-lg font-semibold text-gantly-muted mb-3">
                  Estado de Animo
                </div>
                <div className="text-5xl mb-2">
                  {getMoodEmoji(selectedEntry.moodRating)}
                </div>
                <div className="text-base text-gantly-text">
                  {moods.find(m => m.value === selectedEntry.moodRating)?.label || 'N/A'}
                </div>
              </div>

              {selectedEntry.emotions && (
                <div className="mb-6">
                  <div className="text-lg font-semibold text-gantly-muted mb-3">
                    Emociones
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedEntry.emotions).map((emotion: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full text-sm font-semibold"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.activities && (
                <div className="mb-6">
                  <div className="text-lg font-semibold text-gantly-muted mb-3">
                    Actividades
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedEntry.activities).map((activity: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full text-sm font-semibold"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.companions && (
                <div className="mb-6">
                  <div className="text-lg font-semibold text-gantly-muted mb-3">
                    Con quien
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedEntry.companions).map((companion: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gantly-blue text-white rounded-full text-sm font-semibold"
                      >
                        {companion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.location && (
                <div className="mb-6">
                  <div className="text-lg font-semibold text-gantly-muted mb-3">
                    Ubicacion
                  </div>
                  <div className="text-base text-gantly-text">
                    {selectedEntry.location}
                  </div>
                </div>
              )}

              {selectedEntry.notes && (
                <div>
                  <div className="text-lg font-semibold text-gantly-muted mb-3">
                    Notas
                  </div>
                  <div className="text-base text-gantly-text leading-relaxed p-4 bg-white rounded-xl border border-gray-200">
                    {selectedEntry.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            {viewMode === 'week' ? (
              <div className="grid grid-cols-7 gap-4 mb-6">
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
                      className={`p-5 rounded-xl text-center min-h-[120px] flex flex-col justify-center items-center relative overflow-hidden transition-all duration-200
                        ${entry
                          ? 'bg-gantly-blue border-2 border-gantly-blue-600 text-white hover:-translate-y-0.5 hover:shadow-glow-blue cursor-pointer'
                          : isToday
                            ? 'bg-gantly-gold-100 border-2 border-gantly-gold-500 text-amber-800 hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                            : isValidDate
                              ? 'bg-green-50 border border-dashed border-slate-400 text-gantly-muted hover:-translate-y-0.5 hover:shadow-soft hover:bg-green-100 cursor-pointer'
                              : 'bg-slate-50 border border-slate-200 text-gantly-muted'
                        }
                        ${!isClickable ? 'cursor-default' : ''}
                      `}
                    >
                      {isToday && !entry && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          !
                        </div>
                      )}
                      <div className="text-xs font-semibold mb-2 opacity-90">
                        {dayName.toUpperCase()}
                      </div>
                      <div className="text-[28px] font-bold mb-3">
                        {dayNumber}
                      </div>
                      {entry ? (
                        <div className="text-[40px] animate-fade-in">
                          {getMoodEmoji(entry.moodRating)}
                        </div>
                      ) : isValidDate ? (
                        <div className="text-sm opacity-80 font-semibold">
                          Clic para crear
                        </div>
                      ) : (
                        <div className="text-sm opacity-60">
                          Sin registro
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2 mb-6">
                {/* Dias de la semana */}
                {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day, idx) => (
                  <div key={idx} className="p-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wide bg-slate-50 rounded-lg">
                    {day}
                  </div>
                ))}

                {/* Dias del mes */}
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
                      className={`py-3 px-2 rounded-[10px] text-center min-h-[80px] flex flex-col justify-start items-center gap-1 relative transition-all duration-200
                        ${entry
                          ? 'bg-gantly-blue border-2 border-gantly-blue-600 text-white hover:-translate-y-px hover:z-10 cursor-pointer'
                          : isToday
                            ? 'bg-gantly-gold-100 border-2 border-gantly-gold-500 text-amber-800'
                            : isValidDate && isCurrentMonth
                              ? 'bg-green-50 border border-dashed border-slate-400 text-gantly-muted hover:-translate-y-px hover:z-10 hover:bg-green-100 cursor-pointer'
                              : isCurrentMonth
                                ? 'bg-slate-50 border border-slate-200 text-gantly-muted'
                                : 'bg-slate-100 border border-slate-200 text-gray-400'
                        }
                        ${!isClickable ? 'cursor-default' : ''}
                      `}
                    >
                      <div className="text-sm font-bold">
                        {dayNumber}
                      </div>
                      {entry ? (
                        <div className="text-2xl">
                          {getMoodEmoji(entry.moodRating)}
                        </div>
                      ) : isValidDate && isCurrentMonth ? (
                        <div className="text-[10px] opacity-70 font-semibold">
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
    <div className="bg-white rounded-2xl shadow-card p-10 border border-gantly-blue-50 max-w-[800px] mx-auto">
      {/* Paso 1: Estado de animo */}
      {step === 1 && (
        <div>
          {/* Selector de fecha */}
          <div className="mb-8">
            <label className="block text-base font-semibold text-gantly-muted mb-3 text-center">
              Selecciona la fecha
            </label>
            <div className="flex justify-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={formatDateLocal(new Date())}
                min={(() => {
                  const today = new Date();
                  const twoDaysAgo = new Date(today);
                  twoDaysAgo.setDate(today.getDate() - 2);
                  return formatDateLocal(twoDaysAgo);
                })()}
                className="px-4 py-3 rounded-xl border-2 border-gantly-blue text-base text-gantly-muted font-semibold bg-white cursor-pointer min-w-[200px]"
              />
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">
              Solo puedes crear entradas para hoy o maximo 2 dias atras
            </p>
          </div>

          <h2 className="text-[28px] font-bold text-gantly-text mb-10 text-center font-heading">
            ¿Como te sientes esta tarde?
          </h2>
          <div className="flex justify-center gap-5 flex-nowrap">
            {moods.map(mood => (
              <button
                key={mood.value}
                onClick={() => {
                  setEntryData({ ...entryData, moodRating: mood.value });
                  setTimeout(() => setStep(2), 300);
                }}
                className={`flex flex-col items-center gap-3 px-5 py-6 rounded-2xl cursor-pointer transition-all duration-300 text-[64px] min-w-[120px] flex-1 border-2
                  ${entryData.moodRating === mood.value
                    ? 'text-white'
                    : 'bg-slate-50 border-transparent hover:scale-105'
                  }
                `}
                style={entryData.moodRating === mood.value
                  ? { background: `linear-gradient(135deg, ${mood.color} 0%, ${mood.color}dd 100%)`, borderColor: mood.color }
                  : undefined
                }
              >
                <span>{mood.emoji}</span>
                <span className={`text-sm font-semibold ${
                  entryData.moodRating === mood.value ? 'text-white' : 'text-gantly-muted'
                }`}>
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
          <h2 className="text-2xl font-bold text-gantly-text mb-6 text-center font-heading">
            ¿Que emociones estas experimentando?
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {emotions.map(emotion => (
              <button
                key={emotion}
                onClick={() => toggleSelection(entryData.emotions, emotion, (arr) =>
                  setEntryData({ ...entryData, emotions: arr }))}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm border-2
                  ${entryData.emotions.includes(emotion)
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-500'
                    : 'bg-slate-50 text-gantly-muted border-gray-200 hover:bg-slate-100'
                  }
                `}
              >
                {emotion}
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-gray-200 text-gantly-muted border-none rounded-xl cursor-pointer font-semibold hover:bg-gray-300"
            >
              Atras
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer font-semibold hover:from-indigo-600 hover:to-purple-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Actividades, companeros y ubicacion */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold text-gantly-text mb-6 text-center font-heading">
            ¿Que estas haciendo?
          </h2>
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {activities.map(activity => (
              <button
                key={activity}
                onClick={() => toggleSelection(entryData.activities, activity, (arr) =>
                  setEntryData({ ...entryData, activities: arr }))}
                className={`px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm border-2
                  ${entryData.activities.includes(activity)
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500'
                    : 'bg-slate-50 text-gantly-muted border-gray-200 hover:bg-slate-100'
                  }
                `}
              >
                {activity}
              </button>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-gantly-text mb-4 font-heading">
            ¿Con quien estas?
          </h3>
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {companions.map(companion => (
              <button
                key={companion}
                onClick={() => toggleSelection(entryData.companions, companion, (arr) =>
                  setEntryData({ ...entryData, companions: arr }))}
                className={`px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm border-2
                  ${entryData.companions.includes(companion)
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500'
                    : 'bg-slate-50 text-gantly-muted border-gray-200 hover:bg-slate-100'
                  }
                `}
              >
                {companion}
              </button>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-gantly-text mb-4 font-heading">
            ¿Donde estas?
          </h3>
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {locations.map(location => (
              <button
                key={location}
                onClick={() => setEntryData({ ...entryData, location })}
                className={`px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm border-2
                  ${entryData.location === location
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500'
                    : 'bg-slate-50 text-gantly-muted border-gray-200 hover:bg-slate-100'
                  }
                `}
              >
                {location}
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-gray-200 text-gantly-muted border-none rounded-xl cursor-pointer font-semibold hover:bg-gray-300"
            >
              Atras
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white border-none rounded-xl cursor-pointer font-semibold hover:from-amber-600 hover:to-orange-600"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Notas */}
      {step === 4 && (
        <div>
          <h2 className="text-2xl font-bold text-gantly-text mb-6 text-center font-heading">
            ¿Que esta haciendo que tu tarde sea {entryData.moodRating <= 2 ? 'dificil' : entryData.moodRating >= 4 ? 'genial' : 'asi'}?
          </h2>
          <textarea
            value={entryData.notes}
            onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
            placeholder="Escribe aqui..."
            className="w-full min-h-[200px] p-4 rounded-xl border-2 border-gray-200 text-base resize-y mb-6 focus:border-gantly-blue focus:outline-none"
          />
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-gray-200 text-gantly-muted border-none rounded-xl cursor-pointer font-semibold hover:bg-gray-300"
            >
              Atras
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-3 text-white border-none rounded-xl font-semibold
                ${saving
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 cursor-pointer hover:from-indigo-600 hover:to-purple-700'
                }
              `}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
