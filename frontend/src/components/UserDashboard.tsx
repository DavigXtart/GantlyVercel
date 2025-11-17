import { useEffect, useState } from 'react';
import { profileService, tasksService, calendarService, assignedTestsService } from '../services/api';
import ChatWidget from './ChatWidget';
import CalendarWeek from './CalendarWeek';

type Tab = 'perfil' | 'mi-psicologo' | 'tareas' | 'tests-pendientes' | 'calendario' | 'chat';

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
  const [editForm, setEditForm] = useState({ name: '', gender: '', age: '' });
  const [taskFiles, setTaskFiles] = useState<Record<number, any[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskComments, setTaskComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState<string>('');

  const loadData = async () => {
    try {
    const m = await profileService.me();
    setMe(m);
    setEditForm({ name: m?.name || '', gender: m?.gender || '', age: m?.age?.toString() || '' });
    const p = await profileService.myPsychologist();
    setPsych(p);
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
  };

  useEffect(() => {
    loadData();
    loadAvailability(); // Cargar disponibilidad y citas al inicio
  }, []);

  useEffect(() => {
    if (tab === 'calendario') {
      loadAvailability();
    }
  }, [tab]);

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
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }
    try {
      const res = await profileService.uploadAvatar(file);
      setMe({ ...me, avatarUrl: res.avatarUrl });
      alert('Avatar actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al subir avatar:', error);
      alert('Error al subir el avatar: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
    }
  };

  const toggleDarkMode = async () => {
    await profileService.update({ darkMode: !me?.darkMode });
    setMe({ ...me, darkMode: !me?.darkMode });
    // Aplicar dark mode globalmente
    if (!me?.darkMode) {
      document.documentElement.style.setProperty('--bg-primary', '#1f2937');
      document.documentElement.style.setProperty('--bg-secondary', '#111827');
      document.documentElement.style.setProperty('--text-primary', '#f9fafb');
      document.documentElement.style.setProperty('--text-secondary', '#d1d5db');
    } else {
      document.documentElement.style.setProperty('--bg-primary', '#ffffff');
      document.documentElement.style.setProperty('--bg-secondary', '#f9fafb');
      document.documentElement.style.setProperty('--text-primary', '#1f2937');
      document.documentElement.style.setProperty('--text-secondary', '#6b7280');
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

  const loadAvailability = async () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const list = await calendarService.availability(from.toISOString(), to.toISOString());
    setSlots(list);
    // Cargar también las citas reservadas del usuario
    const appointments = await calendarService.myAppointments();
    setMyAppointments(appointments);
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
          { id: 'perfil', label: 'Mi Perfil', icon: '👤' },
          { id: 'mi-psicologo', label: 'Mi Psicólogo', icon: '👨‍⚕️' },
          { id: 'tareas', label: 'Tareas', icon: '📋' },
          { id: 'tests-pendientes', label: 'Tests', icon: '📝' },
          { id: 'calendario', label: 'Calendario', icon: '📅' },
          { id: 'chat', label: 'Chat', icon: '💬' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            style={{
              padding: '12px 24px',
              background: tab === t.id ? '#5a9270' : 'transparent',
              color: tab === t.id ? '#ffffff' : '#3a5a4a',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: tab === t.id ? 600 : 500,
              fontSize: '15px',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif",
              boxShadow: tab === t.id ? '0 4px 12px rgba(90, 146, 112, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (tab !== t.id) {
                e.currentTarget.style.background = '#f0f5f3';
                e.currentTarget.style.color = '#5a9270';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== t.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#3a5a4a';
              }
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
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
          {/* Header con gradiente pastel */}
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
                    src={me.avatarUrl.startsWith('http') ? me.avatarUrl : `http://localhost:8080${me.avatarUrl}`}
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
                        onClick={() => { setEditing(false); setEditForm({ name: me?.name || '', gender: me?.gender || '', age: me?.age?.toString() || '' }); }}
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

          {/* Información adicional */}
            <div style={{
            padding: '40px', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '24px',
            background: '#f8f9fa'
          }}>
            <div style={{
              padding: '24px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(90, 146, 112, 0.15)',
              boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
              transition: 'all 0.3s ease'
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
                marginBottom: '12px', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Estado de cuenta
              </div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif"
              }}>
                {me?.role === 'USER' ? '👤 Usuario' : me?.role === 'PSYCHOLOGIST' ? '👨‍⚕️ Psicólogo' : '👑 Administrador'}
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(90, 146, 112, 0.15)',
              boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
              transition: 'all 0.3s ease'
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

            <div style={{
              padding: '24px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(90, 146, 112, 0.15)',
              boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
              transition: 'all 0.3s ease'
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
              transition: 'all 0.3s ease'
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
                marginBottom: '12px', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Preferencias
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  cursor: 'pointer', 
                  fontSize: '15px', 
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  <input
                    type="checkbox"
                    checked={!!me?.darkMode}
                    onChange={toggleDarkMode}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      cursor: 'pointer',
                      accentColor: '#5a9270'
                    }}
                  />
                  Modo oscuro
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mi Psicólogo */}
      {tab === 'mi-psicologo' && (
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
              Mi Psicólogo
            </h3>
            <button
              onClick={loadData}
              style={{
                padding: '10px 20px',
                background: '#5a9270',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '15px',
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
              🔄 Refrescar
            </button>
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
                  📧 {psych.psychologist.email}
                </div>
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
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '24px', 
                fontWeight: 600, 
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif"
              }}>
                Esperando asignación
              </h3>
              <p style={{ 
                margin: 0, 
                color: '#3a5a4a', 
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
                lineHeight: '1.6'
              }}>
                Un administrador te asignará un psicólogo pronto. Te notificaremos cuando esto ocurra.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tareas */}
      {tab === 'tareas' && (
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
                            alert('Archivo subido exitosamente');
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
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
              borderRadius: '20px',
              border: '2px dashed rgba(90, 146, 112, 0.3)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: '#1a2e22', 
                marginBottom: '12px',
                fontFamily: "'Inter', sans-serif"
              }}>
                No hay tareas disponibles
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#3a5a4a',
                fontFamily: "'Inter', sans-serif",
                lineHeight: '1.6'
              }}>
                Tu psicólogo te asignará tareas cuando sea necesario
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tasks.map(t => (
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
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#5a9270', 
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        marginTop: '8px'
                      }}>
                        👆 Haz clic para ver detalles y comentarios
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
      {tab === 'tests-pendientes' && (
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
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
              borderRadius: '20px',
              border: '2px dashed rgba(90, 146, 112, 0.3)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: '#1a2e22', 
                marginBottom: '12px',
                fontFamily: "'Inter', sans-serif"
              }}>
                No hay tests pendientes
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: '#3a5a4a',
                fontFamily: "'Inter', sans-serif",
                lineHeight: '1.6'
              }}>
                Tu psicólogo te asignará tests cuando sea necesario
              </div>
            </div>
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
                      const testTitle = at.testTitle || at.test?.title || 'el test';
                      if (confirm(`¿Deseas comenzar el test "${testTitle}"?`)) {
                        try {
                          // Usar el callback directo para iniciar el test
                          if (onStartTest) {
                            onStartTest(testId);
                          }
                        } catch (error) {
                          console.error('Error al navegar al test:', error);
                          alert('Error al iniciar el test. Por favor intenta de nuevo.');
                        }
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
                      {!at.completedAt && (
                        <div style={{ 
                          marginTop: '16px', 
                          fontSize: '15px', 
                          color: '#5a9270', 
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          👆 Haz clic para comenzar el test
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
      {tab === 'calendario' && (
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
          <CalendarWeek
            mode="USER"
            slots={slots}
            myAppointments={myAppointments}
            onBook={async (id) => {
              try {
                const result = await calendarService.book(id);
                if (result.error) {
                  alert(result.error);
                  return;
                }
                await loadAvailability();
                alert('Cita reservada exitosamente');
              } catch (e: any) {
                const errorMsg = e.response?.data?.error || 'Error al reservar la cita';
                alert(errorMsg);
              }
            }}
          />
          {myAppointments.length > 0 && (
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
                📅 Mis Citas Reservadas
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
                      fontSize: '15px', 
                      color: '#3a5a4a', 
                      marginBottom: '8px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      🕐 {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {apt.psychologist && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#5a9270', 
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        👨‍⚕️ {apt.psychologist.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {tab === 'chat' && (
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
    </div>
  );
}
