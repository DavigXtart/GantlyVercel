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
    try { setTaskFiles(prev => ({ ...prev, [taskId]: await tasksService.getFiles(taskId) })); } catch {}
  };
  const loadTaskComments = async (taskId: number) => {
    try { setTaskComments(prev => ({ ...prev, [taskId]: await tasksService.getComments(taskId) })); } catch {}
  };
  const loadTaskDetails = async (taskId: number) => {
    try {
      const task = await tasksService.get(taskId);
      setSelectedTask(task);
      await loadTaskFiles(taskId);
      await loadTaskComments(taskId);
    } catch { toast.error('Error al cargar los detalles de la tarea'); }
  };
  const handleAddComment = async (taskId: number) => {
    if (!newComment.trim()) return;
    try { await tasksService.addComment(taskId, newComment); setNewComment(''); await loadTaskComments(taskId); }
    catch (error: any) { toast.error('Error al agregar el comentario: ' + (error.response?.data?.error || error.message)); }
  };

  const tasksByPatient = tasks.reduce((acc: Record<number, any[]>, task: any) => {
    const pid = task.user?.id || task.userId;
    if (pid) { if (!acc[pid]) acc[pid] = []; acc[pid].push(task); }
    return acc;
  }, {});
  const patientsWithTasks = patients.filter((p: any) => tasksByPatient[p.id]?.length > 0);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completedAt).length;
  const pendingCount = totalTasks - completedCount;
  const overdueCount = tasks.filter(t => !t.completedAt && t.dueDate && new Date(t.dueDate) < new Date()).length;

  useEffect(() => { tasks.forEach(t => { if (!taskFiles[t.id]) loadTaskFiles(t.id); }); }, [tasks.length]);

  const inputCls = "w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 focus:bg-white transition-all duration-200 placeholder:text-slate-400";

  // ── Task creation form (shared) ──
  const renderTaskForm = (patientId?: number) => {
    if (!showTaskForm) return null;
    return (
      <div className="mb-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-gantly-blue to-gantly-cyan" />
        <div className="p-5 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-gantly-blue text-base">add_task</span>
            Nueva tarea
          </h4>
          {!patientId && (
            <select value={taskForm.userId} onChange={e => setTaskForm({ ...taskForm, userId: e.target.value })}
              className={`${inputCls} cursor-pointer`}>
              <option value="">Selecciona un paciente</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <input type="text" placeholder="Titulo de la tarea" value={taskForm.title}
            onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className={inputCls} autoFocus />
          <textarea placeholder="Descripcion (opcional)" value={taskForm.description}
            onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
            className={`${inputCls} min-h-[80px] resize-y py-3`} />
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Fecha limite</label>
            <input type="datetime-local" value={taskForm.dueDate}
              onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className={inputCls} />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={async () => {
                const uid = patientId || parseInt(taskForm.userId);
                if (!uid || !taskForm.title) { toast.warning('Completa los campos requeridos'); return; }
                if (!me?.id) { toast.error('Error: recarga la pagina'); return; }
                try {
                  await tasksService.create({ userId: uid, psychologistId: me.id, title: taskForm.title,
                    description: taskForm.description || undefined,
                    dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined });
                  await onRefresh(); setShowTaskForm(false);
                  setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                } catch (error: any) { toast.error('Error: ' + (error.response?.data?.message || error.message)); }
              }}
              className="px-5 py-2.5 rounded-xl bg-gantly-blue text-white text-sm font-semibold hover:bg-gantly-blue/90 transition-colors cursor-pointer border-none">
              Crear tarea
            </button>
            <button onClick={() => { setShowTaskForm(false); setTaskForm({ userId: '', title: '', description: '', dueDate: '' }); }}
              className="px-4 py-2.5 rounded-xl text-slate-500 text-sm hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-none">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

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
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {selectedTask.createdBy === 'PSYCHOLOGIST' ? 'Asignada por' : 'Enviada por'}
              </div>
              <div className="text-sm font-medium text-slate-900">
                {selectedTask.createdBy === 'PSYCHOLOGIST' ? (selectedTask.psychologistName || 'Tu') : selectedTask.userName}
              </div>
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
              <label className="flex items-center gap-1.5 text-xs text-gantly-blue font-semibold cursor-pointer bg-gantly-blue/5 hover:bg-gantly-blue/10 border-none px-3 py-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">upload</span>Subir
                <input type="file" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try { await tasksService.uploadFile(selectedTaskId, file); await loadTaskFiles(selectedTaskId); }
                    catch (error: any) { toast.error('Error: ' + (error.response?.data?.error || error.response?.data?.message || error.message)); }
                    e.target.value = '';
                  }
                }} />
              </label>
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

          {/* Status actions */}
          {selectedTask.completedAt ? (
            <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
                <span className="text-sm font-medium text-emerald-700">Completada</span>
                <span className="text-xs text-slate-400 ml-1">
                  {new Date(selectedTask.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <button onClick={async () => {
                try { await tasksService.reopen(selectedTask.id); toast.success('Tarea reabierta'); await onRefresh();
                  setSelectedTask(await tasksService.get(selectedTask.id));
                } catch (error: any) { toast.error(error.response?.data?.error || 'Error al reabrir'); }
              }} className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                Reabrir
              </button>
            </div>
          ) : (
            <div className="rounded-xl p-4 bg-amber-50 border border-amber-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">hourglass_top</span>
              <div>
                <span className="text-sm font-medium text-amber-700">Pendiente</span>
                <span className="text-xs text-slate-400 ml-2">El paciente puede finalizarla desde su panel</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Patient task list ──
  if (selectedPatientForTasks) {
    const patientTasks = tasksByPatient[selectedPatientForTasks] || [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setSelectedPatientForTasks(null)}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-gantly-blue mb-2 cursor-pointer bg-transparent border-none transition-colors">
              <span className="material-symbols-outlined text-base">arrow_back</span>Volver
            </button>
            <h3 className="text-lg font-semibold text-slate-900">
              Tareas de {patients.find((p: any) => p.id === selectedPatientForTasks)?.name || 'Paciente'}
            </h3>
          </div>
          <button onClick={() => { setTaskForm({ ...taskForm, userId: selectedPatientForTasks.toString() }); setShowTaskForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gantly-blue text-white rounded-xl text-sm font-semibold hover:bg-gantly-blue/90 transition-colors cursor-pointer border-none">
            <span className="material-symbols-outlined text-sm">add</span>Nueva tarea
          </button>
        </div>

        {renderTaskForm(selectedPatientForTasks)}

        {patientTasks.length > 0 ? (
          <div className="space-y-2">
            {patientTasks.map((t: any) => {
              const done = !!t.completedAt;
              const overdue = t.dueDate && new Date(t.dueDate) < new Date() && !done;
              return (
                <div key={t.id} onClick={() => { setSelectedTaskId(t.id); loadTaskDetails(t.id); }}
                  className="bg-white rounded-xl px-5 py-4 border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-center gap-4">
                  <div className={`size-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    done ? 'bg-emerald-50' : overdue ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <span className={`material-symbols-outlined text-base ${done ? 'text-emerald-600' : overdue ? 'text-red-500' : 'text-amber-600'}`}>
                      {done ? 'task_alt' : overdue ? 'warning' : 'pending_actions'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 group-hover:text-gantly-blue transition-colors">{t.title}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        done ? 'bg-emerald-50 text-emerald-700' : overdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-500' : overdue ? 'bg-red-400' : 'bg-amber-500'}`} />
                        {done ? 'Completada' : overdue ? 'Vencida' : 'Pendiente'}
                      </span>
                    </div>
                    {t.description && <p className="text-sm text-slate-500 truncate mt-0.5">{t.description}</p>}
                    {t.dueDate && !done && (
                      <div className={`text-[11px] mt-1 flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                  {done && (
                    <button onClick={e => { e.stopPropagation(); (async () => {
                      try { await tasksService.reopen(t.id); toast.success('Reabierta'); await onRefresh(); }
                      catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
                    })(); }} className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                      Reabrir
                    </button>
                  )}
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-gantly-blue transition-colors text-lg">chevron_right</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">assignment</span>
            <p className="text-sm text-slate-400">Sin tareas para este paciente</p>
          </div>
        )}
      </div>
    );
  }

  // ── Main view: patients with tasks ──
  return (
    <div className="space-y-6">
      {/* Header + new task button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Tareas por paciente</h3>
        <button onClick={() => setShowTaskForm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gantly-blue text-white rounded-xl text-sm font-semibold hover:bg-gantly-blue/90 transition-colors cursor-pointer border-none">
          <span className="material-symbols-outlined text-sm">add</span>Nueva tarea
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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
        {overdueCount > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-400 to-red-500" />
            <div className="p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vencidas</div>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gantly-navy via-gantly-blue to-gantly-cyan rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-1">Progreso</div>
              <div className="text-2xl font-bold text-white">{totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%</div>
            </div>
          </div>
        )}
      </div>

      {renderTaskForm()}

      {/* Patient cards */}
      {patientsWithTasks.length === 0 ? (
        <EmptyState icon="assignment" title="Sin tareas" description="Crea tareas para tus pacientes o revisa las enviadas por ellos." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patientsWithTasks.map((p: any) => {
            const pt = tasksByPatient[p.id] || [];
            const done = pt.filter((t: any) => t.completedAt).length;
            return (
              <div key={p.id} onClick={() => setSelectedPatientForTasks(p.id)}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br from-gantly-blue to-gantly-cyan">
                      {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" /> : (p.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate group-hover:text-gantly-blue transition-colors">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{pt.length} {pt.length === 1 ? 'tarea' : 'tareas'}</div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-gantly-blue transition-colors text-lg">chevron_right</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-gantly-cyan transition-all duration-500"
                        style={{ width: `${pt.length > 0 ? (done / pt.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{done}/{pt.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
