import { useState, useEffect, useMemo } from 'react';
import {
  User, ArrowLeft, Calendar, CalendarCheck, Clock, CheckCircle2,
  ClipboardList, Heart, FileText, ChevronDown, ChevronUp,
  Smile, Frown, Meh, X, BarChart3
} from 'lucide-react';
import { calendarNotesService, psychPatientService, resultsService, API_BASE_URL } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';
import { toast } from './ui/Toast';

interface PsychPatientProfileViewProps {
  viewingPatientId: number;
  patientDetails: any;
  patientOverallStats: any;
  loadingPatientDetails: boolean;
  availableTests: any[];
  onBack: () => void;
}

// --- Helper functions ---

function resolveAvatar(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${API_BASE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateLong(dateStr?: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
}

function genderLabel(gender?: string): string {
  switch (gender) {
    case 'MALE': return 'Hombre';
    case 'FEMALE': return 'Mujer';
    case 'OTHER': return 'Otro';
    default: return gender || '';
  }
}

function statusDot(status: string): string {
  switch (status) {
    case 'BOOKED': return 'bg-emerald-500';
    case 'CONFIRMED': return 'bg-blue-500';
    case 'CANCELLED': return 'bg-red-400';
    case 'FREE': return 'bg-slate-300';
    default: return 'bg-slate-400';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'BOOKED': return 'Reservada';
    case 'CONFIRMED': return 'Confirmada';
    case 'CANCELLED': return 'Cancelada';
    case 'FREE': return 'Libre';
    default: return status;
  }
}

function paymentStatusBadge(paymentStatus?: string): { label: string; cls: string } | null {
  if (!paymentStatus) return null;
  switch (paymentStatus) {
    case 'PAID': return { label: 'Pagada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'PENDING': return { label: 'Pago pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'EXPIRED': return { label: 'Expirada', cls: 'bg-red-50 text-red-600 border-red-200' };
    case 'FAILED': return { label: 'Fallida', cls: 'bg-red-50 text-red-600 border-red-200' };
    default: return { label: paymentStatus, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
}

function moodIcon(rating: number) {
  if (rating >= 4) return <Smile size={14} className="text-emerald-500" />;
  if (rating >= 3) return <Meh size={14} className="text-amber-500" />;
  return <Frown size={14} className="text-red-400" />;
}

function moodBarColor(rating: number): string {
  if (rating >= 4) return 'bg-emerald-400';
  if (rating >= 3) return 'bg-amber-400';
  return 'bg-red-400';
}

// --- Component ---

export default function PsychPatientProfileView({
  viewingPatientId,
  patientDetails,
  patientOverallStats: _patientOverallStats,
  loadingPatientDetails,
  availableTests: _availableTests,
  onBack,
}: PsychPatientProfileViewProps) {
  // Extra data fetched internally
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [sessionNotes, setSessionNotes] = useState<Record<number, string>>({});
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [selectedTestResult, setSelectedTestResult] = useState<any | null>(null);
  const [loadingTestResult, setLoadingTestResult] = useState(false);

  // Load appointments and tasks via dedicated patient endpoints
  useEffect(() => {
    if (!viewingPatientId) return;
    let cancelled = false;

    const loadAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const appts = await psychPatientService.getAppointments(viewingPatientId);
        if (cancelled) return;
        // Sort by startTime desc (most recent first)
        const sorted = (appts || []).slice().sort((a: any, b: any) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        setAllAppointments(sorted);

        // Load notes for recent past appointments (first 5 past)
        const pastAppts = sorted.filter((a: any) => new Date(a.startTime) <= new Date());
        const recentIds = pastAppts.slice(0, 5).map((a: any) => a.id).filter(Boolean);
        if (recentIds.length > 0) {
          setLoadingNotes(true);
          const notesMap: Record<number, string> = {};
          await Promise.all(
            recentIds.map(async (id: number) => {
              try {
                const result = await calendarNotesService.getNotes(id);
                if (result?.notes) {
                  notesMap[id] = result.notes;
                }
              } catch {
                // Appointment may not have notes or access denied — skip silently
              }
            })
          );
          if (!cancelled) setSessionNotes(notesMap);
          setLoadingNotes(false);
        }
      } catch {
        if (!cancelled) toast.error('Error al cargar el historial de citas');
      } finally {
        if (!cancelled) setLoadingAppointments(false);
      }
    };

    const loadTasks = async () => {
      try {
        setLoadingTasks(true);
        const patientTasks = await psychPatientService.getTasks(viewingPatientId);
        if (cancelled) return;
        setTasks(patientTasks || []);
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    };

    loadAppointments();
    loadTasks();

    return () => { cancelled = true; };
  }, [viewingPatientId]);

  // Derived data — split allAppointments into past completed and upcoming
  const now = useMemo(() => new Date(), []);

  const pastAppointments = useMemo(
    () => allAppointments.filter((a: any) =>
      new Date(a.startTime) <= now && (a.status === 'BOOKED' || a.status === 'CONFIRMED')
    ),
    [allAppointments, now]
  );

  const completedSessions = pastAppointments;
  const lastSession = completedSessions[0] || null;

  const upcomingAppointments = useMemo(
    () => allAppointments
      .filter((a: any) =>
        new Date(a.startTime) > now && (a.status === 'BOOKED' || a.status === 'CONFIRMED')
      )
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [allAppointments, now]
  );

  const nextAppointment = upcomingAppointments[0] || null;

  const pendingTasks = tasks.filter((t: any) => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');

  // Notes from sessions (only those that have notes)
  const sessionsWithNotes = useMemo(
    () => completedSessions.filter((a: any) => sessionNotes[a.id]),
    [completedSessions, sessionNotes]
  );

  const handleViewTestResult = async (testId: number) => {
    try {
      setLoadingTestResult(true);
      const result = await resultsService.getUserTest(viewingPatientId, testId);
      setSelectedTestResult(result);
    } catch {
      toast.error('Error al cargar los resultados del test');
    } finally {
      setLoadingTestResult(false);
    }
  };

  // Avatar
  const avatarUrl = resolveAvatar(patientDetails?.avatarUrl);

  return (
    <div>
      {loadingPatientDetails ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10">
          <LoadingSpinner />
        </div>
      ) : patientDetails ? (
        <div className="space-y-5">
          {/* ===== HEADER CARD ===== */}
          <div className="bg-white rounded-2xl border border-slate-200/80">
            <div className="px-6 py-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gantly-blue to-cyan-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (patientDetails.name || '?')[0].toUpperCase()
                  )}
                </div>
                {/* Name + email + badges */}
                <div>
                  <h2 className="m-0 text-xl font-heading font-bold text-slate-800">
                    {patientDetails.name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5 m-0">{patientDetails.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {patientDetails.age && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {patientDetails.age} años
                      </span>
                    )}
                    {patientDetails.gender && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        {genderLabel(patientDetails.gender)}
                      </span>
                    )}
                    {lastSession && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                        <CalendarCheck size={11} />
                        Ultima sesion: {formatDateShort(lastSession.startTime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white flex-shrink-0"
              >
                <ArrowLeft size={14} />
                Volver
              </button>
            </div>
          </div>

          {/* ===== QUICK STATS ROW ===== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sesiones */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-blue-500" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Sesiones</div>
                  <div className="text-xl font-bold text-slate-800">
                    {loadingAppointments ? '...' : completedSessions.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Ultima sesion */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CalendarCheck size={18} className="text-emerald-500" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Ultima sesion</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {loadingAppointments ? '...' : lastSession ? formatDateShort(lastSession.startTime) : 'Sin sesiones'}
                  </div>
                </div>
              </div>
            </div>

            {/* Proxima cita */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-amber-500" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Proxima cita</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {loadingAppointments ? '...' : nextAppointment ? formatDateShort(nextAppointment.startTime) : 'Sin cita'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tareas */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={18} className="text-violet-500" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Tareas</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {loadingTasks ? '...' : `${completedTasks.length}/${tasks.length} completadas`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== MAIN CONTENT GRID ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* LEFT COLUMN */}
            <div className="space-y-5">
              {/* --- Proxima cita (if exists) --- */}
              {nextAppointment && (
                <div className="bg-white rounded-2xl border border-slate-200/80">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                    <Clock size={15} className="text-amber-500" />
                    <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Proxima cita</h3>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-slate-800">
                          {formatDateLong(nextAppointment.startTime)}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">
                          {formatTime(nextAppointment.startTime)} - {formatTime(nextAppointment.endTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          nextAppointment.status === 'BOOKED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(nextAppointment.status)}`} />
                          {statusLabel(nextAppointment.status)}
                        </span>
                        {(() => {
                          const badge = paymentStatusBadge(nextAppointment.paymentStatus);
                          if (!badge) return null;
                          return (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    {nextAppointment.notes && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Notas</span>
                        {nextAppointment.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- Historial de sesiones --- */}
              <div className="bg-white rounded-2xl border border-slate-200/80">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} className="text-blue-500" />
                    <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Historial de sesiones</h3>
                    {!loadingAppointments && (
                      <span className="text-[11px] text-slate-400 font-medium">({completedSessions.length})</span>
                    )}
                  </div>
                  {completedSessions.length > 5 && (
                    <button
                      onClick={() => setShowAllSessions(!showAllSessions)}
                      className="flex items-center gap-1 text-xs text-gantly-blue font-medium cursor-pointer bg-transparent border-none hover:underline"
                    >
                      {showAllSessions ? 'Ver menos' : 'Ver todas'}
                      {showAllSessions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {loadingAppointments ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-3 h-3 border-2 border-slate-300 border-t-gantly-blue rounded-full animate-spin" />
                      Cargando...
                    </div>
                  ) : completedSessions.length === 0 ? (
                    <p className="text-sm text-slate-500 m-0">Sin sesiones registradas</p>
                  ) : (
                    <div className="space-y-2">
                      {(showAllSessions ? completedSessions : completedSessions.slice(0, 5)).map((appt: any) => (
                        <div
                          key={appt.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          {/* Status dot + time line */}
                          <div className="flex flex-col items-center pt-1 flex-shrink-0">
                            <span className={`w-2.5 h-2.5 rounded-full ${statusDot(appt.status)}`} />
                            <div className="w-px h-full bg-slate-100 mt-1 min-h-[20px]" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-slate-800">
                                {formatDateShort(appt.startTime)}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                              </span>
                            </div>
                            {sessionNotes[appt.id] && (
                              <p className="text-xs text-slate-500 mt-1 m-0 line-clamp-2">
                                {sessionNotes[appt.id]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* --- Notas clinicas --- */}
              <div className="bg-white rounded-2xl border border-slate-200/80">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-slate-500" />
                    <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Notas clinicas</h3>
                  </div>
                  {sessionsWithNotes.length > 3 && (
                    <button
                      onClick={() => setShowAllNotes(!showAllNotes)}
                      className="flex items-center gap-1 text-xs text-gantly-blue font-medium cursor-pointer bg-transparent border-none hover:underline"
                    >
                      {showAllNotes ? 'Ver menos' : 'Ver todas'}
                      {showAllNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {loadingNotes ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-3 h-3 border-2 border-slate-300 border-t-gantly-blue rounded-full animate-spin" />
                      Cargando notas...
                    </div>
                  ) : sessionsWithNotes.length === 0 ? (
                    <div className="text-center py-4">
                      <FileText size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500 m-0">Sin notas de sesion</p>
                      <p className="text-xs text-slate-400 mt-1 m-0">Las notas se crean desde el historial de citas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(showAllNotes ? sessionsWithNotes : sessionsWithNotes.slice(0, 3)).map((appt: any) => (
                        <div key={appt.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-slate-500">
                              {formatDateShort(appt.startTime)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatTime(appt.startTime)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 m-0 leading-relaxed">
                            {sessionNotes[appt.id]}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-5">
              {/* --- Estado de animo --- */}
              <MoodSection patientId={viewingPatientId} />

              {/* --- Tareas terapeuticas --- */}
              <div className="bg-white rounded-2xl border border-slate-200/80">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-violet-500" />
                    <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Tareas terapeuticas</h3>
                    {!loadingTasks && tasks.length > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({completedTasks.length}/{tasks.length})
                      </span>
                    )}
                  </div>
                  {tasks.length > 5 && (
                    <button
                      onClick={() => setShowAllTasks(!showAllTasks)}
                      className="flex items-center gap-1 text-xs text-gantly-blue font-medium cursor-pointer bg-transparent border-none hover:underline"
                    >
                      {showAllTasks ? 'Ver menos' : 'Ver todas'}
                      {showAllTasks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {loadingTasks ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-3 h-3 border-2 border-slate-300 border-t-gantly-blue rounded-full animate-spin" />
                      Cargando...
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle2 size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500 m-0">Sin tareas asignadas</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(showAllTasks ? tasks : tasks.slice(0, 5)).map((task: any) => {
                        const isCompleted = task.status === 'COMPLETED';
                        return (
                          <div
                            key={task.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              isCompleted ? 'border-slate-100 bg-slate-50' : 'border-slate-200/80 bg-white'
                            }`}
                          >
                            {/* Status indicator */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? 'bg-emerald-100' : 'bg-amber-100'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 size={12} className="text-emerald-600" />
                              ) : (
                                <Clock size={12} className="text-amber-600" />
                              )}
                            </div>
                            {/* Task info */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                              }`}>
                                {task.title}
                              </div>
                              {task.dueDate && (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Vence: {formatDateShort(task.dueDate)}
                                </div>
                              )}
                            </div>
                            {/* Status badge */}
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}>
                              {isCompleted ? 'Completada' : 'Pendiente'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* --- Tests realizados --- */}
              <div className="bg-white rounded-2xl border border-slate-200/80">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <BarChart3 size={15} className="text-indigo-500" />
                  <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Tests realizados</h3>
                  {patientDetails.tests?.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">({patientDetails.tests.length})</span>
                  )}
                </div>
                <div className="p-5">
                  {!patientDetails.tests || patientDetails.tests.length === 0 ? (
                    <div className="text-center py-4">
                      <BarChart3 size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500 m-0">Sin tests realizados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {patientDetails.tests.map((test: any) => (
                        <div
                          key={test.testId}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <ClipboardList size={14} className="text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">
                              {test.testTitle || test.testCode}
                            </div>
                            {test.testCode && test.testTitle && (
                              <div className="text-[11px] text-slate-400 mt-0.5">{test.testCode}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleViewTestResult(test.testId)}
                            disabled={loadingTestResult}
                            className="text-xs font-medium text-gantly-blue hover:text-blue-700 cursor-pointer bg-transparent border-none hover:underline flex-shrink-0 disabled:opacity-50"
                          >
                            Ver resultados
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* --- Info del paciente --- */}
              <div className="bg-white rounded-2xl border border-slate-200/80">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <User size={15} className="text-slate-500" />
                  <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Informacion del paciente</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Fecha de registro</div>
                      <div className="text-sm font-medium text-slate-800">
                        {patientDetails.createdAt ? formatDateLong(patientDetails.createdAt) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Edad</div>
                      <div className="text-sm font-medium text-slate-800">
                        {patientDetails.age ? `${patientDetails.age} años` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Genero</div>
                      <div className="text-sm font-medium text-slate-800">
                        {patientDetails.gender ? genderLabel(patientDetails.gender) : '--'}
                      </div>
                    </div>
                    {patientDetails.birthDate && (
                      <div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Fecha de nacimiento</div>
                        <div className="text-sm font-medium text-slate-800">
                          {formatDateLong(patientDetails.birthDate)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Consentimiento</div>
                      <div className="text-sm font-medium">
                        {patientDetails.consentStatus === 'SIGNED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={12} /> Firmado
                          </span>
                        ) : patientDetails.consentStatus === 'SENT' || patientDetails.consentStatus === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                            <Clock size={12} /> Pendiente
                          </span>
                        ) : patientDetails.consentStatus === 'DRAFT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            Borrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            No enviado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <EmptyState
            icon={<User className="w-12 h-12 text-slate-400" />}
            title="Paciente no encontrado"
            description="No se pudieron cargar los detalles del paciente."
          />
        </div>
      )}

      {/* ===== MODAL: Test Results ===== */}
      {selectedTestResult && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
          onClick={() => setSelectedTestResult(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="m-0 text-base font-heading font-bold text-slate-800">
                {selectedTestResult.testTitle || 'Resultados del test'}
              </h3>
              <button
                onClick={() => setSelectedTestResult(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-none text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 overflow-y-auto">
              {selectedTestResult.factors?.length > 0 ? (
                <div className="space-y-4">
                  {selectedTestResult.factors.map((factor: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{factor.name}</span>
                        <span className="text-sm font-bold text-slate-800">{Math.round(factor.percentage ?? factor.score ?? 0)}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gantly-blue transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, factor.percentage ?? factor.score ?? 0))}%` }}
                        />
                      </div>
                      {/* Subfactors */}
                      {selectedTestResult.subfactors?.filter((sf: any) => sf.factorName === factor.name).length > 0 && (
                        <div className="mt-2 ml-3 space-y-2">
                          {selectedTestResult.subfactors
                            .filter((sf: any) => sf.factorName === factor.name)
                            .map((sf: any, j: number) => (
                              <div key={j}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-500">{sf.name}</span>
                                  <span className="text-xs font-semibold text-slate-600">{Math.round(sf.percentage ?? sf.score ?? 0)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(0, sf.percentage ?? sf.score ?? 0))}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BarChart3 size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 m-0">No se encontraron resultados para este test</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Mood Section (separate component to handle its own data loading) ---

function MoodSection({ patientId }: { patientId: number }) {
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const entries = await psychPatientService.getMoodEntries(patientId);
        if (!cancelled) setMoodEntries(entries || []);
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [patientId]);

  // Build last 14 days array, filling gaps with null
  const last14Days = useMemo(() => {
    const days: Array<{ date: Date; entry: any | null }> = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      // Find matching entry by date string (YYYY-MM-DD)
      const dateStr = d.toISOString().slice(0, 10);
      const entry = moodEntries.find((e: any) => {
        const eDate = (e.date || e.entryDate || '').slice(0, 10);
        return eDate === dateStr;
      }) || null;
      days.push({ date: d, entry });
    }
    return days;
  }, [moodEntries]);

  const dayAbbr = (d: Date) => {
    const abbrs = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    return abbrs[d.getDay()];
  };

  const hasAnyData = moodEntries.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <Heart size={15} className="text-rose-400" />
        <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Estado de animo</h3>
        {hasAnyData && (
          <span className="text-[11px] text-slate-400 font-medium">Ultimos 14 dias</span>
        )}
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-3 h-3 border-2 border-slate-300 border-t-gantly-blue rounded-full animate-spin" />
            Cargando...
          </div>
        ) : !hasAnyData ? (
          <EmptyState
            icon={<Heart className="w-8 h-8 text-slate-300" />}
            title="Sin registros de animo"
            description="El paciente aun no ha registrado su estado de animo."
          />
        ) : (
          <div>
            {/* Bar chart */}
            <div className="flex items-end justify-between gap-1" style={{ height: 80 }}>
              {last14Days.map(({ date, entry }, i) => {
                const rating = entry?.moodRating ?? 0;
                const barHeight = rating > 0 ? (rating / 5) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    {rating > 0 ? (
                      <>
                        <div
                          className={`w-full max-w-[20px] rounded-sm transition-all ${moodBarColor(rating)}`}
                          style={{ height: `${barHeight}%`, minHeight: 4 }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                          <div className="bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg">
                            <div className="flex items-center gap-1">
                              {moodIcon(rating)}
                              <span>{rating}/5</span>
                            </div>
                            {entry?.notes && (
                              <p className="mt-0.5 m-0 text-slate-300 max-w-[150px] truncate">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className="w-full max-w-[20px] rounded-sm bg-slate-100"
                        style={{ height: 4 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Day labels */}
            <div className="flex justify-between gap-1 mt-1.5">
              {last14Days.map(({ date }, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[9px] text-slate-400 font-medium">
                    {dayAbbr(date)}
                  </span>
                  <span className="block text-[9px] text-slate-300">
                    {date.getDate()}
                  </span>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <Smile size={12} className="text-emerald-500" />
                <span className="text-[10px] text-slate-500">Bien (4-5)</span>
              </div>
              <div className="flex items-center gap-1">
                <Meh size={12} className="text-amber-500" />
                <span className="text-[10px] text-slate-500">Regular (3)</span>
              </div>
              <div className="flex items-center gap-1">
                <Frown size={12} className="text-red-400" />
                <span className="text-[10px] text-slate-500">Bajo (1-2)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
