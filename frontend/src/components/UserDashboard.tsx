import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Home, Brain, CheckSquare, ClipboardList, CalendarDays, BookOpen,
  BarChart3, FileText, Compass, MessageCircle, Building2, FileCheck, LogOut,
  Menu, MoreHorizontal, X,
} from 'lucide-react';
import NotificationBell from './ui/NotificationBell';
import api, {
  profileService,
  tasksService,
  calendarService,
  assignedTestsService,
  stripeService,
} from '../services/api';
import ChatWidget from './ChatWidget';
import AgendaPersonal from './AgendaPersonal';
import MisEstadisticas from './MisEstadisticas';
import Evaluaciones from './Evaluaciones';
import Descubrimiento from './Descubrimiento';
import LoadingSpinner from './ui/LoadingSpinner';
import UserTasksTab from './UserTasksTab';
import UserPsychProfileTab from './UserPsychProfileTab';
import UserSettingsTab from './UserSettingsTab';
import UserHomeTab from './UserHomeTab';
import UserPsychologistTab from './UserPsychologistTab';
import UserTestsTab from './UserTestsTab';
import UserCalendarTab from './UserCalendarTab';
import UserAppointmentsTab from './UserAppointmentsTab';
import UserClinicPortalTab from './UserClinicPortalTab';
import UserConsentTab from './UserConsentTab';
import { toast } from './ui/Toast';
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
  | 'valoraciones'
  | 'descubrimiento'
  | 'chat'
  | 'perfil-psicologo'
  | 'consentimientos'
  | 'clinica';


interface UserDashboardProps {
  onStartTest?: (testId: number) => void;
}

export default function UserDashboard({ onStartTest }: UserDashboardProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('perfil');
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [psych, setPsych] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);
  const [loadingPsychologistProfile, setLoadingPsychologistProfile] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState<string | null>(null);
  const [videoCallOtherUser, setVideoCallOtherUser] = useState<{ email: string; name: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding-completed'));
  // Mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Unread chat indicator
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const nav = useNavigate();

  const hasPsychologist = psych?.status === 'ASSIGNED';
  const hasClinic = !!me?.companyId;

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

      // Check for unread chat messages
      if (p?.status === 'ASSIGNED') {
        try {
          const { data: history } = await api.get('/chat/history');
          if (Array.isArray(history) && history.length > 0) {
            const lastMsg = history[0]; // most recent first
            if (lastMsg.sender === 'PSYCHOLOGIST') {
              setHasUnreadChat(true);
            }
          }
        } catch {
          // silently ignore
        }
      }
    } catch (err: any) {
      toast.error('Error al cargar tu panel. Intenta recargar la pagina.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Handle Stripe return params
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

  const loadPsychologistProfile = async (psychologistId: number) => {
    try {
      setLoadingPsychologistProfile(true);
      const profile = await profileService.getPsychologistProfile(psychologistId);
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

  const upcomingAppointment = useMemo(() => {
    const now = new Date();
    return myAppointments
      .filter((apt: any) => apt.startTime && new Date(apt.startTime) > now)
      .sort(
        (a: any, b: any) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )[0];
  }, [myAppointments]);

  // Clear unread chat when entering chat tab
  useEffect(() => {
    if (tab === 'chat') setHasUnreadChat(false);
  }, [tab]);

  // Close mobile more menu on Escape
  useEffect(() => {
    if (!mobileMoreOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMoreOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileMoreOpen]);

  if (loading && !me) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoadingSpinner text="Cargando..." />
      </div>
    );
  }

  type SidebarItem = { id: string; icon: ReactNode; label: string; requiresPsych: boolean };
  type SidebarGroup = { group: string; items: SidebarItem[] };

  const sidebarGroups: SidebarGroup[] = [
    {
      group: 'Inicio',
      items: [
        { id: 'perfil', icon: <Home size={20} />, label: 'Inicio', requiresPsych: false },
        { id: 'mis-estadisticas', icon: <BarChart3 size={20} />, label: 'Estadísticas', requiresPsych: false },
      ],
    },
    {
      group: 'Terapia',
      items: [
        { id: 'mi-psicologo', icon: <Brain size={20} />, label: 'Psicólogo', requiresPsych: false },
        { id: 'chat', icon: <div className="relative"><MessageCircle size={20} />{hasUnreadChat && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-gantly-navy" />}</div>, label: 'Chat', requiresPsych: true },
        { id: 'tareas', icon: <CheckSquare size={20} />, label: 'Tareas', requiresPsych: true },
        { id: 'valoraciones', icon: <ClipboardList size={20} />, label: 'Evaluaciones', requiresPsych: false },
        { id: 'descubrimiento', icon: <Compass size={20} />, label: 'Colabora', requiresPsych: false },
      ],
    },
    {
      group: 'Citas',
      items: [
        { id: 'calendario', icon: <CalendarDays size={20} />, label: 'Calendario', requiresPsych: true },
        { id: 'agenda-personal', icon: <BookOpen size={20} />, label: 'Agenda', requiresPsych: false },
      ],
    },
    {
      group: 'Config',
      items: [
        { id: 'consentimientos', icon: <FileCheck size={20} />, label: 'Consentimientos', requiresPsych: true },
        ...(me?.companyId ? [{ id: 'clinica', icon: <Building2 size={20} /> as ReactNode, label: 'Mi Clínica', requiresPsych: false }] : []),
      ],
    },
  ];

  // Flat list for mobile bottom nav and header title lookup
  const sidebarItems: SidebarItem[] = sidebarGroups.flatMap(g => g.items);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-100 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-60 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col fixed top-0 left-0 h-screen z-40">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-100">
          <img src={LogoSvg} alt="Gantly" className="h-7 cursor-pointer" onClick={() => nav('/')} />
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col px-3 py-4 overflow-y-auto">
          {sidebarGroups.map((group, gi) => (
            <div key={group.group}>
              {gi > 0 && <div className="mx-3 my-1.5 border-t border-slate-100" />}
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-4 pt-3 pb-1 block select-none">{group.group}</span>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
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
                          ? 'bg-gantly-blue text-white shadow-sm'
                          : isDisabled
                          ? 'text-slate-400 cursor-not-allowed opacity-50'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={isDisabled ? 'Requiere psicólogo asignado' : undefined}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gantly-blue/10 flex items-center justify-center flex-shrink-0">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-gantly-blue font-semibold">
                  {me?.name ? me.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{me?.name || 'Usuario'}</p>
              <p className="text-xs text-slate-500 truncate">{me?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.reload();
            }}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-200 w-full px-2 py-1.5 rounded-lg"
          >
            <LogOut size={14} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col">
            <div className="px-6 py-6 border-b border-slate-100">
              <img src={LogoSvg} alt="Gantly" className="h-7 cursor-pointer" onClick={() => nav('/')} />
            </div>
            <nav className="flex-1 flex flex-col px-3 py-4 overflow-y-auto">
              {sidebarGroups.map((group, gi) => (
                <div key={group.group}>
                  {gi > 0 && <div className="mx-3 my-1.5 border-t border-slate-100" />}
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-4 pt-3 pb-1 block select-none">{group.group}</span>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
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
                              ? 'bg-gantly-blue text-white shadow-sm'
                              : isDisabled
                              ? 'text-slate-400 cursor-not-allowed opacity-50'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  window.location.reload();
                }}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-200 px-2 py-1.5 rounded-lg"
              >
                <LogOut size={14} />
                Cerrar sesion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              type="button"
              aria-label="Abrir menu"
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gantly-blue rounded-lg outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} className="text-slate-600" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              {sidebarItems.find(i => i.id === tab)?.label || 'Panel'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell onNavigate={(type) => {
              const tabMap: Record<string, Tab> = {
                TASK: 'tareas',
                APPOINTMENT: 'mis-citas',
                PAYMENT: 'mis-citas',
                REMINDER: 'mis-citas',
                MESSAGE: 'chat',
                CLINIC_CHAT: 'clinica',
                APPROVAL: 'perfil',
                CRISIS: 'perfil',
                WARNING: 'perfil',
              };
              const target = tabMap[type];
              if (target) setTab(target);
            }} />
          </div>
        </nav>

        {/* Mobile bottom nav */}
        {(() => {
          const mobileMainIds = ['perfil', 'calendario', 'chat', 'agenda-personal'];
          const mainItems = sidebarItems.filter(i => mobileMainIds.includes(i.id));
          const moreItems = sidebarItems.filter(i => !mobileMainIds.includes(i.id));
          const isMoreActive = moreItems.some(i => i.id === tab);
          return (
            <>
              {/* More menu overlay */}
              {mobileMoreOpen && (
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMoreOpen(false)}>
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                  <div
                    className="absolute bottom-16 left-2 right-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 animate-in slide-in-from-bottom-4 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mas opciones</span>
                      <button type="button" aria-label="Cerrar menu" onClick={() => setMobileMoreOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-gantly-blue rounded outline-none">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {moreItems.map((item) => {
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
                              } else {
                                setTab(item.id as Tab);
                              }
                              setMobileMoreOpen(false);
                            }}
                            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl cursor-pointer transition-colors duration-150 ${
                              isActive ? 'bg-gantly-blue/10 text-gantly-blue' : isDisabled ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {item.icon}
                            <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {/* Bottom bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/50 flex justify-around py-2 px-1 md:hidden z-30">
                {mainItems.map((item) => {
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
                        setMobileMoreOpen(false);
                      }}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg cursor-pointer transition-colors duration-200 ${
                        isActive ? 'text-gantly-blue' : isDisabled ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.icon}
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
                {/* More button */}
                <button
                  type="button"
                  aria-label="Ver mas opciones"
                  aria-expanded={mobileMoreOpen}
                  onClick={() => setMobileMoreOpen(prev => !prev)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg cursor-pointer transition-colors duration-200 ${
                    mobileMoreOpen || isMoreActive ? 'text-gantly-blue' : 'text-slate-500'
                  }`}
                >
                  <MoreHorizontal size={20} />
                  <span className="text-[10px] font-medium">Mas</span>
                </button>
              </div>
            </>
          );
        })()}

        {/* Content area */}
        <main className="flex-1 p-6 md:p-8 pb-20 md:pb-8 overflow-x-hidden">
          {/* Home / Profile overview */}
          {tab === 'perfil' && (
            <UserHomeTab
              me={me}
              tasks={tasks}
              assignedTests={assignedTests}
              upcomingAppointment={upcomingAppointment}
              hasPsychologist={hasPsychologist}
              setTab={(t) => setTab(t as Tab)}
              setShowVideoCall={setShowVideoCall}
              setVideoCallRoom={setVideoCallRoom}
              setVideoCallOtherUser={setVideoCallOtherUser}
            />
          )}

          {/* Settings */}
          {tab === 'configuracion' && (
            <UserSettingsTab
              me={me}
              onBack={() => setTab('perfil')}
              onMeUpdate={(updated) => setMe(updated)}
              onShowOnboarding={() => { setTab('perfil'); setShowOnboarding(true); }}
            />
          )}

          {/* Statistics */}
          {tab === 'mis-estadisticas' && <MisEstadisticas onViewTest={(testId, testCode, testTitle) => {
            // Navigate to evaluaciones tab and let it handle showing results
            setTab('evaluaciones');
            // Store in sessionStorage so Evaluaciones can auto-open results
            sessionStorage.setItem('view-test-result', JSON.stringify({ testId, testCode, testTitle }));
          }} />}

          {/* Evaluations */}
          {tab === 'evaluaciones' && <Evaluaciones onStartTest={onStartTest} />}

          {/* Discovery */}
          {tab === 'descubrimiento' && <Descubrimiento onStartTest={onStartTest} />}

          {/* Personal agenda */}
          {tab === 'agenda-personal' && <AgendaPersonal />}

          {/* Chat */}
          {tab === 'chat' && hasPsychologist && (
            <div className="w-full">
              <ChatWidget mode="USER" />
            </div>
          )}

          {/* My Psychologist */}
          {tab === 'mi-psicologo' && (
            <UserPsychologistTab
              me={me}
              psych={psych}
              setPsych={setPsych}
              hasPsychologist={hasPsychologist}
              setTab={(t) => setTab(t as Tab)}
              loadPsychologistProfile={loadPsychologistProfile}
            />
          )}

          {/* Psychologist full profile */}
          {tab === 'perfil-psicologo' && psychologistProfile && (
            <UserPsychProfileTab
              psychologistProfile={psychologistProfile}
              loadingPsychologistProfile={loadingPsychologistProfile}
              onBack={() => setTab('mi-psicologo')}
            />
          )}

          {/* Tasks */}
          {tab === 'tareas' && hasPsychologist && (
            <UserTasksTab tasks={tasks} onRefresh={loadData} />
          )}

          {/* Assigned Tests (legacy tab id kept for deep-links) */}
          {tab === 'tests-pendientes' && hasPsychologist && (
            <UserTestsTab
              me={me}
              assignedTests={assignedTests}
              onStartTest={onStartTest}
              setTab={(t) => setTab(t as Tab)}
            />
          )}

          {/* Valoraciones — unified tests + evaluations */}
          {tab === 'valoraciones' && (
            <div className="space-y-8">
              {hasPsychologist && assignedTests.length > 0 && (
                <div>
                  <h2 className="text-lg font-heading font-semibold text-slate-800 mb-4">Tests asignados</h2>
                  <UserTestsTab
                    me={me}
                    assignedTests={assignedTests}
                    onStartTest={onStartTest}
                    setTab={(t) => setTab(t as Tab)}
                  />
                </div>
              )}
              <div>
                {hasPsychologist && assignedTests.length > 0 && (
                  <h2 className="text-lg font-heading font-semibold text-slate-800 mb-4">Evaluaciones</h2>
                )}
                <Evaluaciones onStartTest={onStartTest} />
              </div>
            </div>
          )}

          {/* Calendar */}
          {tab === 'calendario' && hasPsychologist && (
            <UserCalendarTab
              hasPsychologist={hasPsychologist}
              setTab={(t) => setTab(t as Tab)}
            />
          )}

          {/* Appointment history */}
          {tab === 'mis-citas' && hasPsychologist && (
            <UserAppointmentsTab setTab={(t) => setTab(t as Tab)} />
          )}

          {/* Consentimientos */}
          {tab === 'consentimientos' && hasPsychologist && (
            <UserConsentTab userName={me?.name} />
          )}

          {/* Clinic portal */}
          {tab === 'clinica' && hasClinic && (
            <UserClinicPortalTab hasClinic={hasClinic} />
          )}
        </main>
      </div>

      {/* Onboarding Wizard */}
      {showOnboarding && !hasPsychologist && me && (
        <OnboardingWizard
          userName={me.name || 'Usuario'}
          onComplete={() => setShowOnboarding(false)}
          onGoToProfile={() => { setShowOnboarding(false); setTab('configuracion'); }}
          onGoToMatching={() => { setShowOnboarding(false); setTab('mi-psicologo'); }}
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
