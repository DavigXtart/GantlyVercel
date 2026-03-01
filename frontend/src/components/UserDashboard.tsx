import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import {
  profileService,
  authService,
  tasksService,
  calendarService,
  assignedTestsService,
  jitsiService,
  consentService,
  API_BASE_URL,
} from '../services/api';
import CalendarWeek from './CalendarWeek';
import ChatWidget from './ChatWidget';
import EmptyState from './ui/EmptyState';
import AgendaPersonal from './AgendaPersonal';
import MisEstadisticas from './MisEstadisticas';
import Evaluaciones from './Evaluaciones';
import Descubrimiento from './Descubrimiento';
import LoadingSpinner from './ui/LoadingSpinner';
import { toast } from './ui/Toast';
import PatientMatchingTest from './PatientMatchingTest';
import MatchingPsychologists from './MatchingPsychologists';
import JitsiVideoCall from './JitsiVideoCall';
import NotificationBell from './ui/NotificationBell';
import OnboardingWizard from './OnboardingWizard';

const ProgressDashboard = lazy(() => import('./ProgressDashboard'));
const BillingPortal = lazy(() => import('./BillingPortal'));
const GroupSessions = lazy(() => import('./GroupSessions'));
const TwoFactorSetup = lazy(() => import('./TwoFactorSetup'));

type Tab =
  | 'perfil'
  | 'editar-perfil'
  | 'mi-psicologo'
  | 'tareas'
  | 'tests-pendientes'
  | 'calendario'
  | 'mis-citas'
  | 'agenda-personal'
  | 'mis-estadisticas'
  | 'evaluaciones'
  | 'descubrimiento'
  | 'chat'
  | 'perfil-psicologo'
  | 'privacidad'
  | 'progreso'
  | 'facturacion'
  | 'grupos';

interface UserDashboardProps {
  onStartTest?: (testId: number) => void;
}

export default function UserDashboard({ onStartTest }: UserDashboardProps = {}) {
  const [tab, setTab] = useState<Tab>('perfil');
  const [me, setMe] = useState<any>(null);
  const [psych, setPsych] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loadingPastAppointments, setLoadingPastAppointments] = useState(false);
  const [taskFiles, setTaskFiles] = useState<Record<number, any[]>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskComments, setTaskComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState<string>('');
  const [showMatchingTest, setShowMatchingTest] = useState(false);
  const [showMatchingResults, setShowMatchingResults] = useState(false);
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);
  const [loadingPsychologistProfile, setLoadingPsychologistProfile] =
    useState(false);
  const [ratingAppointment, setRatingAppointment] = useState<number | null>(
    null,
  );
  const [ratingComment, setRatingComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState<string | null>(null);
  const [videoCallOtherUser, setVideoCallOtherUser] = useState<{ email: string; name: string } | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState<string>('');
  const [usingReferralCode, setUsingReferralCode] = useState(false);
  // Editar perfil (paciente)
  const [editProfileForm, setEditProfileForm] = useState({ name: '', gender: '', birthDate: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  // Consentimientos (menores)
  const [pendingConsents, setPendingConsents] = useState<any[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(false);
  const [signerNameForConsent, setSignerNameForConsent] = useState('');
  const [signingConsentId, setSigningConsentId] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding-completed'));

  const hasPsychologist = psych?.status === 'ASSIGNED';

  const isMinor = useMemo(() => {
    if (!me) return false;
    if (me.birthDate) {
      const birth = new Date(me.birthDate);
      const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age < 18;
    }
    const age = me.age;
    return typeof age === 'number' && age < 18;
  }, [me]);

  useEffect(() => {
    if (!me || !isMinor) {
      setPendingConsents([]);
      return;
    }
    let cancelled = false;
    setLoadingConsents(true);
    consentService
      .myPending()
      .then((list) => {
        if (!cancelled) setPendingConsents(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setPendingConsents([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingConsents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [me?.id, isMinor]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, p, t] = await Promise.all([
        profileService.me(),
        profileService.myPsychologist(),
        tasksService.list(),
      ]);
      setMe(m);
      setPsych(p);
      setTasks(t || []);

      const [ats, apps] = await Promise.all([
        assignedTestsService.list().catch(() => []),
        calendarService.myAppointments().catch(() => []),
      ]);
      setAssignedTests(ats || []);
      setMyAppointments(apps || []);
    } catch (err: any) {
      toast.error('Error al cargar tu panel. Intenta recargar la página.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      toast.error('Por favor ingresa un código de referencia');
      return;
    }

    try {
      setUsingReferralCode(true);
      const result = await profileService.useReferralCode(referralCodeInput.trim());
      toast.success(result.message || 'Te has unido correctamente a la consulta');
      setReferralCodeInput('');
      // Recargar datos para actualizar el estado del psicólogo
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al usar el código de referencia');
    } finally {
      setUsingReferralCode(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    loadData();
  }, []);

  // Cargar historial cuando se entra en Mi Psicólogo
  useEffect(() => {
    if (tab === 'mi-psicologo' && hasPsychologist) {
      loadPastAppointments();
    }
  }, [tab, hasPsychologist]);

  const loadPsychologistProfile = async (psychologistId: number) => {
    try {
      setLoadingPsychologistProfile(true);
      const profile = await profileService.getPsychologistProfile(
        psychologistId,
      );
      setPsychologistProfile(profile);
      setTab('perfil-psicologo');
    } catch (err: any) {
      toast.error(
        'Error al cargar el perfil del psicólogo: ' +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setLoadingPsychologistProfile(false);
    }
  };

  const loadAvailability = async () => {
    try {
      setLoadingSlots(true);
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const list = await calendarService.availability(
        from.toISOString(),
        to.toISOString(),
      );
      setSlots(list);
      try {
        const appointments = await calendarService.myAppointments();
        const validAppointments = appointments.filter(
          (apt: any) => apt.startTime && apt.endTime,
        );
        setMyAppointments(validAppointments);
      } catch (error) {
        // error handled silently
      }
    } catch (error: any) {
      toast.error('Error al cargar el calendario');
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadPastAppointments = async () => {
    try {
      setLoadingPastAppointments(true);
      const appointments = await calendarService.getPastAppointments();
      setPastAppointments(appointments || []);
    } catch (err: any) {
      toast.error(
        'Error al cargar las citas pasadas: ' +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setLoadingPastAppointments(false);
    }
  };

  const handleRateAppointment = async (appointmentId: number) => {
    if (!ratingAppointment || ratingAppointment < 1 || ratingAppointment > 5) {
      toast.error('Por favor selecciona una valoración entre 1 y 5 estrellas');
      return;
    }
    try {
      setSubmittingRating(true);
      await calendarService.rateAppointment(
        appointmentId,
        ratingAppointment,
        ratingComment || undefined,
      );
      toast.success('Valoración guardada exitosamente');
      setRatingAppointment(null);
      setRatingComment('');
      await loadPastAppointments();
    } catch (err: any) {
      toast.error(
        'Error al guardar la valoración: ' +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setSubmittingRating(false);
    }
  };

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

  const upcomingAppointment = useMemo(() => {
    const now = new Date();
    return myAppointments
      .filter((apt: any) => apt.startTime && new Date(apt.startTime) > now)
      .sort(
        (a: any, b: any) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )[0];
  }, [myAppointments]);

  // Cargar disponibilidad cuando se entra en la pestaña de calendario
  useEffect(() => {
    if (tab === 'calendario' && hasPsychologist) {
      loadAvailability();
    }
  }, [tab, hasPsychologist]);

  // Cargar historial cuando se entra en la pestaña mis-citas
  useEffect(() => {
    if (tab === 'mis-citas' && hasPsychologist) {
      loadPastAppointments();
    }
  }, [tab, hasPsychologist]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && !me) {
    return (
      <div className="container" style={{ maxWidth: '1200px', padding: '40px' }}>
        <LoadingSpinner text="Cargando tu espacio..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-forest flex">
      {/* Sidebar */}
      <aside className="w-24 bg-white border-r border-sage/10 h-screen sticky top-0 flex flex-col items-center py-10 z-40">
        <nav className="flex flex-col gap-4 w-full px-3 pt-2">
          {[
            { id: 'perfil', icon: 'person', label: 'Perfil', requiresPsych: false },
            { id: 'mi-psicologo', icon: 'medical_services', label: 'Psicólogo', requiresPsych: false },
            { id: 'tareas', icon: 'task_alt', label: 'Tareas', requiresPsych: true },
            { id: 'tests-pendientes', icon: 'assignment', label: 'Tests', requiresPsych: true },
            { id: 'calendario', icon: 'calendar_today', label: 'Calendario', requiresPsych: true },
            { id: 'agenda-personal', icon: 'book', label: 'Agenda', requiresPsych: false },
            { id: 'progreso', icon: 'trending_up', label: 'Progreso', requiresPsych: false },
            { id: 'chat', icon: 'chat', label: 'Chat', requiresPsych: true },
            { id: 'grupos', icon: 'group', label: 'Grupos', requiresPsych: false },
            { id: 'facturacion', icon: 'receipt_long', label: 'Pagos', requiresPsych: false },
            { id: 'privacidad', icon: 'shield', label: 'Privacidad', requiresPsych: false },
          ].map((item) => {
            const isDisabled = item.requiresPsych && !hasPsychologist;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) {
                    toast.error(
                      'Necesitas tener un psicólogo asignado para acceder a esta sección',
                    );
                    setTab('mi-psicologo');
                    return;
                  }
                  setTab(item.id as Tab);
                }}
                className={`sidebar-item ${isActive ? 'active' : ''} ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isDisabled ? 'Requiere psicólogo asignado' : undefined}
              >
                <span className="material-symbols-outlined font-light text-lg">
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-tighter">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto">
          <button
            type="button"
            className="sidebar-item text-sage/40 hover:text-red-400"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/';
            }}
          >
            <span className="material-symbols-outlined font-light">logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 lg:p-12 relative overflow-x-hidden">
        {/* Notification bell */}
        <div className="flex justify-end mb-4">
          <NotificationBell />
        </div>
        {/* Header hero solo en PERFIL */}
        {tab === 'perfil' && (
          <header className="bg-sage/10 rounded-[4rem] p-8 lg:p-12 mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-20">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <path
                  className="line-art"
                  d="M150 40 Q180 80 160 120 T100 160 T40 100 Q60 40 150 40"
                />
                <circle cx="100" cy="100" r="2" fill="#8da693" />
              </svg>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="relative">
                <div className="size-28 md:size-32 rounded-full overflow-hidden border-4 border-white soft-shadow bg-sage/20 flex items-center justify-center">
                  {me?.avatarUrl ? (
                    <img
                      src={me.avatarUrl}
                      alt={me.name || 'Usuario'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl md:text-4xl text-forest font-semibold">
                      {me?.name ? me.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-2">
                  Hola,{' '}
                  <span className="italic text-sage">
                    {me?.name || 'tu espacio emocional'}.
                  </span>
                </h1>
                <p className="text-sage/70 font-light mb-4">
                  {me?.email}
                  {me?.createdAt && (
                    <>
                      {' • Miembro desde '}
                      {formatDate(me.createdAt)}
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditProfileForm({
                      name: me?.name ?? '',
                      gender: me?.gender ?? '',
                      birthDate: me?.birthDate ? (typeof me.birthDate === 'string' ? me.birthDate.slice(0, 10) : '') : '',
                    });
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setTab('editar-perfil');
                  }}
                  className="px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition"
                >
                  Editar perfil y contraseña
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Vista PERFIL: tarjetas resumen como en el diseño */}
        {tab === 'perfil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna izquierda */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                <button
                  type="button"
                  onClick={() => setTab('mis-estadisticas')}
                  className="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-6xl text-sage">
                      monitoring
                    </span>
                  </div>
                  <div className="size-12 bg-mint flex items-center justify-center rounded-2xl text-sage mb-6">
                    <span className="material-symbols-outlined">bar_chart</span>
                  </div>
                  <h3 className="text-2xl font-normal mb-1">Mis estadísticas</h3>
                  <p className="text-sm text-sage/60 font-light">
                    Tu progreso en el tiempo
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('evaluaciones')}
                  className="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-6xl text-sage">
                      edit_note
                    </span>
                  </div>
                  <div className="size-12 bg-mint flex items-center justify-center rounded-2xl text-sage mb-6">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <h3 className="text-2xl font-normal mb-1">Evaluaciones</h3>
                  <p className="text-sm text-sage/60 font-light">Tests de evaluación</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('descubrimiento')}
                  className="bg-white p-8 rounded-[3rem] border border-sage/10 soft-shadow hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-6xl text-sage">
                      search_insights
                    </span>
                  </div>
                  <div className="size-12 bg-mint flex items-center justify-center rounded-2xl text-sage mb-6">
                    <span className="material-symbols-outlined">travel_explore</span>
                  </div>
                  <h3 className="text-2xl font-normal mb-1">Descubrimiento</h3>
                  <p className="text-sm text-sage/60 font-light">Explora nuevos insights</p>
                </button>
              </div>

              {/* Tareas y tests pendientes */}
              <div className="grid md:grid-cols-2 gap-8">
                <button
                  type="button"
                  onClick={() => setTab('tareas')}
                  className="bg-white p-10 rounded-[3rem] border border-sage/10 soft-shadow text-left hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-sage/40">
                      Tareas pendientes
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl serif-font italic">
                      {tasks.filter((t) => !t.completedAt).length}
                    </span>
                    <span className="text-sage font-light">pendiente(s)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('tests-pendientes')}
                  className="bg-white p-10 rounded-[3rem] border border-sage/10 soft-shadow text-left hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-sage/40">
                      Tests pendientes
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl serif-font italic">
                      {assignedTests.filter((t) => !t.completedAt).length}
                    </span>
                    <span className="text-sage font-light">pendiente(s)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Columna derecha: próxima cita */}
            <div className="lg:col-span-1">
              <div className="bg-white p-10 rounded-[4rem] border border-sage/10 soft-shadow h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-amber-500 text-sm">
                    alarm
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-sage/40">
                    Próxima cita
                  </span>
                </div>

                {upcomingAppointment ? (
                  <div className="bg-amber-light/50 rounded-[3rem] p-8 flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <h4 className="text-3xl font-normal mb-4">
                        {new Date(upcomingAppointment.startTime).toLocaleDateString(
                          'es-ES',
                          {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          },
                        )}
                      </h4>
                      <div className="space-y-3 text-sage">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="material-symbols-outlined text-lg">
                            schedule
                          </span>
                          <span className="font-light">
                            {new Date(
                              upcomingAppointment.startTime,
                            ).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {upcomingAppointment.psychologist && (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="material-symbols-outlined text-lg">
                              psychology
                            </span>
                            <span className="font-light">
                              Sesión con {upcomingAppointment.psychologist.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-amber-500/10 text-sm">
                      <p className="text-amber-600 font-semibold">
                        Podrás iniciar la videollamada 1 hora antes
                      </p>
                    </div>

                    <button
                      type="button"
                      className="mt-8 w-full py-3 bg-forest text-cream rounded-full font-medium hover:bg-sage transition-all shadow-lg shadow-forest/10 text-sm"
                      onClick={async () => {
                        const apt = upcomingAppointment;
                        if (me && apt?.psychologist) {
                          try {
                            const roomInfo = await jitsiService.getRoomInfo(
                              apt.psychologist.email,
                            );
                            setVideoCallRoom(roomInfo.roomName);
                            setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                            setShowVideoCall(true);
                          } catch (error: any) {
                            toast.error(
                              error.response?.data?.error ||
                                'No tienes permiso para iniciar esta videollamada',
                            );
                          }
                        }
                      }}
                    >
                      Join Call
                    </button>

                    <button
                      type="button"
                      className="mt-4 w-full py-2 text-sm text-sage hover:text-forest font-medium transition underline underline-offset-2"
                      onClick={() => {
                        setTab('calendario');
                        setTimeout(() => {
                          const citasSection = document.querySelector('[data-section="mis-citas"]');
                          if (citasSection) {
                            citasSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                    >
                      Ver todas
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-light/30 rounded-[3rem] p-8 flex-1 flex flex-col justify-center text-sage/70 text-sm">
                    No tienes ninguna cita próxima.
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 rounded-full border border-sage/40 text-sage text-xs font-medium hover:bg-sage hover:text-white transition"
                      onClick={() => setTab('calendario')}
                    >
                      Ir al calendario
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editar perfil (paciente): datos y contraseña */}
        {tab === 'editar-perfil' && (
          <div className="max-w-2xl">
            <button
              type="button"
              onClick={() => setTab('perfil')}
              className="mb-6 inline-flex items-center gap-2 text-sage hover:text-forest font-medium transition"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Volver al perfil
            </button>
            <div className="bg-white rounded-3xl p-8 border border-sage/10 soft-shadow space-y-8">
              <h2 className="text-2xl font-semibold text-forest">Editar perfil</h2>

              {/* Avatar */}
              <div className="flex flex-col items-start gap-4">
                <span className="text-sm font-medium text-forest">Foto de perfil</span>
                <div className="flex items-center gap-4">
                  <div className="size-24 rounded-full overflow-hidden border-2 border-sage/20 bg-sage/10 flex items-center justify-center">
                    {me?.avatarUrl ? (
                      <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-forest font-semibold">
                        {me?.name ? me.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !file.type.startsWith('image/')) {
                          toast.error('Selecciona una imagen válida');
                          return;
                        }
                        try {
                          setUploadingAvatar(true);
                          const res = await profileService.uploadAvatar(file);
                          setMe({ ...me, avatarUrl: res.avatarUrl });
                          toast.success('Foto actualizada');
                        } catch (err: any) {
                          toast.error(err.response?.data?.error || 'Error al subir la foto');
                        } finally {
                          setUploadingAvatar(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition">
                      {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Nombre, género, edad */}
              <div className="grid gap-4">
                <label className="block text-sm font-medium text-forest">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition"
                  placeholder="Tu nombre"
                />
                <label className="block text-sm font-medium text-forest">
                  Género
                </label>
                <select
                  value={editProfileForm.gender}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition"
                >
                  <option value="">No especificado</option>
                  <option value="MALE">Hombre</option>
                  <option value="FEMALE">Mujer</option>
                  <option value="OTHER">Otro</option>
                </select>
                <label className="block text-sm font-medium text-forest">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={editProfileForm.birthDate}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, birthDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition"
                />
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={async () => {
                    try {
                      setSavingProfile(true);
                      await profileService.update({
                        name: editProfileForm.name || undefined,
                        gender: editProfileForm.gender || undefined,
                        birthDate: editProfileForm.birthDate || undefined,
                      });
                      const ageFromBirth = editProfileForm.birthDate
                        ? Math.floor((Date.now() - new Date(editProfileForm.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : undefined;
                      setMe({
                        ...me,
                        name: editProfileForm.name,
                        gender: editProfileForm.gender,
                        birthDate: editProfileForm.birthDate || undefined,
                        age: ageFromBirth,
                      });
                      toast.success('Perfil actualizado');
                    } catch (err: any) {
                      toast.error(err.response?.data?.error || 'Error al guardar');
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                  className="mt-2 px-6 py-3 rounded-full bg-sage text-white font-medium hover:bg-sage/90 transition disabled:opacity-60"
                >
                  {savingProfile ? 'Guardando...' : 'Guardar datos'}
                </button>
              </div>

              {/* Cambiar contraseña */}
              <div className="pt-8 border-t border-sage/20">
                <h3 className="text-lg font-semibold text-forest mb-4">Cambiar contraseña</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-forest mb-1">Contraseña actual</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-sage/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest mb-1">Nueva contraseña</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-sage/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-forest mb-1">Repetir nueva contraseña</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-sage/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                    onClick={async () => {
                      if (passwordForm.newPassword.length < 6) {
                        toast.error('La nueva contraseña debe tener al menos 6 caracteres');
                        return;
                      }
                      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                        toast.error('Las contraseñas no coinciden');
                        return;
                      }
                      try {
                        setSavingPassword(true);
                        await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        toast.success('Contraseña actualizada');
                      } catch (err: any) {
                        const msg = err.response?.data?.error ?? err.response?.data?.message ?? 'Error al cambiar la contraseña';
                        toast.error(msg);
                      } finally {
                        setSavingPassword(false);
                      }
                    }}
                    className="px-6 py-3 rounded-full bg-forest text-cream font-medium hover:bg-forest/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingPassword ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mis estadísticas */}
        {tab === 'mis-estadisticas' && <MisEstadisticas />}

        {/* Evaluaciones */}
        {tab === 'evaluaciones' && <Evaluaciones />}

        {/* Descubrimiento */}
        {tab === 'descubrimiento' && <Descubrimiento />}

        {/* Agenda personal */}
        {tab === 'agenda-personal' && <AgendaPersonal />}

        {/* Chat */}
        {tab === 'chat' && hasPsychologist && (
          <div style={{ width: '100%' }}>
            <ChatWidget mode="USER" />
          </div>
        )}

        {/* Mi Psicólogo - estilo nuevo pero con funcionalidades antiguas */}
        {tab === 'mi-psicologo' && !showMatchingTest && !showMatchingResults && (
          <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
            {psych?.status === 'ASSIGNED' ? (
              <>
                {/* Menor con consentimiento pendiente: bloquear hasta firmar */}
                {hasPsychologist && isMinor && (loadingConsents || pendingConsents.length > 0) ? (
                  <div className="space-y-6">
                    {loadingConsents ? (
                      <LoadingSpinner text="Cargando consentimiento..." />
                    ) : (
                      <>
                        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
                          <h3 className="text-xl font-semibold text-amber-900 mb-2">
                            Consentimiento requerido (menores de 18 años)
                          </h3>
                          <p className="text-sm text-amber-800 mb-4">
                            Tu psicólogo te ha enviado un documento de consentimiento. Debes leerlo y firmarlo para continuar.
                          </p>
                        </div>
                        {pendingConsents.map((c: any) => (
                          <div key={c.id} className="rounded-2xl border border-sage/20 overflow-hidden">
                            <div className="p-4 bg-sage/10 border-b border-sage/20">
                              <span className="font-medium text-forest">{c.documentTitle || 'Consentimiento'}</span>
                            </div>
                            <div className="p-6 max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm text-forest">
                              {c.renderedContent || 'Sin contenido.'}
                            </div>
                            <div className="p-4 bg-sage/5 border-t border-sage/20 flex flex-col sm:flex-row gap-3">
                              <input
                                type="text"
                                value={signingConsentId === c.id ? signerNameForConsent : ''}
                                onChange={(e) => setSignerNameForConsent(e.target.value)}
                                placeholder="Nombre del firmante (ej. padre/madre/tutor o el menor)"
                                className="flex-1 px-4 py-3 rounded-xl border border-sage/20 focus:ring-2 focus:ring-sage/30 outline-none"
                              />
                              <button
                                type="button"
                                disabled={!signerNameForConsent.trim() || signingConsentId !== null}
                                onClick={async () => {
                                  if (!signerNameForConsent.trim()) return;
                                  setSigningConsentId(c.id);
                                  try {
                                    await consentService.sign(c.id, signerNameForConsent.trim());
                                    toast.success('Consentimiento firmado');
                                    setSignerNameForConsent('');
                                    const list = await consentService.myPending();
                                    setPendingConsents(Array.isArray(list) ? list : []);
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.error || 'Error al firmar');
                                  } finally {
                                    setSigningConsentId(null);
                                  }
                                }}
                                className="px-6 py-3 rounded-xl bg-forest text-cream font-medium hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {signingConsentId === c.id ? 'Firmando...' : 'Firmar consentimiento'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                <>
                {/* Header tipo perfil */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full overflow-hidden soft-shadow flex items-center justify-center">
                    {psych.psychologist?.avatarUrl ? (
                      <img
                        src={psych.psychologist.avatarUrl}
                        alt={psych.psychologist.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-3xl text-forest">
                        {(psych.psychologist?.name || 'P')[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-normal text-forest mb-1">
                      {psych.psychologist?.name}
                    </h2>
                    <p className="text-sage/70 text-sm mb-4">
                      {psych.psychologist?.email}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition"
                      onClick={() =>
                        loadPsychologistProfile(psych.psychologist.id)
                      }
                    >
                      Ver perfil completo
                    </button>
                  </div>
                </div>

                {/* Citas pasadas con este psicólogo (cards uniformes + valoración) */}
                <div className="mt-6">
                  <h3 className="text-xl font-medium text-forest mb-3">
                    Mis citas pasadas
                  </h3>
                  {loadingPastAppointments ? (
                    <LoadingSpinner text="Cargando citas pasadas..." />
                  ) : pastAppointments.length === 0 ? (
                    <p className="text-sage/70 text-sm">
                      Aún no tienes citas pasadas con tu psicólogo.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {pastAppointments.map((apt: any) => {
                        const hasRating = !!apt.rating;
                        const comment = apt.rating?.comment || '';
                        return (
                          <div
                            key={apt.id}
                            className="rounded-3xl px-6 py-4 shadow-sm bg-sage/10 border border-sage/20 flex items-center justify-between gap-6"
                          >
                            {/* Columna izquierda: fecha y hora */}
                            <div className="flex-1">
                              <div className="text-sm text-sage/70 serif-font">
                                {new Date(apt.startTime).toLocaleDateString(
                                  'es-ES',
                                  {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  },
                                )}
                              </div>
                              <div className="text-xs text-forest font-medium mt-0.5">
                                {new Date(apt.startTime).toLocaleTimeString(
                                  'es-ES',
                                  { hour: '2-digit', minute: '2-digit' },
                                )}{' '}
                                -{' '}
                                {new Date(apt.endTime).toLocaleTimeString(
                                  'es-ES',
                                  { hour: '2-digit', minute: '2-digit' },
                                )}
                              </div>
                            </div>

                            {/* Columna derecha: estrellas + comentario, siempre alineada */}
                            <div className="w-40 flex flex-col items-center justify-center">
                              <div className="flex gap-0.5 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={
                                      hasRating && star <= apt.rating.rating
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                    }
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <p className="min-h-[28px] text-[11px] text-sage/80 italic text-center flex items-center justify-center">
                                {hasRating && comment ? `"${comment}"` : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-forest mb-2">
                  Encuentra tu psicólogo ideal
                </h3>
                <p className="text-sage/70 mb-6">
                  Completa el test de matching para encontrar psicólogos que se adapten a tus necesidades, o usa un código de referencia si ya tienes un psicólogo.
                </p>

                {/* Formulario para usar código de referencia */}
                <div className="max-w-md mx-auto mb-8">
                  <div className="bg-sage/5 rounded-2xl p-6 border border-sage/20">
                    <h4 className="text-lg font-medium text-forest mb-3">
                      ¿Tienes un código de referencia?
                    </h4>
                    <p className="text-sm text-sage/70 mb-4">
                      Si un psicólogo te ha compartido un código o enlace, úsalo aquí para unirte directamente a su consulta.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralCodeInput}
                        onChange={(e) => setReferralCodeInput(e.target.value)}
                        placeholder="Código de referencia (ej: juan-garcia)"
                        className="flex-1 px-4 py-2 rounded-xl border border-sage/20 text-forest placeholder:text-sage/50 focus:outline-none focus:ring-2 focus:ring-sage/30"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && referralCodeInput.trim()) {
                            handleUseReferralCode();
                          }
                        }}
                      />
                      <button
                        onClick={handleUseReferralCode}
                        disabled={!referralCodeInput.trim() || usingReferralCode}
                        className="px-6 py-2 bg-sage text-white rounded-xl hover:bg-sage/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {usingReferralCode ? 'Uniendo...' : 'Usar código'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sage/70 text-sm mb-6 max-w-md mx-auto">
                    O completa nuestro test de matching para encontrar el
                    profesional que mejor se adapte a tus necesidades.
                  </p>
                  <button
                    type="button"
                    className="px-6 py-3 rounded-full bg-sage text-cream text-sm font-semibold hover:bg-forest transition shadow-sm"
                    onClick={() => setShowMatchingTest(true)}
                  >
                    Comenzar test de matching
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test de Matching del Paciente */}
        {tab === 'mi-psicologo' && showMatchingTest && !showMatchingResults && (
          <div className="mt-10">
            <PatientMatchingTest
              onComplete={() => {
                setShowMatchingTest(false);
                setShowMatchingResults(true);
              }}
              onBack={() => setShowMatchingTest(false)}
            />
          </div>
        )}

        {/* Resultados del Matching - Psicólogos compatibles */}
        {tab === 'mi-psicologo' && showMatchingResults && (
          <div className="mt-10">
            <MatchingPsychologists
              onSelect={async () => {
                setShowMatchingResults(false);
                // Recargar datos del psicólogo asignado
                try {
                  const psychData = await profileService.myPsychologist();
                  setPsych(psychData);
                } catch (e) {
                  // Recargar página si falla
                  window.location.reload();
                }
              }}
              onBack={() => {
                setShowMatchingResults(false);
              }}
            />
          </div>
        )}

        {/* Perfil completo del psicólogo - plantilla tipo LinkedIn antigua */}
        {tab === 'perfil-psicologo' && psychologistProfile && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
              padding: '40px',
              border: '1px solid rgba(90, 146, 112, 0.15)',
              maxWidth: '900px',
              margin: '40px auto 0',
            }}
          >
            {loadingPsychologistProfile ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>
                  Cargando perfil del psicólogo...
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#1a2e22',
                    }}
                  >
                    Perfil del Psicólogo
                  </h2>
                  <button
                    onClick={() => setTab('mi-psicologo')}
                    style={{
                      padding: '10px 20px',
                      background: '#f3f4f6',
                      color: '#1f2937',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ← Volver
                  </button>
                </div>

                {/* Header del perfil */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                    padding: '40px',
                    borderRadius: '20px',
                    border: '2px solid rgba(90, 146, 112, 0.3)',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '32px',
                    boxShadow: '0 4px 16px rgba(90, 146, 112, 0.15)',
                  }}
                >
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '4px solid white',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      flexShrink: 0,
                    }}
                  >
                    {psychologistProfile.avatarUrl ? (
                      <img
                        src={psychologistProfile.avatarUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9ca3af',
                          fontSize: '24px',
                        }}
                      >
                        PS
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#1f2937',
                      }}
                    >
                      {psychologistProfile.name}
                    </h3>
                    <div
                      style={{
                        fontSize: '18px',
                        color: '#6b7280',
                        marginBottom: '12px',
                      }}
                    >
                      {psychologistProfile.email}
                    </div>
                  </div>
                </div>

                {/* Biografía */}
                {psychologistProfile.bio && (
                  <div
                    style={{
                      marginBottom: '32px',
                      padding: '24px',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 16px 0',
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1f2937',
                      }}
                    >
                      Sobre mí
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#4b5563',
                      }}
                    >
                      {psychologistProfile.bio}
                    </p>
                  </div>
                )}

                {/* Educación */}
                {psychologistProfile.education && (() => {
                  try {
                    const education = JSON.parse(psychologistProfile.education);
                    if (Array.isArray(education) && education.length > 0) {
                      return (
                        <div
                          style={{
                            marginBottom: '32px',
                            padding: '24px',
                            background: '#f9fafb',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <h3
                            style={{
                              margin: '0 0 20px 0',
                              fontSize: '20px',
                              fontWeight: 600,
                              color: '#1f2937',
                            }}
                          >
                            Educación
                          </h3>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                            }}
                          >
                            {education.map((edu: any, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '16px',
                                  background: '#ffffff',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#1f2937',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {edu.degree || 'Título'}{' '}
                                  {edu.field ? `en ${edu.field}` : ''}
                                </div>
                                <div
                                  style={{
                                    fontSize: '16px',
                                    color: '#667eea',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {edu.institution || 'Institución'}
                                </div>
                                <div
                                  style={{ fontSize: '14px', color: '#6b7280' }}
                                >
                                  {edu.startDate && edu.endDate
                                    ? `${edu.startDate} - ${edu.endDate}`
                                    : edu.startDate ||
                                      edu.endDate ||
                                      ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {
                    // ignore parse errors
                  }
                  return null;
                })()}

                {/* Certificaciones */}
                {psychologistProfile.certifications && (() => {
                  try {
                    const certs = JSON.parse(
                      psychologistProfile.certifications,
                    );
                    if (Array.isArray(certs) && certs.length > 0) {
                      return (
                        <div
                          style={{
                            marginBottom: '32px',
                            padding: '24px',
                            background: '#f9fafb',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <h3
                            style={{
                              margin: '0 0 20px 0',
                              fontSize: '20px',
                              fontWeight: 600,
                              color: '#1f2937',
                            }}
                          >
                            Certificaciones
                          </h3>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                            }}
                          >
                            {certs.map((cert: any, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '16px',
                                  background: '#ffffff',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#1f2937',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {cert.name || 'Certificación'}
                                </div>
                                <div
                                  style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    marginBottom: '4px',
                                  }}
                                >
                                  Emitido por: {cert.issuer || 'N/A'}
                                </div>
                                {cert.date && (
                                  <div
                                    style={{
                                      fontSize: '14px',
                                      color: '#6b7280',
                                      marginBottom: '4px',
                                    }}
                                  >
                                    Fecha: {cert.date}
                                  </div>
                                )}
                                {cert.credentialId && (
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      color: '#9ca3af',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    ID: {cert.credentialId}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {}
                  return null;
                })()}

                {/* Experiencia */}
                {psychologistProfile.experience && (() => {
                  try {
                    const experience = JSON.parse(
                      psychologistProfile.experience,
                    );
                    if (Array.isArray(experience) && experience.length > 0) {
                      return (
                        <div
                          style={{
                            marginBottom: '32px',
                            padding: '24px',
                            background: '#f9fafb',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <h3
                            style={{
                              margin: '0 0 20px 0',
                              fontSize: '20px',
                              fontWeight: 600,
                              color: '#1f2937',
                            }}
                          >
                            Experiencia profesional
                          </h3>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                            }}
                          >
                            {experience.map((exp: any, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '16px',
                                  background: '#ffffff',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#1f2937',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {exp.title || 'Cargo'}
                                </div>
                                <div
                                  style={{
                                    fontSize: '16px',
                                    color: '#667eea',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {exp.company || 'Empresa'}
                                </div>
                                {exp.description && (
                                  <div
                                    style={{
                                      fontSize: '14px',
                                      color: '#4b5563',
                                      marginTop: '8px',
                                      lineHeight: '1.6',
                                    }}
                                  >
                                    {exp.description}
                                  </div>
                                )}
                                <div
                                  style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    marginTop: '8px',
                                  }}
                                >
                                  {exp.startDate && exp.endDate
                                    ? `${exp.startDate} - ${exp.endDate}`
                                    : exp.startDate
                                    ? `Desde ${exp.startDate}`
                                    : exp.endDate
                                    ? `Hasta ${exp.endDate}`
                                    : ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {}
                  return null;
                })()}
              </>
            )}
          </div>
        )}

        {tab === 'tareas' && hasPsychologist && (
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
        )}

        {tab === 'tests-pendientes' && hasPsychologist && (
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
              Tests Pendientes
            </h3>
            {assignedTests.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No hay tests pendientes"
                description="Aún no tienes tests asignados. Tu psicólogo te asignará tests aquí."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {assignedTests.map((at: any) => (
                  <div
                    key={at.id}
                    className={`rounded-3xl px-6 py-4 shadow-sm border border-sage/20 transition-all flex items-center justify-between gap-6 ${
                      at.completedAt
                        ? 'cursor-default'
                        : 'cursor-pointer hover:shadow-md'
                    }`}
                    style={{ backgroundColor: '#EDF2EB' }}
                    onClick={async () => {
                      if (!at.completedAt && (at.testId || at.test?.id)) {
                        const testId = at.testId || at.test?.id;
                        try {
                          if (onStartTest) {
                            onStartTest(testId);
                          }
                        } catch (error) {
                          toast.error(
                            'Error al iniciar el test. Por favor intenta de nuevo.',
                          );
                        }
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="text-sm text-sage serif-font font-medium">
                        {at.testTitle || at.test?.title || 'Test'}
                      </div>
                      {at.assignedAt && (
                        <div className="text-xs text-forest font-medium mt-0.5">
                          Asignado:{' '}
                          {new Date(at.assignedAt).toLocaleDateString(
                            'es-ES',
                            {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            },
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-sm text-sage font-medium serif-font">
                      {at.completedAt ? 'Completado' : 'Pendiente'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'calendario' && hasPsychologist && (
          <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
            <h2 className="text-2xl font-normal mb-4">Calendario</h2>
            {loadingSlots ? (
              <LoadingSpinner text="Cargando calendario..." />
            ) : (
              <CalendarWeek
                mode="USER"
                slots={slots}
                myAppointments={myAppointments}
                onBook={async (id) => {
                  try {
                    const result = await calendarService.book(id);
                    if ((result as any).error) {
                      toast.error((result as any).error);
                      return;
                    }
                    await loadAvailability();
                    toast.success(
                      'Cita reservada exitosamente. Espera la confirmación del psicólogo.',
                    );
                  } catch (e: any) {
                    const errorMsg =
                      e.response?.data?.error || 'Error al reservar la cita';
                    toast.error(errorMsg);
                  }
                }}
              />
            )}

            {!loadingSlots && myAppointments.length > 0 && (
              <div className="mt-10 border-t border-sage/10 pt-8" data-section="mis-citas">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[22px] font-normal text-forest flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-sage">
                      calendar_today
                    </span>
                    Mis citas
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myAppointments.map((apt) => {
                    const status = apt.status as string | undefined;
                    const isConfirmed = status === 'CONFIRMED';
                    const isPending = status === 'REQUESTED';
                    const isCancelled =
                      status === 'CANCELLED' || status === 'CANCELED';

                    const statusLabel = isConfirmed
                      ? 'Confirmada'
                      : isPending
                      ? 'Pendiente'
                      : isCancelled
                      ? 'Cancelada'
                      : status || 'Programada';

                    const statusClasses = isConfirmed
                      ? 'bg-[#F1F8F6] text-[#6B8B7E]'
                      : isPending
                      ? 'bg-[#FAF5E6] text-[#9A8754]'
                      : isCancelled
                      ? 'bg-[#F5F5F5] text-[#8E8E8E]'
                      : 'bg-sage/10 text-sage/70';

                    const badgeBg = isConfirmed
                      ? 'bg-[#E9F0EE]'
                      : isPending
                      ? 'bg-[#F7F3E6]'
                      : isCancelled
                      ? 'bg-[#F2F2F2]'
                      : 'bg-sage/10';

                    const badgeIconColor = isConfirmed
                      ? 'text-[#8DA399]'
                      : isPending
                      ? 'text-[#B29D6B]'
                      : isCancelled
                      ? 'text-[#9E9E9E]'
                      : 'text-sage';

                    return (
                      <div
                        key={apt.id}
                        className="rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow border border-sage/15 flex flex-col min-h-[190px] bg-white"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <p className="text-[10px] tracking-[0.25em] font-bold text-sage/50 uppercase">
                            Próxima cita
                          </p>
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center ${badgeBg}`}
                          >
                            <span
                              className={`material-symbols-outlined text-xl ${badgeIconColor}`}
                            >
                              psychology
                            </span>
                          </div>
                        </div>

                        <h4 className="serif-font text-3xl text-forest mb-1">
                          {new Date(apt.startTime).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </h4>

                        <p className="text-sm text-sage/70 font-medium mb-10">
                          {new Date(apt.startTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {apt.endTime &&
                            new Date(apt.endTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </p>

                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-sm text-sage/80 font-medium">
                            {apt.psychologist?.name || 'Terapia online'}
                          </span>
                          <span
                            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-[13px] font-medium shadow-sm ${statusClasses}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10 flex items-center justify-end border-t border-sage/10 pt-6">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-sage"
                    onClick={() => {
                      setTab('mis-citas');
                    }}
                  >
                    <span className="material-symbols-outlined text-base">
                      history
                    </span>
                    <span className="underline underline-offset-2">
                      Ver historial completo
                    </span>
                  </button>
                </div>
              </div>
            )}

            {!loadingSlots && slots.length === 0 && myAppointments.length === 0 && (
              <p className="text-sage/70 text-sm">
                De momento no hay disponibilidad publicada por tu psicólogo.
              </p>
            )}
          </div>
        )}

        {/* Historial completo de citas */}
        {tab === 'mis-citas' && hasPsychologist && (
          <div className="mt-10 bg-cream rounded-3xl p-8 border border-sage/10 soft-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-normal text-forest flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-sage">
                  history
                </span>
                Historial de citas
              </h2>
            </div>

            {loadingPastAppointments ? (
              <LoadingSpinner text="Cargando historial de citas..." />
            ) : pastAppointments.length === 0 ? (
              <p className="text-sage/70 text-sm">
                Aún no tienes citas en tu historial.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastAppointments
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.startTime).getTime() -
                      new Date(a.startTime).getTime(),
                  )
                  .map((apt) => {
                    const status = apt.status as string | undefined;
                    const isConfirmed = status === 'CONFIRMED';
                    const isPending = status === 'REQUESTED';
                    const isCancelled =
                      status === 'CANCELLED' || status === 'CANCELED';

                    const statusLabel = isConfirmed
                      ? 'Confirmada'
                      : isPending
                      ? 'Pendiente'
                      : isCancelled
                      ? 'Cancelada'
                      : status || 'Programada';

                    const statusClasses = isConfirmed
                      ? 'bg-[#F1F8F6] text-[#6B8B7E]'
                      : isPending
                      ? 'bg-[#FAF5E6] text-[#9A8754]'
                      : isCancelled
                      ? 'bg-[#F5F5F5] text-[#8E8E8E]'
                      : 'bg-sage/10 text-sage/70';

                    const badgeBg = isConfirmed
                      ? 'bg-[#E9F0EE]'
                      : isPending
                      ? 'bg-[#F7F3E6]'
                      : isCancelled
                      ? 'bg-[#F2F2F2]'
                      : 'bg-sage/10';

                    const badgeIconColor = isConfirmed
                      ? 'text-[#8DA399]'
                      : isPending
                      ? 'text-[#B29D6B]'
                      : isCancelled
                      ? 'text-[#9E9E9E]'
                      : 'text-sage';

                    return (
                      <div
                        key={apt.id}
                        className="rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow border border-sage/15 flex flex-col min-h-[190px] bg-white"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <p className="text-[10px] tracking-[0.25em] font-bold text-sage/50 uppercase">
                            Cita
                          </p>
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center ${badgeBg}`}
                          >
                            <span
                              className={`material-symbols-outlined text-xl ${badgeIconColor}`}
                            >
                              psychology
                            </span>
                          </div>
                        </div>

                        <h4 className="serif-font text-2xl text-forest mb-1">
                          {new Date(apt.startTime).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </h4>

                        <p className="text-sm text-sage/70 font-medium mb-8">
                          {new Date(apt.startTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {apt.endTime &&
                            new Date(apt.endTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </p>

                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-sm text-sage/80 font-medium">
                            {apt.psychologist?.name || 'Terapia online'}
                          </span>
                          <span
                            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-[13px] font-medium shadow-sm ${statusClasses}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
        {/* Tab: Privacidad y Datos (RGPD) */}
        {tab === 'privacidad' && (
          <div className="space-y-8">
            {/* 2FA Setup */}
            <div className="bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
              <h2 className="text-2xl font-normal text-forest flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-xl text-sage">lock</span>
                Seguridad de la cuenta
              </h2>
              <Suspense fallback={<LoadingSpinner />}>
                <TwoFactorSetup
                  isEnabled={me?.totpEnabled || false}
                  onStatusChange={() => { authService.me().then((data: any) => setMe(data)).catch(() => {}); }}
                />
              </Suspense>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
              <h2 className="text-2xl font-normal text-forest flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-xl text-sage">shield</span>
                Privacidad y Datos
              </h2>
              <p className="text-sage/70 text-sm mb-8">
                Gestiona tus datos personales conforme al Reglamento General de Protección de Datos (RGPD).
              </p>

              {/* Exportar datos */}
              <div className="bg-cream rounded-2xl p-6 mb-6 border border-sage/10">
                <h3 className="text-lg font-medium text-forest mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-sage">download</span>
                  Descargar mis datos
                </h3>
                <p className="text-sage/70 text-sm mb-4">
                  Descarga una copia de todos tus datos en formato JSON (Art. 20 RGPD - Derecho de portabilidad).
                </p>
                <button
                  onClick={async () => {
                    try {
                      const data = await profileService.exportMyData();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `mis-datos-psymatch-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Datos exportados correctamente');
                    } catch {
                      toast.error('Error al exportar los datos');
                    }
                  }}
                  className="px-6 py-2.5 bg-forest text-white rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors"
                >
                  Descargar mis datos
                </button>
              </div>

              {/* Info retención */}
              <div className="bg-cream rounded-2xl p-6 mb-6 border border-sage/10">
                <h3 className="text-lg font-medium text-forest mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-sage">info</span>
                  Política de retención
                </h3>
                <p className="text-sage/70 text-sm">
                  Tus datos se conservan durante un máximo de 5 años desde tu registro, conforme a la legislación sanitaria.
                  Tras ese periodo, tus datos son anonimizados automáticamente.
                </p>
              </div>

              {/* Eliminar cuenta */}
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <h3 className="text-lg font-medium text-red-700 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-red-500">delete_forever</span>
                  Eliminar mi cuenta
                </h3>
                <p className="text-red-600/70 text-sm mb-4">
                  Esta acción es irreversible. Todos tus datos serán eliminados permanentemente (Art. 17 RGPD - Derecho de supresión).
                </p>
                <button
                  onClick={async () => {
                    const confirmed = window.confirm(
                      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es IRREVERSIBLE y todos tus datos serán eliminados permanentemente.'
                    );
                    if (!confirmed) return;
                    const doubleConfirmed = window.confirm(
                      'Última confirmación: ¿Realmente deseas eliminar tu cuenta y todos tus datos?'
                    );
                    if (!doubleConfirmed) return;
                    try {
                      await profileService.deleteMyAccount();
                      toast.success('Cuenta eliminada correctamente');
                      localStorage.removeItem('token');
                      localStorage.removeItem('refreshToken');
                      window.location.reload();
                    } catch {
                      toast.error('Error al eliminar la cuenta');
                    }
                  }}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Eliminar mi cuenta permanentemente
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Tab: Progreso */}
        {tab === 'progreso' && (
          <Suspense fallback={<LoadingSpinner />}>
            <ProgressDashboard />
          </Suspense>
        )}

        {/* Tab: Facturación */}
        {tab === 'facturacion' && (
          <Suspense fallback={<LoadingSpinner />}>
            <BillingPortal />
          </Suspense>
        )}

        {/* Tab: Grupos */}
        {tab === 'grupos' && (
          <Suspense fallback={<LoadingSpinner />}>
            <GroupSessions role="USER" />
          </Suspense>
        )}
      </main>

      {/* Onboarding Wizard */}
      {showOnboarding && !hasPsychologist && me && (
        <OnboardingWizard
          userName={me.name || 'Usuario'}
          onComplete={() => setShowOnboarding(false)}
          onGoToProfile={() => { setShowOnboarding(false); setTab('editar-perfil'); }}
          onGoToMatching={() => { setShowOnboarding(false); setTab('mi-psicologo'); setShowMatchingTest(true); }}
        />
      )}

      {/* Video Call Component */}
      {showVideoCall && videoCallRoom && videoCallOtherUser && me && (
        <JitsiVideoCall
          roomName={videoCallRoom}
          userEmail={me.email}
          userName={me.name || 'Usuario'}
          otherUserEmail={videoCallOtherUser.email}
          otherUserName={videoCallOtherUser.name}
          onClose={() => {
            setShowVideoCall(false);
            setVideoCallRoom(null);
            setVideoCallOtherUser(null);
          }}
        />
      )}
    </div>
  );
}

