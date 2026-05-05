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
  const [submitting, setSubmitting] = useState(false);

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

  const handleCompleteTask = async (taskId: number) => {
    if (!confirm('¿Estás seguro de que quieres finalizar esta tarea? Esta acción no se puede deshacer.')) return;
    try {
      setSubmitting(true);
      await tasksService.complete(taskId);
      toast.success('Tarea finalizada correctamente');
      await onRefresh();
      // Reload the task details to reflect the new state
      const updated = await tasksService.get(taskId);
      setSelectedTask(updated);
    } catch (error: any) {
      toast.error('Error al finalizar la tarea: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completedAt);
  const completedTasks = tasks.filter((t) => t.completedAt);
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const pendingCount = pendingTasks.length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <>
      {selectedTaskId && selectedTask ? (
        // Task detail view — PREMIUM
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {/* Gradient accent strip */}
          <div className="h-1.5 bg-gradient-to-r from-gantly-blue via-gantly-cyan to-gantly-emerald"></div>

          <div className="p-6 md:p-8">
            {/* Header + back button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  selectedTask.completedAt
                    ? 'bg-gantly-emerald/10'
                    : 'bg-gantly-gold/10'
                }`}>
                  <span className={`material-symbols-outlined text-xl ${
                    selectedTask.completedAt ? 'text-gantly-emerald' : 'text-gantly-gold'
                  }`}>
                    {selectedTask.completedAt ? 'task_alt' : 'pending_actions'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-gantly-text">
                    {selectedTask.title}
                  </h3>
                  <span className={`inline-block mt-1 text-xs font-body font-semibold px-3 py-1 rounded-full ${
                    selectedTask.completedAt
                      ? 'bg-gantly-emerald/10 text-gantly-emerald'
                      : 'bg-gantly-gold/10 text-gantly-gold'
                  }`}>
                    {selectedTask.completedAt ? 'Completada' : 'Pendiente'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTaskId(null);
                  setSelectedTask(null);
                  setNewComment('');
                }}
                className="text-sm text-gantly-blue hover:text-gantly-navy cursor-pointer transition-all duration-200 flex items-center gap-1 hover:bg-gantly-ice px-3 py-2 rounded-xl"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Volver
              </button>
            </div>

            {/* Stats / Metadata bento row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-gantly-cloud/60 rounded-xl px-4 py-3 border border-gantly-blue/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-gantly-blue">calendar_today</span>
                  <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Creada</span>
                </div>
                <div className="font-body text-sm font-semibold text-gantly-text">
                  {selectedTask.createdAt
                    ? new Date(selectedTask.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </div>
              </div>
              {selectedTask.dueDate && (
                <div className={`rounded-xl px-4 py-3 border ${
                  new Date(selectedTask.dueDate) < new Date() && !selectedTask.completedAt
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gantly-gold/5 border-gantly-gold/15'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`material-symbols-outlined text-sm ${
                      new Date(selectedTask.dueDate) < new Date() && !selectedTask.completedAt ? 'text-red-500' : 'text-gantly-gold'
                    }`}>schedule</span>
                    <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Vence</span>
                  </div>
                  <div className={`font-body text-sm font-semibold ${
                    new Date(selectedTask.dueDate) < new Date() && !selectedTask.completedAt ? 'text-red-600' : 'text-gantly-text'
                  }`}>
                    {new Date(selectedTask.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {!selectedTask.completedAt && new Date(selectedTask.dueDate) >= new Date() && (
                    <div className="text-[10px] text-gantly-muted mt-0.5">
                      {Math.ceil((new Date(selectedTask.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días restantes
                    </div>
                  )}
                </div>
              )}
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-gantly-muted">person</span>
                  <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Asignada por</span>
                </div>
                <div className="font-body text-sm font-semibold text-gantly-text">
                  {selectedTask.psychologistName || 'Tu psicólogo'}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h4 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-gantly-ice flex items-center justify-center">
                    <span className="material-symbols-outlined text-gantly-blue text-sm">description</span>
                  </span>
                  Descripción
                </h4>
                <p className="text-sm font-body text-gantly-muted leading-relaxed whitespace-pre-wrap bg-gantly-cloud/50 rounded-xl p-5 border border-slate-100">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Files */}
            <div className="mb-6 pb-6 border-b border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-gantly-navy/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gantly-navy text-sm">attach_file</span>
                  </span>
                  Archivos adjuntos
                </h4>
                {!selectedTask.completedAt && (
                  <label className="text-sm text-gantly-blue hover:text-gantly-navy font-body font-medium cursor-pointer transition-all duration-200 flex items-center gap-1 border border-gantly-blue/30 hover:border-gantly-blue px-3 py-2 rounded-xl hover:bg-gantly-ice hover:shadow-sm">
                    <span className="material-symbols-outlined text-base">add</span>
                    Subir archivo
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedTaskId) {
                          try {
                            await tasksService.uploadFile(selectedTaskId, file);
                            await loadTaskFiles(selectedTaskId);
                            e.target.value = '';
                          } catch (error: any) {
                            const errorMessage =
                              error.response?.data?.error ||
                              error.response?.data?.message ||
                              error.response?.data?.details ||
                              error.message ||
                              'Error desconocido';
                            toast.error('Error al subir el archivo: ' + errorMessage);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {taskFiles[selectedTaskId] && taskFiles[selectedTaskId].length > 0 ? (
                <div className="space-y-2">
                  {taskFiles[selectedTaskId].map((file: any) => (
                    <div
                      key={file.id}
                      className="flex justify-between items-center p-4 bg-gantly-cloud/50 rounded-xl border border-slate-100 hover:border-gantly-blue/20 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gantly-navy/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-gantly-navy text-lg">description</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-body font-medium text-gantly-text truncate group-hover:text-gantly-blue transition-colors duration-200">
                            {file.originalName}
                          </p>
                          <p className="text-xs font-body text-gantly-muted">
                            {(file.fileSize / 1024).toFixed(1)} KB · Subido por {file.uploaderName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => fileService.downloadTaskFile(file.filePath)}
                        className="text-xs text-gantly-blue hover:text-white font-body font-medium cursor-pointer transition-all duration-200 flex-shrink-0 ml-3 bg-gantly-blue/10 hover:bg-gantly-blue px-3 py-2 rounded-lg"
                      >
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gantly-cloud/30 rounded-xl border-2 border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-3xl text-gantly-muted/40 mb-2 block">cloud_upload</span>
                  <p className="text-sm font-body text-gantly-muted">
                    Sin archivos adjuntos
                  </p>
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="mb-6 pb-6 border-b border-slate-100">
              <h4 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gantly-cyan/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gantly-cyan text-sm">chat</span>
                </span>
                Comentarios
                {taskComments[selectedTaskId] && taskComments[selectedTaskId].length > 0 && (
                  <span className="text-xs font-heading font-bold text-gantly-blue bg-gantly-blue/10 px-2 py-0.5 rounded-full">
                    {taskComments[selectedTaskId].length}
                  </span>
                )}
              </h4>

              {taskComments[selectedTaskId] && taskComments[selectedTaskId].length > 0 ? (
                <div className="space-y-3 mb-5">
                  {taskComments[selectedTaskId].map((comment: any) => (
                    <div key={comment.id} className="p-4 bg-gantly-cloud/50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="text-sm font-body font-semibold text-gantly-text">{comment.userName}</div>
                        <div className="text-xs font-body text-gantly-muted">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          }) : ''}
                        </div>
                      </div>
                      <div className="text-sm font-body text-gantly-muted leading-relaxed whitespace-pre-wrap">{comment.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 mb-5 bg-gantly-cloud/30 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-body text-gantly-muted/70">No hay comentarios aún</p>
                </div>
              )}

              {/* Comment form */}
              <div className="flex gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 p-3 rounded-xl border-2 border-slate-200 text-sm font-body text-gantly-text resize-y min-h-[70px] outline-none transition-all duration-200 focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10"
                />
                <button
                  onClick={() => handleAddComment(selectedTaskId)}
                  disabled={!newComment.trim()}
                  className="self-start px-5 py-2.5 bg-gantly-blue hover:bg-gantly-blue/90 text-white border-none rounded-xl text-sm font-heading font-semibold cursor-pointer transition-all duration-200 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Enviar
                </button>
              </div>
            </div>

            {/* COMPLETE TASK — CTA for patient */}
            {!selectedTask.completedAt && (
              <div className="rounded-2xl p-6 border-2 border-dashed border-gantly-emerald/30 bg-gradient-to-br from-gantly-emerald/5 to-gantly-cyan/5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gantly-emerald/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gantly-emerald text-xl">check_circle</span>
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-gantly-text text-base">¿Has terminado esta tarea?</h4>
                      <p className="font-body text-sm text-gantly-muted">Marca la tarea como completada cuando la hayas finalizado.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCompleteTask(selectedTaskId)}
                    disabled={submitting}
                    className={`px-6 py-3 rounded-xl font-heading font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg ${
                      submitting
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gantly-emerald text-white hover:bg-gantly-emerald/90 shadow-gantly-emerald/25 hover:shadow-xl hover:shadow-gantly-emerald/30'
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">send</span>
                        Finalizar tarea
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Already completed message */}
            {selectedTask.completedAt && (
              <div className="rounded-2xl p-5 bg-gantly-emerald/5 border border-gantly-emerald/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-gantly-emerald text-xl">verified</span>
                <div>
                  <span className="font-heading font-bold text-gantly-emerald text-sm">Tarea completada</span>
                  <span className="font-body text-xs text-gantly-muted ml-2">
                    {new Date(selectedTask.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Task list
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-gantly-blue text-xl">checklist</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-gantly-text">
              Mis Tareas
            </h2>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-gantly-cloud rounded-2xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="material-symbols-outlined text-3xl text-gantly-muted">task</span>
              </div>
              <p className="text-base font-heading font-medium text-gantly-text mb-1">
                No tienes tareas asignadas
              </p>
              <p className="text-sm font-body text-gantly-muted">
                Cuando tu psicólogo te asigne tareas aparecerán aquí.
              </p>
            </div>
          ) : (
            <>
              {/* Summary bento header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-gantly-cloud/60 rounded-xl px-4 py-3 border border-gantly-blue/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sm text-gantly-blue">assignment</span>
                    <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Total</span>
                  </div>
                  <div className="font-heading text-2xl font-bold text-gantly-blue">{totalTasks}</div>
                </div>
                <div className="bg-gantly-gold/5 rounded-xl px-4 py-3 border border-gantly-gold/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sm text-gantly-gold">pending_actions</span>
                    <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Pendientes</span>
                  </div>
                  <div className="font-heading text-2xl font-bold text-yellow-700">{pendingCount}</div>
                </div>
                <div className="bg-gantly-emerald/5 rounded-xl px-4 py-3 border border-gantly-emerald/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sm text-gantly-emerald">task_alt</span>
                    <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Completadas</span>
                  </div>
                  <div className="font-heading text-2xl font-bold text-gantly-emerald">{completedCount}</div>
                </div>
                <div className="rounded-xl px-4 py-3 border border-gantly-blue/10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 30%, #48C6D4 65%, #78D4B0 100%)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-sm text-white/80">trending_up</span>
                    <span className="font-body text-[11px] uppercase tracking-wider text-white/70 font-medium">Progreso</span>
                  </div>
                  <div className="font-heading text-2xl font-bold text-white">{Math.round(progressPercent)}%</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="font-body text-xs text-gantly-muted font-medium">Avance:</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gantly-emerald to-gantly-cyan transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <span className="font-body text-xs font-semibold text-gantly-text">{completedCount}/{totalTasks}</span>
                </div>
              </div>

              {/* Pending tasks */}
              {pendingCount > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-gantly-gold"></div>
                    <h4 className="text-xs font-heading font-semibold text-gantly-muted uppercase tracking-widest">
                      Tareas pendientes
                    </h4>
                    <span className="text-xs font-heading font-bold text-gantly-gold bg-gantly-gold/10 px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {pendingTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskId(t.id);
                            loadTaskDetails(t.id);
                          }}
                          className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-gantly-gold cursor-pointer hover:shadow-lg hover:shadow-gantly-blue/5 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gantly-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gantly-gold/20 transition-all duration-300">
                              <span className="material-symbols-outlined text-gantly-gold text-lg">pending_actions</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-heading font-semibold text-gantly-text group-hover:text-gantly-blue transition-colors duration-200">
                                {t.title}
                              </p>
                              <p className="text-sm font-body text-gantly-muted mt-0.5 truncate">
                                {t.description || 'Sin descripción'}
                              </p>
                              {t.dueDate && (
                                <p className={`text-xs font-body mt-2 flex items-center gap-1 ${
                                  new Date(t.dueDate) < new Date()
                                    ? 'text-red-600 font-medium'
                                    : new Date(t.dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
                                    ? 'text-gantly-gold'
                                    : 'text-gantly-muted'
                                }`}>
                                  <span className="material-symbols-outlined text-xs">schedule</span>
                                  Vence: {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-gantly-blue transition-colors duration-200">
                            chevron_right
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Completed tasks */}
              {completedCount > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-gantly-emerald"></div>
                    <h4 className="text-xs font-heading font-semibold text-gantly-muted uppercase tracking-widest">
                      Tareas completadas
                    </h4>
                    <span className="text-xs font-heading font-bold text-gantly-emerald bg-gantly-emerald/10 px-2 py-0.5 rounded-full">
                      {completedCount}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {completedTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskId(t.id);
                            loadTaskDetails(t.id);
                          }}
                          className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-gantly-emerald cursor-pointer hover:shadow-lg hover:shadow-gantly-blue/5 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-4 group opacity-80 hover:opacity-100"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gantly-emerald/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gantly-emerald/20 transition-all duration-300">
                              <span className="material-symbols-outlined text-gantly-emerald text-lg">task_alt</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-heading font-semibold text-gantly-text group-hover:text-gantly-blue transition-colors duration-200">
                                {t.title}
                              </p>
                              <p className="text-sm font-body text-gantly-muted mt-0.5 truncate">
                                {t.description || 'Sin descripción'}
                              </p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-gantly-blue transition-colors duration-200">
                            chevron_right
                          </span>
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
