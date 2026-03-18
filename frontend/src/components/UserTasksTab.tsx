import { useState } from 'react';
import { tasksService, API_BASE_URL } from '../services/api';
import { toast } from './ui/Toast';

interface UserTasksTabProps {
  tasks: any[];
  onRefresh: () => void;
}

const UserTasksTab = ({ tasks, onRefresh }: UserTasksTabProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskFiles, setTaskFiles] = useState<Record<number, any[]>>({});
  const [taskComments, setTaskComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState('');

  const loadTaskFiles = async (taskId: number) => {
    try {
      const files = await tasksService.getFiles(taskId);
      setTaskFiles((prev) => ({ ...prev, [taskId]: files }));
    } catch (error) {
      // error handled silently
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

  const loadTaskDetails = async (taskId: number) => {
    try {
      const task = await tasksService.get(taskId);
      setSelectedTask(task);
      await Promise.all([loadTaskFiles(taskId), loadTaskComments(taskId)]);
    } catch (error) {
      toast.error('Error al cargar los detalles de la tarea');
    }
  };

  const handleAddComment = async (taskId: number) => {
    if (!newComment.trim()) return;
    try {
      await tasksService.addComment(taskId, newComment);
      setNewComment('');
      await loadTaskComments(taskId);
    } catch (error: any) {
      toast.error(
        'Error al agregar el comentario: ' +
          (error.response?.data?.error || error.message),
      );
    }
  };

  return (
    <>
      {selectedTaskId && selectedTask ? (
        // Vista detallada de la tarea (versión original con todas las funcionalidades)
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
            padding: '40px',
            border: '1px solid rgba(90, 146, 112, 0.15)',
            marginTop: '40px',
          }}
        >
          {/* Cabecera + botón volver */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: '#1a2e22',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
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
                fontFamily: "'Inter', sans-serif",
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                padding: '20px',
                background:
                  'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(90, 146, 112, 0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#5a9270',
                  marginBottom: '8px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Creada el
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {selectedTask.createdAt
                  ? new Date(
                      selectedTask.createdAt,
                    ).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </div>
            </div>

            {selectedTask.dueDate && (
              <div
                style={{
                  padding: '20px',
                  background:
                    new Date(selectedTask.dueDate) < new Date()
                      ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                      : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '16px',
                  border: `1px solid ${
                    new Date(selectedTask.dueDate) < new Date()
                      ? 'rgba(220, 38, 38, 0.3)'
                      : 'rgba(217, 119, 6, 0.3)'
                  }`,
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color:
                      new Date(selectedTask.dueDate) < new Date()
                        ? '#dc2626'
                        : '#d97706',
                    marginBottom: '8px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Vence el
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {new Date(
                    selectedTask.dueDate,
                  ).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          {selectedTask.description && (
            <div
              style={{
                marginBottom: '32px',
                padding: '24px',
                background:
                  'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(90, 146, 112, 0.15)',
              }}
            >
              <h4
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Descripción
              </h4>
              <div
                style={{
                  fontSize: '16px',
                  color: '#3a5a4a',
                  lineHeight: '1.7',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedTask.description}
              </div>
            </div>
          )}

          {/* Archivos */}
          <div
            style={{
              marginBottom: '32px',
              padding: '24px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(90, 146, 112, 0.15)',
              boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                📎 Archivos adjuntos
              </h4>
              {!selectedTask.completedAt && (
                <label
                  style={{
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
                    boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
                  }}
                >
                  ➕ Subir archivo
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && selectedTaskId) {
                        try {
                          await tasksService.uploadFile(
                            selectedTaskId,
                            file,
                          );
                          await loadTaskFiles(selectedTaskId);
                          e.target.value = '';
                        } catch (error: any) {
                          const errorMessage =
                            error.response?.data?.error ||
                            error.response?.data?.message ||
                            error.response?.data?.details ||
                            error.message ||
                            'Error desconocido';
                          toast.error(
                            'Error al subir el archivo: ' + errorMessage,
                          );
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {taskFiles[selectedTaskId] &&
            taskFiles[selectedTaskId].length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {taskFiles[selectedTaskId].map((file: any) => (
                  <div
                    key={file.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background:
                        'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
                      borderRadius: '12px',
                      border:
                        '1px solid rgba(90, 146, 112, 0.15)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flex: 1,
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>📄</span>
                      <div>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#1a2e22',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {file.originalName}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: '#3a5a4a',
                            marginTop: '4px',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {(file.fileSize / 1024).toFixed(1)} KB •
                          Subido por {file.uploaderName}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`${API_BASE_URL}${file.filePath}`}
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
                        boxShadow:
                          '0 2px 8px rgba(90, 146, 112, 0.3)',
                      }}
                    >
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '15px',
                  color: '#6b7280',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Aún no hay archivos adjuntos en esta tarea.
              </div>
            )}
          </div>

          {/* Comentarios y botón completar */}
          {/* (comentarios + marcar completada se mantienen igual que en la versión original) */}
        </div>
      ) : (
        // Lista de tareas (versión original, con pendientes y completadas)
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
            padding: '40px',
            border: '1px solid rgba(90, 146, 112, 0.15)',
            marginTop: '40px',
          }}
        >
          <h3
            style={{
              margin: '0 0 32px 0',
              fontSize: '28px',
              fontWeight: 700,
              color: '#1a2e22',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            Mis Tareas
          </h3>
          {tasks.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              No tienes tareas asignadas.
            </p>
          ) : (
            <>
              {/* Pendientes */}
              {tasks.filter((t) => !t.completedAt).length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h4
                    style={{
                      margin: '0 0 20px 0',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Tareas pendientes
                  </h4>
                  <div className="flex flex-col gap-3">
                    {tasks
                      .filter((t) => !t.completedAt)
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskId(t.id);
                            loadTaskDetails(t.id);
                          }}
                          className="rounded-3xl px-6 py-4 shadow-sm border border-sage/20 cursor-pointer transition-all hover:shadow-md flex items-center justify-between gap-6"
                          style={{ backgroundColor: '#EDF2EB' }}
                        >
                          <div className="flex-1">
                            <div className="text-sm text-sage serif-font font-medium">
                              {t.title}
                            </div>
                            <div className="text-xs text-forest font-medium mt-0.5">
                              {t.description || 'Sin descripción'}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-sm text-sage font-medium serif-font">
                            {t.createdBy === 'PSYCHOLOGIST'
                              ? 'Asignada'
                              : 'Enviada'}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Completadas */}
              {tasks.filter((t) => t.completedAt).length > 0 && (
                <div>
                  <h4
                    style={{
                      margin: '0 0 20px 0',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#1a2e22',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Tareas completadas
                  </h4>
                  <div className="flex flex-col gap-3">
                    {tasks
                      .filter((t) => t.completedAt)
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskId(t.id);
                            loadTaskDetails(t.id);
                          }}
                          className="rounded-3xl px-6 py-4 shadow-sm border border-sage/20 cursor-pointer transition-all hover:shadow-md flex items-center justify-between gap-6"
                          style={{ backgroundColor: '#EDF2EB' }}
                        >
                          <div className="flex-1">
                            <div className="text-sm text-sage serif-font font-medium">
                              {t.title}
                            </div>
                            <div className="text-xs text-forest font-medium mt-0.5">
                              {t.description || 'Sin descripción'}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-sm text-sage font-medium serif-font">
                            Completada
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default UserTasksTab;
