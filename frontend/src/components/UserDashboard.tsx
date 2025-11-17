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
          { id: 'mi-psicologo', label: '👨‍⚕️ Mi Psicólogo', icon: '👨‍⚕️' },
          { id: 'tareas', label: '📋 Tareas', icon: '📋' },
          { id: 'tests-pendientes', label: '📝 Tests Pendientes', icon: '📝' },
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
                      {me?.name || 'Usuario'}
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

          {/* Información adicional */}
          <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Estado de cuenta
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                {me?.role === 'USER' ? '👤 Usuario' : me?.role === 'PSYCHOLOGIST' ? '👨‍⚕️ Psicólogo' : '👑 Administrador'}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tareas pendientes
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                {tasks.filter(t => t.createdBy === 'PSYCHOLOGIST' && (!t.dueDate || new Date(t.dueDate) > new Date())).length} pendientes
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tests pendientes
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                {assignedTests.filter(t => !t.completedAt).length} pendientes
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Preferencias
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1f2937' }}>
                  <input
                    type="checkbox"
                    checked={!!me?.darkMode}
                    onChange={toggleDarkMode}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
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
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Mi Psicólogo
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
          {psych?.status === 'ASSIGNED' ? (
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
              padding: '32px',
              borderRadius: '12px',
              border: '2px solid #667eea',
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
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
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '12px',
              border: '2px dashed #f59e0b'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#92400e' }}>
                Esperando asignación
              </h3>
              <p style={{ margin: 0, color: '#78350f', fontSize: '14px' }}>
                Un administrador te asignará un psicólogo pronto. Te notificaremos cuando esto ocurra.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tareas */}
      {tab === 'tareas' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Mis Tareas
          </h3>
          {tasks.length === 0 ? (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                No hay tareas disponibles
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                Tu psicólogo te asignará tareas cuando sea necesario
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tasks.map(t => (
                <div
                  key={t.id}
                  style={{
                    padding: '24px',
                    background: t.createdBy === 'PSYCHOLOGIST' ? '#f0f9ff' : '#f9fafb',
                    border: `2px solid ${t.createdBy === 'PSYCHOLOGIST' ? '#0ea5e9' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div style={{
                          padding: '4px 8px',
                          background: t.createdBy === 'PSYCHOLOGIST' ? '#0ea5e9' : '#6b7280',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600
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
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>
                        {t.title}
                      </div>
                      <div style={{ 
                        fontSize: '15px', 
                        color: '#4b5563', 
                        lineHeight: '1.7', 
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {t.description || 'Sin descripción'}
                      </div>
                      
                      {/* Sección de archivos siempre visible */}
                      <div style={{ marginTop: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>📎 Archivos adjuntos</h5>
                          <label style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            ➕ Subir archivo
                            <input
                              type="file"
                              style={{ display: 'none' }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    await tasksService.uploadFile(t.id, file);
                                    await loadTaskFiles(t.id);
                                    alert('Archivo subido exitosamente');
                                  } catch (error: any) {
                                    console.error('Error al subir archivo:', error);
                                    alert('Error al subir el archivo: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        {taskFiles[t.id] && taskFiles[t.id].length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {taskFiles[t.id].map((file: any) => (
                              <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                  <span style={{ fontSize: '20px' }}>📄</span>
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>{file.originalName}</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                                      {(file.fileSize / 1024).toFixed(1)} KB • Subido por {file.uploaderName}
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href={`http://localhost:8080${file.filePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: '6px 12px',
                                    background: '#667eea',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#5568d3'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
                                >
                                  Descargar
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                            No hay archivos adjuntos aún
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tests Pendientes */}
      {tab === 'tests-pendientes' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Tests Pendientes
          </h3>
          {assignedTests.length === 0 ? (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                No hay tests pendientes
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                Tu psicólogo te asignará tests cuando sea necesario
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {assignedTests.map(at => (
                <div
                  key={at.id}
                  style={{
                    padding: '20px',
                    background: at.completedAt ? '#f0fdf4' : '#fef3c7',
                    border: `2px solid ${at.completedAt ? '#22c55e' : '#f59e0b'}`,
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    cursor: at.completedAt ? 'default' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!at.completedAt) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!at.completedAt) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
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
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>
                        {at.testTitle || at.test?.title || 'Test'}
                      </div>
                      {at.testCode && (
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                          Código: {at.testCode}
                        </div>
                      )}
                      {!at.completedAt && (
                        <div style={{ marginTop: '12px', fontSize: '14px', color: '#f59e0b', fontWeight: 600 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{
                margin: '0 0 20px 0',
                fontSize: '20px',
                fontWeight: 700,
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📅 Mis Citas Reservadas
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {myAppointments.map(apt => (
                  <div
                    key={apt.id}
                    style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      border: '2px solid #f59e0b',
                      borderRadius: '10px',
                      padding: '16px',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
                      {new Date(apt.startTime).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '14px', color: '#78350f', marginBottom: '4px' }}>
                      🕐 {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {apt.psychologist && (
                      <div style={{ fontSize: '13px', color: '#92400e', opacity: 0.8 }}>
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
          <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Chat con mi Psicólogo
          </h3>
          <div style={{ width: '100%' }}>
            <ChatWidget mode="USER" />
          </div>
        </div>
      )}
    </div>
  );
}
