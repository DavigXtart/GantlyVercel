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

export default function AgendaPersonal({ onComplete }: AgendaPersonalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  const [entryData, setEntryData] = useState({
    moodRating: 0,
    emotions: [] as string[],
    activities: [] as string[],
    companions: [] as string[],
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (showCalendar) {
      loadEntries();
    }
  }, [showCalendar]);

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

  const emotions = [
    'Enojado', 'Aterrorizado', 'Pánico', 'Celoso', 'Furioso', 'Asustado',
    'Deprimido', 'Disgustado', 'Avergonzado', 'Sin esperanza', 'Vacío', 'Herido'
  ];

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
    
    setSaving(true);
    try {
      const payload: any = {
        entryDate: new Date().toISOString().split('T')[0],
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
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const getEntryForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(e => e.entryDate === dateStr);
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
    
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
        padding: '40px',
        border: '1px solid rgba(90, 146, 112, 0.15)',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#1a2e22', 
            margin: 0,
            fontFamily: "'Inter', sans-serif"
          }}>
            Mi Agenda Semanal
          </h2>
          <button
            onClick={() => {
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
            }}
            style={{
              padding: '10px 20px',
              background: '#5a9270',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4a8062';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5a9270';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Nueva Entrada
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
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {weekDates.map((date, index) => {
                const entry = getEntryForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                const dayNumber = date.getDate();
                
                return (
                  <div
                    key={index}
                    onClick={() => entry && setSelectedEntry(entry)}
                    style={{
                      padding: '16px',
                      background: entry ? 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)' : '#f8f9fa',
                      borderRadius: '12px',
                      border: isToday ? '2px solid #5a9270' : '1px solid #e5e7eb',
                      cursor: entry ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      color: entry ? '#fff' : '#3a5a4a',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (entry) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(90, 146, 112, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (entry) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', opacity: 0.8 }}>
                      {dayName.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                      {dayNumber}
                    </div>
                    {entry ? (
                      <div style={{ fontSize: '32px' }}>
                        {getMoodEmoji(entry.moodRating)}
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
