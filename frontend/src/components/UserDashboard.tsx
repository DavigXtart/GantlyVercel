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
  patientClinicChatService,
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
  | 'perfil-psicologo'
  | 'mensajes-clinica';


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
  // Clinic chat state
  const [clinicChatMessages, setClinicChatMessages] = useState<Array<{ id: number; sender: string; content: string; createdAt: string }>>([]);
  const [clinicChatInput, setClinicChatInput] = useState('');
  const [clinicChatSending, setClinicChatSending] = useState(false);
  const [clinicChatLoading, setClinicChatLoading] = useState(false);

  const hasPsychologist = psych?.status === 'ASSIGNED';
  const hasClinic = !!me?.companyId;

  // Load clinic chat messages
  const loadClinicChat = async () => {
    if (!hasClinic) return;
    try {
      const msgs = await patientClinicChatService.getMessages();
      setClinicChatMessages(msgs);
    } catch {
      // silently ignore
    }
  };

  // Poll clinic chat every 5 seconds
  useEffect(() => {
    if (tab !== 'mensajes-clinica' || !hasClinic) return;
    setClinicChatLoading(true);
    loadClinicChat().finally(() => setClinicChatLoading(false));
    const interval = setInterval(() => {
      if (clinicChatMessages.length > 0) {
        const lastTime = clinicChatMessages[clinicChatMessages.length - 1].createdAt;
        patientClinicChatService.getMessages(lastTime)
          .then((newMsgs) => {
            if (newMsgs.length > 0) {
              setClinicChatMessages((prev) => [...prev, ...newMsgs]);
            }
          })
          .catch(() => {});
      } else {
        loadClinicChat();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tab, hasClinic]);

  const handleSendClinicChat = async () => {
    if (!clinicChatInput.trim() || clinicChatSending) return;
    setClinicChatSending(true);
    try {
      const msg = await patientClinicChatService.sendMessage(clinicChatInput.trim());
      setClinicChatMessages((prev) => [...prev, msg]);
      setClinicChatInput('');
    } catch {
      toast.error('Error al enviar el mensaje');
    } finally {
      setClinicChatSending(false);
    }
  };

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
      <div className="max-w-[1200px] mx-auto p-10">
        <LoadingSpinner text="Cargando tu espacio..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gantly-cloud-100 text-gantly-text flex">
      {/* Sidebar */}
      <aside className="w-24 bg-white border-r border-gantly-blue-100 sticky top-0 h-screen flex flex-col items-center pt-2 pb-10 z-40">
        <nav className="flex flex-col gap-4 w-full px-3">
          {[
            { id: 'perfil', icon: 'person', label: 'Perfil', requiresPsych: false },
            { id: 'mi-psicologo', icon: 'medical_services', label: 'Psicólogo', requiresPsych: false },
            { id: 'tareas', icon: 'task_alt', label: 'Tareas', requiresPsych: true },
            { id: 'tests-pendientes', icon: 'assignment', label: 'Tests', requiresPsych: true },
            { id: 'calendario', icon: 'calendar_today', label: 'Calendario', requiresPsych: true },
            { id: 'agenda-personal', icon: 'book', label: 'Agenda', requiresPsych: false },
            { id: 'chat', icon: 'chat', label: 'Chat', requiresPsych: true },
            ...(me?.companyId ? [{ id: 'mensajes-clinica', icon: 'business_messages', label: 'Clínica', requiresPsych: false }] : []),
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
          <header className="bg-gradient-to-r from-gantly-cloud-100 to-white rounded-2xl p-8 lg:p-12 mb-10 relative overflow-hidden border border-slate-100 shadow-card">
            <div className="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-10">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <path
                  className="line-art"
                  d="M150 40 Q180 80 160 120 T100 160 T40 100 Q60 40 150 40"
                  stroke="#2E93CC"
                  fill="none"
                  strokeWidth="1"
                />
                <circle cx="100" cy="100" r="2" fill="#2E93CC" />
              </svg>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="relative">
                <div className="size-28 md:size-32 rounded-full overflow-hidden border-4 border-white shadow-card bg-gantly-blue-50 flex items-center justify-center">
                  {me?.avatarUrl ? (
                    <img
                      src={me.avatarUrl}
                      alt={me.name || 'Usuario'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl md:text-4xl text-gantly-text font-semibold">
                      {me?.name ? me.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-2">
                  Hola,{' '}
                  <span className="italic text-gantly-blue-500">
                    {me?.name || 'tu espacio emocional'}.
                  </span>
                </h1>
                <p className="text-gantly-muted/70 font-light mb-4">
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
                    setTab('configuracion');
                  }}
                  className="px-4 py-2 rounded-full border border-gantly-blue-200 text-sm text-gantly-blue-600 hover:bg-gantly-blue-500 hover:text-white transition inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">settings</span>
                  Configuracion
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Vista PERFIL: tarjetas resumen como en el diseno */}
        {tab === 'perfil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna izquierda */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                <button
                  type="button"
                  onClick={() => setTab('mis-estadisticas')}
                  className="bg-white p-8 rounded-2xl border border-slate-100 shadow-card hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-6xl text-gantly-blue-400">
                      monitoring
                    </span>
                  </div>
                  <div className="size-12 bg-gantly-blue-50 flex items-center justify-center rounded-2xl text-gantly-blue-500 mb-6">
                    <span className="material-symbols-outlined">bar_chart</span>
                  </div>
                  <h3 className="text-2xl font-normal mb-1">Mis estadisticas</h3>
                  <p className="text-sm text-gantly-muted/60 font-light">
                    Tu progreso en el tiempo
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('evaluaciones')}
                  className="bg-white p-8 rounded-2xl border border-slate-100 shadow-card hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-6xl text-gantly-blue-400">
                      edit_note
                    </span>
                  </div>
                  <div className="size-12 bg-gantly-blue-50 flex items-center justify-center rounded-2xl text-gantly-blue-500 mb-6">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <h3 className="text-2xl font-normal mb-1">Evaluaciones</h3>
                  <p className="text-sm text-gantly-muted/60 font-light">Tests de evaluacion</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('descubrimiento')}
                  className="bg-white p-8 rounded-2xl border border-slate-100 shadow-card hover:-translate-y-1 transition-transform duration-300 text-left relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-6xl text-gantly-blue-400">
                      search_insights
                    </span>
                  </div>
                  <div className="size-12 bg-gantly-blue-50 flex items-center justify-center rounded-2xl text-gantly-blue-500 mb-6">
                    <span className="material-symbols-outlined">travel_explore</span>
                  </div>
                  <h3 className="text-2xl font-normal mb-1">Descubrimiento</h3>
                  <p className="text-sm text-gantly-muted/60 font-light">Explora nuevos insights</p>
                </button>
              </div>

              {/* Tareas y tests pendientes */}
              <div className="grid md:grid-cols-2 gap-8">
                <button
                  type="button"
                  onClick={() => setTab('tareas')}
                  className="bg-white p-10 rounded-2xl border border-slate-100 shadow-card text-left hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gantly-muted/40">
                      Tareas pendientes
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-heading italic text-gantly-text">
                      {tasks.filter((t) => !t.completedAt).length}
                    </span>
                    <span className="text-gantly-muted font-light">pendiente(s)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('tests-pendientes')}
                  className="bg-white p-10 rounded-2xl border border-slate-100 shadow-card text-left hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gantly-muted/40">
                      Tests pendientes
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-heading italic text-gantly-text">
                      {assignedTests.filter((t) => !t.completedAt).length}
                    </span>
                    <span className="text-gantly-muted font-light">pendiente(s)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Columna derecha: proxima cita */}
            <div className="lg:col-span-1">
              <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-card h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-gantly-gold-500 text-sm">
                    alarm
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gantly-muted/40">
                    Proxima cita
                  </span>
                </div>

                {upcomingAppointment ? (
                  <div className="bg-gantly-gold-50 rounded-2xl p-8 flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <h4 className="text-3xl font-normal mb-4 text-gantly-text">
                        {new Date(upcomingAppointment.startTime).toLocaleDateString(
                          'es-ES',
                          {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          },
                        )}
                      </h4>
                      <div className="space-y-3 text-gantly-muted">
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
                              Sesion con {upcomingAppointment.psychologist.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {upcomingAppointment.paymentStatus === 'PAID' ? (
                    <>
                    <div className="mt-6 pt-4 border-t border-gantly-gold-200 text-sm">
                      <p className="text-gantly-gold-700 font-semibold">
                        Podras iniciar la videollamada 1 hora antes
                      </p>
                    </div>

                    <button
                      type="button"
                      className="mt-8 w-full py-3 bg-gantly-blue-500 text-white rounded-full font-medium hover:bg-gantly-blue-600 transition-all shadow-glow-blue text-sm"
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
                    <div className="mt-6 pt-4 border-t border-gantly-gold-200 text-sm">
                      <p className="text-gantly-gold-700 font-semibold">
                        Debes completar el pago antes de poder acceder a la videollamada
                      </p>
                    </div>
                    )}

                    <button
                      type="button"
                      className="mt-4 w-full py-2 text-sm text-gantly-muted hover:text-gantly-text font-medium transition underline underline-offset-2"
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
                  <div className="bg-gantly-cloud-200 rounded-2xl p-8 flex-1 flex flex-col justify-center text-gantly-muted/70 text-sm">
                    No tienes ninguna cita proxima.
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 rounded-full border border-gantly-blue-200 text-gantly-blue-600 text-xs font-medium hover:bg-gantly-blue-500 hover:text-white transition"
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
          <div className="w-full">
            <ChatWidget mode="USER" />
          </div>
        )}

        {/* Mi Psicologo - estilo nuevo pero con funcionalidades antiguas */}
        {tab === 'mi-psicologo' && !showMatchingTest && !showMatchingResults && (
          <div className="mt-10 bg-white rounded-2xl p-8 border border-slate-100 shadow-card">
            {psych?.status === 'ASSIGNED' ? (
              <>
                {/* Menor con consentimiento pendiente: bloquear hasta firmar */}
                {hasPsychologist && isMinor && (loadingConsents || pendingConsents.length > 0) ? (
                  <div className="space-y-6">
                    {loadingConsents ? (
                      <LoadingSpinner text="Cargando consentimiento..." />
                    ) : (
                      <>
                        <div className="p-6 rounded-2xl bg-gantly-gold-50 border border-gantly-gold-200">
                          <h3 className="text-xl font-semibold text-gantly-gold-800 mb-2">
                            Consentimiento requerido (menores de 18 anos)
                          </h3>
                          <p className="text-sm text-gantly-gold-700 mb-4">
                            Tu psicologo te ha enviado un documento de consentimiento. Debes leerlo y firmarlo para continuar.
                          </p>
                        </div>
                        {pendingConsents.map((c: any) => (
                          <div key={c.id} className="rounded-2xl border border-gantly-blue-100 overflow-hidden">
                            <div className="p-4 bg-gantly-blue-50 border-b border-gantly-blue-100">
                              <span className="font-medium text-gantly-text">{c.documentTitle || 'Consentimiento'}</span>
                            </div>
                            <div className="p-6 max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm text-gantly-text">
                              {c.renderedContent || 'Sin contenido.'}
                            </div>
                            <div className="p-4 bg-gantly-cloud-100 border-t border-gantly-blue-100 flex flex-col sm:flex-row gap-3">
                              <input
                                type="text"
                                value={signingConsentId === c.id ? signerNameForConsent : ''}
                                onChange={(e) => setSignerNameForConsent(e.target.value)}
                                placeholder="Nombre del firmante (ej. padre/madre/tutor o el menor)"
                                className="flex-1 px-4 py-3 rounded-xl border border-gantly-blue-100 focus:ring-2 focus:ring-gantly-blue-200 outline-none"
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
                                className="px-6 py-3 rounded-xl bg-gantly-blue-500 text-white font-medium hover:bg-gantly-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-card flex items-center justify-center bg-gantly-blue-50">
                    {psych.psychologist?.avatarUrl ? (
                      <img
                        src={psych.psychologist.avatarUrl}
                        alt={psych.psychologist.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-3xl text-gantly-text">
                        {(psych.psychologist?.name || 'P')[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-normal text-gantly-text mb-1">
                      {psych.psychologist?.name}
                    </h2>
                    <p className="text-gantly-muted/70 text-sm mb-4">
                      {psych.psychologist?.email}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gantly-blue-200 text-sm text-gantly-blue-600 hover:bg-gantly-blue-500 hover:text-white transition"
                      onClick={() =>
                        loadPsychologistProfile(psych.psychologist.id)
                      }
                    >
                      Ver perfil completo
                    </button>
                  </div>
                </div>

                {/* Citas pasadas con este psicologo (cards uniformes + valoracion) */}
                <div className="mt-6">
                  <h3 className="text-xl font-medium text-gantly-text mb-3">
                    Mis citas pasadas
                  </h3>
                  {loadingPastAppointments ? (
                    <LoadingSpinner text="Cargando citas pasadas..." />
                  ) : pastAppointments.length === 0 ? (
                    <p className="text-gantly-muted/70 text-sm">
                      Aun no tienes citas pasadas con tu psicologo.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {pastAppointments.map((apt: any) => {
                        const hasRating = !!apt.rating;
                        const comment = apt.rating?.comment || '';
                        return (
                          <div
                            key={apt.id}
                            className="rounded-2xl px-6 py-4 shadow-soft bg-gantly-cloud-100 border border-gantly-blue-100 flex items-center justify-between gap-6"
                          >
                            {/* Columna izquierda: fecha y hora */}
                            <div className="flex-1">
                              <div className="text-sm text-gantly-muted/70 font-heading">
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
                              <div className="text-xs text-gantly-text font-medium mt-0.5">
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
                                        ? 'text-gantly-gold-400'
                                        : 'text-gray-300'
                                    }
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <p className="min-h-[28px] text-[11px] text-gantly-muted/80 italic text-center flex items-center justify-center">
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
                <h3 className="text-xl font-semibold text-gantly-text mb-2">
                  Encuentra tu psicologo ideal
                </h3>
                <p className="text-gantly-muted/70 mb-6">
                  Completa el test de matching para encontrar psicologos que se adapten a tus necesidades, o usa un codigo de referencia si ya tienes un psicologo.
                </p>

                {/* Formulario para usar codigo de referencia */}
                <div className="max-w-md mx-auto mb-8">
                  <div className="bg-gantly-cloud-100 rounded-2xl p-6 border border-gantly-blue-100">
                    <h4 className="text-lg font-medium text-gantly-text mb-3">
                      Tienes un codigo de referencia?
                    </h4>
                    <p className="text-sm text-gantly-muted/70 mb-4">
                      Si un psicologo te ha compartido un codigo o enlace, usalo aqui para unirte directamente a su consulta.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralCodeInput}
                        onChange={(e) => setReferralCodeInput(e.target.value)}
                        placeholder="Codigo de referencia (ej: juan-garcia)"
                        className="flex-1 px-4 py-2 rounded-xl border border-gantly-blue-100 text-gantly-text placeholder:text-gantly-muted/50 focus:outline-none focus:ring-2 focus:ring-gantly-blue-200"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && referralCodeInput.trim()) {
                            handleUseReferralCode();
                          }
                        }}
                      />
                      <button
                        onClick={handleUseReferralCode}
                        disabled={!referralCodeInput.trim() || usingReferralCode}
                        className="px-6 py-2 bg-gantly-blue-500 text-white rounded-xl hover:bg-gantly-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {usingReferralCode ? 'Uniendo...' : 'Usar codigo'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gantly-muted/70 text-sm mb-6 max-w-md mx-auto">
                    O completa nuestro test de matching para encontrar el
                    profesional que mejor se adapte a tus necesidades.
                  </p>
                  <button
                    type="button"
                    className="px-6 py-3 rounded-full bg-gantly-blue-500 text-white text-sm font-semibold hover:bg-gantly-blue-600 transition shadow-glow-blue"
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
          <div className="bg-white rounded-2xl shadow-card p-10 border border-slate-100 mt-10">
            <h3 className="text-2xl font-bold text-gantly-text tracking-tight mb-8">
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
                    className={`rounded-2xl px-6 py-4 shadow-soft border border-gantly-blue-100 transition-all flex items-center justify-between gap-6 bg-gantly-cloud-100 ${
                      at.completedAt
                        ? 'cursor-default'
                        : 'cursor-pointer hover:shadow-card hover:-translate-y-0.5'
                    }`}
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
                      <div className="text-sm text-gantly-blue-600 font-medium">
                        {at.testTitle || at.test?.title || 'Test'}
                      </div>
                      {at.assignedAt && (
                        <div className="text-xs text-gantly-text font-medium mt-0.5">
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
                    <div className="flex-shrink-0 text-sm text-gantly-muted font-medium">
                      {at.completedAt ? 'Completado' : 'Pendiente'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'calendario' && hasPsychologist && (
          <div className="mt-10 bg-white rounded-2xl p-8 border border-slate-100 shadow-card">
            <h2 className="text-2xl font-normal mb-4 text-gantly-text">Calendario</h2>
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
              <div className="mt-10 border-t border-slate-100 pt-8" data-section="mis-citas">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[22px] font-normal text-gantly-text flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-gantly-blue-500">
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
                      : 'bg-gantly-blue-50 text-gantly-muted';

                    const badgeBg = isBooked || isPaid
                      ? 'bg-[#E8F5E9]'
                      : isConfirmed
                      ? 'bg-[#FFF3E0]'
                      : isPending
                      ? 'bg-[#F7F3E6]'
                      : isCancelled
                      ? 'bg-[#F2F2F2]'
                      : 'bg-gantly-blue-50';

                    const badgeIconColor = isBooked || isPaid
                      ? 'text-[#2E7D32]'
                      : isConfirmed
                      ? 'text-[#E65100]'
                      : isPending
                      ? 'text-[#B29D6B]'
                      : isCancelled
                      ? 'text-[#9E9E9E]'
                      : 'text-gantly-blue-500';

                    return (
                      <div
                        key={apt.id}
                        className="rounded-2xl p-8 shadow-soft hover:shadow-card transition-shadow border border-slate-100 flex flex-col min-h-[190px] bg-white"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <p className="text-[10px] tracking-[0.25em] font-bold text-gantly-muted/50 uppercase">
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

                        <h4 className="font-heading text-3xl text-gantly-text mb-1">
                          {new Date(apt.startTime).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </h4>

                        <p className="text-sm text-gantly-muted/70 font-medium mb-10">
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
                          <span className="text-sm text-gantly-muted/80 font-medium">
                            {apt.psychologist?.name || 'Terapia online'}
                          </span>
                          <div className="flex items-center gap-2">
                            {isConfirmed && apt.paymentStatus === 'PENDING' && (
                              <button
                                className="inline-flex items-center justify-center rounded-full px-4 py-1 text-[13px] font-semibold shadow-sm bg-gantly-blue-500 text-white hover:bg-gantly-blue-600 transition-colors cursor-pointer border-none"
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

                <div className="mt-10 flex items-center justify-end border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gantly-text hover:text-gantly-blue-500"
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
              <p className="text-gantly-muted/70 text-sm">
                De momento no hay disponibilidad publicada por tu psicólogo.
              </p>
            )}
          </div>
        )}

        {/* Historial completo de citas */}
        {tab === 'mis-citas' && hasPsychologist && (
          <div className="mt-10 bg-gantly-cloud-100 rounded-2xl p-8 border border-slate-100 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-normal text-gantly-text flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-gantly-blue-500">
                  history
                </span>
                Historial de citas
              </h2>
            </div>

            {loadingPastAppointments ? (
              <LoadingSpinner text="Cargando historial de citas..." />
            ) : pastAppointments.length === 0 ? (
              <p className="text-gantly-muted/70 text-sm">
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
                      : 'bg-gantly-blue-50 text-gantly-muted';

                    const badgeBg = isBooked || isPaid
                      ? 'bg-[#E8F5E9]'
                      : isConfirmed
                      ? 'bg-[#FFF3E0]'
                      : isPending
                      ? 'bg-[#F7F3E6]'
                      : isCancelled
                      ? 'bg-[#F2F2F2]'
                      : 'bg-gantly-blue-50';

                    const badgeIconColor = isBooked || isPaid
                      ? 'text-[#2E7D32]'
                      : isConfirmed
                      ? 'text-[#E65100]'
                      : isPending
                      ? 'text-[#B29D6B]'
                      : isCancelled
                      ? 'text-[#9E9E9E]'
                      : 'text-gantly-blue-500';

                    return (
                      <div
                        key={apt.id}
                        className="rounded-2xl p-8 shadow-soft hover:shadow-card transition-shadow border border-slate-100 flex flex-col min-h-[190px] bg-white"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <p className="text-[10px] tracking-[0.25em] font-bold text-gantly-muted/50 uppercase">
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

                        <h4 className="font-heading text-2xl text-gantly-text mb-1">
                          {new Date(apt.startTime).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </h4>

                        <p className="text-sm text-gantly-muted/70 font-medium mb-8">
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
                          <span className="text-sm text-gantly-muted/80 font-medium">
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

        {/* Mensajes Clinica */}
        {tab === 'mensajes-clinica' && hasClinic && (
          <div className="mt-10 bg-white rounded-2xl p-8 border border-slate-100 shadow-card">
            <h2 className="text-2xl font-normal mb-6 flex items-center gap-2 text-gantly-text">
              <span className="material-symbols-outlined text-xl text-gantly-blue-500">business_messages</span>
              Mensajes de tu clinica
            </h2>

            {clinicChatLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gantly-blue-100 border-t-gantly-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Messages list */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto mb-6 pr-2">
                  {clinicChatMessages.length === 0 ? (
                    <p className="text-gantly-muted/60 text-sm text-center py-8">
                      No hay mensajes todavia. Escribe el primer mensaje a tu clinica.
                    </p>
                  ) : (
                    clinicChatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'PATIENT' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            msg.sender === 'PATIENT'
                              ? 'bg-gantly-blue-500 text-white rounded-br-md'
                              : 'bg-gantly-cloud-200 text-gantly-text rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender === 'PATIENT' ? 'text-white/60' : 'text-gantly-muted/50'}`}>
                            {new Date(msg.createdAt).toLocaleString('es-ES', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-3">
                  <textarea
                    value={clinicChatInput}
                    onChange={(e) => setClinicChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendClinicChat();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    rows={2}
                    className="flex-1 px-4 py-3 rounded-xl border border-gantly-blue-100 text-gantly-text placeholder-gantly-muted/50 focus:outline-none focus:ring-2 focus:ring-gantly-blue-200 resize-none"
                  />
                  <button
                    onClick={handleSendClinicChat}
                    disabled={!clinicChatInput.trim() || clinicChatSending}
                    className="px-5 py-3 bg-gantly-blue-500 text-white rounded-xl font-medium hover:bg-gantly-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    {clinicChatSending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-lg">send</span>
                    )}
                  </button>
                </div>
              </>
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

