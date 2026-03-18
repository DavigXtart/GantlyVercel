import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  profileService,
  tasksService,
  calendarService,
  assignedTestsService,
  jitsiService,
  consentService,
  stripeService,
} from '../services/api';
import CalendarWeek from './CalendarWeek';
import ChatWidget from './ChatWidget';
import EmptyState from './ui/EmptyState';
import AgendaPersonal from './AgendaPersonal';
import MisEstadisticas from './MisEstadisticas';
import Evaluaciones from './Evaluaciones';
import Descubrimiento from './Descubrimiento';
import LoadingSpinner from './ui/LoadingSpinner';
import UserTasksTab from './UserTasksTab';
import UserPsychProfileTab from './UserPsychProfileTab';
import UserSettingsTab from './UserSettingsTab';
import { toast } from './ui/Toast';
import PatientMatchingTest from './PatientMatchingTest';
import MatchingPsychologists from './MatchingPsychologists';
import JitsiVideoCall from './JitsiVideoCall';

import OnboardingWizard from './OnboardingWizard';


type Tab =
  | 'perfil'
  | 'configuracion'
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
  | 'perfil-psicologo';


interface UserDashboardProps {
  onStartTest?: (testId: number) => void;
}

export default function UserDashboard({ onStartTest }: UserDashboardProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Gestionar parámetros de retorno de Stripe
  useEffect(() => {
    const payment = searchParams.get('payment');
    const appointmentId = searchParams.get('appointment');
    if (payment === 'success') {
      searchParams.delete('payment');
      searchParams.delete('appointment');
      setSearchParams(searchParams, { replace: true });
      if (appointmentId) {
        stripeService.verifyAppointmentPayment(Number(appointmentId))
          .then(() => {
            toast.success('Pago realizado correctamente');
            loadData();
          })
          .catch(() => {
            toast.success('Pago realizado correctamente');
            loadData();
          });
      } else {
        toast.success('Pago realizado correctamente');
        loadData();
      }
    } else if (payment === 'canceled') {
      toast.error('El pago fue cancelado');
      searchParams.delete('payment');
      searchParams.delete('appointment');
      setSearchParams(searchParams, { replace: true });
    }
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
      <aside className="w-24 bg-cream sticky top-0 h-screen flex flex-col items-center pt-2 pb-10 z-40 border-none">
        <nav className="flex flex-col gap-4 w-full px-3">
          {[
            { id: 'perfil', icon: 'person', label: 'Perfil', requiresPsych: false },
            { id: 'mi-psicologo', icon: 'medical_services', label: 'Psicólogo', requiresPsych: false },
            { id: 'tareas', icon: 'task_alt', label: 'Tareas', requiresPsych: true },
            { id: 'tests-pendientes', icon: 'assignment', label: 'Tests', requiresPsych: true },
            { id: 'calendario', icon: 'calendar_today', label: 'Calendario', requiresPsych: true },
            { id: 'agenda-personal', icon: 'book', label: 'Agenda', requiresPsych: false },
            { id: 'chat', icon: 'chat', label: 'Chat', requiresPsych: true },
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
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 lg:px-12 py-4 relative overflow-x-hidden">
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
                    setTab('configuracion');
                  }}
                  className="px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">settings</span>
                  Configuración
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

                    {upcomingAppointment.paymentStatus === 'PAID' ? (
                    <>
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
                    </>
                    ) : (
                    <div className="mt-6 pt-4 border-t border-amber-500/10 text-sm">
                      <p className="text-amber-600 font-semibold">
                        Debes completar el pago antes de poder acceder a la videollamada
                      </p>
                    </div>
                    )}

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

        {/* Configuración: Perfil, Seguridad, Pagos, Privacidad */}
        {tab === 'configuracion' && (
          <UserSettingsTab
            me={me}
            onBack={() => setTab('perfil')}
            onMeUpdate={(updated) => setMe(updated)}
          />
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
          <UserPsychProfileTab
            psychologistProfile={psychologistProfile}
            loadingPsychologistProfile={loadingPsychologistProfile}
            onBack={() => setTab('mi-psicologo')}
          />
        )}

        {tab === 'tareas' && hasPsychologist && (
          <UserTasksTab tasks={tasks} onRefresh={loadData} />
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
                    const isBooked = status === 'BOOKED';
                    const isConfirmed = status === 'CONFIRMED';
                    const isPaid = apt.paymentStatus === 'PAID';
                    const isPending = status === 'REQUESTED';
                    const isCancelled =
                      status === 'CANCELLED' || status === 'CANCELED';

                    const statusLabel = isBooked || isPaid
                      ? 'Pagada'
                      : isConfirmed
                      ? 'Pago pendiente'
                      : isPending
                      ? 'Por confirmar'
                      : isCancelled
                      ? 'Cancelada'
                      : status || 'Programada';

                    const statusClasses = isBooked || isPaid
                      ? 'bg-[#E8F5E9] text-[#2E7D32]'
                      : isConfirmed
                      ? 'bg-[#FFF3E0] text-[#E65100]'
                      : isPending
                      ? 'bg-[#FAF5E6] text-[#9A8754]'
                      : isCancelled
                      ? 'bg-[#F5F5F5] text-[#8E8E8E]'
                      : 'bg-sage/10 text-sage/70';

                    const badgeBg = isBooked || isPaid
                      ? 'bg-[#E8F5E9]'
                      : isConfirmed
                      ? 'bg-[#FFF3E0]'
                      : isPending
                      ? 'bg-[#F7F3E6]'
                      : isCancelled
                      ? 'bg-[#F2F2F2]'
                      : 'bg-sage/10';

                    const badgeIconColor = isBooked || isPaid
                      ? 'text-[#2E7D32]'
                      : isConfirmed
                      ? 'text-[#E65100]'
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
                          <div className="flex items-center gap-2">
                            {isConfirmed && apt.paymentStatus === 'PENDING' && (
                              <button
                                className="inline-flex items-center justify-center rounded-full px-4 py-1 text-[13px] font-semibold shadow-sm bg-[#5a9270] text-white hover:bg-[#4a8062] transition-colors cursor-pointer border-none"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const { url } = await stripeService.createAppointmentCheckout(apt.id);
                                    window.location.href = url;
                                  } catch (err: any) {
                                    alert(err.response?.data?.error || 'Error al iniciar el pago');
                                  }
                                }}
                              >
                                Pagar {apt.price ? `${apt.price}€` : ''}
                              </button>
                            )}
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-[13px] font-medium shadow-sm ${statusClasses}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
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
                    const isBooked = status === 'BOOKED';
                    const isConfirmed = status === 'CONFIRMED';
                    const isPaid = apt.paymentStatus === 'PAID';
                    const isPending = status === 'REQUESTED';
                    const isCancelled =
                      status === 'CANCELLED' || status === 'CANCELED';

                    const statusLabel = isBooked || isPaid
                      ? 'Pagada'
                      : isConfirmed
                      ? 'Pago pendiente'
                      : isPending
                      ? 'Por confirmar'
                      : isCancelled
                      ? 'Cancelada'
                      : status || 'Programada';

                    const statusClasses = isBooked || isPaid
                      ? 'bg-[#E8F5E9] text-[#2E7D32]'
                      : isConfirmed
                      ? 'bg-[#FFF3E0] text-[#E65100]'
                      : isPending
                      ? 'bg-[#FAF5E6] text-[#9A8754]'
                      : isCancelled
                      ? 'bg-[#F5F5F5] text-[#8E8E8E]'
                      : 'bg-sage/10 text-sage/70';

                    const badgeBg = isBooked || isPaid
                      ? 'bg-[#E8F5E9]'
                      : isConfirmed
                      ? 'bg-[#FFF3E0]'
                      : isPending
                      ? 'bg-[#F7F3E6]'
                      : isCancelled
                      ? 'bg-[#F2F2F2]'
                      : 'bg-sage/10';

                    const badgeIconColor = isBooked || isPaid
                      ? 'text-[#2E7D32]'
                      : isConfirmed
                      ? 'text-[#E65100]'
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
      </main>

      {/* Onboarding Wizard */}
      {showOnboarding && !hasPsychologist && me && (
        <OnboardingWizard
          userName={me.name || 'Usuario'}
          onComplete={() => setShowOnboarding(false)}
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

