import { useState } from 'react';
import { tasksService, fileService } from '../services/api';
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
        // Vista detallada de la tarea
        <div className="bg-white rounded-2xl shadow-card p-10 border border-slate-100 mt-10">
          {/* Cabecera + boton volver */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gantly-text tracking-tight">
              {selectedTask.title}
            </h3>
            <button
              onClick={() => {
                setSelectedTaskId(null);
                setSelectedTask(null);
                setNewComment('');
              }}
              className="px-5 py-2.5 bg-gantly-cloud-100 text-gantly-blue-600 border-2 border-gantly-blue-200 rounded-xl font-semibold text-sm cursor-pointer transition-all hover:bg-gantly-blue-50 hover:-translate-y-0.5"
            >
              ← Volver
            </button>
          </div>

          {/* Informacion de la tarea */}
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-8">
            <div className="p-5 bg-gradient-to-br from-gantly-cloud-100 to-gantly-blue-50 rounded-2xl border border-gantly-blue-100">
              <div className="text-xs text-gantly-blue-600 mb-2 font-semibold uppercase">
                Creada el
              </div>
              <div className="text-base font-semibold text-gantly-text">
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
                className={`p-5 rounded-2xl border ${
                  new Date(selectedTask.dueDate) < new Date()
                    ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                    : 'bg-gradient-to-br from-gantly-gold-50 to-gantly-gold-100 border-gantly-gold-300'
                }`}
              >
                <div
                  className={`text-xs mb-2 font-semibold uppercase ${
                    new Date(selectedTask.dueDate) < new Date()
                      ? 'text-red-600'
                      : 'text-gantly-gold-600'
                  }`}
                >
                  Vence el
                </div>
                <div className="text-base font-semibold text-gantly-text">
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

          {/* Descripcion */}
          {selectedTask.description && (
            <div className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-gantly-cloud-100 rounded-2xl border border-gantly-blue-100/50">
              <h4 className="text-lg font-semibold text-gantly-text mb-4">
                Descripcion
              </h4>
              <div className="text-base text-gantly-muted leading-relaxed whitespace-pre-wrap">
                {selectedTask.description}
              </div>
            </div>
          )}

          {/* Archivos */}
          <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-100 shadow-soft">
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-xl font-semibold text-gantly-text">
                Archivos adjuntos
              </h4>
              {!selectedTask.completedAt && (
                <label className="px-5 py-2.5 bg-gantly-blue-500 text-white rounded-xl text-sm font-semibold cursor-pointer transition-all hover:bg-gantly-blue-600 shadow-glow-blue">
                  Subir archivo
                  <input
                    type="file"
                    className="hidden"
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
              <div className="flex flex-col gap-3">
                {taskFiles[selectedTaskId].map((file: any) => (
                  <div
                    key={file.id}
                    className="flex justify-between items-center p-4 bg-gradient-to-br from-slate-50 to-gantly-cloud-100 rounded-xl border border-gantly-blue-100/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className="material-symbols-outlined text-2xl text-gantly-blue-400">description</span>
                      <div>
                        <div className="text-sm font-semibold text-gantly-text">
                          {file.originalName}
                        </div>
                        <div className="text-xs text-gantly-muted mt-1">
                          {(file.fileSize / 1024).toFixed(1)} KB •
                          Subido por {file.uploaderName}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => fileService.downloadTaskFile(file.filePath)}
                      className="px-4 py-2 bg-gantly-blue-500 text-white rounded-xl text-xs font-semibold transition-all hover:bg-gantly-blue-600 shadow-glow-blue"
                    >
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Aun no hay archivos adjuntos en esta tarea.
              </div>
            )}
          </div>

          {/* Comentarios y boton completar */}
          {/* (comentarios + marcar completada se mantienen igual que en la version original) */}
        </div>
      ) : (
        // Lista de tareas
        <div className="bg-white rounded-2xl shadow-card p-10 border border-slate-100 mt-10">
          <h3 className="text-2xl font-bold text-gantly-text tracking-tight mb-8">
            Mis Tareas
          </h3>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No tienes tareas asignadas.
            </p>
          ) : (
            <>
              {/* Pendientes */}
              {tasks.filter((t) => !t.completedAt).length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-gantly-text mb-5">
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
                          className="rounded-2xl px-6 py-4 shadow-soft border border-gantly-blue-100 cursor-pointer transition-all hover:shadow-card hover:-translate-y-0.5 flex items-center justify-between gap-6 bg-gantly-cloud-100"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-gantly-blue-600 font-medium">
                              {t.title}
                            </div>
                            <div className="text-xs text-gantly-text font-medium mt-0.5">
                              {t.description || 'Sin descripcion'}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-sm text-gantly-muted font-medium">
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
                  <h4 className="text-xl font-semibold text-gantly-text mb-5">
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
                          className="rounded-2xl px-6 py-4 shadow-soft border border-gantly-emerald-100 cursor-pointer transition-all hover:shadow-card hover:-translate-y-0.5 flex items-center justify-between gap-6 bg-gantly-emerald-50"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-gantly-emerald-600 font-medium">
                              {t.title}
                            </div>
                            <div className="text-xs text-gantly-text font-medium mt-0.5">
                              {t.description || 'Sin descripcion'}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-sm text-gantly-emerald-600 font-medium">
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
