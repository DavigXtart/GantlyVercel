import { useState, useEffect } from 'react';
import { groupSessionService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';

interface GroupSession {
  id: number;
  title: string;
  description: string;
  psychologistName: string;
  maxParticipants: number;
  currentParticipants: number;
  startTime: string;
  endTime: string;
  status: string;
  jitsiRoomName: string;
}

export default function GroupSessions({ role }: { role: 'USER' | 'PSYCHOLOGIST' }) {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [mySessions, setMySessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    maxParticipants: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSessions, mySessionsList] = await Promise.all([
        groupSessionService.list(),
        groupSessionService.getMy(),
      ]);
      setSessions(allSessions);
      setMySessions(mySessionsList);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar las sesiones de grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id: number) => {
    setJoining(id);
    try {
      await groupSessionService.join(id);
      toast.success('Te has unido a la sesión de grupo');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al unirse a la sesión');
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async (id: number) => {
    setLeaving(id);
    try {
      await groupSessionService.leave(id);
      toast.success('Has salido de la sesión de grupo');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al salir de la sesión');
    } finally {
      setLeaving(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startTime || !formData.endTime) {
      toast.warning('Por favor completa todos los campos obligatorios');
      return;
    }
    setCreating(true);
    try {
      await groupSessionService.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxParticipants: formData.maxParticipants,
      });
      toast.success('Sesión de grupo creada correctamente');
      setFormData({ title: '', description: '', startTime: '', endTime: '', maxParticipants: 10 });
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear la sesión');
    } finally {
      setCreating(false);
    }
  };

  const isEnrolled = (sessionId: number): boolean => {
    return mySessions.some((s) => s.id === sessionId);
  };

  const isSessionActive = (session: GroupSession): boolean => {
    const now = new Date();
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return now >= start && now <= end && session.status === 'ACTIVE';
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string): { text: string; color: string; bg: string } => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Activa', color: '#065f46', bg: '#d1fae5' };
      case 'SCHEDULED':
        return { text: 'Programada', color: '#92400e', bg: '#fef3c7' };
      case 'COMPLETED':
        return { text: 'Completada', color: '#1e40af', bg: '#dbeafe' };
      case 'CANCELLED':
        return { text: 'Cancelada', color: '#991b1b', bg: '#fee2e2' };
      default:
        return { text: status, color: '#374151', bg: '#f3f4f6' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner color="#5a9270" text="Cargando sesiones de grupo..." />
      </div>
    );
  }

  const renderSessionCard = (session: GroupSession, isMine: boolean) => {
    const statusInfo = getStatusLabel(session.status);
    const enrolled = isEnrolled(session.id);
    const active = isSessionActive(session);

    return (
      <div
        key={session.id}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(90, 146, 112, 0.2)',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(45, 74, 62, 0.08)',
          transition: 'box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(45, 74, 62, 0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(45, 74, 62, 0.08)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <h4
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: '#1a2e22',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {session.title}
          </h4>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              color: statusInfo.color,
              background: statusInfo.bg,
              fontFamily: "'Inter', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            {statusInfo.text}
          </span>
        </div>

        {session.description && (
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#4b5563',
              lineHeight: '1.5',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {session.description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>
              Psicol.: <strong style={{ color: '#1a2e22' }}>{session.psychologistName}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>
              Inicio: <strong style={{ color: '#1a2e22' }}>{formatDateTime(session.startTime)}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>
              Fin: <strong style={{ color: '#1a2e22' }}>{formatDateTime(session.endTime)}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>
              Participantes:{' '}
              <strong style={{ color: session.currentParticipants >= session.maxParticipants ? '#991b1b' : '#1a2e22' }}>
                {session.currentParticipants}/{session.maxParticipants}
              </strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {role === 'USER' && !isMine && !enrolled && session.currentParticipants < session.maxParticipants && session.status !== 'COMPLETED' && session.status !== 'CANCELLED' && (
            <button
              onClick={() => handleJoin(session.id)}
              disabled={joining === session.id}
              style={{
                padding: '10px 20px',
                background: joining === session.id ? '#9ca3af' : '#5a9270',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: joining === session.id ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'background 0.2s ease',
              }}
            >
              {joining === session.id ? 'Uniendose...' : 'Unirme'}
            </button>
          )}

          {isMine && enrolled && session.status !== 'COMPLETED' && session.status !== 'CANCELLED' && (
            <button
              onClick={() => handleLeave(session.id)}
              disabled={leaving === session.id}
              style={{
                padding: '10px 20px',
                background: leaving === session.id ? '#9ca3af' : '#fee2e2',
                color: leaving === session.id ? '#ffffff' : '#991b1b',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: leaving === session.id ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'background 0.2s ease',
              }}
            >
              {leaving === session.id ? 'Saliendo...' : 'Salir'}
            </button>
          )}

          {enrolled && active && session.jitsiRoomName && (
            <button
              onClick={() => window.open('https://8x8.vc/gantly/' + session.jitsiRoomName, '_blank')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #5a9270, #3d7a5a)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 2px 8px rgba(90, 146, 112, 0.3)',
                transition: 'box-shadow 0.2s ease',
              }}
            >
              Unirse a videollamada
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
        padding: '40px',
        border: '1px solid rgba(90, 146, 112, 0.15)',
      }}
    >
      <h2
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#1a2e22',
          marginBottom: '32px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Sesiones de grupo
      </h2>

      {/* Create session form for psychologists */}
      {role === 'PSYCHOLOGIST' && (
        <div
          style={{
            background: '#f0faf4',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '32px',
            border: '1px solid rgba(90, 146, 112, 0.2)',
          }}
        >
          <h3
            style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a2e22',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Crear sesion de grupo
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3a5a4a',
                  marginBottom: '6px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Titulo *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Taller de ansiedad social"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(90, 146, 112, 0.3)',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#5a9270'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)'; }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3a5a4a',
                  marginBottom: '6px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Descripcion
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe de que trata la sesion..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(90, 146, 112, 0.3)',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#5a9270'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)'; }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#3a5a4a',
                    marginBottom: '6px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Fecha/hora inicio *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(90, 146, 112, 0.3)',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#5a9270'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)'; }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#3a5a4a',
                    marginBottom: '6px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Fecha/hora fin *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(90, 146, 112, 0.3)',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#5a9270'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)'; }}
                />
              </div>

              <div style={{ minWidth: '160px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#3a5a4a',
                    marginBottom: '6px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Max. participantes
                </label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 10 })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(90, 146, 112, 0.3)',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#5a9270'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.3)'; }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '12px 28px',
                  background: creating ? '#9ca3af' : '#5a9270',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'background 0.2s ease',
                }}
              >
                {creating ? 'Creando...' : 'Crear sesion de grupo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming sessions section */}
      <div style={{ marginBottom: '40px' }}>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1a2e22',
            marginBottom: '20px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Proximas sesiones
        </h3>
        {sessions.length === 0 ? (
          <EmptyState
            title="No hay sesiones programadas"
            description="Actualmente no hay sesiones de grupo disponibles. Vuelve a consultar mas tarde."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {sessions.map((session) => renderSessionCard(session, false))}
          </div>
        )}
      </div>

      {/* My sessions section */}
      <div>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1a2e22',
            marginBottom: '20px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Mis sesiones de grupo
        </h3>
        {mySessions.length === 0 ? (
          <EmptyState
            title="No tienes sesiones de grupo"
            description={
              role === 'USER'
                ? 'Unete a una sesion de grupo desde la lista de sesiones disponibles.'
                : 'Crea tu primera sesion de grupo usando el formulario de arriba.'
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {mySessions.map((session) => renderSessionCard(session, true))}
          </div>
        )}
      </div>
    </div>
  );
}
