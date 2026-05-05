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

  // Stats
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completedAt).length;
  const pendingCount = totalTasks - completedCount;
  const overdueCount = tasks.filter(t => !t.completedAt && t.dueDate && new Date(t.dueDate) < new Date()).length;

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
        // Vista detallada de la tarea — PREMIUM
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {/* Gradient accent strip */}
          <div className="h-1.5 bg-gradient-to-r from-gantly-blue via-gantly-cyan to-gantly-emerald"></div>

          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  selectedTask.completedAt ? 'bg-gantly-emerald/10' : 'bg-gantly-gold/10'
                }`}>
                  <span className={`material-symbols-outlined text-xl ${
                    selectedTask.completedAt ? 'text-gantly-emerald' : 'text-gantly-gold'
                  }`}>
                    {selectedTask.completedAt ? 'task_alt' : 'pending_actions'}
                  </span>
                </div>
                <div>
                  <h3 className="m-0 text-xl font-heading font-bold text-gantly-text">
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

            {/* Metadata bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <div className="bg-gantly-cloud/60 rounded-xl px-4 py-3 border border-gantly-blue/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-gantly-blue">calendar_today</span>
                  <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Creada</span>
                </div>
                <div className="font-body text-sm font-semibold text-gantly-text">
                  {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString('es-ES', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : 'N/A'}
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
                    {new Date(selectedTask.dueDate).toLocaleDateString('es-ES', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
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
                  <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">
                    {selectedTask.createdBy === 'PSYCHOLOGIST' ? 'Asignada por' : 'Enviada por'}
                  </span>
                </div>
                <div className="font-body text-sm font-semibold text-gantly-text">
                  {selectedTask.createdBy === 'PSYCHOLOGIST' ? (selectedTask.psychologistName || 'Tú') : selectedTask.userName}
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
                <div className="text-sm font-body text-gantly-muted leading-relaxed whitespace-pre-wrap bg-gantly-cloud/50 rounded-xl p-5 border border-slate-100">
                  {selectedTask.description}
                </div>
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
                <label className="text-sm text-gantly-blue hover:text-gantly-navy font-body font-medium cursor-pointer transition-all duration-200 flex items-center gap-1 border border-gantly-blue/30 hover:border-gantly-blue px-3 py-2 rounded-xl hover:bg-gantly-ice hover:shadow-sm">
                  <span className="material-symbols-outlined text-base">add</span>
                  Subir archivo
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          await tasksService.uploadFile(selectedTaskId, file);
                          await loadTaskFiles(selectedTaskId);
                          e.target.value = '';
                        } catch (error: any) {
                          const errorMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.details || error.message || 'Error desconocido';
                          toast.error('Error al subir el archivo: ' + errorMessage);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </label>
              </div>
              {taskFiles[selectedTaskId] && taskFiles[selectedTaskId].length > 0 ? (
                <div className="space-y-2">
                  {taskFiles[selectedTaskId].map((file: any) => (
                    <div key={file.id} className="flex justify-between items-center p-4 bg-gantly-cloud/50 rounded-xl border border-slate-100 hover:border-gantly-blue/20 hover:shadow-sm transition-all duration-200 group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gantly-navy/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-gantly-navy text-lg">description</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-body font-medium text-gantly-text truncate group-hover:text-gantly-blue transition-colors duration-200">{file.originalName}</div>
                          <div className="text-xs font-body text-gantly-muted">
                            {(file.fileSize / 1024).toFixed(1)} KB · Subido por {file.uploaderName}
                          </div>
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
                  <div className="text-sm font-body text-gantly-muted">No hay archivos adjuntos aún</div>
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
                  <p className="text-sm font-body text-gantly-muted/70">No hay comentarios aún.</p>
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

            {/* Reopen / Status actions */}
            {selectedTask.completedAt ? (
              <div className="rounded-2xl p-5 bg-gantly-emerald/5 border border-gantly-emerald/20 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gantly-emerald text-xl">verified</span>
                  <div>
                    <span className="font-heading font-bold text-gantly-emerald text-sm">Tarea completada</span>
                    <span className="font-body text-xs text-gantly-muted ml-2">
                      {new Date(selectedTask.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await tasksService.reopen(selectedTask.id);
                      toast.success('Tarea reabierta exitosamente');
                      await onRefresh();
                      const updated = await tasksService.get(selectedTask.id);
                      setSelectedTask(updated);
                    } catch (error: any) {
                      toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al reabrir la tarea');
                    }
                  }}
                  className="px-4 py-2 bg-gantly-gold/10 text-gantly-gold border border-gantly-gold/30 rounded-xl text-xs font-heading font-semibold cursor-pointer transition-all duration-200 hover:bg-gantly-gold/20 hover:shadow-sm"
                >
                  Reabrir tarea
                </button>
              </div>
            ) : (
              <div className="rounded-2xl p-5 bg-gantly-gold/5 border border-gantly-gold/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-gantly-gold text-xl">hourglass_top</span>
                <div>
                  <span className="font-heading font-bold text-yellow-700 text-sm">Tarea pendiente</span>
                  <p className="font-body text-xs text-gantly-muted mt-0.5">El paciente puede finalizarla desde su panel.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : selectedPatientForTasks ? (
        // Lista de tareas de un paciente especifico — PREMIUM
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-gantly-blue via-gantly-cyan to-gantly-emerald"></div>

          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <button
                  onClick={() => setSelectedPatientForTasks(null)}
                  className="text-sm text-gantly-blue hover:text-gantly-navy cursor-pointer transition-all duration-200 flex items-center gap-1 hover:bg-gantly-ice px-3 py-2 rounded-xl mb-2"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Volver a pacientes
                </button>
                <h3 className="m-0 text-lg font-heading font-bold text-gantly-text">
                  Tareas de {patients.find((p: any) => p.id === selectedPatientForTasks)?.name || 'Paciente'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setTaskForm({ ...taskForm, userId: selectedPatientForTasks.toString() });
                  setShowTaskForm(true);
                }}
                className="px-5 py-2.5 bg-gantly-blue text-white border-none rounded-xl font-heading font-semibold cursor-pointer text-sm hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25 transition-all duration-200 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Nueva Tarea
              </button>
            </div>

            {showTaskForm && (
              <div className="mb-5 p-5 bg-gantly-cloud/50 rounded-xl border border-slate-100">
                <h4 className="m-0 mb-3 text-sm font-heading font-semibold text-gantly-text">Crear Nueva Tarea</h4>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Título de la tarea"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-sm font-body text-gantly-text outline-none focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue transition-all duration-200"
                  />
                  <textarea
                    placeholder="Descripción (opcional)"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="p-3 rounded-xl border-2 border-slate-200 text-sm font-body min-h-[70px] resize-y outline-none focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue transition-all duration-200"
                  />
                  <input
                    type="datetime-local"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-sm font-body text-gantly-text outline-none focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue transition-all duration-200"
                  />
                  <div className="flex gap-2">
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
                        } catch (error: any) {
                          toast.error('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                        }
                      }}
                      className="px-5 py-2.5 bg-gantly-blue text-white border-none rounded-xl font-heading font-semibold cursor-pointer text-sm hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 transition-all duration-200"
                    >
                      Crear
                    </button>
                    <button
                      onClick={() => {
                        setShowTaskForm(false);
                        setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                      }}
                      className="px-5 py-2.5 bg-transparent text-gantly-muted border-none rounded-xl font-body font-medium cursor-pointer text-sm transition-all duration-200 hover:text-gantly-text hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tasksByPatient[selectedPatientForTasks] && tasksByPatient[selectedPatientForTasks].length > 0 ? (
              <div className="flex flex-col gap-3">
                {tasksByPatient[selectedPatientForTasks].map((t: any) => {
                  const isCompleted = !!t.completedAt;
                  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && !isCompleted;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        loadTaskDetails(t.id);
                      }}
                      className={`bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-gantly-blue/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group ${
                        isCompleted ? 'border-l-4 border-l-gantly-emerald' : isOverdue ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-gantly-gold'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            isCompleted ? 'bg-gantly-emerald/10 group-hover:bg-gantly-emerald/20' : isOverdue ? 'bg-red-50 group-hover:bg-red-100' : 'bg-gantly-gold/10 group-hover:bg-gantly-gold/20'
                          }`}>
                            <span className={`material-symbols-outlined text-lg ${
                              isCompleted ? 'text-gantly-emerald' : isOverdue ? 'text-red-500' : 'text-gantly-gold'
                            }`}>
                              {isCompleted ? 'task_alt' : isOverdue ? 'warning' : 'pending_actions'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                t.createdBy === 'PSYCHOLOGIST' ? 'bg-gantly-blue/10 text-gantly-blue' : 'bg-slate-100 text-gantly-muted'
                              }`}>
                                {t.createdBy === 'PSYCHOLOGIST' ? 'Creada por mí' : 'Enviada por paciente'}
                              </span>
                              {isCompleted && (
                                <span className="bg-gantly-emerald/10 text-gantly-emerald px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                  Completada
                                </span>
                              )}
                              {isOverdue && (
                                <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                  Vencida
                                </span>
                              )}
                              {!isCompleted && !isOverdue && (
                                <span className="bg-gantly-gold/10 text-gantly-gold px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                  Pendiente
                                </span>
                              )}
                            </div>
                            <div className="text-base font-heading font-semibold text-gantly-text group-hover:text-gantly-blue transition-colors duration-200">{t.title}</div>
                            <div className="text-sm font-body text-gantly-muted line-clamp-2 mt-0.5">{t.description || 'Sin descripción'}</div>
                            {t.dueDate && (
                              <div className={`text-xs font-body mt-2 flex items-center gap-1 ${
                                new Date(t.dueDate) < new Date() && !isCompleted ? 'text-red-500 font-medium' : 'text-gantly-muted'
                              }`}>
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                Vence: {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {t.completedAt && (
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
                              className="px-3 py-1.5 bg-gantly-gold/10 text-gantly-gold border border-gantly-gold/30 rounded-xl text-xs font-heading font-semibold cursor-pointer transition-all duration-200 hover:bg-gantly-gold/20 hover:shadow-sm"
                            >
                              Reabrir
                            </button>
                          )}
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-gantly-blue transition-colors duration-200">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-gantly-cloud/30 rounded-xl border-2 border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl text-gantly-muted/40 mb-2 block">assignment</span>
                <div className="text-sm font-body text-gantly-muted">No hay tareas para este paciente</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Lista de pacientes con tareas — PREMIUM
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-gantly-blue text-xl">checklist</span>
              </div>
              <h3 className="m-0 text-2xl font-heading font-bold text-gantly-text">Tareas por Paciente</h3>
            </div>
            <button
              onClick={() => setShowTaskForm(true)}
              className="px-5 py-2.5 bg-gantly-blue text-white border-none rounded-xl font-heading font-semibold cursor-pointer text-sm hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25 transition-all duration-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nueva Tarea
            </button>
          </div>

          {/* Stats bento */}
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
            {overdueCount > 0 ? (
              <div className="bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-red-500">warning</span>
                  <span className="font-body text-[11px] uppercase tracking-wider text-gantly-muted font-medium">Vencidas</span>
                </div>
                <div className="font-heading text-2xl font-bold text-red-600">{overdueCount}</div>
              </div>
            ) : (
              <div className="rounded-xl px-4 py-3 border border-gantly-blue/10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 30%, #48C6D4 65%, #78D4B0 100%)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-white/80">trending_up</span>
                  <span className="font-body text-[11px] uppercase tracking-wider text-white/70 font-medium">Completadas</span>
                </div>
                <div className="font-heading text-2xl font-bold text-white">{totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%</div>
              </div>
            )}
          </div>

          {showTaskForm && (
            <div className="mb-5 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="m-0 mb-4 text-base font-heading font-semibold text-gantly-text">Crear Nueva Tarea</h4>
              <div className="flex flex-col gap-3">
                <select
                  value={taskForm.userId}
                  onChange={(e) => setTaskForm({ ...taskForm, userId: e.target.value })}
                  className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-sm font-body text-gantly-text outline-none focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue transition-all duration-200 cursor-pointer"
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
                  className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-sm font-body text-gantly-text outline-none focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue transition-all duration-200"
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="p-3 rounded-xl border-2 border-slate-200 text-sm font-body min-h-[70px] resize-y outline-none focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue transition-all duration-200"
                />
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-sm font-body text-gantly-text outline-none focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue transition-all duration-200"
                />
                <div className="flex gap-2">
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
                      } catch (error: any) {
                        toast.error('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                      }
                    }}
                    className="px-5 py-2.5 bg-gantly-blue text-white border-none rounded-xl font-heading font-semibold cursor-pointer text-sm hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 transition-all duration-200"
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => {
                      setShowTaskForm(false);
                      setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                    }}
                    className="px-5 py-2.5 bg-transparent text-gantly-muted border-none rounded-xl font-body font-medium cursor-pointer text-sm transition-all duration-200 hover:text-gantly-text hover:bg-slate-100"
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {patientsWithTasks.map((p: any) => {
                const patientTasks = tasksByPatient[p.id] || [];
                const patientPending = patientTasks.filter((t: any) => !t.completedAt).length;
                const patientCompleted = patientTasks.filter((t: any) => t.completedAt).length;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientForTasks(p.id)}
                    className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-gantly-blue/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-base font-heading font-bold overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1B6FA0, #2E93CC)' }}>
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (p.name || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-semibold text-gantly-text truncate group-hover:text-gantly-blue transition-colors duration-200">{p.name}</div>
                        <div className="text-xs font-body text-gantly-muted mt-0.5">{patientTasks.length} {patientTasks.length === 1 ? 'tarea' : 'tareas'}</div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-gantly-blue transition-colors duration-200">chevron_right</span>
                    </div>
                    {/* Mini progress */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-gantly-emerald to-gantly-cyan transition-all duration-500"
                          style={{ width: `${patientTasks.length > 0 ? (patientCompleted / patientTasks.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-body font-semibold text-gantly-muted">{patientCompleted}/{patientTasks.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
