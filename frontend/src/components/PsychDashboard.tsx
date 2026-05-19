import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, UsersRound, CheckSquare, Brain, Calendar, MessageCircle, History, Receipt, FileCheck, LogOut, X, type LucideIcon } from 'lucide-react';
import api, { profileService, psychService, calendarService, tasksService, assignedTestsService, testService, resultsService, matchingService, jitsiService } from '../services/api';
import NotificationBell from './ui/NotificationBell';
import JitsiVideoCall from './JitsiVideoCall';
import LoadingSpinner from './ui/LoadingSpinner';
import { toast } from './ui/Toast';
import { SkeletonList } from './ui/SkeletonLoader';
import LogoSvg from '../assets/logo-gantly.svg';

// Already extracted tabs
import PsychEditProfileTab from './PsychEditProfileTab';
import PsychPatientsTab from './PsychPatientsTab';
import PsychTasksTab from './PsychTasksTab';
import PsychTestsTab from './PsychTestsTab';
import PsychBillingTab from './PsychBillingTab';
import PsychologistMatchingTest from './PsychologistMatchingTest';

// Newly extracted tabs
import PsychHomeTab from './PsychHomeTab';
import PsychCalendarTab from './PsychCalendarTab';
import PsychPastAppointmentsTab from './PsychPastAppointmentsTab';
import PsychChatTab from './PsychChatTab';
import PsychPatientProfileView from './PsychPatientProfileView';
import PsychTestDetailsView from './PsychTestDetailsView';
import PsychConsentTab from './PsychConsentTab';

type Tab = 'perfil' | 'pacientes' | 'calendario' | 'tareas' | 'chat' | 'citas-pasadas' | 'tests-asignados' | 'patient-profile' | 'test-details' | 'editar-perfil-profesional' | 'matching-test' | 'facturacion' | 'consentimientos';

export default function PsychDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('perfil');
  const [me, setMe] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState<string | null>(null);
  const [videoCallOtherUser, setVideoCallOtherUser] = useState<{ email: string; name: string } | null>(null);
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date | null>(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // Patient profile view state
  const [viewingPatientId, setViewingPatientId] = useState<number | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [patientOverallStats, setPatientOverallStats] = useState<any>(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  // Test details view state
  const [viewingTestDetails, setViewingTestDetails] = useState<{ patientId: number; testId: number; assignedTestId: number } | null>(null);
  const [testDetailsData, setTestDetailsData] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<any>(null);
  const [loadingTestDetails, setLoadingTestDetails] = useState(false);

  // Past appointments
  const [pastAppointmentsPsych, setPastAppointmentsPsych] = useState<any[]>([]);
  const [loadingPastAppointmentsPsych, setLoadingPastAppointmentsPsych] = useState(false);

  // Billing
  const [billingAppointments, setBillingAppointments] = useState<any[]>([]);
  const [loadingBillingAppointments, setLoadingBillingAppointments] = useState(false);

  // Rating
  const [myRating, setMyRating] = useState<{ averageRating: number | null; totalRatings: number } | null>(null);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [ratingsList, setRatingsList] = useState<Array<{ rating: number; comment: string; patientName: string; createdAt: string }>>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Psychologist profile
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);

  // Absences
  const [absences, setAbsences] = useState<Array<{ id: number; startTime: string; endTime: string; reason?: string }>>([]);

  // Matching test
  const [matchingTestCompleted, setMatchingTestCompleted] = useState<boolean | null>(null);
  const [checkingMatchingTest, setCheckingMatchingTest] = useState(false);
  const [hasCheckedInitialStatus, setHasCheckedInitialStatus] = useState(false);

  // Video call ref
  const videoCallRef = useRef<{ room: string | null; user: any; otherUser: any } | null>(null);

  useEffect(() => {
    if (showVideoCall && videoCallRoom && me) {
      videoCallRef.current = { room: videoCallRoom, user: me, otherUser: videoCallOtherUser };
    }
  }, [showVideoCall, videoCallRoom, me, videoCallOtherUser]);

  const handleVideoCallClose = useCallback(() => {
    videoCallRef.current = null;
    setShowVideoCall(false);
    setVideoCallRoom(null);
    setVideoCallOtherUser(null);
  }, []);

  useEffect(() => {
    if (tab === 'chat') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setHasUnreadChat(false);
    }
  }, [tab]);

  // --- Data loading ---

  const loadData = async () => {
    try {
      setLoading(true);
      const m = await profileService.me();
      setMe(m);
      setLoadingPatients(true);
      const p = await psychService.patients();
      setPatients(p);
      setLoadingPatients(false);
      const t = await tasksService.list();
      setTasks(t);
    } catch {
      toast.error('Error al cargar los datos. Por favor recarga la pagina.');
    } finally {
      setLoading(false);
    }

    // Check unread chat
    setTimeout(async () => {
      try {
        const patientList = await psychService.patients();
        for (const p of patientList) {
          const { data: history } = await api.get('/chat/history', { params: { userId: p.id } });
          if (Array.isArray(history) && history.length > 0 && history[0].sender === 'USER') {
            setHasUnreadChat(true);
            break;
          }
        }
      } catch {
        // silently ignore
      }
    }, 300);

    // Load assigned tests
    setTimeout(async () => {
      try {
        const at = await assignedTestsService.list();
        setAssignedTests(at || []);
      } catch {
        setAssignedTests([]);
      }
    }, 100);

    // Load available tests
    setTimeout(async () => {
      try {
        const tests = await testService.list();
        setAvailableTests((tests || []).filter((t: any) => t.active !== false));
      } catch {
        setAvailableTests([]);
      }
    }, 200);
  };

  const loadMySlots = async () => {
    try {
      setLoadingSlots(true);
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const list = await calendarService.mySlots(from.toISOString(), to.toISOString());
      setSlots(list);
    } catch {
      toast.error('Error al cargar el calendario');
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const requests = await calendarService.getPendingRequests();
      setPendingRequests(requests);
    } catch {
      // non-critical
    }
  };

  const loadAbsences = async () => {
    try {
      const list = await calendarService.getAbsences();
      setAbsences(list);
    } catch {
      // non-critical
    }
  };

  const loadPsychologistProfile = async () => {
    try {
      const profile = await psychService.getProfile();
      setPsychologistProfile(profile);
    } catch {
      // silent
    }
  };

  const loadPastAppointmentsPsych = async () => {
    try {
      setLoadingPastAppointmentsPsych(true);
      const appointments = await calendarService.getPsychologistPastAppointments();
      setPastAppointmentsPsych(appointments);
    } catch (err: any) {
      toast.error('Error al cargar las citas pasadas: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPastAppointmentsPsych(false);
    }
  };

  const loadBillingAppointments = async () => {
    try {
      setLoadingBillingAppointments(true);
      const appointments = await calendarService.getBillingAppointments();
      setBillingAppointments(appointments);
    } catch (err: any) {
      toast.error('Error al cargar datos de facturacion: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingBillingAppointments(false);
    }
  };

  const loadMyRating = async () => {
    if (!me) return;
    try {
      const rating = await calendarService.getPsychologistRating(me.id);
      setMyRating(rating);
    } catch {
      // silent
    }
  };

  const checkMatchingTestStatus = async () => {
    try {
      setCheckingMatchingTest(true);
      const status = await matchingService.getPsychologistTestStatus();
      setMatchingTestCompleted(status.completed || false);
    } catch {
      setMatchingTestCompleted(false);
    } finally {
      setCheckingMatchingTest(false);
    }
  };

  const loadPatientDetails = async (patientId: number) => {
    try {
      setLoadingPatientDetails(true);
      const data = await psychService.getPatientDetails(patientId);
      setPatientDetails(data);
      setViewingPatientId(patientId);

      try {
        const testIds = (data?.tests || []).map((t: any) => t.testId);
        if (testIds.length > 0) {
          const results = await Promise.all(
            testIds.map((tid: number) => resultsService.getUserTest(patientId, tid).catch(() => null))
          );
          const factors: Record<string, { name: string; sum: number; count: number }> = {};
          for (const r of results) {
            if (!r || !r.factors) continue;
            for (const f of r.factors) {
              const key = f.factorCode || f.factorName || String(f.factorId);
              if (!factors[key]) factors[key] = { name: f.factorName || key, sum: 0, count: 0 };
              factors[key].sum += Number(f.percentage) || 0;
              factors[key].count += 1;
            }
          }
          const averaged = Object.entries(factors).map(([code, v]) => ({
            code,
            name: v.name,
            percentage: v.count > 0 ? v.sum / v.count : 0,
          }));
          setPatientOverallStats({ factors: averaged });
        } else {
          setPatientOverallStats(null);
        }
      } catch {
        // silent
      }
    } catch (err: any) {
      toast.error('Error al cargar los detalles del paciente: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  const loadTestDetails = async (patientId: number, testId: number, assignedTestId: number) => {
    try {
      setLoadingTestDetails(true);
      setViewingTestDetails({ patientId, testId, assignedTestId });
      const answersData = await psychService.getPatientTestAnswers(patientId, testId);
      setTestAnswers(answersData);
      const statsData = await resultsService.getUserTest(patientId, testId);
      setTestDetailsData(statsData);
    } catch (err: any) {
      toast.error('Error al cargar los detalles del test: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingTestDetails(false);
    }
  };

  const updatePatientStatus = async (patientId: number, status: 'ACTIVE' | 'DISCHARGED') => {
    try {
      await psychService.updatePatientStatus(patientId, status);
      setPatients(patients.map(p => p.id === patientId ? { ...p, status } : p));
      toast.success(`Paciente ${status === 'ACTIVE' ? 'reactivado' : 'dado de alta'} exitosamente`);
    } catch (err: any) {
      toast.error('Error al actualizar el status: ' + (err.response?.data?.error || err.message));
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen');
      return;
    }
    try {
      const res = await profileService.uploadAvatar(file);
      setMe({ ...me, avatarUrl: res.avatarUrl });
      toast.success('Avatar actualizado exitosamente');
    } catch (error: any) {
      toast.error('Error al subir el avatar: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
    } finally {
      input.value = '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // --- Effects ---

  useEffect(() => {
    loadData();
    loadMySlots();
    checkMatchingTestStatus();
  }, []);

  useEffect(() => {
    if (me && tab === 'perfil') loadMyRating();
  }, [me, tab]);

  useEffect(() => {
    if (!me || checkingMatchingTest || matchingTestCompleted === null) return;
    if (hasCheckedInitialStatus) return;
    setHasCheckedInitialStatus(true);
    if (me.role === 'PSYCHOLOGIST' && matchingTestCompleted === false && tab === 'perfil') {
      setTab('matching-test');
    }
  }, [me, matchingTestCompleted, checkingMatchingTest, hasCheckedInitialStatus, tab]);

  useEffect(() => {
    if (tab === 'citas-pasadas') loadPastAppointmentsPsych();
    if (tab === 'facturacion') loadBillingAppointments();
  }, [tab]);

  useEffect(() => {
    if (tab === 'calendario') {
      loadMySlots();
      loadPendingRequests();
      loadPsychologistProfile();
      loadAbsences();
    }
  }, [tab]);

  // --- Loading state ---

  if (loading && !me) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner text="Cargando perfil..." />
      </div>
    );
  }

  // --- Sidebar config ---

  const iconMap: Record<string, LucideIcon> = {
    home: Home,
    group: UsersRound,
    task_alt: CheckSquare,
    psychology: Brain,
    calendar_month: Calendar,
    chat: MessageCircle,
    history: History,
    receipt_long: Receipt,
    file_check: FileCheck,
  };

  const mainTabs = [
    { id: 'perfil', label: 'Inicio', icon: 'home' },
    { id: 'pacientes', label: 'Pacientes', icon: 'group' },
    { id: 'tareas', label: 'Tareas', icon: 'task_alt' },
    { id: 'tests-asignados', label: 'Tests', icon: 'psychology' },
    { id: 'consentimientos', label: 'Consentimientos', icon: 'file_check' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar_month' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
    { id: 'citas-pasadas', label: 'Historial', icon: 'history' },
    { id: 'facturacion', label: 'Facturacion', icon: 'receipt_long' },
  ];

  const activeTabGroup = (() => {
    if (tab === 'editar-perfil-profesional' || tab === 'matching-test') return 'perfil';
    if (tab === 'patient-profile') return 'pacientes';
    if (tab === 'test-details') return 'tests-asignados';
    return tab;
  })();

  // --- Ratings modal handler ---

  const handleShowRatingsModal = async () => {
    if (!myRating || myRating.totalRatings === 0 || !me?.id) return;
    setShowRatingsModal(true);
    setLoadingRatings(true);
    try {
      const list = await calendarService.getPsychologistRatings(me.id);
      setRatingsList(list);
    } catch {
      setRatingsList([]);
    } finally {
      setLoadingRatings(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 fixed inset-y-0 left-0 z-50 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <img src={LogoSvg} alt="Gantly" className="h-7 cursor-pointer" onClick={() => navigate('/')} />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {mainTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 border-none ${
                activeTabGroup === t.id
                  ? 'bg-gantly-blue/10 text-gantly-blue'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 bg-transparent'
              }`}
            >
              <span className="relative">
                {(() => { const Icon = iconMap[t.icon]; return Icon ? <Icon size={18} /> : null; })()}
                {t.id === 'chat' && hasUnreadChat && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
              </span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gantly-blue/10 flex items-center justify-center flex-shrink-0">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-gantly-blue">
                  {me?.name ? me.name.charAt(0).toUpperCase() : 'P'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{me?.name || 'Profesional'}</div>
              <div className="text-[11px] text-slate-500 truncate">{me?.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-200 border-none bg-transparent"
          >
            <LogOut size={16} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-heading font-semibold text-slate-800">
            {mainTabs.find(t => t.id === activeTabGroup)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        <div className="px-8 py-6">
          {/* Ratings Modal */}
          {showRatingsModal && (
            <div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-6"
              onClick={() => setShowRatingsModal(false)}
            >
              <div
                className="bg-white rounded-xl max-w-[520px] w-full max-h-[80vh] overflow-hidden flex flex-col border border-slate-200/80"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Resenas de pacientes</h3>
                  <button
                    className="px-3 py-1.5 text-sm bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-medium cursor-pointer transition-colors duration-200"
                    onClick={() => setShowRatingsModal(false)}
                  >
                    Cerrar
                  </button>
                </div>
                <div className="px-5 py-4 overflow-y-auto flex-1">
                  {loadingRatings ? (
                    <SkeletonList rows={3} />
                  ) : ratingsList.length === 0 ? (
                    <p className="text-slate-500">No hay resenas</p>
                  ) : (
                    ratingsList.map((r, i) => (
                      <div
                        key={i}
                        className="p-4 mb-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <strong className="text-sm text-slate-800">{r.patientName}</strong>
                          <span className="text-gantly-gold text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        </div>
                        {r.comment && <p className="m-0 text-sm text-slate-500">{r.comment}</p>}
                        <div className="text-[11px] text-slate-400 mt-2">{formatDate(r.createdAt)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== Tab Content ===== */}

          {tab === 'perfil' && (
            <PsychHomeTab
              me={me}
              patients={patients}
              tasks={tasks}
              slots={slots}
              pendingRequests={pendingRequests}
              matchingTestCompleted={matchingTestCompleted}
              myRating={myRating}
              onSetMe={setMe}
              onNavigateTab={(t) => setTab(t as Tab)}
              onAvatarChange={onAvatarChange}
              onShowRatingsModal={handleShowRatingsModal}
              onStartVideoCall={(room, otherUser) => {
                setVideoCallRoom(room);
                setVideoCallOtherUser(otherUser);
                setShowVideoCall(true);
              }}
              onLoadPsychologistProfile={loadPsychologistProfile}
            />
          )}

          {tab === 'matching-test' && (
            <div className="bg-white rounded-xl p-6 border border-slate-200/80">
              <PsychologistMatchingTest
                onComplete={async () => {
                  setMatchingTestCompleted(true);
                  try { await checkMatchingTestStatus(); } catch { /* keep true */ }
                  setTab('perfil');
                  toast.success('Test de matching completado correctamente');
                }}
                onBack={() => setTab('perfil')}
              />
            </div>
          )}

          {tab === 'editar-perfil-profesional' && (
            <PsychEditProfileTab onBack={() => setTab('perfil')} />
          )}

          {tab === 'pacientes' && (
            <PsychPatientsTab
              patients={patients}
              loadingPatients={loadingPatients}
              onRefresh={loadData}
              onOpenChat={(patientId) => {
                setSelectedPatient(patientId);
                setTab('chat');
              }}
              onViewPatient={(patientId) => {
                loadPatientDetails(patientId);
                setTab('patient-profile');
              }}
              onUpdateStatus={updatePatientStatus}
            />
          )}

          {tab === 'tareas' && (
            <PsychTasksTab me={me} tasks={tasks} patients={patients} onRefresh={loadData} />
          )}

          {tab === 'tests-asignados' && (
            <PsychTestsTab
              patients={patients}
              assignedTests={assignedTests}
              onRefresh={loadData}
              onViewTestDetails={(patientId, testId, assignedTestId) => {
                loadTestDetails(patientId, testId, assignedTestId);
                setTab('test-details');
              }}
            />
          )}

          {tab === 'calendario' && (
            <PsychCalendarTab
              slots={slots}
              absences={absences}
              pendingRequests={pendingRequests}
              loadingSlots={loadingSlots}
              psychologistProfile={psychologistProfile}
              patients={patients}
              calendarWeekStart={calendarWeekStart}
              onCalendarWeekChange={setCalendarWeekStart}
              onReloadSlots={loadMySlots}
              onReloadPendingRequests={loadPendingRequests}
              onReloadAbsences={loadAbsences}
            />
          )}

          {tab === 'chat' && (
            <PsychChatTab
              patients={patients}
              selectedPatient={selectedPatient}
              onSelectPatient={setSelectedPatient}
            />
          )}

          {tab === 'citas-pasadas' && (
            <PsychPastAppointmentsTab
              pastAppointments={pastAppointmentsPsych}
              loading={loadingPastAppointmentsPsych}
              myRating={myRating}
              onShowRatingsModal={handleShowRatingsModal}
            />
          )}

          {tab === 'patient-profile' && viewingPatientId && (
            <PsychPatientProfileView
              viewingPatientId={viewingPatientId}
              patientDetails={patientDetails}
              patientOverallStats={patientOverallStats}
              loadingPatientDetails={loadingPatientDetails}
              availableTests={availableTests}
              onBack={() => {
                setTab('pacientes');
                setViewingPatientId(null);
                setPatientDetails(null);
                setPatientOverallStats(null);
              }}
            />
          )}

          {tab === 'test-details' && viewingTestDetails && (
            <PsychTestDetailsView
              viewingTestDetails={viewingTestDetails}
              testDetailsData={testDetailsData}
              testAnswers={testAnswers}
              loadingTestDetails={loadingTestDetails}
              patients={patients}
              onBack={() => {
                setTab('tests-asignados');
                setViewingTestDetails(null);
                setTestDetailsData(null);
                setTestAnswers(null);
              }}
            />
          )}

          {tab === 'consentimientos' && (
            <PsychConsentTab patients={patients} />
          )}

          {tab === 'facturacion' && (
            <PsychBillingTab
              appointments={billingAppointments}
              loading={loadingBillingAppointments}
              onRefresh={loadBillingAppointments}
            />
          )}

          {/* Jitsi Video Call - persists even when switching tabs */}
          {(() => {
            const shouldRender = showVideoCall || (videoCallRef.current && videoCallRef.current.room);
            const roomToUse: string | undefined = showVideoCall ? (videoCallRoom ?? undefined) : (videoCallRef.current?.room ?? undefined);
            const userToUse = showVideoCall ? me : videoCallRef.current?.user;
            const otherUserToUse = showVideoCall ? videoCallOtherUser : videoCallRef.current?.otherUser;

            return shouldRender && roomToUse && userToUse ? (
              <div className="fixed inset-0 z-[10000]">
                <JitsiVideoCall
                  key={`jitsi-${roomToUse}`}
                  roomName={roomToUse}
                  userEmail={userToUse.email}
                  userName={userToUse.name || 'Psicólogo'}
                  otherUserEmail={otherUserToUse?.email}
                  otherUserName={otherUserToUse?.name}
                  onClose={handleVideoCallClose}
                />
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
