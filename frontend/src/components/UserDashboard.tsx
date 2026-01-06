import { useEffect, useState, useCallback, useRef } from 'react';
import { profileService, tasksService, calendarService, assignedTestsService, jitsiService, authService } from '../services/api';
import ChatWidget from './ChatWidget';
import CalendarWeek from './CalendarWeek';
import JitsiVideoCall from './JitsiVideoCall';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';
import { toast } from './ui/Toast';
import AgendaPersonal from './AgendaPersonal';
import MisEstadisticas from './MisEstadisticas';
import Evaluaciones from './Evaluaciones';
import Descubrimiento from './Descubrimiento';
import PatientMatchingTest from './PatientMatchingTest';
import MatchingPsychologists from './MatchingPsychologists';

type Tab = 'perfil' | 'mi-psicologo' | 'tareas' | 'tests-pendientes' | 'calendario' | 'chat' | 'mis-citas' | 'agenda-personal' | 'mis-estadisticas' | 'evaluaciones' | 'descubrimiento' | 'perfil-psicologo';

interface UserDashboardProps {
  onStartTest?: (testId: number) => void;
}

export default function UserDashboard({ onStartTest }: UserDashboardProps = {}) {
  const [tab, setTab] = useState<Tab>('perfil');
  const [me, setMe] = useState<any>(null);
  const [psych, setPsych] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', gender: '', age: '' });
  const [taskFiles, setTaskFiles] = useState<Record<number, any[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskComments, setTaskComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState<string>('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState<string | null>(null);
  const [videoCallOtherUser, setVideoCallOtherUser] = useState<{ email: string; name: string } | null>(null);
  
  // Estados para perfil del psicólogo
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);
  const [loadingPsychologistProfile, setLoadingPsychologistProfile] = useState(false);
  
  // Estados para mis citas
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loadingPastAppointments, setLoadingPastAppointments] = useState(false);
  const [ratingAppointment, setRatingAppointment] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changePasswordErrors, setChangePasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Estados para matching
  const [showMatchingTest, setShowMatchingTest] = useState(false);
  const [showMatchingResults, setShowMatchingResults] = useState(false);
  
  // Ref para mantener el componente montado incluso si showVideoCall cambia temporalmente
  const videoCallRef = useRef<{ room: string | null; user: any; otherUser: any } | null>(null);
  
  // Determinar si el usuario tiene psicólogo asignado
  const hasPsychologist = psych?.status === 'ASSIGNED';
  
  // Tabs que requieren psicólogo asignado
  const tabsRequiringPsychologist = ['tareas', 'calendario', 'chat', 'tests-pendientes'];
  
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
      setLoading(true);
      const m = await profileService.me();
      setMe(m);
      setEditForm({ name: m?.name || '', gender: m?.gender || '', age: m?.age?.toString() || '' });
      const p = await profileService.myPsychologist();
      setPsych(p);
      const t = await tasksService.list();
      setTasks(t);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos. Por favor recarga la página.');
    } finally {
      setLoading(false);
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
  };

  useEffect(() => {
    loadData();
    loadAvailability(); // Cargar disponibilidad y citas al inicio
  }, []);

  // Cargar citas periódicamente para actualizar recordatorios
  useEffect(() => {
    const interval = setInterval(() => {
      loadAvailability();
    }, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Si se intenta acceder a un tab que requiere psicólogo sin tenerlo, redirigir
    if (tabsRequiringPsychologist.includes(tab) && !hasPsychologist) {
      setTab('mi-psicologo');
    }
    if (tab === 'calendario' && hasPsychologist) {
      loadAvailability();
    }
  }, [tab, hasPsychologist]);

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

  // Cargar citas pasadas cuando se abre la pestaña Mi Psicólogo
  useEffect(() => {
    if (tab === 'mi-psicologo' && psych?.status === 'ASSIGNED') {
      loadPastAppointments();
    }
  }, [tab, psych?.status]);

  const [psychologistRating, setPsychologistRating] = useState<{ averageRating: number | null; totalRatings: number } | null>(null);

  const loadPsychologistProfile = async (psychologistId: number) => {
    try {
      setLoadingPsychologistProfile(true);
      const profile = await profileService.getPsychologistProfile(psychologistId);
      setPsychologistProfile(profile);
      
      // Cargar valoración del psicólogo
      try {
        const rating = await calendarService.getPsychologistRating(psychologistId);
        setPsychologistRating(rating);
      } catch (err) {
        console.error('Error cargando valoración del psicólogo:', err);
      }
      
      setTab('perfil-psicologo');
    } catch (err: any) {
      console.error('Error cargando perfil del psicólogo:', err);
      toast.error('Error al cargar el perfil del psicólogo: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPsychologistProfile(false);
    }
  };

  const loadPastAppointments = async () => {
    try {
      setLoadingPastAppointments(true);
      const appointments = await calendarService.getPastAppointments();
      setPastAppointments(appointments);
    } catch (err: any) {
      console.error('Error cargando citas pasadas:', err);
      toast.error('Error al cargar las citas pasadas: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPastAppointments(false);
    }
  };

  const handleRateAppointment = async (appointmentId: number) => {
    if (!ratingAppointment || ratingAppointment < 1 || ratingAppointment > 5) {
      toast.error('Por favor selecciona una valoración entre 1 y 5 estrellas');
      return;
    }
    try {
      setSubmittingRating(true);
      await calendarService.rateAppointment(appointmentId, ratingAppointment, ratingComment || undefined);
      toast.success('Valoración guardada exitosamente');
      setRatingAppointment(null);
      setRatingComment('');
      await loadPastAppointments(); // Recargar para mostrar la valoración
    } catch (err: any) {
      console.error('Error guardando valoración:', err);
      toast.error('Error al guardar la valoración: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingRating(false);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen');
      return;
    }
    try {
      const res = await profileService.uploadAvatar(file);
      setMe({ ...me, avatarUrl: res.avatarUrl });
      toast.success('Avatar actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al subir avatar:', error);
      toast.error('Error al subir el avatar: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
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
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      toast.error('Error al guardar los cambios');
    }
  };

  const handleChangePassword = async () => {
    const errors: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};
    if (!changePasswordForm.currentPassword) {
      errors.currentPassword = 'La contraseña actual es requerida';
    }
    if (!changePasswordForm.newPassword) {
      errors.newPassword = 'La nueva contraseña es requerida';
    } else if (changePasswordForm.newPassword.length < 6) {
      errors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (Object.keys(errors).length > 0) {
      setChangePasswordErrors(errors);
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(changePasswordForm.currentPassword, changePasswordForm.newPassword);
      toast.success('Contraseña cambiada exitosamente');
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordErrors({});
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(errorMsg);
      if (errorMsg.includes('actual')) {
        setChangePasswordErrors({ currentPassword: errorMsg });
      } else {
        setChangePasswordErrors({ newPassword: errorMsg });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const loadAvailability = async () => {
    try {
      setLoadingSlots(true);
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const list = await calendarService.availability(from.toISOString(), to.toISOString());
      setSlots(list);
      // Cargar también las citas reservadas del usuario
      try {
        const appointments = await calendarService.myAppointments();
        // Asegurar que todas las citas tengan startTime y endTime válidos
        const validAppointments = appointments.filter(apt => apt.startTime && apt.endTime);
        setMyAppointments(validAppointments);
      } catch (error) {
        console.error('Error cargando citas:', error);
        // No fallar completamente, solo loguear el error
      }
    } catch (error: any) {
      console.error('Error cargando disponibilidad:', error);
      toast.error('Error al cargar el calendario');
    } finally {
      setLoadingSlots(false);
    }
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
      toast.error('Error al cargar los detalles de la tarea');
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
      toast.error('Error al agregar el comentario: ' + (error.response?.data?.error || error.message));
    }
  };

  const _toggleTaskExpanded = (taskId: number) => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading && !me) {
    return (
      <div className="container" style={{ maxWidth: '1200px', padding: '40px' }}>
        <LoadingSpinner text="Cargando perfil..." />
      </div>
    );
  }

  return (
    <div className="container" style={{ 
      maxWidth: '1200px', 
      padding: '24px 20px',
      background: '#f5f7f6',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        background: '#ffffff',
        padding: '8px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(90, 146, 112, 0.08)',
        border: '1px solid rgba(90, 146, 112, 0.1)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'perfil', label: 'Mi Perfil', icon: '👤', requiresPsych: false },
          { id: 'mi-psicologo', label: 'Mi Psicólogo', icon: '👨‍⚕️', requiresPsych: false },
          { id: 'tareas', label: 'Tareas', icon: '📋', requiresPsych: true },
          { id: 'tests-pendientes', label: 'Tests', icon: '📝', requiresPsych: true },
          { id: 'calendario', label: 'Calendario', icon: '📅', requiresPsych: true },
          { id: 'agenda-personal', label: 'Agenda Personal', icon: '📖', requiresPsych: false },
          { id: 'chat', label: 'Chat', icon: '💬', requiresPsych: true }
        ].map(t => {
          const isDisabled = t.requiresPsych && !hasPsychologist;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (isDisabled) {
                  toast.error('Necesitas tener un psicólogo asignado para acceder a esta sección');
                  setTab('mi-psicologo');
                  return;
                }
                setTab(t.id as Tab);
              }}
              disabled={isDisabled}
              style={{
                padding: '12px 24px',
                background: tab === t.id ? '#5a9270' : 'transparent',
                color: isDisabled ? '#9ca3af' : (tab === t.id ? '#ffffff' : '#3a5a4a'),
                border: 'none',
                borderRadius: '12px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontWeight: tab === t.id ? 600 : 500,
                fontSize: '15px',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', sans-serif",
                boxShadow: tab === t.id ? '0 4px 12px rgba(90, 146, 112, 0.3)' : 'none',
                opacity: isDisabled ? 0.6 : 1,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (tab !== t.id && !isDisabled) {
                  e.currentTarget.style.background = '#f0f5f3';
                  e.currentTarget.style.color = '#5a9270';
                }
              }}
              onMouseLeave={(e) => {
                if (tab !== t.id && !isDisabled) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#3a5a4a';
                }
              }}
              title={isDisabled ? 'Requiere psicólogo asignado' : undefined}
            >
              {t.icon} {t.label}
              {isDisabled && <span style={{ marginLeft: '6px', fontSize: '12px' }}>🔒</span>}
            </button>
          );
        })}
      </div>

      {/* Perfil */}
      {tab === 'perfil' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
          overflow: 'hidden',
          border: '1px solid rgba(90, 146, 112, 0.15)'
        }}>
          {/* Header con gradiente pastel y mensaje de bienvenida */}
          <div style={{
            background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
            padding: '48px 40px',
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
                      console.error('Error cargando avatar:', me.avatarUrl);
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
                    
                    {/* Cambio de contraseña dentro de editar perfil */}
                    <div style={{
                      marginTop: '24px',
                      padding: '24px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: 'white',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        🔒 Cambiar Contraseña
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            Contraseña actual
                          </label>
                          <input
                            type="password"
                            value={changePasswordForm.currentPassword}
                            onChange={(e) => {
                              setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value });
                              if (changePasswordErrors.currentPassword) {
                                setChangePasswordErrors({ ...changePasswordErrors, currentPassword: undefined });
                              }
                            }}
                            placeholder="Ingresa tu contraseña actual"
                            style={{
                              width: '100%',
                              maxWidth: '400px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: `1px solid ${changePasswordErrors.currentPassword ? '#ef4444' : 'rgba(255, 255, 255, 0.3)'}`,
                              fontSize: '14px',
                              fontFamily: "'Inter', sans-serif",
                              background: 'rgba(255, 255, 255, 0.9)'
                            }}
                          />
                          {changePasswordErrors.currentPassword && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#fee2e2' }}>
                              {changePasswordErrors.currentPassword}
                            </p>
                          )}
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            Nueva contraseña
                          </label>
                          <input
                            type="password"
                            value={changePasswordForm.newPassword}
                            onChange={(e) => {
                              setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value });
                              if (changePasswordErrors.newPassword) {
                                setChangePasswordErrors({ ...changePasswordErrors, newPassword: undefined });
                              }
                              if (changePasswordErrors.confirmPassword && changePasswordForm.confirmPassword) {
                                setChangePasswordErrors({ ...changePasswordErrors, confirmPassword: e.target.value !== changePasswordForm.confirmPassword ? 'Las contraseñas no coinciden' : undefined });
                              }
                            }}
                            placeholder="Ingresa tu nueva contraseña"
                            style={{
                              width: '100%',
                              maxWidth: '400px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: `1px solid ${changePasswordErrors.newPassword ? '#ef4444' : 'rgba(255, 255, 255, 0.3)'}`,
                              fontSize: '14px',
                              fontFamily: "'Inter', sans-serif",
                              background: 'rgba(255, 255, 255, 0.9)'
                            }}
                          />
                          {changePasswordErrors.newPassword && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#fee2e2' }}>
                              {changePasswordErrors.newPassword}
                            </p>
                          )}
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            Confirmar nueva contraseña
                          </label>
                          <input
                            type="password"
                            value={changePasswordForm.confirmPassword}
                            onChange={(e) => {
                              setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value });
                              if (changePasswordErrors.confirmPassword) {
                                setChangePasswordErrors({ ...changePasswordErrors, confirmPassword: e.target.value !== changePasswordForm.newPassword ? 'Las contraseñas no coinciden' : undefined });
                              }
                            }}
                            placeholder="Confirma tu nueva contraseña"
                            style={{
                              width: '100%',
                              maxWidth: '400px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: `1px solid ${changePasswordErrors.confirmPassword ? '#ef4444' : 'rgba(255, 255, 255, 0.3)'}`,
                              fontSize: '14px',
                              fontFamily: "'Inter', sans-serif",
                              background: 'rgba(255, 255, 255, 0.9)'
                            }}
                          />
                          {changePasswordErrors.confirmPassword && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#fee2e2' }}>
                              {changePasswordErrors.confirmPassword}
                            </p>
                          )}
                        </div>

                        {(changePasswordForm.currentPassword || changePasswordForm.newPassword || changePasswordForm.confirmPassword) && (
                          <button
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                            style={{
                              padding: '10px 20px',
                              background: changingPassword ? 'rgba(255, 255, 255, 0.5)' : 'white',
                              color: changingPassword ? '#9ca3af' : '#5a9270',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: changingPassword ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontFamily: "'Inter', sans-serif",
                              transition: 'all 0.2s',
                              alignSelf: 'flex-start'
                            }}
                          >
                            {changingPassword ? 'Cambiando...' : 'Guardar nueva contraseña'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                      <button
                        onClick={saveProfile}
                        style={{
                          padding: '10px 24px',
                          background: 'white',
                          color: '#5a9270',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: "'Inter', sans-serif",
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => { 
                          setEditing(false); 
                          setEditForm({ name: me?.name || '', gender: me?.gender || '', age: me?.age?.toString() || '' }); 
                          setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setChangePasswordErrors({});
                        }}
                        style={{
                          padding: '10px 24px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          border: '2px solid rgba(255, 255, 255, 0.5)',
                          borderRadius: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '36px', 
                      fontWeight: 700,
                      fontFamily: "'Inter', sans-serif",
                      letterSpacing: '-0.02em'
                    }}>
                      {me?.name || 'Usuario'}
                    </h2>
                    <div style={{ 
                      fontSize: '17px', 
                      opacity: 0.95, 
                      marginBottom: '20px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {me?.email}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '20px', 
                      flexWrap: 'wrap', 
                      fontSize: '15px', 
                      opacity: 0.95,
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: '20px'
                    }}>
                      {me?.age && <div style={{ 
                        background: 'rgba(255, 255, 255, 0.2)', 
                        padding: '6px 12px', 
                        borderRadius: '20px',
                        backdropFilter: 'blur(10px)'
                      }}>👤 {me.age} años</div>}
                      {me?.gender && <div style={{ 
                        background: 'rgba(255, 255, 255, 0.2)', 
                        padding: '6px 12px', 
                        borderRadius: '20px',
                        backdropFilter: 'blur(10px)'
                      }}>{me.gender === 'MALE' ? '♂️' : me.gender === 'FEMALE' ? '♀️' : '⚧️'} {me.gender === 'MALE' ? 'Masculino' : me.gender === 'FEMALE' ? 'Femenino' : 'Otro'}</div>}
                      {me?.createdAt && <div style={{ 
                        background: 'rgba(255, 255, 255, 0.2)', 
                        padding: '6px 12px', 
                        borderRadius: '20px',
                        backdropFilter: 'blur(10px)'
                      }}>📅 Miembro desde {formatDate(me.createdAt)}</div>}
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        marginTop: '8px',
                        padding: '12px 28px',
                        background: 'rgba(255, 255, 255, 0.25)',
                        color: 'white',
                        border: '2px solid rgba(255, 255, 255, 0.6)',
                        borderRadius: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: "'Inter', sans-serif",
                        backdropFilter: 'blur(10px)',
                        fontSize: '15px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#5a9270';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      ✏️ Editar Perfil
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acceso rápido */}
          <div style={{
            padding: '40px', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '24px',
            background: '#f8f9fa'
          }}>
            {/* Botones con paleta verde */}
            <div 
              onClick={() => setTab('mis-estadisticas')}
              style={{
                padding: '32px',
                background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                borderRadius: '20px',
                boxShadow: '0 6px 20px rgba(90, 146, 112, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: '#fff',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 146, 112, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(90, 146, 112, 0.3)';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                Mis Estadísticas
              </div>
            </div>

            <div 
              onClick={() => setTab('evaluaciones')}
              style={{
                padding: '32px',
                background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                borderRadius: '20px',
                boxShadow: '0 6px 20px rgba(90, 146, 112, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: '#fff',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 146, 112, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(90, 146, 112, 0.3)';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                Evaluaciones
              </div>
            </div>

            <div 
              onClick={() => setTab('descubrimiento')}
              style={{
                padding: '32px',
                background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                borderRadius: '20px',
                boxShadow: '0 6px 20px rgba(90, 146, 112, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: '#fff',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(90, 146, 112, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(90, 146, 112, 0.3)';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                Descubrimiento
              </div>
            </div>
          </div>

          {/* Información adicional */}
            <div style={{
            padding: '40px', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '24px',
            background: '#f8f9fa'
          }}>
            <div 
              onClick={() => setTab('tareas')}
              style={{
                padding: '24px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(90, 146, 112, 0.15)',
                boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.15)';
                e.currentTarget.style.borderColor = '#5a9270';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.15)';
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                color: '#5a9270', 
                marginBottom: '12px', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Tareas pendientes
              </div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif"
              }}>
                {tasks.filter(t => t.createdBy === 'PSYCHOLOGIST' && (!t.dueDate || new Date(t.dueDate) > new Date())).length} pendientes
              </div>
            </div>

            <div 
              onClick={() => setTab('tests-pendientes')}
              style={{
                padding: '24px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(90, 146, 112, 0.15)',
                boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.15)';
                e.currentTarget.style.borderColor = '#5a9270';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.15)';
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                color: '#5a9270', 
                marginBottom: '12px', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Tests pendientes
              </div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif"
              }}>
                {assignedTests.filter(t => !t.completedAt).length} pendientes
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(90, 146, 112, 0.15)',
              boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
              transition: 'all 0.3s ease',
              gridColumn: 'span 2' // Para que ocupe más espacio
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
                fontSize: '12px', 
                color: '#5a9270', 
                marginBottom: '16px', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontFamily: "'Inter', sans-serif"
              }}>
                ⏰ Próximas Citas
              </div>
              {(() => {
                const now = new Date();
                const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                // Debug: verificar todas las citas disponibles
                // console.log('Todas las citas:', myAppointments);
                // console.log('Hora actual:', now.toISOString());
                
                const upcomingAppointments = myAppointments.filter(apt => {
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
                  
                  // Debug para citas en curso
                  // if (isInProgress) {
                  //   console.log('Cita en curso encontrada:', apt);
                  // }
                  
                  return isInProgress || isUpcoming;
                }).slice(0, 2); // Mostrar máximo 2 citas en el resumen

                if (upcomingAppointments.length === 0) {
                  return (
                    <div style={{ fontSize: '15px', color: '#3a5a4a', fontFamily: "'Inter', sans-serif" }}>
                      No hay citas próximas en las próximas 24 horas
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                            padding: '16px',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            borderRadius: '12px',
                            border: '2px solid rgba(217, 119, 6, 0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a2e22', marginBottom: '4px' }}>
                              {aptDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                            <div style={{ fontSize: '14px', color: '#3a5a4a', marginBottom: '4px' }}>
                              🕐 {aptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {apt.psychologist && (
                              <div style={{ fontSize: '13px', color: '#5a9270', fontWeight: 600 }}>
                                👨‍⚕️ {apt.psychologist.name}
                              </div>
                            )}
                            <div style={{ fontSize: '12px', color: isInProgress ? '#059669' : '#d97706', marginTop: '6px', fontWeight: 600 }}>
                              {isInProgress ? '🟢 En curso' : (hoursUntil > 0 ? `En ${hoursUntil}h ${minutesUntil}m` : `En ${minutesUntil} minutos`)}
                            </div>
                            {!canStartCall && now < oneHourBefore && (
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>
                                Podrás iniciar la videollamada 1 hora antes
                              </div>
                            )}
                          </div>
                          {canStartCall && (
                            <button
                              onClick={async () => {
                                if (me && apt.psychologist) {
                                  try {
                                    // Validar con backend antes de iniciar
                                    const roomInfo = await jitsiService.getRoomInfo(apt.psychologist.email);
                                    setVideoCallRoom(roomInfo.roomName);
                                    setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                                    setShowVideoCall(true);
                                  } catch (error: any) {
                                    toast.error(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                                  }
                                }
                              }}
                              style={{
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontFamily: "'Inter', sans-serif",
                                boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
                                whiteSpace: 'nowrap'
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
                              📹 Iniciar
                            </button>
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

      {/* Test de Matching */}
      {tab === 'mi-psicologo' && showMatchingTest && (
        <PatientMatchingTest
          onComplete={() => {
            setShowMatchingTest(false);
            setShowMatchingResults(true);
            loadData();
          }}
          onBack={() => setShowMatchingTest(false)}
        />
      )}

      {/* Resultados de Matching */}
      {tab === 'mi-psicologo' && showMatchingResults && (
        <MatchingPsychologists
          onSelect={(_psychologistId) => {
            setShowMatchingResults(false);
            loadData();
            toast.success('Psicólogo seleccionado correctamente');
          }}
          onBack={() => setShowMatchingResults(false)}
        />
      )}

      {/* Mi Psicólogo */}
      {tab === 'mi-psicologo' && !showMatchingTest && !showMatchingResults && (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
          padding: '40px',
          border: '1px solid rgba(90, 146, 112, 0.15)'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: 700, 
              color: '#1a2e22',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em'
            }}>
              Mi Psicólogo
            </h3>
          </div>
          {psych?.status === 'ASSIGNED' ? (
            <div style={{
              background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
              padding: '40px',
              borderRadius: '20px',
              border: '2px solid rgba(90, 146, 112, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              boxShadow: '0 4px 16px rgba(90, 146, 112, 0.15)'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid white',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px'
              }}>
                {psych.psychologist.avatarUrl ? (
                  <img src={psych.psychologist.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '👨‍⚕️'
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>
                  {psych.psychologist.name}
                </h3>
                <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                  {psych.psychologist.email}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: '#dcfce7',
                    color: '#15803d',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    ✅ Asignado y disponible
                  </div>
                  <button
                    onClick={() => loadPsychologistProfile(psych.psychologist.id)}
                    disabled={loadingPsychologistProfile}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: loadingPsychologistProfile ? 'not-allowed' : 'pointer',
                      opacity: loadingPsychologistProfile ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingPsychologistProfile) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {loadingPsychologistProfile ? 'Cargando...' : 'Ver Perfil Completo'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)',
              borderRadius: '20px',
              border: '2px dashed rgba(90, 146, 112, 0.3)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '24px', 
                fontWeight: 600, 
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif"
              }}>
                Encuentra tu psicólogo ideal
              </h3>
              <p style={{ 
                margin: '0 0 32px 0', 
                color: '#3a5a4a', 
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
                lineHeight: '1.6'
              }}>
                Completa nuestro test de matching para encontrar psicólogos que se adapten perfectamente a tus necesidades y preferencias.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowMatchingTest(true)}
                  style={{
                    padding: '14px 32px',
                    background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '16px',
                    boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Comenzar Test de Matching
                </button>
                <button
                  onClick={() => setShowMatchingResults(true)}
                  style={{
                    padding: '14px 32px',
                    background: '#fff',
                    color: '#5a9270',
                    border: '2px solid #5a9270',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f5f3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  Ver Psicólogos Recomendados
                </button>
              </div>
            </div>
          )}

          {/* Mis Citas Pasadas - Solo si hay psicólogo asignado */}
          {psych?.status === 'ASSIGNED' && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ 
                margin: '0 0 24px 0', 
                fontSize: '24px', 
                fontWeight: 700, 
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.02em'
              }}>
                Mis Citas Pasadas
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
                Aquí puedes ver todas tus citas pasadas y valorarlas
              </p>

              {loadingPastAppointments ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>Cargando citas pasadas...</p>
                </div>
              ) : pastAppointments.length === 0 ? (
                <div style={{
                  background: '#f9fafb',
                  borderRadius: '16px',
                  padding: '40px',
                  border: '1px solid rgba(90, 146, 112, 0.15)',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>No tienes citas pasadas aún</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {pastAppointments.map((apt: any) => (
                    <div
                      key={apt.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        padding: '24px',
                        border: '1px solid rgba(90, 146, 112, 0.15)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                            {apt.psychologist?.name || 'Psicólogo'}
                          </h4>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            {new Date(apt.startTime).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {apt.price && (
                            <div style={{ fontSize: '14px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                              {parseFloat(apt.price).toFixed(2)}€
                            </div>
                          )}
                        </div>
                        {apt.rating ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  style={{
                                    fontSize: '20px',
                                    color: star <= apt.rating.rating ? '#fbbf24' : '#d1d5db'
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            {apt.rating.comment && (
                              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontStyle: 'italic', maxWidth: '200px', textAlign: 'right' }}>
                                "{apt.rating.comment}"
                              </p>
                            )}
                            <button
                              onClick={() => {
                                setRatingAppointment(apt.rating.rating);
                                setRatingComment(apt.rating.comment || '');
                                const modal = document.getElementById(`rating-modal-${apt.id}`);
                                if (modal) (modal as HTMLElement).style.display = 'flex';
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Editar valoración
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setRatingAppointment(null);
                              setRatingComment('');
                              const modal = document.getElementById(`rating-modal-${apt.id}`);
                              if (modal) (modal as HTMLElement).style.display = 'flex';
                            }}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Valorar cita
                          </button>
                        )}
                      </div>

                      {/* Modal de valoración */}
                      <div
                        id={`rating-modal-${apt.id}`}
                        style={{
                          display: 'none',
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.5)',
                          zIndex: 1000,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={(e) => {
                          if (e.target === e.currentTarget) {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }
                        }}
                      >
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            padding: '32px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 600, color: '#1f2937' }}>
                            Valorar cita
                          </h3>
                          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
                            ¿Cómo fue tu experiencia con {apt.psychologist?.name || 'el psicólogo'}?
                          </p>
                          
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setRatingAppointment(star)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    fontSize: '36px',
                                    color: ratingAppointment && star <= ratingAppointment ? '#fbbf24' : '#d1d5db',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!ratingAppointment) {
                                      const hoverStar = parseInt(e.currentTarget.getAttribute('data-star') || '0');
                                      for (let i = 1; i <= hoverStar; i++) {
                                        const starEl = document.getElementById(`star-${apt.id}-${i}`);
                                        if (starEl) starEl.style.color = '#fbbf24';
                                      }
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    if (!ratingAppointment) {
                                      [1, 2, 3, 4, 5].forEach(i => {
                                        const starEl = document.getElementById(`star-${apt.id}-${i}`);
                                        if (starEl) starEl.style.color = '#d1d5db';
                                      });
                                    }
                                  }}
                                  data-star={star}
                                  id={`star-${apt.id}-${star}`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            {ratingAppointment && (
                              <p style={{ textAlign: 'center', margin: 0, fontSize: '14px', color: '#6b7280' }}>
                                {ratingAppointment === 1 && 'Muy malo'}
                                {ratingAppointment === 2 && 'Malo'}
                                {ratingAppointment === 3 && 'Regular'}
                                {ratingAppointment === 4 && 'Bueno'}
                                {ratingAppointment === 5 && 'Excelente'}
                              </p>
                            )}
                          </div>

                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                              Comentario (opcional)
                            </label>
                            <textarea
                              value={ratingComment}
                              onChange={(e) => setRatingComment(e.target.value)}
                              placeholder="Escribe tu opinión sobre la cita..."
                              rows={4}
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                const modal = document.getElementById(`rating-modal-${apt.id}`);
                                if (modal) (modal as HTMLElement).style.display = 'none';
                                setRatingAppointment(null);
                                setRatingComment('');
                              }}
                              style={{
                                padding: '10px 20px',
                                background: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleRateAppointment(apt.id)}
                              disabled={!ratingAppointment || submittingRating}
                              style={{
                                padding: '10px 20px',
                                background: ratingAppointment && !submittingRating ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: ratingAppointment && !submittingRating ? 'pointer' : 'not-allowed',
                                opacity: ratingAppointment && !submittingRating ? 1 : 0.6
                              }}
                            >
                              {submittingRating ? 'Guardando...' : 'Guardar valoración'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tareas */}
      {tab === 'tareas' && hasPsychologist && (
        <>
          {selectedTaskId && selectedTask ? (
            // Vista detallada de la tarea
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
                            toast.error('Error al subir el archivo: ' + errorMessage);
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
          ) : (
            // Lista de tareas
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
              padding: '40px',
              border: '1px solid rgba(90, 146, 112, 0.15)'
            }}>
              <h3 style={{ 
                margin: '0 0 32px 0', 
                fontSize: '28px', 
                fontWeight: 700, 
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.02em'
              }}>
            Mis Tareas
          </h3>
          {tasks.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No hay tareas"
              description="Aún no tienes tareas asignadas. Tu psicólogo te asignará tareas aquí."
            />
          ) : (
            <div 
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              role="list"
              aria-label="Lista de tareas"
            >
              {tasks.map((t) => (
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
                          {t.createdBy === 'PSYCHOLOGIST' ? '📥 Asignada' : '📤 Enviada'}
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
                      )}
                    </div>
          )}
        </>
      )}

      {/* Tests Pendientes */}
      {tab === 'tests-pendientes' && hasPsychologist && (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
          padding: '40px',
          border: '1px solid rgba(90, 146, 112, 0.15)'
        }}>
          <h3 style={{ 
            margin: '0 0 32px 0', 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#1a2e22',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '-0.02em'
          }}>
            Tests Pendientes
          </h3>
          {assignedTests.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No hay tests pendientes"
              description="Aún no tienes tests asignados. Tu psicólogo te asignará tests aquí."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {assignedTests.map(at => (
                <div
                  key={at.id}
                  style={{
                    padding: '28px',
                    background: at.completedAt ? 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)' : 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)',
                    border: `2px solid ${at.completedAt ? 'rgba(90, 146, 112, 0.3)' : 'rgba(90, 146, 112, 0.25)'}`,
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    cursor: at.completedAt ? 'default' : 'pointer',
                    boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)'
                  }}
                  onMouseEnter={(e) => {
                    if (!at.completedAt) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!at.completedAt) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.08)';
                    }
                  }}
                  onClick={async () => {
                    if (!at.completedAt && (at.testId || at.test?.id)) {
                      const testId = at.testId || at.test?.id;
                      const _testTitle = at.testTitle || at.test?.title || 'el test';
                      // Iniciar el test directamente sin confirmación
                      try {
                        // Usar el callback directo para iniciar el test
                        if (onStartTest) {
                          onStartTest(testId);
                        }
                      } catch (error) {
                        console.error('Error al navegar al test:', error);
                        toast.error('Error al iniciar el test. Por favor intenta de nuevo.');
                      }
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                          padding: '6px 12px',
                          background: at.completedAt ? '#5a9270' : '#7fb3a3',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          {at.completedAt ? '✅ Completado' : '⏳ Pendiente'}
                        </div>
                        {at.assignedAt && (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Asignado: {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                        {at.testTitle || at.test?.title || 'Test'}
                      </div>
                      {at.testCode && (
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#3a5a4a', 
                          marginBottom: '8px',
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          Código: {at.testCode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendario */}
      {tab === 'calendario' && hasPsychologist && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '32px',
            background: '#ffffff',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
            border: '1px solid rgba(90, 146, 112, 0.15)'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: 700, 
              color: '#1a2e22',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em'
            }}>
              Calendario de Disponibilidad
            </h3>
          </div>
          {loadingSlots ? (
            <LoadingSpinner text="Cargando calendario..." />
          ) : (
            <CalendarWeek
            mode="USER"
            slots={slots}
            myAppointments={myAppointments}
            onBook={async (id) => {
              try {
                const result = await calendarService.book(id);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                await loadAvailability();
                toast.success('Cita reservada exitosamente. Espera la confirmación del psicólogo.');
              } catch (e: any) {
                const errorMsg = e.response?.data?.error || 'Error al reservar la cita';
                toast.error(errorMsg);
              }
            }}
          />
          )}
          {!loadingSlots && myAppointments.length > 0 && (
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
                📅 Mis Citas
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {myAppointments.map(apt => (
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
                      fontSize: '14px', 
                      color: '#6b7280', 
                      marginBottom: '12px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {apt.psychologist && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#3a5a4a', 
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '16px'
                      }}>
                        {apt.psychologist.name}
                      </div>
                    )}
                    {apt.price && (
                      <div style={{ 
                        fontSize: '16px', 
                        color: '#1a2e22', 
                        fontWeight: 700,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '16px'
                      }}>
                        {apt.price} €
                      </div>
                    )}
                    {apt.status === 'REQUESTED' && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#d97706',
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '12px',
                        padding: '6px 10px',
                        background: '#fef3c7',
                        borderRadius: '6px'
                      }}>
                        Estado: Solicitud pendiente
                        {apt.requestedAt && (
                          <div style={{ fontSize: '11px', marginTop: '4px', color: '#6b7280' }}>
                            Solicitada: {new Date(apt.requestedAt).toLocaleString('es-ES')}
                          </div>
                        )}
                      </div>
                    )}
                    {apt.status === 'CONFIRMED' && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#059669',
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '12px',
                        padding: '6px 10px',
                        background: '#d1fae5',
                        borderRadius: '6px'
                      }}>
                        Cita confirmada
                      </div>
                    )}
                    {apt.status === 'CONFIRMED' && apt.paymentStatus && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: apt.paymentStatus === 'PAID' ? '#059669' : apt.paymentStatus === 'EXPIRED' ? '#dc2626' : '#d97706',
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '12px',
                        padding: '6px 10px',
                        background: apt.paymentStatus === 'PAID' ? '#d1fae5' : apt.paymentStatus === 'EXPIRED' ? '#fee2e2' : '#fef3c7',
                        borderRadius: '6px'
                      }}>
                        Estado de pago: {apt.paymentStatus === 'PAID' ? 'Pagado' : apt.paymentStatus === 'EXPIRED' ? 'Expirado' : 'Pendiente'}
                        {apt.paymentDeadline && apt.paymentStatus === 'PENDING' && (
                          <div style={{ fontSize: '11px', marginTop: '4px', color: '#6b7280', fontWeight: 500 }}>
                            Tienes hasta el {new Date(apt.paymentDeadline).toLocaleString('es-ES')} para realizar el pago
                          </div>
                        )}
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
                            if (me && apt.psychologist) {
                              try {
                                // Validar con backend antes de iniciar
                                const roomInfo = await jitsiService.getRoomInfo(apt.psychologist.email);
                                setVideoCallRoom(roomInfo.roomName);
                                setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                                setShowVideoCall(true);
                              } catch (error: any) {
                                toast.error(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
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
                          Iniciar Videollamada
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
      {tab === 'agenda-personal' && (
        <AgendaPersonal onComplete={() => setTab('perfil')} />
      )}

      {tab === 'mis-estadisticas' && (
        <MisEstadisticas />
      )}

      {tab === 'evaluaciones' && (
        <Evaluaciones />
      )}

      {tab === 'descubrimiento' && (
        <Descubrimiento />
      )}

      {/* Vista de Perfil del Psicólogo (estilo LinkedIn) */}
      {tab === 'perfil-psicologo' && psychologistProfile && (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
          padding: '40px',
          border: '1px solid rgba(90, 146, 112, 0.15)',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {loadingPsychologistProfile ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>Cargando perfil del psicólogo...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1a2e22' }}>
                  Perfil del Psicólogo
                </h2>
                <button
                  onClick={() => setTab('mi-psicologo')}
                  style={{
                    padding: '10px 20px',
                    background: '#f3f4f6',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ← Volver
                </button>
              </div>

              {/* Header del perfil */}
              <div style={{
                background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                padding: '40px',
                borderRadius: '20px',
                border: '2px solid rgba(90, 146, 112, 0.3)',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
                boxShadow: '0 4px 16px rgba(90, 146, 112, 0.15)'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid white',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  background: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  flexShrink: 0
                }}>
                  {psychologistProfile.avatarUrl ? (
                    <img src={psychologistProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '24px' }}>PS</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700, color: '#1f2937' }}>
                    {psychologistProfile.name}
                  </h3>
                  <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '12px' }}>
                    {psychologistProfile.email}
                  </div>
                  {psychologistRating && psychologistRating.averageRating !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{
                              fontSize: '18px',
                              color: star <= Math.round(psychologistRating.averageRating!) ? '#fbbf24' : '#d1d5db'
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                        {psychologistRating.averageRating.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        ({psychologistRating.totalRatings} {psychologistRating.totalRatings === 1 ? 'valoración' : 'valoraciones'})
                      </span>
                    </div>
                  )}
                  {psychologistProfile.specializations && (() => {
                    try {
                      const specs = JSON.parse(psychologistProfile.specializations);
                      if (Array.isArray(specs) && specs.length > 0) {
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                            {specs.map((spec: string, idx: number) => (
                              <span key={idx} style={{
                                padding: '6px 12px',
                                background: '#dcfce7',
                                color: '#15803d',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 500
                              }}>
                                {spec}
                              </span>
                            ))}
                          </div>
                        );
                      }
                    } catch (e) {}
                    return null;
                  })()}
                </div>
              </div>

              {/* Biografía */}
              {psychologistProfile.bio && (
                <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Sobre mí</h3>
                  <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#4b5563' }}>
                    {psychologistProfile.bio}
                  </p>
                </div>
              )}

              {/* Educación */}
              {psychologistProfile.education && (() => {
                try {
                  const education = JSON.parse(psychologistProfile.education);
                  if (Array.isArray(education) && education.length > 0) {
                    return (
                      <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Educación</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {education.map((edu: any, idx: number) => (
                            <div key={idx} style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                {edu.degree || 'Título'} {edu.field ? `en ${edu.field}` : ''}
                              </div>
                              <div style={{ fontSize: '16px', color: '#667eea', marginBottom: '4px' }}>
                                {edu.institution || 'Institución'}
                              </div>
                              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.startDate || edu.endDate || ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}

              {/* Certificaciones */}
              {psychologistProfile.certifications && (() => {
                try {
                  const certs = JSON.parse(psychologistProfile.certifications);
                  if (Array.isArray(certs) && certs.length > 0) {
                    return (
                      <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Certificaciones</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {certs.map((cert: any, idx: number) => (
                            <div key={idx} style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                {cert.name || 'Certificación'}
                              </div>
                              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                                Emitido por: {cert.issuer || 'N/A'}
                              </div>
                              {cert.date && (
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                                  Fecha: {cert.date}
                                </div>
                              )}
                              {cert.credentialId && (
                                <div style={{ fontSize: '13px', color: '#9ca3af', fontFamily: 'monospace' }}>
                                  ID: {cert.credentialId}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}

              {/* Experiencia */}
              {psychologistProfile.experience && (() => {
                try {
                  const experience = JSON.parse(psychologistProfile.experience);
                  if (Array.isArray(experience) && experience.length > 0) {
                    return (
                      <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Experiencia Profesional</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {experience.map((exp: any, idx: number) => (
                            <div key={idx} style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                {exp.title || 'Cargo'}
                              </div>
                              <div style={{ fontSize: '16px', color: '#667eea', marginBottom: '4px' }}>
                                {exp.company || 'Empresa'}
                              </div>
                              {exp.description && (
                                <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px', lineHeight: '1.6' }}>
                                  {exp.description}
                                </div>
                              )}
                              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                                {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate ? `Desde ${exp.startDate}` : exp.endDate ? `Hasta ${exp.endDate}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}

              {/* Intereses */}
              {psychologistProfile.interests && (() => {
                try {
                  const interests = JSON.parse(psychologistProfile.interests);
                  if (Array.isArray(interests) && interests.length > 0) {
                    return (
                      <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Intereses y Pasiones</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {interests.map((interest: string, idx: number) => (
                            <span key={idx} style={{
                              padding: '8px 16px',
                              background: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 500
                            }}>
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}

              {/* Idiomas */}
              {psychologistProfile.languages && (() => {
                try {
                  const languages = JSON.parse(psychologistProfile.languages);
                  if (Array.isArray(languages) && languages.length > 0) {
                    return (
                      <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Idiomas</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {languages.map((lang: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                              <span style={{ fontSize: '16px', fontWeight: 500, color: '#1f2937' }}>
                                {lang.language || 'Idioma'}
                              </span>
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                                {lang.level || 'Nivel'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}

              {/* Enlaces */}
              {(psychologistProfile.linkedinUrl || psychologistProfile.website) && (
                <div style={{ marginBottom: '32px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>Enlaces</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {psychologistProfile.linkedinUrl && (
                      <a
                        href={psychologistProfile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          background: '#0077b5',
                          color: 'white',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#005885';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#0077b5';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        LinkedIn
                      </a>
                    )}
                    {psychologistProfile.website && (
                      <a
                        href={psychologistProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          background: '#667eea',
                          color: 'white',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#5568d3';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#667eea';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Sitio Web
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'chat' && hasPsychologist && (
        <div style={{ width: '100%' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
            padding: '32px',
            border: '1px solid rgba(90, 146, 112, 0.15)',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: 700, 
              color: '#1a2e22',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em'
            }}>
            Chat con mi Psicólogo
          </h3>
          </div>
          <div style={{ width: '100%' }}>
            <ChatWidget mode="USER" />
          </div>
        </div>
      )}

      {/* Videollamada Jitsi - NUNCA desmontar, usar ref para mantener montado */}
      {(() => {
        // Si tenemos una referencia, renderizar el componente incluso si showVideoCall es false temporalmente
        const shouldRender = showVideoCall || (videoCallRef.current && videoCallRef.current.room);
        const roomToUse: string | undefined = showVideoCall ? (videoCallRoom ?? undefined) : (videoCallRef.current?.room ?? undefined);
        const userToUse = showVideoCall ? me : videoCallRef.current?.user;
        const otherUserToUse = showVideoCall ? videoCallOtherUser : videoCallRef.current?.otherUser;
        
        return shouldRender && roomToUse && userToUse ? (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, pointerEvents: 'auto' }}>
            <JitsiVideoCall
              key={`jitsi-${roomToUse}`} // Key estable para evitar re-montajes
              roomName={roomToUse!}
              userEmail={userToUse.email}
              userName={userToUse.name || 'Usuario'}
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
