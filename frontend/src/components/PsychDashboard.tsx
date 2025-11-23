import { useEffect, useState, useCallback, useRef } from 'react';
import { profileService, psychService, calendarService, tasksService, adminService, assignedTestsService, testService, jitsiService } from '../services/api';
import ChatWidget from './ChatWidget';
import CalendarWeek from './CalendarWeek';
import JitsiVideoCall from './JitsiVideoCall';
import { generateJitsiRoomName } from '../lib/utils';

type Tab = 'perfil' | 'pacientes' | 'calendario' | 'tareas' | 'chat' | 'tests-asignados';

export default function PsychDashboard() {
  const [tab, setTab] = useState<Tab>('perfil');
  const [me, setMe] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', gender: '', age: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ userId: '', title: '', description: '', dueDate: '' });
  const [showAssignTestForm, setShowAssignTestForm] = useState(false);
  const [assignTestForm, setAssignTestForm] = useState({ userId: '', testId: '' });
  const [taskFiles, setTaskFiles] = useState<Record<number, any[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
  const [selectedPatientForTasks, setSelectedPatientForTasks] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskComments, setTaskComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState<string>('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState<string | null>(null);
  const [videoCallOtherUser, setVideoCallOtherUser] = useState<{ email: string; name: string } | null>(null);
  
  // Ref para mantener el componente montado incluso si showVideoCall cambia temporalmente
  const videoCallRef = useRef<{ room: string | null; user: any; otherUser: any } | null>(null);
  
  // Actualizar ref cuando hay una videollamada activa
  useEffect(() => {
    if (showVideoCall && videoCallRoom && me) {
      videoCallRef.current = { room: videoCallRoom, user: me, otherUser: videoCallOtherUser };
    }
  }, [showVideoCall, videoCallRoom, me, videoCallOtherUser]);
  
  // Función estable de cierre que solo se ejecuta manualmente
  const handleVideoCallClose = useCallback(() => {
    // Solo cerrar cuando el usuario hace clic explícitamente
    videoCallRef.current = null; // Limpiar ref
    setShowVideoCall(false);
    setVideoCallRoom(null);
    setVideoCallOtherUser(null);
  }, []);

  const loadData = async () => {
    try {
      const m = await profileService.me();
      setMe(m);
      setEditForm({ name: m?.name || '', gender: m?.gender || '', age: m?.age?.toString() || '' });
      const p = await psychService.patients();
      setPatients(p);
      const t = await tasksService.list();
      setTasks(t);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos. Por favor recarga la página.');
    }
    
    // Cargar tests asignados de forma asíncrona y no bloqueante
    setTimeout(async () => {
      try {
        const at = await assignedTestsService.list();
        setAssignedTests(at || []);
      } catch (error: any) {
        console.error('Error cargando tests asignados (no crítico):', error);
        setAssignedTests([]);
      }
    }, 100);
    
    // Cargar tests disponibles de forma asíncrona y no bloqueante
    setTimeout(async () => {
      try {
        const tests = await testService.list();
        const activeTests = (tests || []).filter((t: any) => t.active !== false);
        setAvailableTests(activeTests);
      } catch (error: any) {
        console.error('Error cargando tests disponibles (no crítico):', error);
        setAvailableTests([]);
      }
    }, 200);
  };

  const loadTaskFiles = async (taskId: number) => {
    try {
      const files = await tasksService.getFiles(taskId);
      setTaskFiles((prev) => ({ ...prev, [taskId]: files }));
    } catch (error) {
      console.error('Error cargando archivos de tarea:', error);
    }
  };

  const loadTaskDetails = async (taskId: number) => {
    try {
      const task = await tasksService.get(taskId);
      setSelectedTask(task);
      await loadTaskFiles(taskId);
      await loadTaskComments(taskId);
    } catch (error) {
      console.error('Error cargando detalles de tarea:', error);
      alert('Error al cargar los detalles de la tarea');
    }
  };

  const loadTaskComments = async (taskId: number) => {
    try {
      const comments = await tasksService.getComments(taskId);
      setTaskComments((prev) => ({ ...prev, [taskId]: comments }));
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    }
  };

  const handleAddComment = async (taskId: number) => {
    if (!newComment.trim()) return;
    try {
      await tasksService.addComment(taskId, newComment);
      setNewComment('');
      await loadTaskComments(taskId);
    } catch (error: any) {
      console.error('Error agregando comentario:', error);
      alert('Error al agregar el comentario: ' + (error.response?.data?.error || error.message));
    }
  };

  // Agrupar tareas por paciente
  const tasksByPatient = tasks.reduce((acc: Record<number, any[]>, task: any) => {
    const patientId = task.user?.id || task.userId;
    if (patientId) {
      if (!acc[patientId]) {
        acc[patientId] = [];
      }
      acc[patientId].push(task);
    }
    return acc;
  }, {});

  // Obtener pacientes que tienen tareas
  const patientsWithTasks = patients.filter((p: any) => tasksByPatient[p.id] && tasksByPatient[p.id].length > 0);

  const toggleTaskExpanded = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
      if (!taskFiles[taskId]) {
        loadTaskFiles(taskId);
      }
    }
    setExpandedTasks(newExpanded);
  };

  useEffect(() => {
    loadData();
    loadMySlots();
  }, []);

  const loadMySlots = async () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const list = await calendarService.mySlots(from.toISOString(), to.toISOString());
    setSlots(list);
  };

  useEffect(() => {
    if (tab === 'calendario') {
      loadMySlots();
    }
  }, [tab]);

  // Cargar slots periódicamente para actualizar recordatorios
  useEffect(() => {
    const interval = setInterval(() => {
      loadMySlots();
    }, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === 'tareas' && tasks.length > 0) {
      // Cargar archivos de todas las tareas solo una vez
      tasks.forEach(t => {
        if (!taskFiles[t.id]) {
          loadTaskFiles(t.id);
        }
      });
    }
  }, [tab, tasks.length]); // Solo dependemos de la longitud, no del array completo

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }
    try {
      const res = await profileService.uploadAvatar(file);
      setMe({ ...me, avatarUrl: res.avatarUrl });
      // Avatar actualizado exitosamente (sin pop-up)
    } catch (error: any) {
      console.error('Error al subir avatar:', error);
      alert('Error al subir el avatar: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
    } finally {
      // Permitir seleccionar el mismo archivo nuevamente
      input.value = '';
    }
  };

  const saveProfile = async () => {
    try {
      await profileService.update({
        name: editForm.name,
        gender: editForm.gender || null,
        age: editForm.age ? parseInt(editForm.age) : null
      });
      setMe({ ...me, ...editForm });
      setEditing(false);
      await loadData();
    } catch (error) {
      alert('Error al guardar los cambios');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        overflowX: 'auto'
      }}>
        {[
          { id: 'perfil', label: '👤 Mi Perfil', icon: '👤' },
          { id: 'pacientes', label: '👥 Mis Pacientes', icon: '👥' },
          { id: 'tareas', label: '📋 Tareas', icon: '📋' },
          { id: 'tests-asignados', label: '📝 Tests Asignados', icon: '📝' },
          { id: 'calendario', label: '📅 Calendario', icon: '📅' },
          { id: 'chat', label: '💬 Chat', icon: '💬' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            style={{
              padding: '12px 24px',
              background: tab === t.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: tab === t.id ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: tab === t.id ? '3px solid #764ba2' : '3px solid transparent',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: tab === t.id ? 600 : 500,
              fontSize: '14px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (tab !== t.id) {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#1f2937';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== t.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Perfil */}
      {tab === 'perfil' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header con gradiente */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px',
            color: 'white',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                {me?.avatarUrl ? (
                  <img
                    src={me.avatarUrl}
                    alt="avatar"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                    }}
                  />
                ) : null}
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: me?.avatarUrl ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  👤
                </div>
                <label style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: 'white',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  📷
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange} />
                </label>
              </div>
              <div style={{ flex: 1 }}>
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nombre completo"
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '20px',
                        fontWeight: 600,
                        width: '100%',
                        maxWidth: '400px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">Selecciona género</option>
                        <option value="MALE">Masculino</option>
                        <option value="FEMALE">Femenino</option>
                        <option value="OTHER">Otro</option>
                      </select>
                      <input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        placeholder="Edad"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '14px',
                          width: '100px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={saveProfile}
                        style={{
                          padding: '8px 20px',
                          background: 'white',
                          color: '#667eea',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => { setEditing(false); setEditForm({ name: me?.name || '', gender: me?.gender || '', age: me?.age?.toString() || '' }); }}
                        style={{
                          padding: '8px 20px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700 }}>
                      {me?.name || 'Psicólogo'}
                    </h2>
                    <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '16px' }}>
                      {me?.email}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', opacity: 0.9 }}>
                      {me?.age && <div>👤 {me.age} años</div>}
                      {me?.gender && <div>{me.gender === 'MALE' ? '♂️' : me.gender === 'FEMALE' ? '♀️' : '⚧️'} {me.gender === 'MALE' ? 'Masculino' : me.gender === 'FEMALE' ? 'Femenino' : 'Otro'}</div>}
                      {me?.createdAt && <div>📅 Miembro desde {formatDate(me.createdAt)}</div>}
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        marginTop: '16px',
                        padding: '10px 24px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '2px solid white',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#667eea';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.color = 'white';
                      }}
                    >
                      ✏️ Editar Perfil
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pacientes asignados
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>
                {patients.length}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tareas creadas
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>
                {tasks.filter(t => t.createdBy === 'PSYCHOLOGIST').length}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Slots disponibles
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0ea5e9' }}>
                {slots.filter(s => s.status === 'FREE').length}
              </div>
            </div>

            {/* Citas Próximas - Nueva tarjeta */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '12px',
              border: '2px solid rgba(217, 119, 6, 0.3)',
              gridColumn: 'span 1'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⏰ Próximas Citas
              </div>
              {(() => {
                const now = new Date();
                const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const upcomingAppointments = slots
                  .filter(s => s.status === 'BOOKED' && s.user)
                  .filter(apt => {
                    if (!apt.startTime || !apt.endTime) return false;
                    const aptDate = new Date(apt.startTime);
                    const aptEndDate = new Date(apt.endTime);
                    // Incluir citas en curso (ya comenzaron pero no han terminado) o próximas (en las próximas 24h)
                    // Usar getTime() para comparaciones más precisas
                    const nowTime = now.getTime();
                    const aptStartTime = aptDate.getTime();
                    const aptEndTime = aptEndDate.getTime();
                    const next24HoursTime = next24Hours.getTime();
                    
                    const isInProgress = aptStartTime <= nowTime && aptEndTime >= nowTime;
                    const isUpcoming = aptStartTime >= nowTime && aptStartTime <= next24HoursTime;
                    return isInProgress || isUpcoming;
                  })
                  .slice(0, 2); // Mostrar máximo 2 citas

                if (upcomingAppointments.length === 0) {
                  return (
                    <div style={{ fontSize: '14px', color: '#92400e', fontFamily: "'Inter', sans-serif" }}>
                      No hay citas próximas
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {upcomingAppointments.map(apt => {
                      const aptDate = new Date(apt.startTime);
                      const aptEndDate = new Date(apt.endTime);
                      const isInProgress = aptDate <= now && aptEndDate >= now;
                      const hoursUntil = Math.floor((aptDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                      const minutesUntil = Math.floor((aptDate.getTime() - now.getTime()) / (1000 * 60)) % 60;
                      
                      // Calcular si está dentro del rango permitido (máximo 1 hora antes, hasta 1 hora después del final)
                      const oneHourBefore = new Date(aptDate.getTime() - 60 * 60 * 1000);
                      const oneHourAfterEnd = new Date(aptEndDate.getTime() + 60 * 60 * 1000);
                      const canStartCall = now >= oneHourBefore && now <= oneHourAfterEnd;
                      
                      return (
                        <div
                          key={apt.id}
                          style={{
                            padding: '12px',
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid rgba(217, 119, 6, 0.2)',
                            cursor: canStartCall ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            opacity: canStartCall ? 1 : 0.7
                          }}
                          onClick={canStartCall ? async () => {
                            if (me && apt.user) {
                              try {
                                // Validar con backend antes de iniciar
                                const roomInfo = await jitsiService.getRoomInfo(apt.user.email);
                                setVideoCallRoom(roomInfo.roomName);
                                setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                                setShowVideoCall(true);
                              } catch (error: any) {
                                alert(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                              }
                            }
                          } : undefined}
                          onMouseEnter={canStartCall ? (e) => {
                            e.currentTarget.style.borderColor = '#d97706';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(217, 119, 6, 0.15)';
                          } : undefined}
                          onMouseLeave={canStartCall ? (e) => {
                            e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.2)';
                            e.currentTarget.style.boxShadow = 'none';
                          } : undefined}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a2e22', marginBottom: '4px' }}>
                            {aptDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div style={{ fontSize: '12px', color: '#3a5a4a', marginBottom: '2px' }}>
                            🕐 {aptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {apt.user && (
                            <div style={{ fontSize: '11px', color: '#5a9270', fontWeight: 600, marginBottom: '4px' }}>
                              👤 {apt.user.name || apt.user.email}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: isInProgress ? '#059669' : '#d97706', fontWeight: 600 }}>
                            {isInProgress ? '🟢 En curso' : (hoursUntil > 0 ? `En ${hoursUntil}h ${minutesUntil}m` : `En ${minutesUntil}m`)}
                          </div>
                          {!canStartCall && now < oneHourBefore && (
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>
                              Disponible 1h antes
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Pacientes */}
      {tab === 'pacientes' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Mis Pacientes
            </h3>
            <button
              onClick={loadData}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🔄 Refrescar
            </button>
          </div>
          {patients.length === 0 ? (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                No tienes pacientes asignados
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                Pide al administrador que asigne usuarios a tu perfil
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {patients.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '24px',
                    background: '#f9fafb',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  onClick={() => {
                    setSelectedPatient(p.id);
                    setTab('chat');
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      border: '3px solid white',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {p.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatient(p.id);
                      setTab('chat');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    💬 Abrir Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tareas */}
      {tab === 'tareas' && (
        <>
          {selectedTaskId && selectedTask ? (
            // Vista detallada de la tarea (igual que en UserDashboard)
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
              padding: '40px',
              border: '1px solid rgba(90, 146, 112, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '28px', 
                  fontWeight: 700, 
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '-0.02em'
                }}>
                  {selectedTask.title}
                </h3>
                <button
                  onClick={() => {
                    setSelectedTaskId(null);
                    setSelectedTask(null);
                    setNewComment('');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#f0f5f3',
                    color: '#5a9270',
                    border: '2px solid rgba(90, 146, 112, 0.3)',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '15px',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e8f0ed';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f5f3';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ← Volver
                </button>
              </div>

              {/* Información de la tarea */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px',
                marginBottom: '32px'
              }}>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(90, 146, 112, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#5a9270', 
                    marginBottom: '8px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Creada el
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </div>
                </div>

                {selectedTask.dueDate && (
                  <div style={{
                    padding: '20px',
                    background: new Date(selectedTask.dueDate) < new Date() 
                      ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                      : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '16px',
                    border: `1px solid ${new Date(selectedTask.dueDate) < new Date() ? 'rgba(220, 38, 38, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: new Date(selectedTask.dueDate) < new Date() ? '#dc2626' : '#d97706', 
                      marginBottom: '8px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Vence el
                    </div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1a2e22',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {new Date(selectedTask.dueDate).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {new Date(selectedTask.dueDate) >= new Date() && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#3a5a4a',
                        marginTop: '8px',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        {Math.ceil((new Date(selectedTask.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(90, 146, 112, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#5a9270', 
                    marginBottom: '8px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {selectedTask.createdBy === 'PSYCHOLOGIST' ? 'Asignada por' : 'Enviada por'}
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {selectedTask.createdBy === 'PSYCHOLOGIST' ? selectedTask.psychologistName : selectedTask.userName}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedTask.description && (
                <div style={{ 
                  marginBottom: '32px',
                  padding: '24px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(90, 146, 112, 0.15)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px', 
                    fontWeight: 600, 
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Descripción
                  </h4>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#3a5a4a', 
                    lineHeight: '1.7',
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedTask.description}
                  </div>
                </div>
              )}

              {/* Archivos */}
              <div style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(90, 146, 112, 0.15)',
                boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    📎 Archivos adjuntos
                  </h4>
                  <label style={{
                    padding: '10px 20px',
                    background: '#5a9270',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
                    e.currentTarget.style.background = '#4a8062';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                    e.currentTarget.style.background = '#5a9270';
                  }}
                  >
                    ➕ Subir archivo
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await tasksService.uploadFile(selectedTaskId, file);
                            await loadTaskFiles(selectedTaskId);
                            // Archivo subido exitosamente (sin pop-up)
                            // Resetear el input para permitir subir el mismo archivo de nuevo
                            e.target.value = '';
                          } catch (error: any) {
                            console.error('Error al subir archivo:', error);
                            console.error('Error completo:', JSON.stringify(error, null, 2));
                            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.details || error.message || 'Error desconocido';
                            alert('Error al subir el archivo: ' + errorMessage);
                            // Resetear el input incluso si hay error
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {taskFiles[selectedTaskId] && taskFiles[selectedTaskId].length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {taskFiles[selectedTaskId].map((file: any) => (
                      <div key={file.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '16px', 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(90, 146, 112, 0.15)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                          <span style={{ fontSize: '24px' }}>📄</span>
                          <div>
                            <div style={{ 
                              fontSize: '15px', 
                              fontWeight: 600, 
                              color: '#1a2e22',
                              fontFamily: "'Inter', sans-serif"
                            }}>{file.originalName}</div>
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#3a5a4a', 
                              marginTop: '4px',
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              {(file.fileSize / 1024).toFixed(1)} KB • Subido por {file.uploaderName}
                            </div>
                          </div>
                        </div>
                        <a
                          href={`http://localhost:8080${file.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '8px 16px',
                            background: '#5a9270',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 2px 8px rgba(90, 146, 112, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#4a8062';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#5a9270';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.3)';
                          }}
                        >
                          Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '15px', 
                    color: '#3a5a4a', 
                    textAlign: 'center', 
                    padding: '40px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    No hay archivos adjuntos aún
                  </div>
                )}
              </div>

              {/* Comentarios */}
              <div style={{ 
                padding: '24px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(90, 146, 112, 0.15)',
                boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)'
              }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  💬 Comentarios
                </h4>
                
                {/* Lista de comentarios */}
                {taskComments[selectedTaskId] && taskComments[selectedTaskId].length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {taskComments[selectedTaskId].map((comment: any) => (
                      <div key={comment.id} style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(90, 146, 112, 0.15)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#1a2e22',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {comment.userName}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#3a5a4a',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '15px', 
                          color: '#3a5a4a', 
                          lineHeight: '1.6',
                          fontFamily: "'Inter', sans-serif",
                          whiteSpace: 'pre-wrap'
                        }}>
                          {comment.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '15px', 
                    color: '#3a5a4a', 
                    textAlign: 'center', 
                    padding: '40px',
                    marginBottom: '24px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    No hay comentarios aún. Sé el primero en comentar.
                  </div>
                )}

                {/* Formulario de nuevo comentario */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid rgba(90, 146, 112, 0.2)',
                      fontSize: '15px',
                      fontFamily: "'Inter', sans-serif",
                      color: '#1a2e22',
                      resize: 'vertical',
                      minHeight: '80px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5a9270';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(selectedTaskId)}
                    disabled={!newComment.trim()}
                    style={{
                      padding: '12px 24px',
                      background: newComment.trim() ? '#5a9270' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: newComment.trim() ? '0 4px 12px rgba(90, 146, 112, 0.3)' : 'none',
                      alignSelf: 'flex-start'
                    }}
                    onMouseEnter={(e) => {
                      if (newComment.trim()) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
                        e.currentTarget.style.background = '#4a8062';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newComment.trim()) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                        e.currentTarget.style.background = '#5a9270';
                      }
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          ) : selectedPatientForTasks ? (
            // Lista de tareas de un paciente específico
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '32px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <button
                    onClick={() => setSelectedPatientForTasks(null)}
                    style={{
                      padding: '8px 16px',
                      background: '#f0f5f3',
                      color: '#5a9270',
                      border: '2px solid rgba(90, 146, 112, 0.3)',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginBottom: '12px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e8f0ed'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f0f5f3'}
                  >
                    ← Volver a pacientes
                  </button>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Tareas de {patients.find((p: any) => p.id === selectedPatientForTasks)?.name || 'Paciente'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setTaskForm({ ...taskForm, userId: selectedPatientForTasks.toString() });
                    setShowTaskForm(true);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ➕ Nueva Tarea
                </button>
              </div>
              
              {showTaskForm && (
                <div style={{
                  marginBottom: '24px',
                  padding: '24px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Crear Nueva Tarea</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Título de la tarea"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px'
                      }}
                    />
                    <textarea
                      placeholder="Descripción (opcional)"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                    />
                    <input
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={async () => {
                          if (!taskForm.title) {
                            alert('Por favor completa el título de la tarea');
                            return;
                          }
                          if (!me || !me.id) {
                            alert('Error: No se pudo obtener la información del psicólogo. Por favor recarga la página.');
                            return;
                          }
                          try {
                            await tasksService.create({
                              userId: selectedPatientForTasks,
                              psychologistId: me.id,
                              title: taskForm.title,
                              description: taskForm.description || undefined,
                              dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined
                            });
                            await loadData();
                            setShowTaskForm(false);
                            setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                            // Tarea creada exitosamente (sin pop-up)
                          } catch (error: any) {
                            console.error('Error al crear la tarea:', error);
                            alert('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                          }
                        }}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Crear
                      </button>
                      <button
                        onClick={() => {
                          setShowTaskForm(false);
                          setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#e5e7eb',
                          color: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tasksByPatient[selectedPatientForTasks] && tasksByPatient[selectedPatientForTasks].length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tasksByPatient[selectedPatientForTasks].map((t: any) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        loadTaskDetails(t.id);
                      }}
                      style={{
                        padding: '28px',
                        background: t.createdBy === 'PSYCHOLOGIST' ? 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)' : '#ffffff',
                        border: `2px solid ${t.createdBy === 'PSYCHOLOGIST' ? 'rgba(90, 146, 112, 0.3)' : 'rgba(90, 146, 112, 0.15)'}`,
                        borderRadius: '16px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.08)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <div style={{
                              padding: '6px 12px',
                              background: t.createdBy === 'PSYCHOLOGIST' ? '#5a9270' : '#7fb3a3',
                              color: 'white',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              {t.createdBy === 'PSYCHOLOGIST' ? '📤 Creada por mí' : '📥 Enviada por paciente'}
                            </div>
                            {t.createdAt && (
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                📅 Creada: {new Date(t.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            )}
                            {t.dueDate && (
                              <div style={{
                                padding: '4px 8px',
                                background: new Date(t.dueDate) < new Date() ? '#fee2e2' : '#fef3c7',
                                color: new Date(t.dueDate) < new Date() ? '#dc2626' : '#d97706',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600
                              }}>
                                ⏰ Vence: {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '22px', 
                            fontWeight: 700, 
                            color: '#1a2e22', 
                            marginBottom: '12px',
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '-0.01em'
                          }}>
                            {t.title}
                          </div>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#3a5a4a', 
                            lineHeight: '1.6', 
                            marginBottom: '16px',
                            fontFamily: "'Inter', sans-serif",
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {t.description || 'Sin descripción'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '60px 40px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                    No hay tareas para este paciente
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Lista de pacientes con tareas
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '32px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Tareas por Paciente
                </h3>
                <button
                  onClick={() => setShowTaskForm(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ➕ Nueva Tarea
                </button>
              </div>
          
          {showTaskForm && (
            <div style={{
              marginBottom: '24px',
              padding: '24px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Crear Nueva Tarea</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select
                  value={taskForm.userId}
                  onChange={(e) => setTaskForm({ ...taskForm, userId: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Selecciona un paciente</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Título de la tarea"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      if (!taskForm.userId || !taskForm.title) {
                        alert('Por favor completa todos los campos requeridos');
                        return;
                      }
                      if (!me || !me.id) {
                        alert('Error: No se pudo obtener la información del psicólogo. Por favor recarga la página.');
                        return;
                      }
                      try {
                        await tasksService.create({
                          userId: parseInt(taskForm.userId),
                          psychologistId: me.id,
                          title: taskForm.title,
                          description: taskForm.description || undefined,
                          dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined
                        });
                        await loadData();
                        setShowTaskForm(false);
                        setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                        // Tarea creada exitosamente (sin pop-up)
                      } catch (error: any) {
                        console.error('Error al crear la tarea:', error);
                        alert('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => {
                      setShowTaskForm(false);
                      setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#e5e7eb',
                      color: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {patientsWithTasks.length === 0 ? (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                No hay pacientes con tareas
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                Crea tareas para tus pacientes o revisa las enviadas por ellos
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {patientsWithTasks.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientForTasks(p.id)}
                  style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                    border: '2px solid rgba(90, 146, 112, 0.3)',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.08)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      border: '3px solid white',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#1a2e22', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#3a5a4a', fontFamily: "'Inter', sans-serif" }}>
                        {tasksByPatient[p.id]?.length || 0} {tasksByPatient[p.id]?.length === 1 ? 'tarea' : 'tareas'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          )}
        </>
      )}

      {/* Tests Asignados */}
      {tab === 'tests-asignados' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tests Asignados
            </h3>
            <button
              onClick={async () => {
                setShowAssignTestForm(true);
                // Asegurar que los tests estén cargados
                try {
                  console.log('Cargando tests al abrir formulario...');
                  const tests = await testService.list();
                  console.log('Tests recibidos del servidor:', tests);
                  console.log('Número de tests recibidos:', tests?.length || 0);
                  
                  // Filtrar tests activos
                  const activeTests = (tests || []).filter((t: any) => {
                    if (t.active === false) {
                      console.log(`Test ${t.id} (${t.title}) excluido: active=false`);
                      return false;
                    }
                    console.log(`Test ${t.id} (${t.title}) incluido: active=${t.active}`);
                    return true;
                  });
                  
                  console.log('Tests activos después del filtro:', activeTests);
                  console.log('Número de tests activos:', activeTests.length);
                  setAvailableTests(activeTests);
                  
                  if (activeTests.length === 0) {
                    alert('No hay tests disponibles para asignar. Verifica que haya tests activos en el sistema.');
                  }
                } catch (error: any) {
                  console.error('Error cargando tests:', error);
                  alert('Error al cargar los tests. Por favor intenta de nuevo.');
                }
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ➕ Asignar Test
            </button>
          </div>

          {showAssignTestForm && (
            <div style={{
              marginBottom: '24px',
              padding: '24px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Asignar Test a Paciente</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                    Paciente:
                  </label>
                  <select
                    value={assignTestForm.userId}
                    onChange={(e) => setAssignTestForm({ ...assignTestForm, userId: e.target.value })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  >
                    <option value="">Selecciona un paciente</option>
                    {patients.length === 0 ? (
                      <option value="" disabled>No hay pacientes asignados</option>
                    ) : (
                      patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                      ))
                    )}
                  </select>
                  {patients.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      ⚠️ No tienes pacientes asignados. Pide al administrador que asigne pacientes a tu perfil.
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                    Test:
                  </label>
                  <select
                    value={assignTestForm.testId}
                    onChange={(e) => setAssignTestForm({ ...assignTestForm, testId: e.target.value })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  >
                    <option value="">Selecciona un test</option>
                    {availableTests.length === 0 ? (
                      <option value="" disabled>Cargando tests...</option>
                    ) : (
                      availableTests.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title} {t.code ? `(${t.code})` : ''}</option>
                      ))
                    )}
                  </select>
                  {availableTests.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      ⚠️ No hay tests disponibles. Verifica que haya tests activos en el sistema.
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      if (!assignTestForm.userId || !assignTestForm.testId) {
                        alert('Por favor selecciona un paciente y un test');
                        return;
                      }
                      try {
                        const userId = parseInt(assignTestForm.userId);
                        const testId = parseInt(assignTestForm.testId);
                        
                        console.log('Asignando test:', { userId, testId });
                        console.log('Valores del formulario:', assignTestForm);
                        
                        if (isNaN(userId) || isNaN(testId)) {
                          alert('Error: Los valores seleccionados no son válidos');
                          return;
                        }
                        
                        const result = await assignedTestsService.assign({
                          userId,
                          testId
                        });
                        
                        console.log('Test asignado exitosamente:', result);
                        // Test asignado exitosamente (sin pop-up)
                        await loadData();
                        setShowAssignTestForm(false);
                        setAssignTestForm({ userId: '', testId: '' });
                      } catch (error: any) {
                        console.error('Error al asignar el test:', error);
                        console.error('Detalles del error:', error.response?.data || error.message);
                        console.error('Status code:', error.response?.status);
                        
                        let errorMessage = 'Error desconocido al asignar el test';
                        if (error.response?.data) {
                          // El backend puede devolver { error: "mensaje" } o { message: "mensaje" }
                          errorMessage = error.response.data.error || error.response.data.message || JSON.stringify(error.response.data);
                        } else if (error.message) {
                          errorMessage = error.message;
                        }
                        
                        alert(`Error al asignar el test: ${errorMessage}`);
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Asignar
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignTestForm(false);
                      setAssignTestForm({ userId: '', testId: '' });
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#e5e7eb',
                      color: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {(() => {
            // Agrupar tests por paciente
            const testsByPatient = new Map<number, any[]>();
            assignedTests.forEach(at => {
              const userId = at.userId;
              if (!testsByPatient.has(userId)) {
                testsByPatient.set(userId, []);
              }
              testsByPatient.get(userId)!.push(at);
            });

            if (testsByPatient.size === 0) {
              return (
                <div style={{
                  padding: '60px 40px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                    No hay tests asignados
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Asigna tests a tus pacientes para que los completen
                  </div>
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Array.from(testsByPatient.entries()).map(([userId, patientTests]) => {
                  const patient = patients.find(p => p.id === userId) || { 
                    id: userId, 
                    name: patientTests[0]?.userName || 'Usuario', 
                    email: patientTests[0]?.userEmail || '',
                    avatarUrl: patientTests[0]?.userAvatarUrl || null
                  };
                  const isExpanded = expandedPatients.has(userId);
                  const completedCount = patientTests.filter(t => t.completedAt).length;
                  const pendingCount = patientTests.length - completedCount;
                  const patientAvatarUrl = patient.avatarUrl || patientTests[0]?.userAvatarUrl;

                  return (
                    <div
                      key={userId}
                      style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div
                        style={{
                          padding: '20px',
                          background: isExpanded ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px'
                        }}
                        onClick={() => {
                          const newExpanded = new Set(expandedPatients);
                          if (newExpanded.has(userId)) {
                            newExpanded.delete(userId);
                          } else {
                            newExpanded.add(userId);
                          }
                          setExpandedPatients(newExpanded);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isExpanded ? '#f3f4f6' : '#ffffff';
                        }}
                      >
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            flexShrink: 0,
                            border: '2px solid #d1d5db'
                          }}>
                            {patientAvatarUrl ? (
                              <img 
                                src={patientAvatarUrl} 
                                alt={patient.name}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover' 
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '👤';
                                    parent.style.fontSize = '24px';
                                  }
                                }}
                              />
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                              {patient.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                              {patient.email}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                              {patientTests.length} test{patientTests.length !== 1 ? 's' : ''}
                            </div>
                            {completedCount > 0 && (
                              <div style={{
                                padding: '4px 8px',
                                background: '#22c55e',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                ✅ {completedCount} completado{completedCount !== 1 ? 's' : ''}
                              </div>
                            )}
                            {pendingCount > 0 && (
                              <div style={{
                                padding: '4px 8px',
                                background: '#f59e0b',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                ⏳ {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '20px', color: '#9ca3af' }}>
                            {isExpanded ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {patientTests.map(at => (
                              <div
                                key={at.id}
                                style={{
                                  padding: '16px',
                                  background: at.completedAt ? '#f0fdf4' : '#fef3c7',
                                  border: `2px solid ${at.completedAt ? '#22c55e' : '#f59e0b'}`,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: '16px'
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{
                                      padding: '4px 8px',
                                      background: at.completedAt ? '#22c55e' : '#f59e0b',
                                      color: 'white',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}>
                                      {at.completedAt ? '✅ Completado' : '⏳ Pendiente'}
                                    </div>
                                    {at.assignedAt && (
                                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        Asignado: {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                    )}
                                    {at.completedAt && (
                                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        Completado: {new Date(at.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                    {at.testTitle || at.test?.title || 'Test'}
                                  </div>
                                  {at.testCode && (
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                      Código: {at.testCode}
                                    </div>
                                  )}
                                </div>
                                {!at.completedAt && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm('¿Estás seguro de que deseas desasignar este test?')) {
                                        try {
                                          await assignedTestsService.unassign(at.id);
                                          await loadData();
                                        } catch (error) {
                                          alert('Error al desasignar el test');
                                        }
                                      }
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                  >
                                    Desasignar
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Calendario */}
      {tab === 'calendario' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Gestión de Calendario
            </h3>
          </div>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
          </div>
          <CalendarWeek
            mode="PSYCHO"
            slots={slots}
            onCreateSlot={async (start, end) => {
              try {
                await calendarService.createSlot(start, end);
                await loadMySlots();
              } catch (e) {
                alert('Error al crear el slot');
              }
            }}
          />
          
          {/* Citas Reservadas */}
          {slots.filter(s => s.status === 'BOOKED' && s.user).length > 0 && (
            <div style={{
              marginTop: '32px',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
              border: '1px solid rgba(90, 146, 112, 0.15)',
              padding: '32px'
            }}>
              <h4 style={{
                margin: '0 0 24px 0',
                fontSize: '24px',
                fontWeight: 700,
                color: '#1a2e22',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.01em'
              }}>
                📅 Citas Reservadas
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {slots.filter(s => s.status === 'BOOKED' && s.user).map(apt => (
                  <div
                    key={apt.id}
                    style={{
                      background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                      border: '2px solid rgba(90, 146, 112, 0.3)',
                      borderRadius: '16px',
                      padding: '24px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.08)';
                    }}
                  >
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 700, 
                      color: '#1a2e22', 
                      marginBottom: '12px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {new Date(apt.startTime).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: '#3a5a4a', 
                      marginBottom: '8px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      🕐 {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {apt.user && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#5a9270', 
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '12px'
                      }}>
                        👤 {apt.user.name || apt.user.email}
                      </div>
                    )}
                    {(() => {
                      const now = new Date();
                      const aptDate = new Date(apt.startTime);
                      const aptEndDate = new Date(apt.endTime);
                      // Calcular si está dentro del rango permitido (máximo 1 hora antes, hasta 1 hora después del final)
                      const oneHourBefore = new Date(aptDate.getTime() - 60 * 60 * 1000);
                      const oneHourAfterEnd = new Date(aptEndDate.getTime() + 60 * 60 * 1000);
                      const canStartCall = now >= oneHourBefore && now <= oneHourAfterEnd;
                      
                      if (!canStartCall) {
                        if (now < oneHourBefore) {
                          const minutesUntil = Math.floor((oneHourBefore.getTime() - now.getTime()) / (1000 * 60));
                          return (
                            <div style={{
                              width: '100%',
                              padding: '12px 20px',
                              background: '#f3f4f6',
                              color: '#6b7280',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              fontSize: '14px',
                              textAlign: 'center',
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              Disponible en {Math.floor(minutesUntil / 60)}h {minutesUntil % 60}m
                            </div>
                          );
                        }
                        return null;
                      }
                      
                      return (
                        <button
                          onClick={async () => {
                            if (me && apt.user) {
                              try {
                                // Validar con backend antes de iniciar
                                const roomInfo = await jitsiService.getRoomInfo(apt.user.email);
                                setVideoCallRoom(roomInfo.roomName);
                                setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                                setShowVideoCall(true);
                              } catch (error: any) {
                                alert(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 20px',
                            background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
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
                          📹 Iniciar Videollamada
                        </button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {tab === 'chat' && (
        <div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{
              width: '300px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '20px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                Seleccionar Paciente
              </h4>
              {patients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>
                  No hay pacientes asignados
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p.id)}
                      style={{
                        padding: '12px',
                        background: selectedPatient === p.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f9fafb',
                        color: selectedPatient === p.id ? 'white' : '#1f2937',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: selectedPatient === p.id ? 'none' : '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPatient !== p.id) {
                          e.currentTarget.style.background = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPatient !== p.id) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>{p.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ flex: 1, width: '100%', minWidth: 0 }}>
              <ChatWidget mode="PSYCHOLOGIST" otherId={selectedPatient || undefined} />
            </div>
          </div>
        </div>
      )}

      {/* Videollamada Jitsi - NUNCA desmontar, usar ref para mantener montado */}
      {(() => {
        // Si tenemos una referencia, renderizar el componente incluso si showVideoCall es false temporalmente
        const shouldRender = showVideoCall || (videoCallRef.current && videoCallRef.current.room);
        const roomToUse = showVideoCall ? videoCallRoom : videoCallRef.current?.room;
        const userToUse = showVideoCall ? me : videoCallRef.current?.user;
        const otherUserToUse = showVideoCall ? videoCallOtherUser : videoCallRef.current?.otherUser;
        
        return shouldRender && roomToUse && userToUse ? (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, pointerEvents: 'auto' }}>
            <JitsiVideoCall
              key={`jitsi-${roomToUse}`} // Key estable para evitar re-montajes
              roomName={roomToUse}
              userEmail={userToUse.email}
              userName={userToUse.name || 'Psicólogo'}
              otherUserEmail={otherUserToUse?.email}
              otherUserName={otherUserToUse?.name}
              onClose={handleVideoCallClose}
            />
          </div>
        ) : null;
      })()}
    </div>
  );
}
