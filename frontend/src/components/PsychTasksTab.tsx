import { useState, useEffect } from 'react';
import { tasksService, fileService } from '../services/api';
import EmptyState from './ui/EmptyState';
import { toast } from './ui/Toast';

interface PsychTasksTabProps {
  me: any;
  tasks: any[];
  patients: any[];
  onRefresh: () => Promise<void>;
}

export default function PsychTasksTab({ me, tasks, patients, onRefresh }: PsychTasksTabProps) {
  const [selectedPatientForTasks, setSelectedPatientForTasks] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskFiles, setTaskFiles] = useState<Record<number, any[]>>({});
  const [taskComments, setTaskComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState<string>('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ userId: '', title: '', description: '', dueDate: '' });
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const loadTaskFiles = async (taskId: number) => {
    try {
      const files = await tasksService.getFiles(taskId);
      setTaskFiles((prev) => ({ ...prev, [taskId]: files }));
    } catch (error) {
      // error handled silently
    }
  };

  const loadTaskDetails = async (taskId: number) => {
    try {
      const task = await tasksService.get(taskId);
      setSelectedTask(task);
      await loadTaskFiles(taskId);
      await loadTaskComments(taskId);
    } catch (error) {
      toast.error('Error al cargar los detalles de la tarea');
    }
  };

  const loadTaskComments = async (taskId: number) => {
    try {
      const comments = await tasksService.getComments(taskId);
      setTaskComments((prev) => ({ ...prev, [taskId]: comments }));
    } catch (error) {
      // error handled silently
    }
  };

  const handleAddComment = async (taskId: number) => {
    if (!newComment.trim()) return;
    try {
      await tasksService.addComment(taskId, newComment);
      setNewComment('');
      await loadTaskComments(taskId);
      toast.success('Comentario agregado exitosamente');
    } catch (error: any) {
      toast.error('Error al agregar el comentario: ' + (error.response?.data?.error || error.message));
    }
  };

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

  const patientsWithTasks = patients.filter((p: any) => tasksByPatient[p.id] && tasksByPatient[p.id].length > 0);

  useEffect(() => {
    tasks.forEach(t => {
      if (!taskFiles[t.id]) {
        loadTaskFiles(t.id);
      }
    });
  }, [tasks.length]);

  return (
    <>
      {selectedTaskId && selectedTask ? (
        // Vista detallada de la tarea (igual que en UserDashboard)
        <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
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
                    <button
                      onClick={() => fileService.downloadTaskFile(file.filePath)}
                      style={{
                        padding: '8px 16px',
                        background: '#5a9270',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
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
                    </button>
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
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
                background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
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
              + Nueva Tarea
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
                        toast.warning('Por favor completa el título de la tarea');
                        return;
                      }
                      if (!me || !me.id) {
                        toast.error('Error: No se pudo obtener la información del psicólogo. Por favor recarga la página.');
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
                        await onRefresh();
                        setShowTaskForm(false);
                        setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                        // Tarea creada exitosamente (sin pop-up)
                      } catch (error: any) {
                        toast.error('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
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
                            Creada: {new Date(t.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                      {t.completedAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            padding: '4px 10px',
                            background: '#E8F5E9',
                            color: '#2E7D32',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            Completada
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              (async () => {
                                try {
                                  await tasksService.reopen(t.id);
                                  toast.success('Tarea reabierta exitosamente');
                                  await onRefresh();
                                } catch (error: any) {
                                  toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al reabrir la tarea');
                                }
                              })();
                            }}
                            style={{
                              padding: '4px 12px',
                              background: '#FFF3E0',
                              color: '#E65100',
                              border: '1px solid rgba(230, 81, 0, 0.3)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: "'Inter', sans-serif",
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#FFE0B2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FFF3E0';
                            }}
                          >
                            Reabrir
                          </button>
                        </div>
                      )}
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
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tareas por Paciente
            </h3>
            <button
              onClick={() => setShowTaskForm(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
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
              + Nueva Tarea
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
                        toast.warning('Por favor completa todos los campos requeridos');
                        return;
                      }
                      if (!me || !me.id) {
                        toast.error('Error: No se pudo obtener la información del psicólogo. Por favor recarga la página.');
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
                        await onRefresh();
                        setShowTaskForm(false);
                        setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                        // Tarea creada exitosamente (sin pop-up)
                      } catch (error: any) {
                        toast.error('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
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
            <EmptyState
              icon="📋"
              title="No hay pacientes con tareas"
              description="Crea tareas para tus pacientes o revisa las enviadas por ellos."
            />
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
  );
}
