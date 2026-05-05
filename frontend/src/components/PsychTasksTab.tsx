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
        // Vista detallada de la tarea
        <div className="mt-10 bg-white rounded-2xl p-8 border border-slate-100 shadow-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="m-0 text-[28px] font-bold text-gantly-text tracking-tight">
              {selectedTask.title}
            </h3>
            <button
              onClick={() => {
                setSelectedTaskId(null);
                setSelectedTask(null);
                setNewComment('');
              }}
              className="px-5 py-2.5 bg-gantly-blue-50 text-gantly-blue-600 border-2 border-gantly-blue-200 rounded-xl font-semibold cursor-pointer text-[15px] transition-all hover:bg-gantly-blue-100 hover:-translate-y-0.5"
            >
              ← Volver
            </button>
          </div>

          {/* Información de la tarea */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <div className="p-5 bg-gantly-blue-50 rounded-2xl border border-gantly-blue-100">
              <div className="text-xs text-gantly-blue-600 mb-2 font-semibold uppercase">
                Creada el
              </div>
              <div className="text-base font-semibold text-gantly-text">
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
              <div className={`p-5 rounded-2xl border ${
                new Date(selectedTask.dueDate) < new Date()
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className={`text-xs mb-2 font-semibold uppercase ${
                  new Date(selectedTask.dueDate) < new Date() ? 'text-red-600' : 'text-amber-600'
                }`}>
                  Vence el
                </div>
                <div className="text-base font-semibold text-gantly-text">
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
                  <div className="text-sm text-slate-600 mt-2">
                    {Math.ceil((new Date(selectedTask.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                  </div>
                )}
              </div>
            )}

            <div className="p-5 bg-gantly-blue-50 rounded-2xl border border-gantly-blue-100">
              <div className="text-xs text-gantly-blue-600 mb-2 font-semibold uppercase">
                {selectedTask.createdBy === 'PSYCHOLOGIST' ? 'Asignada por' : 'Enviada por'}
              </div>
              <div className="text-base font-semibold text-gantly-text">
                {selectedTask.createdBy === 'PSYCHOLOGIST' ? selectedTask.psychologistName : selectedTask.userName}
              </div>
            </div>
          </div>

          {/* Descripcion */}
          {selectedTask.description && (
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="m-0 mb-4 text-lg font-semibold text-gantly-text">
                Descripcion
              </h4>
              <div className="text-base text-slate-600 leading-relaxed whitespace-pre-wrap">
                {selectedTask.description}
              </div>
            </div>
          )}

          {/* Archivos */}
          <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h4 className="m-0 text-xl font-semibold text-gantly-text">
                Archivos adjuntos
              </h4>
              <label className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
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
              <div className="flex flex-col gap-3">
                {taskFiles[selectedTaskId].map((file: any) => (
                  <div key={file.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-2xl">📄</span>
                      <div>
                        <div className="text-[15px] font-semibold text-gantly-text">{file.originalName}</div>
                        <div className="text-[13px] text-slate-500 mt-1">
                          {(file.fileSize / 1024).toFixed(1)} KB • Subido por {file.uploaderName}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => fileService.downloadTaskFile(file.filePath)}
                      className="px-4 py-2 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none cursor-pointer rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[15px] text-slate-500 text-center py-10">
                No hay archivos adjuntos aun
              </div>
            )}
          </div>

          {/* Comentarios */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="m-0 mb-5 text-xl font-semibold text-gantly-text">
              Comentarios
            </h4>

            {/* Lista de comentarios */}
            {taskComments[selectedTaskId] && taskComments[selectedTaskId].length > 0 ? (
              <div className="flex flex-col gap-4 mb-6">
                {taskComments[selectedTaskId].map((comment: any) => (
                  <div key={comment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-semibold text-gantly-text">
                        {comment.userName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </div>
                    </div>
                    <div className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[15px] text-slate-500 text-center py-10 mb-6">
                No hay comentarios aun. Se el primero en comentar.
              </div>
            )}

            {/* Formulario de nuevo comentario */}
            <div className="flex gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 p-3 px-4 rounded-xl border-2 border-slate-200 text-[15px] text-gantly-text resize-y min-h-[80px] outline-none transition-all focus:border-gantly-blue-500 focus:ring-2 focus:ring-gantly-blue-100"
              />
              <button
                onClick={() => handleAddComment(selectedTaskId)}
                disabled={!newComment.trim()}
                className="self-start px-6 py-3 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl text-[15px] font-semibold cursor-pointer transition-all disabled:bg-slate-300 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      ) : selectedPatientForTasks ? (
        // Lista de tareas de un paciente especifico
        <div className="bg-white rounded-2xl shadow-card p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => setSelectedPatientForTasks(null)}
                className="px-4 py-2 bg-gantly-blue-50 text-gantly-blue-600 border-2 border-gantly-blue-200 rounded-lg font-semibold cursor-pointer text-sm mb-3 transition-all hover:bg-gantly-blue-100"
              >
                ← Volver a pacientes
              </button>
              <h3 className="m-0 text-2xl font-bold text-gantly-blue-600">
                Tareas de {patients.find((p: any) => p.id === selectedPatientForTasks)?.name || 'Paciente'}
              </h3>
            </div>
            <button
              onClick={() => {
                setTaskForm({ ...taskForm, userId: selectedPatientForTasks.toString() });
                setShowTaskForm(true);
              }}
              className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer text-sm transition-all hover:scale-105"
            >
              + Nueva Tarea
            </button>
          </div>

          {showTaskForm && (
            <div className="mb-6 p-6 bg-slate-50 rounded-xl border-2 border-slate-200">
              <h4 className="m-0 mb-4 text-lg font-semibold">Crear Nueva Tarea</h4>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Titulo de la tarea"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="p-2.5 rounded-lg border border-slate-200 text-sm"
                />
                <textarea
                  placeholder="Descripcion (opcional)"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="p-2.5 rounded-lg border border-slate-200 text-sm min-h-[80px] resize-y"
                />
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="p-2.5 rounded-lg border border-slate-200 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!taskForm.title) {
                        toast.warning('Por favor completa el titulo de la tarea');
                        return;
                      }
                      if (!me || !me.id) {
                        toast.error('Error: No se pudo obtener la informacion del psicologo. Por favor recarga la pagina.');
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
                    className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer text-sm"
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => {
                      setShowTaskForm(false);
                      setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                    }}
                    className="px-5 py-2.5 bg-slate-200 text-slate-800 border-none rounded-xl font-semibold cursor-pointer text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {tasksByPatient[selectedPatientForTasks] && tasksByPatient[selectedPatientForTasks].length > 0 ? (
            <div className="flex flex-col gap-4">
              {tasksByPatient[selectedPatientForTasks].map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    loadTaskDetails(t.id);
                  }}
                  className={`p-7 rounded-2xl transition-all shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-card border-2 ${
                    t.createdBy === 'PSYCHOLOGIST'
                      ? 'bg-gantly-blue-50 border-gantly-blue-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <div className={`px-3 py-1.5 text-white rounded-full text-xs font-semibold ${
                          t.createdBy === 'PSYCHOLOGIST' ? 'bg-gantly-blue-500' : 'bg-gantly-blue-300'
                        }`}>
                          {t.createdBy === 'PSYCHOLOGIST' ? 'Creada por mi' : 'Enviada por paciente'}
                        </div>
                        {t.createdAt && (
                          <div className="text-xs text-slate-400">
                            Creada: {new Date(t.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {t.dueDate && (
                          <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            new Date(t.dueDate) < new Date() ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            Vence: {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                      <div className="text-[22px] font-bold text-gantly-text mb-3 tracking-tight">
                        {t.title}
                      </div>
                      <div className="text-[15px] text-slate-600 leading-relaxed mb-4 line-clamp-2 overflow-hidden">
                        {t.description || 'Sin descripcion'}
                      </div>
                      {t.completedAt && (
                        <div className="flex items-center gap-3">
                          <div className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">
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
                            className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-300 rounded-md text-xs font-semibold cursor-pointer transition-all hover:bg-orange-100"
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
            <div className="py-14 px-10 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <div className="text-5xl mb-4">📋</div>
              <div className="text-lg font-semibold text-slate-500 mb-2">
                No hay tareas para este paciente
              </div>
            </div>
          )}
        </div>
      ) : (
        // Lista de pacientes con tareas
        <div className="bg-white rounded-2xl shadow-card p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="m-0 text-2xl font-bold text-gantly-blue-600">
              Tareas por Paciente
            </h3>
            <button
              onClick={() => setShowTaskForm(true)}
              className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer text-sm transition-all hover:scale-105"
            >
              + Nueva Tarea
            </button>
          </div>

          {showTaskForm && (
            <div className="mb-6 p-6 bg-slate-50 rounded-xl border-2 border-slate-200">
              <h4 className="m-0 mb-4 text-lg font-semibold">Crear Nueva Tarea</h4>
              <div className="flex flex-col gap-3">
                <select
                  value={taskForm.userId}
                  onChange={(e) => setTaskForm({ ...taskForm, userId: e.target.value })}
                  className="p-2.5 rounded-lg border border-slate-200 text-sm"
                >
                  <option value="">Selecciona un paciente</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Titulo de la tarea"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="p-2.5 rounded-lg border border-slate-200 text-sm"
                />
                <textarea
                  placeholder="Descripcion (opcional)"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="p-2.5 rounded-lg border border-slate-200 text-sm min-h-[80px] resize-y"
                />
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="p-2.5 rounded-lg border border-slate-200 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!taskForm.userId || !taskForm.title) {
                        toast.warning('Por favor completa todos los campos requeridos');
                        return;
                      }
                      if (!me || !me.id) {
                        toast.error('Error: No se pudo obtener la informacion del psicologo. Por favor recarga la pagina.');
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
                    className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer text-sm"
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => {
                      setShowTaskForm(false);
                      setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                    }}
                    className="px-5 py-2.5 bg-slate-200 text-slate-800 border-none rounded-xl font-semibold cursor-pointer text-sm"
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {patientsWithTasks.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientForTasks(p.id)}
                  className="p-6 bg-gantly-blue-50 border-2 border-gantly-blue-200 rounded-2xl transition-all shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-[60px] h-[60px] rounded-full bg-slate-200 flex items-center justify-center text-2xl border-[3px] border-white shadow-sm overflow-hidden">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gantly-text mb-1">
                        {p.name}
                      </div>
                      <div className="text-sm text-slate-500">
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
