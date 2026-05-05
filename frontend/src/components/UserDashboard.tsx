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
import LogoSvg from '../assets/logo-gantly.svg';


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
  // Mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      toast.error('Error al cargar tu panel. Intenta recargar la pagina.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      toast.error('Por favor ingresa un codigo de referencia');
      return;
    }

    try {
      setUsingReferralCode(true);
      const result = await profileService.useReferralCode(referralCodeInput.trim());
      toast.success(result.message || 'Te has unido correctamente a la consulta');
      setReferralCodeInput('');
      // Recargar datos para actualizar el estado del psicologo
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al usar el codigo de referencia');
    } finally {
      setUsingReferralCode(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    loadData();
  }, []);

  // Gestionar parametros de retorno de Stripe
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

  // Cargar historial cuando se entra en Mi Psicologo
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
        'Error al cargar el perfil del psicólogo:' +
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
      toast.error('Por favor selecciona una valoracion entre 1 y 5 estrellas');
      return;
    }
    try {
      setSubmittingRating(true);
      await calendarService.rateAppointment(
        appointmentId,
        ratingAppointment,
        ratingComment || undefined,
      );
      toast.success('Valoracion guardada exitosamente');
      setRatingAppointment(null);
      setRatingComment('');
      await loadPastAppointments();
    } catch (err: any) {
      toast.error(
        'Error al guardar la valoracion: ' +
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

  // Cargar disponibilidad cuando se entra en la pestana de calendario
  useEffect(() => {
    if (tab === 'calendario' && hasPsychologist) {
      loadAvailability();
    }
  }, [tab, hasPsychologist]);

  // Cargar historial cuando se entra en la pestana mis-citas
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <LoadingSpinner text="Cargando tu espacio..." />
      </div>
    );
  }

  const sidebarItems = [
    { id: 'perfil', icon: 'home', label: 'Inicio', requiresPsych: false },
    { id: 'mi-psicologo', icon: 'psychology', label: 'Psicólogo', requiresPsych: false },
    { id: 'tareas', icon: 'task_alt', label: 'Tareas', requiresPsych: true },
    { id: 'tests-pendientes', icon: 'assignment', label: 'Tests', requiresPsych: true },
    { id: 'calendario', icon: 'calendar_today', label: 'Calendario', requiresPsych: true },
    { id: 'agenda-personal', icon: 'book', label: 'Agenda', requiresPsych: false },
    { id: 'mis-estadisticas', icon: 'bar_chart', label: 'Estadísticas', requiresPsych: false },
    { id: 'evaluaciones', icon: 'description', label: 'Evaluaciones', requiresPsych: false },
    { id: 'descubrimiento', icon: 'explore', label: 'Descubrir', requiresPsych: false },
    { id: 'chat', icon: 'chat', label: 'Chat', requiresPsych: true },
    ...(me?.companyId ? [{ id: 'mensajes-clinica', icon: 'business', label: 'Clínica', requiresPsych: false }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-60 bg-gradient-to-b from-gantly-navy to-gantly-navy-600 flex-col fixed top-0 left-0 h-screen z-40">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <img src={LogoSvg} alt="Gantly" className="h-7 brightness-0 invert" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          {sidebarItems.map((item) => {
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
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-gantly-blue/20 text-white border-l-2 border-l-gantly-cyan font-semibold'
                    : isDisabled
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-white hover:bg-white/10'
                }`}
                title={isDisabled ? 'Requiere psicólogo asignado' : undefined}
              >
                <span className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-white font-semibold">
                  {me?.name ? me.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{me?.name || 'Usuario'}</p>
              <p className="text-xs text-slate-400 truncate">{me?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.reload();
            }}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors duration-200 w-full px-1"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-gantly-navy to-gantly-navy-600 flex flex-col">
            <div className="px-6 py-6 border-b border-white/10">
              <img src={LogoSvg} alt="Gantly" className="h-7 brightness-0 invert" />
            </div>
            <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
              {sidebarItems.map((item) => {
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
                        setMobileMenuOpen(false);
                        return;
                      }
                      setTab(item.id as Tab);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-gantly-blue/20 text-white border-l-2 border-l-gantly-cyan font-semibold'
                        : isDisabled
                        ? 'text-slate-600 cursor-not-allowed opacity-50'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  window.location.reload();
                }}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors duration-200"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="material-symbols-outlined text-slate-600">menu</span>
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              {sidebarItems.find(i => i.id === tab)?.label || 'Panel'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-200 relative">
              <span className="material-symbols-outlined text-slate-500 text-xl">notifications</span>
            </button>
          </div>
        </nav>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/50 flex justify-around py-2 px-1 md:hidden z-30">
          {sidebarItems.slice(0, 5).map((item) => {
            const isActive = tab === item.id;
            const isDisabled = item.requiresPsych && !hasPsychologist;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) {
                    toast.error('Necesitas psicólogo asignado');
                    setTab('mi-psicologo');
                    return;
                  }
                  setTab(item.id as Tab);
                }}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg cursor-pointer transition-colors duration-200 ${
                  isActive ? 'text-gantly-blue' : isDisabled ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <main className="flex-1 p-6 md:p-8 pb-20 md:pb-8 overflow-x-hidden">
          {/* Vista PERFIL */}
          {tab === 'perfil' && (
            <div className="space-y-6">
              {/* Hero welcome — compact asymmetric */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Main greeting — spans 7 cols */}
                <div className="lg:col-span-7 relative overflow-hidden rounded-3xl p-7 md:p-9 shadow-2xl shadow-gantly-blue/15" style={{ background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 30%, #48C6D4 65%, #78D4B0 100%)' }}>
                  <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
                  <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gantly-cyan/10 rounded-full blur-xl" />
                  <div className="relative z-10 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-xl shadow-black/20 flex-shrink-0 bg-white/10 flex items-center justify-center">
                      {me?.avatarUrl ? (
                        <img src={me.avatarUrl} alt={me.name || 'Usuario'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl text-white font-heading font-bold">{me?.name ? me.name.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl md:text-3xl font-heading font-bold text-white truncate">
                        Buenos días, {me?.name?.split(' ')[0] || 'usuario'}
                      </h1>
                      <p className="text-white/70 mt-1 text-sm font-body truncate">
                        {upcomingAppointment
                          ? `Próxima cita: ${new Date(upcomingAppointment.startTime).toLocaleDateString('es-ES', { weekday: 'long' })} ${new Date(upcomingAppointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Tu espacio de bienestar'}
                      </p>
                      <div className="flex flex-wrap gap-2.5 mt-4">
                        <button
                          type="button"
                          onClick={() => setTab('calendario')}
                          className="bg-white text-gantly-text hover:bg-white/90 rounded-xl px-4 py-2 text-sm font-heading font-semibold cursor-pointer transition-all duration-200 shadow-lg shadow-black/10 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">calendar_today</span>
                          Calendario
                        </button>
                        {hasPsychologist && (
                          <button
                            type="button"
                            onClick={() => setTab('chat')}
                            className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-heading font-semibold cursor-pointer transition-all duration-200 border border-white/20 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base">chat</span>
                            Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointment spotlight — spans 5 cols */}
                <div className="lg:col-span-5 relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gantly-emerald/5 to-transparent rounded-bl-full" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gantly-emerald/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gantly-emerald text-lg">event_available</span>
                      </div>
                      <span className="text-xs font-body font-semibold text-gantly-emerald uppercase tracking-wider">Próxima cita</span>
                    </div>
                    {upcomingAppointment ? (
                      <>
                        <p className="text-2xl font-heading font-bold text-gantly-text">
                          {new Date(upcomingAppointment.startTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm text-gantly-muted mt-1 font-body">
                          {new Date(upcomingAppointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {upcomingAppointment.psychologist && <span className="ml-1">· {upcomingAppointment.psychologist.name}</span>}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base font-heading font-semibold text-gantly-text">Sin citas programadas</p>
                        <p className="text-sm text-gantly-muted mt-1 font-body">Agenda una sesión cuando lo necesites</p>
                      </>
                    )}
                  </div>
                  <div className="relative mt-4">
                    {upcomingAppointment?.paymentStatus === 'PAID' ? (
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 bg-gantly-emerald text-white text-sm font-heading font-semibold rounded-xl cursor-pointer hover:shadow-lg hover:shadow-gantly-emerald/25 transition-all duration-300 flex items-center justify-center gap-2"
                        onClick={async () => {
                          const apt = upcomingAppointment;
                          if (me && apt?.psychologist) {
                            try {
                              const roomInfo = await jitsiService.getRoomInfo(apt.psychologist.email);
                              setVideoCallRoom(roomInfo.roomName);
                              setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                              setShowVideoCall(true);
                            } catch (error: any) {
                              toast.error(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                            }
                          }
                        }}
                      >
                        <span className="material-symbols-outlined text-base">videocam</span>
                        Unirse a la llamada
                      </button>
                    ) : upcomingAppointment ? (
                      <div className="w-full px-4 py-2.5 bg-gantly-gold/10 text-gantly-gold-700 text-sm font-body font-medium rounded-xl text-center border border-gantly-gold/20">
                        Pago pendiente
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTab('calendario')}
                        className="w-full px-4 py-2.5 bg-gantly-cloud text-gantly-blue text-sm font-heading font-semibold rounded-xl cursor-pointer hover:bg-gantly-blue hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        Agendar cita
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Asymmetric bento — varied card sizes */}
              <div className="grid grid-cols-6 lg:grid-cols-12 gap-5">
                {/* Tasks — large horizontal card spanning 7 cols */}
                <button
                  type="button"
                  onClick={() => setTab('tareas')}
                  className="col-span-6 lg:col-span-7 group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-gantly-blue/10 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-blue/30 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gantly-blue/[0.02] to-transparent" />
                  <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-gantly-blue/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gantly-blue to-gantly-cyan flex items-center justify-center shadow-lg shadow-gantly-blue/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                      <span className="material-symbols-outlined text-white text-2xl">task_alt</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-heading font-extrabold text-gantly-text">{tasks.filter((t) => !t.completedAt).length}</span>
                        <span className="text-sm font-body text-gantly-muted">tareas pendientes</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gantly-cloud rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-gantly-blue to-gantly-cyan rounded-full transition-all duration-500"
                            style={{ width: `${tasks.length > 0 ? (tasks.filter((t) => t.completedAt).length / tasks.length) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-body text-gantly-muted whitespace-nowrap">
                          {tasks.filter((t) => t.completedAt).length}/{tasks.length} completadas
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gantly-muted/40 text-2xl group-hover:text-gantly-blue group-hover:translate-x-1 transition-all duration-300">arrow_forward</span>
                  </div>
                </button>

                {/* Tests + Settings stacked — 5 cols */}
                <div className="col-span-6 lg:col-span-5 grid grid-rows-2 gap-5">
                  <button
                    type="button"
                    onClick={() => setTab('tests-pendientes')}
                    className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-gantly-gold/10 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-gold/30 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gantly-gold/5 rounded-bl-[2rem] group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gantly-gold flex items-center justify-center shadow-md shadow-gantly-gold/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <span className="material-symbols-outlined text-gantly-navy text-lg">assignment</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-2xl font-heading font-extrabold text-gantly-text">{assignedTests.filter((t) => !t.completedAt).length}</span>
                        <p className="text-xs text-gantly-muted font-body font-medium">Tests pendientes</p>
                      </div>
                      <span className="material-symbols-outlined text-gantly-muted/30 group-hover:text-gantly-gold-600 transition-colors">chevron_right</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('configuracion')}
                    className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-gantly-navy/5 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gantly-navy/20 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gantly-navy/[0.03] rounded-bl-[2rem] group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gantly-navy flex items-center justify-center shadow-md shadow-gantly-navy/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-lg">settings</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-heading font-bold text-gantly-text">Configuración</span>
                        <p className="text-xs text-gantly-muted font-body font-medium">Ajustes de cuenta</p>
                      </div>
                      <span className="material-symbols-outlined text-gantly-muted/30 group-hover:text-gantly-navy transition-colors">chevron_right</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Explore section — asymmetric 3-card layout */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-gantly-blue to-gantly-cyan" />
                  <h3 className="text-lg font-heading font-bold text-gantly-text">Explora</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Featured card — statistics (wider) */}
                  <button
                    type="button"
                    onClick={() => setTab('mis-estadisticas')}
                    className="md:col-span-5 group relative rounded-2xl p-7 border border-gantly-blue/10 hover:border-gantly-blue/30 hover:shadow-xl hover:shadow-gantly-blue/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, #F0F8FF 0%, #ffffff 40%, #ECFEFF 100%)' }}
                  >
                    <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-gantly-blue/5 rounded-full group-hover:scale-[2] transition-transform duration-700" />
                    <div className="absolute top-4 right-4 w-20 h-20 border border-gantly-blue/10 rounded-full group-hover:scale-125 group-hover:rotate-45 transition-all duration-700" />
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gantly-blue to-gantly-cyan flex items-center justify-center shadow-lg shadow-gantly-blue/20 group-hover:rotate-6 transition-transform duration-300">
                        <span className="material-symbols-outlined text-white text-xl">bar_chart</span>
                      </div>
                      <h3 className="text-lg font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-blue transition-colors">Mis estadísticas</h3>
                      <p className="text-sm text-gantly-muted mt-1 font-body leading-relaxed">Visualiza tu progreso y bienestar a lo largo del tiempo</p>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gantly-blue font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                        Ver progreso <span className="material-symbols-outlined text-sm">trending_up</span>
                      </span>
                    </div>
                  </button>

                  {/* Evaluaciones — medium */}
                  <button
                    type="button"
                    onClick={() => setTab('evaluaciones')}
                    className="md:col-span-4 group relative bg-white rounded-2xl p-7 border border-gantly-gold/10 hover:border-gantly-gold/30 hover:shadow-xl hover:shadow-gantly-gold/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
                  >
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-gantly-gold/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700" />
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gantly-gold flex items-center justify-center shadow-lg shadow-gantly-gold/20 group-hover:rotate-6 transition-transform duration-300">
                        <span className="material-symbols-outlined text-gantly-navy text-xl">description</span>
                      </div>
                      <h3 className="text-base font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-gold-700 transition-colors">Evaluaciones</h3>
                      <p className="text-sm text-gantly-muted mt-1 font-body">Tests clínicos y resultados</p>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gantly-gold-700 font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                        Completar <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </button>

                  {/* Descubrimiento — narrow, taller feel */}
                  <button
                    type="button"
                    onClick={() => setTab('descubrimiento')}
                    className="md:col-span-3 group relative bg-white rounded-2xl p-7 border border-gantly-emerald/10 hover:border-gantly-emerald/30 hover:shadow-xl hover:shadow-gantly-emerald/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left overflow-hidden"
                  >
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gantly-emerald/[0.03] to-transparent rounded-b-2xl" />
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gantly-emerald flex items-center justify-center shadow-lg shadow-gantly-emerald/20 group-hover:rotate-6 transition-transform duration-300">
                        <span className="material-symbols-outlined text-white text-xl">explore</span>
                      </div>
                      <h3 className="text-base font-heading font-bold text-gantly-text mt-4 group-hover:text-gantly-emerald transition-colors">Descubrir</h3>
                      <p className="text-sm text-gantly-muted mt-1 font-body">Insights personalizados</p>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gantly-emerald font-heading font-semibold mt-4 group-hover:gap-3 transition-all">
                        Explorar <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Configuracion */}
          {tab === 'configuracion' && (
            <UserSettingsTab
              me={me}
              onBack={() => setTab('perfil')}
              onMeUpdate={(updated) => setMe(updated)}
            />
          )}

          {/* Mis estadisticas */}
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

          {/* Mi Psicologo */}
          {tab === 'mi-psicologo' && !showMatchingTest && !showMatchingResults && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              {psych?.status === 'ASSIGNED' ? (
                <>
                  {/* Menor con consentimiento pendiente */}
                  {hasPsychologist && isMinor && (loadingConsents || pendingConsents.length > 0) ? (
                    <div className="space-y-6">
                      {loadingConsents ? (
                        <LoadingSpinner text="Cargando consentimiento..." />
                      ) : (
                        <>
                          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                            <h3 className="text-lg font-semibold text-amber-800 mb-2">
                              Consentimiento requerido (menores de 18 anos)
                            </h3>
                            <p className="text-sm text-amber-700">
                              Tu psicólogo te ha enviado un documento de consentimiento. Debes leerlo y firmarlo para continuar.
                            </p>
                          </div>
                          {pendingConsents.map((c: any) => (
                            <div key={c.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                              <div className="p-4 bg-slate-50 border-b border-slate-200">
                                <span className="font-medium text-slate-800">{c.documentTitle || 'Consentimiento'}</span>
                              </div>
                              <div className="p-6 max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
                                {c.renderedContent || 'Sin contenido.'}
                              </div>
                              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                                <input
                                  type="text"
                                  value={signingConsentId === c.id ? signerNameForConsent : ''}
                                  onChange={(e) => setSignerNameForConsent(e.target.value)}
                                  placeholder="Nombre del firmante (ej. padre/madre/tutor o el menor)"
                                  className="flex-1 h-12 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
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
                                  className="bg-gantly-blue hover:shadow-lg hover:shadow-gantly-blue/25 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {/* Psychologist profile hero */}
                  <div className="rounded-2xl overflow-hidden mb-6 border border-slate-100">
                    <div className="h-1.5 bg-gradient-to-r from-gantly-blue via-gantly-cyan to-gantly-emerald"></div>
                    <div className="p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 30%, #48C6D4 65%, #78D4B0 100%)' }}>
                      <div className="flex flex-col md:flex-row items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 ring-4 ring-white/20 shadow-lg">
                          {psych.psychologist?.avatarUrl ? (
                            <img
                              src={psych.psychologist.avatarUrl}
                              alt={psych.psychologist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl text-white font-heading font-bold">
                              {(psych.psychologist?.name || 'P')[0]}
                            </span>
                          )}
                        </div>
                        <div className="text-center md:text-left flex-1">
                          <h2 className="text-2xl font-heading font-bold text-white mb-1">
                            {psych.psychologist?.name}
                          </h2>
                          <p className="text-sm font-body text-white/70 mb-3">
                            {psych.psychologist?.email}
                          </p>
                          <button
                            type="button"
                            className="text-sm bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-heading font-semibold cursor-pointer hover:bg-white/30 transition-all duration-200 border border-white/20"
                            onClick={() =>
                              loadPsychologistProfile(psych.psychologist.id)
                            }
                          >
                            Ver perfil completo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Past appointments — Premium */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-gantly-blue/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-gantly-blue text-sm">history</span>
                        </span>
                        Mis citas pasadas
                      </h3>
                      {!loadingPastAppointments && pastAppointments.length > 0 && (
                        <span className="text-xs font-heading font-bold text-gantly-blue bg-gantly-blue/10 px-2.5 py-1 rounded-full">
                          {pastAppointments.length} {pastAppointments.length === 1 ? 'cita' : 'citas'}
                        </span>
                      )}
                    </div>
                    {loadingPastAppointments ? (
                      <LoadingSpinner text="Cargando citas pasadas..." />
                    ) : pastAppointments.length === 0 ? (
                      <div className="text-center py-10 bg-gantly-cloud/30 rounded-xl border-2 border-dashed border-slate-200">
                        <span className="material-symbols-outlined text-3xl text-gantly-muted/40 mb-2 block">event_busy</span>
                        <p className="text-sm font-body text-gantly-muted">
                          Aún no tienes citas pasadas con tu psicólogo.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pastAppointments.map((apt: any) => {
                          const hasRating = !!apt.rating;
                          const comment = apt.rating?.comment || '';
                          return (
                            <div
                              key={apt.id}
                              className="bg-gantly-cloud/40 rounded-xl p-4 border border-slate-100 hover:border-gantly-blue/20 hover:shadow-sm transition-all duration-200 group"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gantly-blue/15 transition-all duration-200">
                                    <span className="material-symbols-outlined text-gantly-blue text-lg">event</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-body font-semibold text-gantly-text">
                                      {new Date(apt.startTime).toLocaleDateString(
                                        'es-ES',
                                        {
                                          weekday: 'long',
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                        },
                                      )}
                                    </p>
                                    <p className="text-xs font-body text-gantly-muted mt-0.5 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                                      {new Date(apt.startTime).toLocaleTimeString(
                                        'es-ES',
                                        { hour: '2-digit', minute: '2-digit' },
                                      )}{' '}
                                      -{' '}
                                      {new Date(apt.endTime).toLocaleTimeString(
                                        'es-ES',
                                        { hour: '2-digit', minute: '2-digit' },
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`text-sm ${
                                          hasRating && star <= apt.rating.rating
                                            ? 'text-gantly-gold'
                                            : 'text-slate-200'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  {hasRating && comment && (
                                    <p className="text-[11px] font-body text-gantly-muted italic max-w-[160px] truncate">
                                      &ldquo;{comment}&rdquo;
                                    </p>
                                  )}
                                  {!hasRating && (
                                    <span className="text-[10px] font-body text-gantly-muted/60">Sin valorar</span>
                                  )}
                                </div>
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
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #1B6FA0, #2E93CC)' }}>
                    <span className="material-symbols-outlined text-white text-3xl">psychology</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-gantly-text mb-2">
                    Encuentra tu psicólogo ideal
                  </h3>
                  <p className="text-sm font-body text-gantly-muted mb-8 max-w-md mx-auto">
                    Completa el test de matching para encontrar psicólogos que se adapten a tus necesidades, o usa un código de referencia si ya tienes un psicólogo.
                  </p>

                  {/* Referral code form */}
                  <div className="max-w-md mx-auto mb-8">
                    <div className="bg-gantly-cloud/50 rounded-2xl p-6 border border-slate-100">
                      <h4 className="text-base font-heading font-semibold text-gantly-text mb-2">
                        ¿Tienes un código de referencia?
                      </h4>
                      <p className="text-sm font-body text-gantly-muted mb-4">
                        Si un psicólogo te ha compartido un código o enlace, úsalo aquí para unirte directamente a su consulta.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={referralCodeInput}
                          onChange={(e) => setReferralCodeInput(e.target.value)}
                          placeholder="Código de referencia (ej: juan-garcia)"
                          className="flex-1 h-12 rounded-xl border-2 border-slate-200 px-4 focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue outline-none transition-all duration-200 text-sm font-body"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && referralCodeInput.trim()) {
                              handleUseReferralCode();
                            }
                          }}
                        />
                        <button
                          onClick={handleUseReferralCode}
                          disabled={!referralCodeInput.trim() || usingReferralCode}
                          className="bg-gantly-blue text-white px-5 py-3 rounded-xl font-heading font-semibold cursor-pointer hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {usingReferralCode ? 'Uniendo...' : 'Usar código'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-body text-gantly-muted mb-4 max-w-md mx-auto">
                      O completa nuestro test de matching para encontrar el
                      profesional que mejor se adapte a tus necesidades.
                    </p>
                    <button
                      type="button"
                      className="bg-gantly-blue text-white px-6 py-3 rounded-xl font-heading font-semibold cursor-pointer hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20 hover:shadow-xl hover:shadow-gantly-blue/25 transition-all duration-200"
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
            <div>
              <PatientMatchingTest
                onComplete={() => {
                  setShowMatchingTest(false);
                  setShowMatchingResults(true);
                }}
                onBack={() => setShowMatchingTest(false)}
              />
            </div>
          )}

          {/* Resultados del Matching */}
          {tab === 'mi-psicologo' && showMatchingResults && (
            <div>
              <MatchingPsychologists
                onSelect={async () => {
                  setShowMatchingResults(false);
                  try {
                    const psychData = await profileService.myPsychologist();
                    setPsych(psychData);
                  } catch (e) {
                    window.location.reload();
                  }
                }}
                onBack={() => {
                  setShowMatchingResults(false);
                }}
              />
            </div>
          )}

          {/* Perfil completo del psicologo */}
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
            <div>
              {/* Header with summary */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gantly-gold/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gantly-gold text-xl">assignment</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-gantly-text">Tests asignados</h2>
                    {assignedTests.length > 0 && (
                      <p className="text-sm font-body text-gantly-muted mt-0.5">
                        {assignedTests.filter((t: any) => !t.completedAt).length} pendientes · {assignedTests.filter((t: any) => t.completedAt).length} completados
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {assignedTests.length === 0 ? (
                <div className="bg-gantly-cloud rounded-2xl border border-gantly-blue/10 p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="material-symbols-outlined text-3xl text-gantly-muted">assignment</span>
                  </div>
                  <EmptyState
                    title="No hay tests pendientes"
                    description="Aún no tienes tests asignados. Tu psicólogo te asignará tests aquí."
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pending tests first */}
                  {assignedTests.filter((t: any) => !t.completedAt).length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-5 rounded-full bg-gantly-gold" />
                        <span className="text-xs font-body font-semibold text-gantly-muted uppercase tracking-widest">Pendientes</span>
                      </div>
                      <div className="space-y-3">
                        {assignedTests.filter((t: any) => !t.completedAt).map((at: any) => (
                          <div
                            key={at.id}
                            className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-l-[3px] border-l-gantly-gold hover:shadow-lg hover:shadow-gantly-blue/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                            onClick={async () => {
                              if (at.testId || at.test?.id) {
                                const testId = at.testId || at.test?.id;
                                try {
                                  if (onStartTest) {
                                    onStartTest(testId);
                                  }
                                } catch (error) {
                                  toast.error('Error al iniciar el test. Por favor intenta de nuevo.');
                                }
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-gantly-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gantly-gold/20 transition-colors duration-300">
                                  <span className="material-symbols-outlined text-gantly-gold text-lg">quiz</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-heading font-semibold text-gantly-text group-hover:text-gantly-blue transition-colors truncate">
                                    {at.testTitle || at.test?.title || 'Test'}
                                  </p>
                                  {at.assignedAt && (
                                    <p className="text-xs font-body text-gantly-muted mt-0.5">
                                      Asignado el {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-heading font-semibold bg-gantly-gold/10 text-gantly-gold px-2.5 py-1 rounded-full">Pendiente</span>
                                <span className="bg-gantly-blue text-white px-4 py-2 rounded-xl font-heading font-semibold text-sm hover:shadow-lg hover:shadow-gantly-blue/25 transition-all duration-300 flex items-center gap-1.5">
                                  Comenzar
                                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed tests */}
                  {assignedTests.filter((t: any) => t.completedAt).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-5 rounded-full bg-gantly-emerald" />
                        <span className="text-xs font-body font-semibold text-gantly-muted uppercase tracking-widest">Completados</span>
                      </div>
                      <div className="space-y-2">
                        {assignedTests.filter((t: any) => t.completedAt).map((at: any) => (
                          <div
                            key={at.id}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-l-[3px] border-l-gantly-emerald opacity-80 hover:opacity-100 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-gantly-emerald/10 flex items-center justify-center flex-shrink-0">
                                  <span className="material-symbols-outlined text-gantly-emerald text-lg">task_alt</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-heading font-semibold text-gantly-text truncate">
                                    {at.testTitle || at.test?.title || 'Test'}
                                  </p>
                                  {at.assignedAt && (
                                    <p className="text-xs font-body text-gantly-muted mt-0.5">
                                      Completado el {new Date(at.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-heading font-semibold bg-gantly-emerald/10 text-gantly-emerald px-2.5 py-1 rounded-full flex-shrink-0">Completado</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'calendario' && hasPsychologist && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gantly-blue text-xl">calendar_month</span>
                </div>
                <h2 className="text-2xl font-heading font-bold text-gantly-text">Calendario</h2>
              </div>
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
                <div className="mt-8 border-t border-slate-100 pt-6" data-section="mis-citas">
                  <h3 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full bg-gantly-blue" />
                    Mis citas
                  </h3>

                  <div className="space-y-3">
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
                        ? 'bg-gantly-emerald/10 text-gantly-emerald'
                        : isConfirmed
                        ? 'bg-gantly-gold/10 text-gantly-gold'
                        : isPending
                        ? 'bg-slate-100 text-slate-600'
                        : isCancelled
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-gantly-blue/10 text-gantly-blue';

                      return (
                        <div
                          key={apt.id}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4 hover:shadow-sm transition-all duration-200"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(apt.startTime).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                              })}
                              {' - '}
                              {new Date(apt.startTime).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {' - '}
                              {apt.endTime &&
                                new Date(apt.endTime).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {apt.psychologist?.name || 'Terapia online'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isConfirmed && apt.paymentStatus === 'PENDING' && (
                              <button
                                className="text-xs px-4 py-2 rounded-xl font-medium bg-gantly-blue text-white hover:shadow-lg hover:shadow-gantly-blue/25 cursor-pointer transition-all duration-300"
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
                                Pagar {apt.price ? `${apt.price}\u20AC` : ''}
                              </button>
                            )}
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${statusClasses}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      className="text-sm text-gantly-blue hover:text-gantly-blue/80 font-heading font-semibold cursor-pointer transition-colors duration-200"
                      onClick={() => {
                        setTab('mis-citas');
                      }}
                    >
                      Ver historial completo
                    </button>
                  </div>
                </div>
              )}

              {!loadingSlots && slots.length === 0 && myAppointments.length === 0 && (
                <p className="text-sm text-slate-500">
                  De momento no hay disponibilidad publicada por tu psicólogo.
                </p>
              )}
            </div>
          )}

          {/* Historial completo de citas */}
          {tab === 'mis-citas' && hasPsychologist && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Historial de citas
              </h2>

              {loadingPastAppointments ? (
                <LoadingSpinner text="Cargando historial de citas..." />
              ) : pastAppointments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aun no tienes citas en tu historial.
                </p>
              ) : (
                <div className="space-y-3">
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
                        ? 'bg-gantly-emerald/10 text-gantly-emerald'
                        : isConfirmed
                        ? 'bg-gantly-gold/10 text-gantly-gold'
                        : isPending
                        ? 'bg-slate-100 text-slate-600'
                        : isCancelled
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-gantly-blue/10 text-gantly-blue';

                      return (
                        <div
                          key={apt.id}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(apt.startTime).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {' - '}
                              {new Date(apt.startTime).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {' - '}
                              {apt.endTime &&
                                new Date(apt.endTime).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {apt.psychologist?.name || 'Terapia online'}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${statusClasses}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Mensajes Clinica */}
          {tab === 'mensajes-clinica' && hasClinic && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header with gradient accent */}
              <div className="h-1 bg-gradient-to-r from-gantly-blue to-gantly-cyan" />
              <div className="px-6 md:px-8 pt-6 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gantly-blue text-xl">business</span>
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-gantly-text">
                    Mensajes de tu clinica
                  </h2>
                  <p className="text-xs text-slate-400 font-body">Chat directo con tu clinica</p>
                </div>
              </div>

              <div className="px-6 md:px-8 pb-6">
                {clinicChatLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Messages list */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto mb-6 pr-2">
                      {clinicChatMessages.length === 0 ? (
                        <div className="text-center py-12">
                          <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">chat</span>
                          <p className="text-slate-400 text-sm font-body">
                            No hay mensajes todavia. Escribe el primer mensaje a tu clinica.
                          </p>
                        </div>
                      ) : (
                        clinicChatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'PATIENT' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-3 ${
                                msg.sender === 'PATIENT'
                                  ? 'bg-gradient-to-r from-gantly-blue to-gantly-blue/90 text-white rounded-2xl rounded-br-sm shadow-sm'
                                  : 'bg-slate-50 text-gantly-text rounded-2xl rounded-bl-sm border border-slate-100'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              <p className={`text-[10px] mt-1.5 text-right ${msg.sender === 'PATIENT' ? 'text-white/60' : 'text-slate-400'}`}>
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
                    <div className="flex gap-3 items-end">
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
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-gantly-text placeholder-slate-400 focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue outline-none transition-all duration-200 resize-none font-body text-sm"
                      />
                      <button
                        onClick={handleSendClinicChat}
                        disabled={!clinicChatInput.trim() || clinicChatSending}
                        className="px-5 py-3 bg-gradient-to-r from-gantly-blue to-gantly-cyan text-white rounded-xl font-heading font-bold shadow-md hover:shadow-lg hover:shadow-gantly-blue/25 cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-none"
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
            </div>
          )}
        </main>
      </div>

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
