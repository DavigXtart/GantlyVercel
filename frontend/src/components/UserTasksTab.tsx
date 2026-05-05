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
    try { const files = await tasksService.getFiles(taskId); setTaskFiles(prev => ({ ...prev, [taskId]: files })); } catch {}
  };
  const loadTaskComments = async (taskId: number) => {
    try { const comments = await tasksService.getComments(taskId); setTaskComments(prev => ({ ...prev, [taskId]: comments })); } catch {}
  };
  const loadTaskDetails = async (taskId: number) => {
    try {
      const task = await tasksService.get(taskId);
      setSelectedTask(task);
      await Promise.all([loadTaskFiles(taskId), loadTaskComments(taskId)]);
    } catch { toast.error('Error al cargar los detalles de la tarea'); }
  };
  const handleAddComment = async (taskId: number) => {
    if (!newComment.trim()) return;
    try { await tasksService.addComment(taskId, newComment); setNewComment(''); await loadTaskComments(taskId); }
    catch (error: any) { toast.error('Error al agregar el comentario: ' + (error.response?.data?.error || error.message)); }
  };
  const handleCompleteTask = async (taskId: number) => {
    if (!confirm('¿Estas seguro de que quieres finalizar esta tarea? Esta accion no se puede deshacer.')) return;
    try {
      setSubmitting(true);
      await tasksService.complete(taskId);
      toast.success('Tarea finalizada correctamente');
      await onRefresh();
      setSelectedTask(await tasksService.get(taskId));
    } catch (error: any) {
      toast.error('Error al finalizar la tarea: ' + (error.response?.data?.error || error.message));
    } finally { setSubmitting(false); }
  };

  const pendingTasks = tasks.filter(t => !t.completedAt);
  const completedTasks = tasks.filter(t => t.completedAt);
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const pendingCount = pendingTasks.length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const inputCls = "w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 focus:bg-white transition-all duration-200 placeholder:text-slate-400";

  // ── Task detail view ──
  if (selectedTaskId && selectedTask) {
    const files = taskFiles[selectedTaskId] || [];
    const comments = taskComments[selectedTaskId] || [];
    const isOverdue = selectedTask.dueDate && new Date(selectedTask.dueDate) < new Date() && !selectedTask.completedAt;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className={`h-1 ${selectedTask.completedAt ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-gantly-blue to-gantly-cyan'}`} />
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center ${selectedTask.completedAt ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                <span className={`material-symbols-outlined text-lg ${selectedTask.completedAt ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedTask.completedAt ? 'task_alt' : 'pending_actions'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedTask.title}</h3>
                <span className={`inline-flex items-center gap-1 mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  selectedTask.completedAt ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedTask.completedAt ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {selectedTask.completedAt ? 'Completada' : 'Pendiente'}
                </span>
              </div>
            </div>
            <button onClick={() => { setSelectedTaskId(null); setSelectedTask(null); setNewComment(''); }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-gantly-blue px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none">
              <span className="material-symbols-outlined text-base">arrow_back</span>Volver
            </button>
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Creada</div>
              <div className="text-sm font-medium text-slate-900">
                {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
            {selectedTask.dueDate && (
              <div className={`rounded-xl px-4 py-3 border ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vence</div>
                <div className={`text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-slate-900'}`}>
                  {new Date(selectedTask.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {!selectedTask.completedAt && !isOverdue && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {Math.ceil((new Date(selectedTask.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias restantes
                  </div>
                )}
              </div>
            )}
            <div className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Asignada por</div>
              <div className="text-sm font-medium text-slate-900">{selectedTask.psychologistName || 'Tu psicologo'}</div>
            </div>
          </div>

          {/* Description */}
          {selectedTask.description && (
            <div className="mb-6 pb-6 border-b border-slate-100">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h4>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border border-slate-100">
                {selectedTask.description}
              </div>
            </div>
          )}

          {/* Files */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                Archivos {files.length > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{files.length}</span>}
              </h4>
              {!selectedTask.completedAt && (
                <label className="flex items-center gap-1.5 text-xs text-gantly-blue font-semibold cursor-pointer bg-gantly-blue/5 hover:bg-gantly-blue/10 border-none px-3 py-2 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">upload</span>Subir
                  <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedTaskId) {
                      try { await tasksService.uploadFile(selectedTaskId, file); await loadTaskFiles(selectedTaskId); }
                      catch (error: any) { toast.error('Error: ' + (error.response?.data?.error || error.response?.data?.message || error.message)); }
                      e.target.value = '';
                    }
                  }} />
                </label>
              )}
            </div>
            {files.length > 0 ? (
              <div className="space-y-2">
                {files.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 group transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-slate-500 text-base">description</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{file.originalName}</div>
                        <div className="text-[11px] text-slate-400">{(file.fileSize / 1024).toFixed(1)} KB · {file.uploaderName}</div>
                      </div>
                    </div>
                    <button onClick={() => fileService.downloadTaskFile(file.filePath)}
                      className="text-xs text-gantly-blue font-medium cursor-pointer bg-transparent border-none hover:underline flex-shrink-0 ml-3">
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <span className="material-symbols-outlined text-2xl text-slate-300 mb-1 block">cloud_upload</span>
                <p className="text-sm text-slate-400">Sin archivos adjuntos</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              Comentarios {comments.length > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{comments.length}</span>}
            </h4>
            {comments.length > 0 ? (
              <div className="space-y-2 mb-4">
                {comments.map((c: any) => (
                  <div key={c.id} className="px-4 py-3 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-900">{c.userName}</span>
                      <span className="text-[11px] text-slate-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{c.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 mb-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-sm text-slate-400">Sin comentarios</p>
              </div>
            )}
            <div className="flex gap-2">
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Escribe un comentario..."
                className={`${inputCls} min-h-[60px] resize-y py-3 flex-1`} />
              <button onClick={() => handleAddComment(selectedTaskId)} disabled={!newComment.trim()}
                className="self-end px-4 py-2.5 bg-gantly-blue text-white rounded-xl text-sm font-semibold cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
                Enviar
              </button>
            </div>
          </div>

          {/* Complete task CTA */}
          {!selectedTask.completedAt && (
            <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                <div>
                  <div className="text-sm font-medium text-emerald-700">¿Has terminado esta tarea?</div>
                  <div className="text-xs text-slate-500">Marca la tarea como completada cuando la hayas finalizado.</div>
                </div>
              </div>
              <button onClick={() => handleCompleteTask(selectedTaskId)} disabled={submitting}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border-none ${
                  submitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">send</span>Finalizar tarea
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Already completed */}
          {selectedTask.completedAt && (
            <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
              <span className="text-sm font-medium text-emerald-700">Tarea completada</span>
              <span className="text-xs text-slate-400 ml-1">
                {new Date(selectedTask.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Task list ──
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Mis Tareas</h3>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="size-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="material-symbols-outlined text-2xl text-slate-300">task</span>
          </div>
          <p className="text-sm font-medium text-slate-900 mb-1">No tienes tareas asignadas</p>
          <p className="text-sm text-slate-400">Cuando tu psicologo te asigne tareas apareceran aqui.</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-gantly-blue to-gantly-cyan" />
              <div className="p-4">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</div>
                <div className="text-2xl font-bold text-slate-900">{totalTasks}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-300 to-amber-400" />
              <div className="p-4">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pendientes</div>
                <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
              <div className="p-4">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Completadas</div>
                <div className="text-2xl font-bold text-slate-900">{completedCount}</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gantly-navy via-gantly-blue to-gantly-cyan rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-1">Progreso</div>
                <div className="text-2xl font-bold text-white">{Math.round(progressPercent)}%</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Avance:</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-gantly-cyan transition-all duration-500"
                  style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-900">{completedCount}/{totalTasks}</span>
            </div>
          </div>

          {/* Pending tasks */}
          {pendingCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Pendientes</h4>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded">{pendingCount}</span>
              </div>
              <div className="space-y-2">
                {pendingTasks.map(t => {
                  const overdue = t.dueDate && new Date(t.dueDate) < new Date();
                  return (
                    <div key={t.id} onClick={() => { setSelectedTaskId(t.id); loadTaskDetails(t.id); }}
                      className="bg-white rounded-xl px-5 py-4 border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-center gap-4">
                      <div className={`size-9 rounded-lg flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-red-50' : 'bg-amber-50'}`}>
                        <span className={`material-symbols-outlined text-base ${overdue ? 'text-red-500' : 'text-amber-600'}`}>
                          {overdue ? 'warning' : 'pending_actions'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 group-hover:text-gantly-blue transition-colors">{t.title}</div>
                        {t.description && <p className="text-sm text-slate-500 truncate mt-0.5">{t.description}</p>}
                        {t.dueDate && (
                          <div className={`text-[11px] mt-1 flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            Vence: {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-gantly-blue transition-colors text-lg">chevron_right</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {completedCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Completadas</h4>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded">{completedCount}</span>
              </div>
              <div className="space-y-2">
                {completedTasks.map(t => (
                  <div key={t.id} onClick={() => { setSelectedTaskId(t.id); loadTaskDetails(t.id); }}
                    className="bg-white rounded-xl px-5 py-4 border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-center gap-4 opacity-80 hover:opacity-100">
                    <div className="size-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-emerald-600 text-base">task_alt</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 group-hover:text-gantly-blue transition-colors">{t.title}</div>
                      {t.description && <p className="text-sm text-slate-500 truncate mt-0.5">{t.description}</p>}
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-gantly-blue transition-colors text-lg">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserTasksTab;
