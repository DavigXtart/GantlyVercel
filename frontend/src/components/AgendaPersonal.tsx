import { useState, useEffect } from 'react';
import { personalAgendaService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';
import MoodFace, { moodColors } from './ui/MoodFace';
import { Check } from 'lucide-react';

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
    { value: 1, label: 'Muy triste', color: moodColors[1] },
    { value: 2, label: 'Triste', color: moodColors[2] },
    { value: 3, label: 'Neutral', color: moodColors[3] },
    { value: 4, label: 'Feliz', color: moodColors[4] },
    { value: 5, label: 'Muy feliz', color: moodColors[5] },
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

  const renderMoodFace = (rating: number, size = 48) => (
    <MoodFace value={rating} size={size} />
  );

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
                <div className="mb-2">
                  {renderMoodFace(selectedEntry.moodRating, 56)}
                </div>
                <div className="text-base text-gantly-text">
                  {moods.find(m => m.value === selectedEntry.moodRating)?.label || 'N/A'}
                </div>
              </div>

              {selectedEntry.emotions && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Emociones
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedEntry.emotions).map((emotion: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 bg-gantly-blue text-white rounded-full text-[13px] font-semibold"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.activities && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Actividades
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedEntry.activities).map((activity: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 bg-gantly-blue/10 text-gantly-blue rounded-full text-[13px] font-semibold"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.companions && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Con quién
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedEntry.companions).map((companion: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 bg-gantly-blue/10 text-gantly-blue rounded-full text-[13px] font-semibold"
                      >
                        {companion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.location && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Ubicación
                  </h4>
                  <div className="inline-flex px-3.5 py-1.5 bg-gantly-blue/10 text-gantly-blue rounded-full text-[13px] font-semibold">
                    {selectedEntry.location}
                  </div>
                </div>
              )}

              {selectedEntry.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Notas
                  </h4>
                  <div className="text-sm text-slate-600 leading-relaxed p-4 bg-white rounded-xl border border-slate-200">
                    {selectedEntry.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            {viewMode === 'week' ? (
              <div className="grid grid-cols-7 gap-3 mb-6">
                {weekDates.map((date, index) => {
                  const entry = getEntryForDate(date);
                  const dateStr = date.toDateString();
                  const todayStr = today.toDateString();
                  const isToday = dateStr === todayStr;
                  const isValidDate = isDateValidForEntry(date);
                  const isClickable = entry || isValidDate;
                  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                  const dayNumber = date.getDate();
                  const moodColor = entry ? moodColors[entry.moodRating] : undefined;

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`relative p-4 rounded-xl text-center min-h-[120px] flex flex-col justify-center items-center overflow-hidden transition-all duration-200
                        ${entry
                          ? 'bg-white border border-slate-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                          : isToday
                            ? 'bg-gantly-gold/5 border-2 border-gantly-gold text-amber-800 hover:-translate-y-0.5 cursor-pointer'
                            : isValidDate
                              ? 'bg-white border border-dashed border-slate-200 text-slate-400 hover:border-gantly-blue/40 hover:bg-gantly-blue/[0.02] hover:-translate-y-0.5 cursor-pointer'
                              : 'bg-slate-50/50 border border-slate-100 text-slate-300'
                        }
                        ${!isClickable ? 'cursor-default' : ''}
                      `}
                    >
                      {/* Mood color accent bar */}
                      {entry && moodColor && (
                        <div
                          className="absolute top-0 left-3 right-3 h-1 rounded-b-full"
                          style={{ backgroundColor: moodColor }}
                        />
                      )}
                      {isToday && !entry && (
                        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-gantly-gold shadow-sm shadow-gantly-gold/40" />
                      )}
                      <div className={`text-xs font-semibold mb-1.5 ${entry ? 'text-slate-400' : 'opacity-70'}`}>
                        {dayName.toUpperCase()}
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${entry ? 'text-slate-800' : ''}`}>
                        {dayNumber}
                      </div>
                      {entry ? (
                        <div className="animate-fade-in">
                          {renderMoodFace(entry.moodRating, 30)}
                        </div>
                      ) : isValidDate ? (
                        <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                          <span className="text-xs text-slate-300 leading-none">+</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-300">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5 mb-6">
                {/* Dias de la semana */}
                {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day, idx) => (
                  <div key={idx} className="py-2 text-center font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
                    {day}
                  </div>
                ))}

                {/* Dias del mes */}
                {monthDates.map((date, index) => {
                  const entry = getEntryForDate(date);
                  const dateStr = date.toDateString();
                  const todayStr = today.toDateString();
                  const isToday = dateStr === todayStr;
                  const monthDatesFirstDay = monthDates.find(d => d.getDate() === 1);
                  const targetMonth = monthDatesFirstDay ? monthDatesFirstDay.getMonth() : currentWeekStart.getMonth();
                  const isCurrentMonth = date.getMonth() === targetMonth;
                  const isValidDate = isDateValidForEntry(date);
                  const isClickable = entry || (isValidDate && isCurrentMonth);
                  const dayNumber = date.getDate();
                  const moodColor = entry ? moodColors[entry.moodRating] : undefined;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`relative rounded-xl text-center min-h-[88px] flex flex-col justify-center items-center gap-1 py-2 transition-all duration-200
                        ${entry
                          ? 'bg-white border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                          : isToday
                            ? 'bg-gantly-gold/8 border-2 border-gantly-gold text-amber-800 cursor-pointer'
                            : isValidDate && isCurrentMonth
                              ? 'bg-white border border-dashed border-slate-200 text-slate-400 hover:border-gantly-blue/40 hover:bg-gantly-blue/[0.02] cursor-pointer'
                              : isCurrentMonth
                                ? `${isWeekend ? 'bg-slate-50/40' : 'bg-white/60'} text-slate-300`
                                : 'text-slate-200'
                        }
                        ${!isClickable ? 'cursor-default' : ''}
                      `}
                    >
                      {/* Mood color accent bar */}
                      {entry && moodColor && (
                        <div
                          className="absolute top-0 left-2 right-2 h-1 rounded-b-full"
                          style={{ backgroundColor: moodColor }}
                        />
                      )}
                      {isToday && !entry && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gantly-gold" />
                      )}
                      <div className={`text-sm font-bold ${entry ? 'text-slate-800' : isToday ? 'text-amber-700' : ''}`}>
                        {dayNumber}
                      </div>
                      {entry ? (
                        <div className="mt-0.5">
                          {renderMoodFace(entry.moodRating, 28)}
                        </div>
                      ) : isValidDate && isCurrentMonth ? (
                        <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center mt-0.5">
                          <span className="text-xs text-slate-300 leading-none">+</span>
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
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-8">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-gantly-blue' : 'w-3 bg-slate-200'}`} />
            ))}
          </div>

          {/* Selector de fecha */}
          <div className="mb-8">
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
                className="px-4 py-2.5 rounded-full border border-slate-200 text-sm text-slate-600 font-medium bg-white cursor-pointer min-w-[180px] focus:border-gantly-blue focus:outline-none transition-colors"
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gantly-text mb-2 text-center font-heading">
            ¿Cómo te sientes?
          </h2>
          <p className="text-sm text-slate-400 text-center mb-10">Elige el estado que mejor te represente</p>

          <div className="flex justify-center gap-4 flex-wrap">
            {moods.map(mood => {
              const selected = entryData.moodRating === mood.value;
              return (
                <button
                  key={mood.value}
                  onClick={() => {
                    setEntryData({ ...entryData, moodRating: mood.value });
                    setTimeout(() => setStep(2), 300);
                  }}
                  className={`flex flex-col items-center gap-3 px-4 py-5 rounded-2xl cursor-pointer transition-all duration-200 min-w-[100px] border
                    ${selected
                      ? 'bg-gantly-blue/10 border-gantly-blue shadow-sm shadow-gantly-blue/15 scale-105'
                      : 'bg-white border-slate-200 hover:border-gantly-blue/30 hover:bg-gantly-blue/5 hover:scale-[1.03]'
                    }
                  `}
                >
                  <MoodFace value={mood.value} size={52} />
                  <span className={`text-xs font-semibold ${selected ? 'text-gantly-blue' : 'text-slate-500'}`}>
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Paso 2: Emociones */}
      {step === 2 && (
        <div>
          {/* Context: selected mood */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <MoodFace value={entryData.moodRating} size={28} />
            <span className="text-sm font-medium text-slate-400">
              {moods.find(m => m.value === entryData.moodRating)?.label}
            </span>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-gantly-blue' : s < step ? 'w-3 bg-gantly-blue/40' : 'w-3 bg-slate-200'}`} />
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gantly-text mb-2 text-center font-heading">
            ¿Qué emociones sientes?
          </h2>
          <p className="text-sm text-slate-400 text-center mb-8">Selecciona todas las que apliquen</p>

          <div className="flex flex-wrap gap-2.5 justify-center mb-10">
            {emotions.map(emotion => {
              const selected = entryData.emotions.includes(emotion);
              return (
                <button
                  key={emotion}
                  onClick={() => toggleSelection(entryData.emotions, emotion, (arr) =>
                    setEntryData({ ...entryData, emotions: arr }))}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-200 text-[13px] font-semibold border
                    ${selected
                      ? 'bg-gantly-blue text-white border-gantly-blue shadow-sm shadow-gantly-blue/25'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-gantly-blue/40 hover:bg-gantly-blue/5'
                    }
                  `}
                >
                  {selected && <Check size={14} strokeWidth={2.5} />}
                  {emotion}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-transparent text-slate-500 border border-slate-200 rounded-full cursor-pointer font-medium text-sm hover:bg-slate-50 transition-colors duration-200"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-gantly-gold text-gantly-navy border-none rounded-full cursor-pointer font-semibold text-sm hover:bg-gantly-gold/90 transition-colors duration-200"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Actividades, companeros y ubicacion */}
      {step === 3 && (
        <div>
          {/* Context: selected mood */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <MoodFace value={entryData.moodRating} size={28} />
            <span className="text-sm font-medium text-slate-400">
              {moods.find(m => m.value === entryData.moodRating)?.label}
            </span>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-gantly-blue' : s < step ? 'w-3 bg-gantly-blue/40' : 'w-3 bg-slate-200'}`} />
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gantly-text mb-2 text-center font-heading">
            ¿Qué estás haciendo?
          </h2>
          <p className="text-sm text-slate-400 text-center mb-6">Selecciona actividades, compañía y lugar</p>

          {/* Activities */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Actividades
            </h3>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {activities.map(activity => {
                const selected = entryData.activities.includes(activity);
                return (
                  <button
                    key={activity}
                    onClick={() => toggleSelection(entryData.activities, activity, (arr) =>
                      setEntryData({ ...entryData, activities: arr }))}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-200 text-[13px] font-semibold border
                      ${selected
                        ? 'bg-gantly-blue text-white border-gantly-blue shadow-sm shadow-gantly-blue/25'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-gantly-blue/40 hover:bg-gantly-blue/5'
                      }
                    `}
                  >
                    {selected && <Check size={14} strokeWidth={2.5} />}
                    {activity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Companions */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              ¿Con quién?
            </h3>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {companions.map(companion => {
                const selected = entryData.companions.includes(companion);
                return (
                  <button
                    key={companion}
                    onClick={() => toggleSelection(entryData.companions, companion, (arr) =>
                      setEntryData({ ...entryData, companions: arr }))}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-200 text-[13px] font-semibold border
                      ${selected
                        ? 'bg-gantly-blue text-white border-gantly-blue shadow-sm shadow-gantly-blue/25'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-gantly-blue/40 hover:bg-gantly-blue/5'
                      }
                    `}
                  >
                    {selected && <Check size={14} strokeWidth={2.5} />}
                    {companion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="mb-10">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              ¿Dónde?
            </h3>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {locations.map(loc => {
                const selected = entryData.location === loc;
                return (
                  <button
                    key={loc}
                    onClick={() => setEntryData({ ...entryData, location: loc })}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-200 text-[13px] font-semibold border
                      ${selected
                        ? 'bg-gantly-blue text-white border-gantly-blue shadow-sm shadow-gantly-blue/25'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-gantly-blue/40 hover:bg-gantly-blue/5'
                      }
                    `}
                  >
                    {selected && <Check size={14} strokeWidth={2.5} />}
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-transparent text-slate-500 border border-slate-200 rounded-full cursor-pointer font-medium text-sm hover:bg-slate-50 transition-colors duration-200"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 bg-gantly-gold text-gantly-navy border-none rounded-full cursor-pointer font-semibold text-sm hover:bg-gantly-gold/90 transition-colors duration-200"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Notas */}
      {step === 4 && (
        <div>
          {/* Context: selected mood */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <MoodFace value={entryData.moodRating} size={28} />
            <span className="text-sm font-medium text-slate-400">
              {moods.find(m => m.value === entryData.moodRating)?.label}
            </span>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-gantly-blue' : s < step ? 'w-3 bg-gantly-blue/40' : 'w-3 bg-slate-200'}`} />
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gantly-text mb-2 text-center font-heading">
            ¿Qué está haciendo que tu tarde sea {entryData.moodRating <= 2 ? 'difícil' : entryData.moodRating >= 4 ? 'genial' : 'así'}?
          </h2>
          <p className="text-sm text-slate-400 text-center mb-6">Opcional — escribe lo que quieras</p>

          <textarea
            value={entryData.notes}
            onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
            placeholder="Escribe aquí..."
            className="w-full min-h-[160px] p-5 rounded-2xl border border-slate-200 text-sm text-slate-700 resize-y mb-8 focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 focus:outline-none transition-all duration-200 placeholder:text-slate-300"
          />

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-transparent text-slate-500 border border-slate-200 rounded-full cursor-pointer font-medium text-sm hover:bg-slate-50 transition-colors duration-200"
            >
              Atrás
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2.5 text-white border-none rounded-full font-semibold text-sm transition-colors duration-200
                ${saving
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-gantly-blue cursor-pointer hover:bg-gantly-blue-600'
                }
              `}
            >
              {saving ? 'Guardando...' : 'Guardar entrada'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
