import { useEffect, useState, useCallback, useRef } from 'react';
import { User, BarChart3 } from 'lucide-react';
import { profileService, psychService, calendarService, tasksService, assignedTestsService, testService, resultsService, matchingService, calendarNotesService, jitsiService, API_BASE_URL } from '../services/api';
import NotificationBell from './ui/NotificationBell';
import ChatWidget from './ChatWidget';
import CalendarWeek from './CalendarWeek';
import JitsiVideoCall from './JitsiVideoCall';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';
import { toast } from './ui/Toast';
import BarChart from './BarChart';
import FactorChart from './FactorChart';
import InitialTestSummary from './InitialTestSummary';
import type { TestReportHandle, TestReportData } from './TestReport';
import TestReport from './TestReport';
import PsychologistMatchingTest from './PsychologistMatchingTest';
import PsychEditProfileTab from './PsychEditProfileTab';
import PsychPatientsTab from './PsychPatientsTab';
import PsychTasksTab from './PsychTasksTab';
import PsychTestsTab from './PsychTestsTab';
import PsychBillingTab from './PsychBillingTab';
import LogoSvg from '../assets/logo-gantly.svg';


type Tab = 'perfil' | 'pacientes' | 'calendario' | 'tareas' | 'chat' | 'citas-pasadas' | 'tests-asignados' | 'patient-profile' | 'test-details' | 'editar-perfil-profesional' | 'matching-test' | 'facturacion';

function SessionNotesSection({ appointmentId, existingNotes }: { appointmentId: number; existingNotes?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(existingNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await calendarNotesService.updateNotes(appointmentId, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-transparent border-none cursor-pointer text-sm text-gantly-blue font-medium font-body flex items-center gap-1 p-0 transition-colors duration-200 hover:text-gantly-blue/80"
      >
        <span className="material-symbols-outlined text-[18px]">{expanded ? 'expand_less' : 'expand_more'}</span>
        Notas de sesion {existingNotes ? '(editadas)' : ''}
      </button>
      {expanded && (
        <div className="mt-2">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Escribe notas sobre esta sesion..."
            className="w-full min-h-[80px] p-3 border border-slate-200 rounded-lg text-sm font-body resize-y outline-none focus:border-gantly-blue focus:ring-2 focus:ring-gantly-blue/10 transition-all duration-200"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-slate-400">{notes.length}/500</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-gantly-blue hover:bg-gantly-blue/90 text-white border-none rounded-lg text-[13px] font-heading cursor-pointer disabled:opacity-60 transition-colors duration-200"
            >
              {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar notas'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PsychDashboard() {
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
  const [, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', gender: '', age: '' });
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState<string | null>(null);
  const [videoCallOtherUser, setVideoCallOtherUser] = useState<{ email: string; name: string } | null>(null);
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);


  // Estados para vista de perfil de paciente
  const [viewingPatientId, setViewingPatientId] = useState<number | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [patientOverallStats, setPatientOverallStats] = useState<any>(null);
  const [selectedTestForStats, setSelectedTestForStats] = useState<number | null>(null);
  const [patientStats, setPatientStats] = useState<any>(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  // Estados para vista de detalles de test asignado
  const [viewingTestDetails, setViewingTestDetails] = useState<{ patientId: number; testId: number; assignedTestId: number } | null>(null);
  const [testDetailsData, setTestDetailsData] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<any>(null);
  const [loadingTestDetails, setLoadingTestDetails] = useState(false);

  // Estados para citas pasadas del psicólogo
  const [pastAppointmentsPsych, setPastAppointmentsPsych] = useState<any[]>([]);
  const [loadingPastAppointmentsPsych, setLoadingPastAppointmentsPsych] = useState(false);
  // Estados para facturación (todas las citas con usuario, pasadas y futuras)
  const [billingAppointments, setBillingAppointments] = useState<any[]>([]);
  const [loadingBillingAppointments, setLoadingBillingAppointments] = useState(false);
  const [myRating, setMyRating] = useState<{ averageRating: number | null; totalRatings: number } | null>(null);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [ratingsList, setRatingsList] = useState<Array<{ rating: number; comment: string; patientName: string; createdAt: string }>>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Estados para perfil profesional del psicólogo
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);

  // Estados para test de matching
  const [matchingTestCompleted, setMatchingTestCompleted] = useState<boolean | null>(null);
  const [checkingMatchingTest, setCheckingMatchingTest] = useState(false);
  const [hasCheckedInitialStatus, setHasCheckedInitialStatus] = useState(false);

  // Ref para mantener el componente montado incluso si showVideoCall cambia temporalmente
  const videoCallRef = useRef<{ room: string | null; user: any; otherUser: any } | null>(null);
  const testReportRef = useRef<TestReportHandle>(null);

  // Actualizar ref cuando hay una videollamada activa
  useEffect(() => {
    if (showVideoCall && videoCallRoom && me) {
      videoCallRef.current = { room: videoCallRoom, user: me, otherUser: videoCallOtherUser };
    }
  }, [showVideoCall, videoCallRoom, me, videoCallOtherUser]);

  // Función estable de cierre que solo se ejecuta manualmente
  const handleVideoCallClose = useCallback(() => {
    // Solo cerrar cuando el usuario hace clic explícitamente
    videoCallRef.current = null; // Limpiar ref
    setShowVideoCall(false);
    setVideoCallRoom(null);
    setVideoCallOtherUser(null);
  }, []);

  // Al entrar al chat, hacer scroll al inicio para que no quede desplazado hacia abajo
  useEffect(() => {
    if (tab === 'chat') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const m = await profileService.me();
      setMe(m);
      setEditForm({ name: m?.name || '', gender: m?.gender || '', age: m?.age?.toString() || '' });
      setLoadingPatients(true);
      const p = await psychService.patients();
      setPatients(p);
      setLoadingPatients(false);
      const t = await tasksService.list();
      setTasks(t);
    } catch (error: any) {
      toast.error('Error al cargar los datos. Por favor recarga la página.');
    } finally {
      setLoading(false);
    }

    // Cargar tests asignados de forma asíncrona y no bloqueante
    setTimeout(async () => {
      try {
        const at = await assignedTestsService.list();
        setAssignedTests(at || []);
      } catch (error: any) {
        setAssignedTests([]);
      }
    }, 100);

    // Cargar tests disponibles de forma asíncrona y no bloqueante
    setTimeout(async () => {
      try {
        const tests = await testService.list();
        const activeTests = (tests || []).filter((t: any) => t.active !== false);
        setAvailableTests(activeTests);
      } catch (error: any) {
        setAvailableTests([]);
      }
    }, 200);
  };



  const loadPatientDetails = async (patientId: number) => {
    try {
      setLoadingPatientDetails(true);
      const data = await psychService.getPatientDetails(patientId);
      setPatientDetails(data);
      setViewingPatientId(patientId);

      // Calcular media general de factores entre tests completados
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
      } catch (e) {
        // error handled silently
      }
    } catch (err: any) {
      toast.error('Error al cargar los detalles del paciente: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  const loadPatientStats = async (patientId: number, testId: number) => {
    try {
      setLoadingPatientDetails(true);
      const data = await resultsService.getUserTest(patientId, testId);
      setPatientStats(data);
    } catch (err: any) {
      toast.error('Error al cargar estadísticas: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  const loadTestDetails = async (patientId: number, testId: number, assignedTestId: number) => {
    try {
      setLoadingTestDetails(true);
      setViewingTestDetails({ patientId, testId, assignedTestId });

      // Cargar respuestas del test
      const answersData = await psychService.getPatientTestAnswers(patientId, testId);
      setTestAnswers(answersData);

      // Cargar estadísticas (factores y subfactores)
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



  useEffect(() => {
    loadData();
    loadMySlots();
    checkMatchingTestStatus();
  }, []);

  const checkMatchingTestStatus = async () => {
    try {
      setCheckingMatchingTest(true);
      const status = await matchingService.getPsychologistTestStatus();
      setMatchingTestCompleted(status.completed || false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setMatchingTestCompleted(false);
      } else {
        setMatchingTestCompleted(false);
      }
    } finally {
      setCheckingMatchingTest(false);
    }
  };

  // Cargar valoración cuando se carga el perfil
  useEffect(() => {
    if (me && tab === 'perfil') {
      loadMyRating();
    }
  }, [me, tab]);

  // Verificar si debe mostrar el test de matching al iniciar sesión (solo la primera vez que se carga)
  useEffect(() => {
    if (!me || checkingMatchingTest || matchingTestCompleted === null) return;
    if (hasCheckedInitialStatus) return;

    setHasCheckedInitialStatus(true);
    if (me.role === 'PSYCHOLOGIST' && matchingTestCompleted === false && tab === 'perfil') {
      setTab('matching-test');
    }
  }, [me, matchingTestCompleted, checkingMatchingTest, hasCheckedInitialStatus, tab]);

  // Cargar citas pasadas cuando se abre la pestaña
  useEffect(() => {
    if (tab === 'citas-pasadas') {
      loadPastAppointmentsPsych();
    }
    if (tab === 'facturacion') {
      loadBillingAppointments();
    }
  }, [tab]);

  const loadMySlots = async () => {
    try {
      setLoadingSlots(true);
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const list = await calendarService.mySlots(from.toISOString(), to.toISOString());
      setSlots(list);
    } catch (error: any) {
      toast.error('Error al cargar el calendario');
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const requests = await calendarService.getPendingRequests();
      setPendingRequests(requests);
    } catch (error: any) {
      // No mostrar toast para esto, es no crítico
    }
  };

  useEffect(() => {
    if (tab === 'calendario') {
      loadMySlots();
      loadPendingRequests();
      loadPsychologistProfile();
    }
  }, [tab]);


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

  const _saveProfile = async () => {
    try {
      await profileService.update({
        name: editForm.name,
        gender: editForm.gender || null,
        age: editForm.age ? parseInt(editForm.age) : null
      });
      setMe({ ...me, ...editForm });
      setEditing(false);
      await loadData();
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      toast.error('Error al guardar los cambios');
    }
  };

  const loadPsychologistProfile = async () => {
    try {
      const profile = await psychService.getProfile();
      setPsychologistProfile(profile);
    } catch (error: any) {
      // silent - profile used for calendar session prices
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
      toast.error('Error al cargar datos de facturación: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingBillingAppointments(false);
    }
  };

  const loadMyRating = async () => {
    if (!me) return;
    try {
      const rating = await calendarService.getPsychologistRating(me.id);
      setMyRating(rating);
    } catch (err: any) {
      // error handled silently
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !me) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner text="Cargando perfil..." />
      </div>
    );
  }

  // Tabs visible in the main nav (not internal navigation tabs like patient-profile, test-details, etc.)
  const mainTabs = [
    { id: 'perfil', label: 'Inicio', icon: 'home' },
    { id: 'pacientes', label: 'Pacientes', icon: 'group' },
    { id: 'tareas', label: 'Tareas', icon: 'task_alt' },
    { id: 'tests-asignados', label: 'Tests', icon: 'psychology' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar_month' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
    { id: 'citas-pasadas', label: 'Historial', icon: 'history' },
    { id: 'facturacion', label: 'Facturación', icon: 'receipt_long' },
  ];

  // Determine which tab group to highlight (some tabs are sub-views)
  const activeTabGroup = (() => {
    if (tab === 'editar-perfil-profesional' || tab === 'matching-test') return 'perfil';
    if (tab === 'patient-profile') return 'pacientes';
    if (tab === 'test-details') return 'tests-asignados';
    return tab;
  })();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gantly-navy to-[#0d1f3c] flex-shrink-0 fixed inset-y-0 left-0 z-50 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <img src={LogoSvg} alt="Gantly" className="h-7 brightness-0 invert" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium cursor-pointer transition-all duration-200 border-none ${
                activeTabGroup === t.id
                  ? 'bg-gantly-blue/20 text-white border-l-2 border-l-gantly-cyan font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* User info + logout at bottom */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-white">
                  {me?.name ? me.name.charAt(0).toUpperCase() : 'P'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{me?.name || 'Profesional'}</div>
              <div className="text-xs text-slate-400 truncate">{me?.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-200 border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-8 py-4 flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-gantly-text">
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-6"
              onClick={() => setShowRatingsModal(false)}
            >
              <div
                className="bg-white rounded-2xl max-w-[520px] w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl shadow-slate-900/20"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="m-0 text-lg font-heading font-bold text-gantly-text">Resenas de pacientes</h3>
                  <button
                    className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer transition-colors duration-200"
                    onClick={() => setShowRatingsModal(false)}
                  >
                    Cerrar
                  </button>
                </div>
                <div className="px-6 py-5 overflow-y-auto flex-1">
                  {loadingRatings ? (
                    <p className="text-slate-500">Cargando resenas...</p>
                  ) : ratingsList.length === 0 ? (
                    <p className="text-slate-500">No hay resenas</p>
                  ) : (
                    ratingsList.map((r, i) => (
                      <div
                        key={i}
                        className="p-4 mb-3 bg-slate-50 rounded-xl border border-slate-100"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <strong className="font-heading text-gantly-text">{r.patientName}</strong>
                          <span className="text-gantly-gold text-base">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        </div>
                        {r.comment && <p className="m-0 text-sm text-slate-500">{r.comment}</p>}
                        <div className="text-xs text-slate-400 mt-2">{formatDate(r.createdAt)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}

          {/* Perfil / Home */}
          {tab === 'perfil' && (
            <div className="space-y-6">
              {/* Hero Profile Card */}
              <div className="rounded-2xl p-8 text-white shadow-2xl shadow-gantly-blue/20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 30%, #48C6D4 65%, #78D4B0 100%)' }}>
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[length:20px_20px]" />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-6">
                    {/* Avatar */}
                    <label className="cursor-pointer relative group flex-shrink-0">
                      <div className="w-16 h-16 rounded-full ring-4 ring-white/30 overflow-hidden bg-white/20 flex items-center justify-center">
                        {me?.avatarUrl ? (
                          <img src={me.avatarUrl} alt={me.name || ''} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-semibold text-white">
                            {me?.name ? me.name.charAt(0).toUpperCase() : 'P'}
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                    </label>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-white truncate mb-1">
                        Hola, {me?.name || 'Profesional'}.
                      </h1>
                      <p className="text-sm text-white/70 mt-0.5 font-body">
                        {me?.email}
                        {me?.createdAt && (
                          <span> · Miembro desde {new Date(me.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                        )}
                      </p>
                      {myRating && myRating.averageRating !== null && (
                        <div
                          onClick={async () => {
                            if (myRating.totalRatings === 0 || !me?.id) return;
                            setShowRatingsModal(true);
                            setLoadingRatings(true);
                            try {
                              const list = await calendarService.getPsychologistRatings(me.id);
                              setRatingsList(list);
                            } catch (e) {
                              setRatingsList([]);
                            } finally {
                              setLoadingRatings(false);
                            }
                          }}
                          className="flex items-center gap-1.5 mt-2 cursor-pointer"
                          title={myRating.totalRatings > 0 ? 'Click para ver todas las resenas' : undefined}
                        >
                          <span className="text-gantly-gold text-sm">
                            {'★'.repeat(Math.round(myRating.averageRating))}{'☆'.repeat(5 - Math.round(myRating.averageRating))}
                          </span>
                          <span className="text-sm text-white/70 font-medium font-body">
                            {myRating.averageRating.toFixed(1)} ({myRating.totalRatings} valoraciones)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Toggle Aceptando nuevos pacientes */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {me?.isFull ? 'Lleno' : 'Aceptando pacientes'}
                        </div>
                        <div className="text-xs text-white/60">
                          {me?.isFull ? 'No en recomendaciones' : 'En recomendaciones'}
                        </div>
                      </div>
                      <label className="relative inline-block w-9 h-5 cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={me?.isFull || false}
                          onChange={async (e) => {
                            const newValue = e.target.checked;
                            const previousValue = me?.isFull || false;
                            setMe({ ...me, isFull: newValue });
                            try {
                              const response: any = await psychService.updateIsFull(newValue);
                              if (response && response.isFull !== undefined) {
                                setMe({ ...me, isFull: response.isFull });
                                toast.success(response.isFull ? 'Marcado como lleno' : 'Aceptando nuevos pacientes');
                              } else {
                                const psychProfile: any = await psychService.getProfile();
                                if (psychProfile && psychProfile.isFull !== undefined) {
                                  setMe({ ...me, isFull: psychProfile.isFull });
                                  toast.success(psychProfile.isFull ? 'Marcado como lleno' : 'Aceptando nuevos pacientes');
                                } else {
                                  toast.success(newValue ? 'Marcado como lleno' : 'Aceptando nuevos pacientes');
                                }
                              }
                            } catch (error: any) {
                              setMe({ ...me, isFull: previousValue });
                              toast.error('Error al actualizar: ' + (error.response?.data?.error || error.message));
                            }
                          }}
                          className="sr-only"
                        />
                        <span className={`absolute inset-0 rounded-full transition-colors duration-200 ${me?.isFull ? 'bg-red-400' : 'bg-gantly-emerald'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${me?.isFull ? 'translate-x-4' : ''}`} />
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Stat cards inside hero */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-white">{patients.length}</div>
                      <div className="text-xs text-white/60 uppercase tracking-wide mt-1 font-body">Pacientes</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-white">{tasks.filter(t => t.createdBy === 'PSYCHOLOGIST').length}</div>
                      <div className="text-xs text-white/60 uppercase tracking-wide mt-1 font-body">Tareas</div>
                    </div>
                    <div
                      className={`backdrop-blur-sm rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                        pendingRequests.length > 0
                          ? 'bg-gantly-gold/20 hover:bg-gantly-gold/30'
                          : 'bg-white/10 hover:bg-white/15'
                      }`}
                      onClick={() => {
                        setTab('calendario');
                        setTimeout(() => {
                          const pendingSection = document.getElementById('solicitudes-pendientes');
                          if (pendingSection) {
                            pendingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                    >
                      <div className={`text-3xl font-bold ${pendingRequests.length > 0 ? 'text-gantly-gold' : 'text-white'}`}>
                        {pendingRequests.length}
                      </div>
                      <div className="text-xs text-white/60 uppercase tracking-wide mt-1 font-body">Por confirmar</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-white">
                        {slots.filter(s => (s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user && new Date(s.startTime) > new Date()).length}
                      </div>
                      <div className="text-xs text-white/60 uppercase tracking-wide mt-1 font-body">Citas hoy</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={async () => {
                        await loadPsychologistProfile();
                        setTab('editar-perfil-profesional');
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-5 py-2.5 backdrop-blur-sm transition-all duration-300 cursor-pointer text-sm font-medium border-none"
                    >
                      Editar Perfil
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const referral = await psychService.getReferralUrl();
                          if (referral && referral.referralCode && referral.fullUrl) {
                            setReferralCode(referral.referralCode);
                            setReferralUrl(referral.fullUrl);
                            setShowReferralModal(true);
                          } else {
                            toast.error('No se pudo obtener el código de referencia. Contacta con tu empresa.');
                          }
                        } catch (error: any) {
                          const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
                          toast.error('Error al obtener el código de referencia: ' + errorMsg);
                        }
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-5 py-2.5 backdrop-blur-sm transition-all duration-300 cursor-pointer text-sm font-medium border-none"
                    >
                      Invitar Paciente
                    </button>
                  </div>
                </div>
              </div>

              {/* Test de Matching - Aviso si no está completo */}
              {matchingTestCompleted === false && (
                <div className="p-5 bg-gantly-gold/10 border border-gantly-gold/20 rounded-2xl shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-base font-heading font-semibold text-gantly-text mb-1">
                        Test de Matching Pendiente
                      </h3>
                      <p className="text-sm font-body text-gantly-muted">
                        Completa el test de matching para que los pacientes puedan encontrarte.
                      </p>
                    </div>
                    <button
                      onClick={() => setTab('matching-test')}
                      className="px-5 py-2.5 bg-gantly-gold text-gantly-navy rounded-xl font-heading font-medium hover:bg-gantly-gold/90 transition-all duration-300 cursor-pointer text-sm whitespace-nowrap shadow-lg shadow-gantly-gold/20 border-none"
                    >
                      Completar Test
                    </button>
                  </div>
                </div>
              )}

              {/* Próxima cita */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                <h3 className="text-sm font-heading font-medium text-slate-500 uppercase tracking-wide mb-4">Proxima cita</h3>
                {(() => {
                  const now = new Date();
                  const upcomingAppointment = slots
                    .filter(s => (s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user)
                    .filter(apt => {
                      if (!apt.startTime || !apt.endTime) return false;
                      const aptDate = new Date(apt.startTime);
                      return aptDate > now;
                    })
                    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

                  return upcomingAppointment ? (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="text-lg font-heading font-bold text-gantly-text">
                          {new Date(upcomingAppointment.startTime).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          {new Date(upcomingAppointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {upcomingAppointment.user && (
                            <span> · {upcomingAppointment.user.name || upcomingAppointment.user.email}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-5 py-2.5 bg-gantly-blue text-white rounded-xl font-heading font-medium hover:bg-gantly-blue/90 transition-all duration-300 cursor-pointer text-sm shadow-lg shadow-gantly-blue/20 border-none"
                        onClick={async () => {
                          if (me && upcomingAppointment.user) {
                            try {
                              const roomInfo = await jitsiService.getRoomInfo(upcomingAppointment.user.email);
                              setVideoCallRoom(roomInfo.roomName);
                              setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                              setShowVideoCall(true);
                            } catch (error: any) {
                              toast.error(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                            }
                          }
                        }}
                      >
                        Iniciar Videollamada
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No tienes ninguna cita proxima.</p>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Test de Matching */}
          {tab === 'matching-test' && (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <PsychologistMatchingTest
                onComplete={async () => {
                  setMatchingTestCompleted(true);
                  try {
                    await checkMatchingTestStatus();
                  } catch (error) {
                    // Si falla, mantener true
                  }
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

          {/* Pacientes */}
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

          {/* Tareas */}
          {tab === 'tareas' && (
            <PsychTasksTab
              me={me}
              tasks={tasks}
              patients={patients}
              onRefresh={loadData}
            />
          )}

          {/* Tests Asignados */}
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

          {/* Calendario */}
          {tab === 'calendario' && (
            <div>
              {loadingSlots ? (
                <LoadingSpinner text="Cargando calendario..." />
              ) : (
                <>
              <CalendarWeek
                mode="PSYCHO"
                slots={slots}
                initialWeekStart={calendarWeekStart || undefined}
                onWeekChange={(weekStart) => setCalendarWeekStart(weekStart)}
                sessionPrices={psychologistProfile?.sessionPrices ? JSON.parse(psychologistProfile.sessionPrices) : null}
                patients={patients.map((p: any) => ({ id: p.id, name: p.name, email: p.email }))}
                onCreateSlot={async (start, end, price) => {
                  try {
                    const slotDate = new Date(start);
                    const day = (slotDate.getDay() + 6) % 7;
                    const slotWeekStart = new Date(slotDate);
                    slotWeekStart.setDate(slotDate.getDate() - day);
                    slotWeekStart.setHours(0, 0, 0, 0);
                    setCalendarWeekStart(slotWeekStart);

                    await calendarService.createSlot(start, end, price);
                    await loadMySlots();
                    await loadPendingRequests();
                    toast.success('Cita creada exitosamente');
                  } catch (e: any) {
                    const errorMessage = e?.response?.data?.error || 'Error al crear el slot';
                    toast.error(errorMessage);
                  }
                }}
                onCreateSlotsRange={async (slots) => {
                  try {
                    for (const slot of slots) {
                      await calendarService.createSlot(slot.start, slot.end, slot.price);
                    }
                    await loadMySlots();
                    await loadPendingRequests();
                    toast.success(`${slots.length} citas creadas exitosamente`);
                  } catch (e: any) {
                    const errorMessage = e?.response?.data?.error || 'Error al crear los slots';
                    toast.error(errorMessage);
                    throw e;
                  }
                }}
                onAssignToPatient={async (appointmentId, userId) => {
                  try {
                    const slot = slots.find(s => s.id === appointmentId);
                    if (!slot) {
                      throw new Error('Cita no encontrada');
                    }
                    await calendarService.deleteSlot(appointmentId);
                    await calendarService.createForPatient(
                      userId,
                      slot.startTime,
                      slot.endTime,
                      slot.price
                    );
                    await loadMySlots();
                    await loadPendingRequests();
                  } catch (e: any) {
                    const errorMessage = e?.response?.data?.error || 'Error al asignar la cita';
                    toast.error(errorMessage);
                    throw e;
                  }
                }}
                onDeleteSlot={async (appointmentId) => {
                  try {
                    await calendarService.deleteSlot(appointmentId);
                    await loadMySlots();
                    await loadPendingRequests();
                  } catch (e: any) {
                    // error handled silently
                  }
                }}
                onUpdateSlot={async (appointmentId, updates) => {
                  try {
                    await calendarService.updateSlot(appointmentId, updates);
                    await loadMySlots();
                    await loadPendingRequests();
                    toast.success('Cita actualizada exitosamente');
                  } catch (e: any) {
                    const errorMessage = e?.response?.data?.error || 'Error al actualizar la cita';
                    toast.error(errorMessage);
                  }
                }}
              />

              {/* Solicitudes Pendientes */}
              {pendingRequests.length > 0 && (
                <div
                  id="solicitudes-pendientes"
                  className="mt-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
                >
                  <h3 className="text-lg font-heading font-bold text-gantly-text mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-gantly-blue">schedule</span>
                    Citas por confirmar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="rounded-2xl p-5 border border-slate-100 bg-white hover:shadow-lg hover:shadow-gantly-blue/10 transition-all duration-300"
                      >
                        <div className="text-lg font-heading font-bold text-gantly-text mb-1">
                          {new Date(req.appointment.startTime).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                        <div className="text-sm text-slate-500 mb-3">
                          {new Date(req.appointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(req.appointment.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {req.appointment.price && (
                          <div className="text-sm font-medium text-slate-700 mb-1">{req.appointment.price} EUR</div>
                        )}
                        <div className="text-sm text-slate-600 mb-1">{req.user.name || req.user.email}</div>
                        <div className="text-xs text-slate-400 mb-4">
                          Solicitada: {new Date(req.requestedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (confirm('¿Confirmar esta cita para ' + (req.user.name || req.user.email) + '?')) {
                                try {
                                  await calendarService.confirmAppointment(req.id);
                                  toast.success('Cita confirmada exitosamente. Se ha enviado un correo al paciente.');
                                  await loadMySlots();
                                  await loadPendingRequests();
                                } catch (e: any) {
                                  toast.error(e?.response?.data?.error || 'Error al confirmar la cita');
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-gantly-blue text-white rounded-xl hover:bg-gantly-blue/90 transition-all duration-300 font-heading font-medium text-sm cursor-pointer border-none shadow-md shadow-gantly-blue/20"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('¿Cancelar esta cita?')) {
                                try {
                                  await calendarService.cancelAppointment(req.appointment.id);
                                  toast.success('Cita cancelada exitosamente');
                                  await loadMySlots();
                                  await loadPendingRequests();
                                } catch (e: any) {
                                  toast.error(e?.response?.data?.error || 'Error al cancelar la cita');
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors duration-200 font-medium text-sm cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citas Confirmadas y Reservadas */}
              {!loadingSlots && slots.filter(s => (s.status === 'CONFIRMED' || s.status === 'BOOKED') && s.user).length > 0 && (
                <div
                  id="citas-confirmadas"
                  data-section="citas-confirmadas"
                  className="mt-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
                >
                  <h3 className="text-lg font-heading font-bold text-gantly-text mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-gantly-blue">calendar_today</span>
                    Citas Confirmadas y Reservadas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slots.filter(s => (s.status === 'CONFIRMED' || s.status === 'BOOKED') && s.user).map(apt => {
                      const status = apt.status as string | undefined;
                      const isConfirmed = status === 'CONFIRMED';
                      const statusLabel = isConfirmed ? 'Confirmada' : 'Reservada';

                      return (
                        <div
                          key={apt.id}
                          className="rounded-2xl p-5 border border-slate-100 bg-white hover:shadow-lg hover:shadow-gantly-blue/10 transition-all duration-300"
                        >
                          <div className="text-lg font-heading font-bold text-gantly-text mb-1">
                            {new Date(apt.startTime).toLocaleDateString('es-ES', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                          <div className="text-sm font-body text-slate-500 mb-4">
                            {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {apt.endTime && new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 font-body font-medium">{apt.user?.name || 'Paciente'}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              isConfirmed ? 'bg-gantly-emerald/10 text-gantly-emerald' : 'bg-gantly-gold/10 text-gantly-gold'
                            }`}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          )}

          {/* Citas Pasadas */}
          {tab === 'citas-pasadas' && (
            <div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-6">
                <h3 className="text-lg font-heading font-bold text-gantly-text">Mis Citas Pasadas</h3>
                {myRating && myRating.averageRating !== null && (
                  <div
                    onClick={async () => {
                      if (myRating.totalRatings === 0 || !me?.id) return;
                      setShowRatingsModal(true);
                      setLoadingRatings(true);
                      try {
                        const list = await calendarService.getPsychologistRatings(me.id);
                        setRatingsList(list);
                      } catch (e) {
                        setRatingsList([]);
                      } finally {
                        setLoadingRatings(false);
                      }
                    }}
                    className="flex items-center gap-2 mt-2 cursor-pointer"
                    title={myRating.totalRatings > 0 ? 'Click para ver todas las resenas' : undefined}
                  >
                    <span className="text-gantly-gold">
                      {'★'.repeat(Math.round(myRating.averageRating))}{'☆'.repeat(5 - Math.round(myRating.averageRating))}
                    </span>
                    <span className="text-sm font-body font-medium text-gantly-muted">
                      {myRating.averageRating.toFixed(1)} de 5.0 ({myRating.totalRatings} valoraciones)
                    </span>
                  </div>
                )}
              </div>

              {loadingPastAppointmentsPsych ? (
                <div className="text-center py-10">
                  <p className="text-slate-500">Cargando citas pasadas...</p>
                </div>
              ) : pastAppointmentsPsych.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                  <p className="text-slate-400">No tienes citas pasadas aun</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pastAppointmentsPsych.map((apt: any) => (
                    <div
                      key={apt.id}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-gantly-blue/10 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="m-0 text-base font-heading font-semibold text-gantly-text">
                            Cita con {apt.user?.name || 'Paciente'}
                          </h4>
                          <div className="text-sm font-body text-gantly-muted mt-1">
                            {new Date(apt.startTime).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="text-sm font-body text-gantly-muted">
                            {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -
                            {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {apt.price && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-heading font-semibold text-gantly-emerald">
                                {parseFloat(apt.price).toFixed(2)} EUR
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-heading font-semibold ${
                                apt.paymentStatus === 'PAID' ? 'bg-gantly-emerald/10 text-gantly-emerald' : 'bg-gantly-gold/10 text-gantly-gold'
                              }`}>
                                {apt.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>
                          )}
                        </div>
                        {apt.rating ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={star <= apt.rating.rating ? 'text-gantly-gold' : 'text-slate-200'}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            {apt.rating.comment && (
                              <p className="m-0 text-xs text-slate-500 italic max-w-[200px] text-right">
                                &ldquo;{apt.rating.comment}&rdquo;
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 italic">Sin valorar</div>
                        )}
                      </div>
                      <SessionNotesSection appointmentId={apt.id} existingNotes={apt.notes} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat */}
          {tab === 'chat' && (
            <div className="flex gap-4 items-start">
              <div className="w-72 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm max-h-[600px] overflow-y-auto flex-shrink-0">
                <h4 className="m-0 mb-3 text-sm font-heading font-semibold text-gantly-text">Seleccionar Paciente</h4>
                {patients.length === 0 ? (
                  <div className="text-center py-5 text-slate-400 text-sm font-body">No hay pacientes asignados</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {patients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatient(p.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                          selectedPatient === p.id
                            ? 'bg-gantly-blue text-white shadow-md shadow-gantly-blue/20'
                            : 'bg-slate-50 text-slate-800 border border-slate-100 hover:bg-slate-100 hover:shadow-sm'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-sm flex-shrink-0">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-heading font-semibold truncate">{p.name}</div>
                          <div className={`text-xs font-body truncate ${selectedPatient === p.id ? 'opacity-80' : 'text-slate-500'}`}>{p.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <ChatWidget mode="PSYCHOLOGIST" otherId={selectedPatient || undefined} />
              </div>
            </div>
          )}

          {/* Vista de perfil de paciente */}
          {tab === 'patient-profile' && viewingPatientId && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              {loadingPatientDetails ? (
                <LoadingSpinner text="Cargando detalles del paciente..." />
              ) : patientDetails ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="m-0 text-2xl font-heading font-bold text-gantly-text">{patientDetails.name}</h2>
                      <p className="text-gantly-muted mt-1 text-sm font-body">{patientDetails.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setTab('pacientes');
                        setViewingPatientId(null);
                        setPatientDetails(null);
                        setPatientOverallStats(null);
                        setPatientStats(null);
                        setSelectedTestForStats(null);
                      }}
                      className="px-4 py-2 bg-slate-100 text-gantly-muted border border-slate-200 rounded-xl font-heading font-medium cursor-pointer text-sm hover:bg-slate-200 transition-colors duration-200"
                    >
                      ← Volver
                    </button>
                  </div>

                  <div className="mb-6 p-4 bg-gantly-cloud rounded-xl border border-slate-100">
                    <p className="text-sm font-body text-gantly-muted m-0"><strong className="font-heading">Fecha de registro:</strong> {patientDetails.createdAt ? new Date(patientDetails.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                    <p className="text-sm font-body text-gantly-muted m-0 mt-1"><strong className="font-heading">Tests completados:</strong> {patientDetails.tests?.length || 0}</p>
                    {patientDetails.gender && <p className="text-sm font-body text-gantly-muted m-0 mt-1"><strong className="font-heading">Genero:</strong> {patientDetails.gender}</p>}
                    {patientDetails.age && <p className="text-sm font-body text-gantly-muted m-0 mt-1"><strong className="font-heading">Edad:</strong> {patientDetails.age}</p>}
                  </div>

                  {patientOverallStats && patientOverallStats.factors && patientOverallStats.factors.length > 0 && (
                    <div className="mb-6 p-5 bg-white rounded-xl border border-slate-100">
                      <h3 className="mt-0 mb-4 text-base font-heading font-semibold text-gantly-text">Media general (todos los tests) - Factores</h3>
                      <div className="flex gap-6 items-center flex-wrap">
                        <div className="flex-1 min-w-[260px]">
                          <BarChart
                            data={patientOverallStats.factors.map((f: any) => ({
                              label: f.code || f.name,
                              value: Number(f.percentage) || 0,
                            }))}
                            maxValue={100}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 p-5 bg-white rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="m-0 text-base font-heading font-semibold text-gantly-text">Estadisticas por Test</h3>
                      <select
                        value={selectedTestForStats ?? ''}
                        onChange={(e) => {
                          const testId = e.target.value ? Number(e.target.value) : null;
                          setSelectedTestForStats(testId);
                          if (testId && viewingPatientId) {
                            loadPatientStats(viewingPatientId, testId);
                          } else {
                            setPatientStats(null);
                          }
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-body cursor-pointer"
                      >
                        <option value="">Selecciona test...</option>
                        {availableTests.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.title || t.code}</option>
                        ))}
                      </select>
                    </div>
                    {!selectedTestForStats && (
                      <p className="text-slate-500 text-sm mt-2">Selecciona un test para ver sus estadisticas.</p>
                    )}
                    {selectedTestForStats && loadingPatientDetails && (
                      <p className="text-slate-500 text-sm mt-2">Cargando estadisticas...</p>
                    )}
                    {selectedTestForStats && !loadingPatientDetails && patientStats && (
                      <div className="mt-4">
                        {patientStats.subfactors && patientStats.subfactors.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-heading font-semibold text-gantly-text mb-3">Subfactores</h4>
                            <div className="flex gap-6 items-center flex-wrap">
                              <div className="flex-1 min-w-[260px]">
                                <BarChart
                                  data={patientStats.subfactors.map((sf: any) => ({
                                    label: sf.subfactorName || sf.subfactorCode,
                                    value: Number(sf.percentage) || 0,
                                    lowPole: sf.minLabel,
                                    highPole: sf.maxLabel,
                                  }))}
                                  maxValue={100}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {patientStats.factors && patientStats.factors.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-heading font-semibold text-gantly-text mb-3">Factores</h4>
                            <div className="flex gap-6 items-center flex-wrap">
                              <div className="flex-1 min-w-[260px]">
                                <FactorChart
                                  data={patientStats.factors.map((f: any) => {
                                    const percentage = Number(f.percentage) || 0;
                                    const value = Math.round((percentage / 100) * 10);
                                    const code = f.factorCode || '';
                                    return {
                                      label: f.factorName || code,
                                      value: Math.max(1, Math.min(10, value)),
                                      lowPole: f.minLabel,
                                      highPole: f.maxLabel,
                                    };
                                  })}
                                  maxValue={10}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {patientDetails.tests && patientDetails.tests.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <p>Este paciente aun no ha completado ningun test.</p>
                    </div>
                  ) : patientDetails.tests && patientDetails.tests.length > 0 ? (
                    <div>
                      {patientDetails.tests.map((test: any) => (
                        <div key={test.testId} className="mb-5 p-5 bg-white rounded-xl border border-slate-100">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="m-0 text-base font-heading font-semibold text-gantly-text">{test.testTitle}</h3>
                              <p className="text-xs text-slate-400 mt-1 font-mono">Codigo: {test.testCode}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            {test.testCode === 'INITIAL' && test.answers && test.answers.length > 0 && (
                              <InitialTestSummary test={test} />
                            )}
                            <h4 className="text-sm font-heading font-semibold text-gantly-text mb-3">
                              Respuestas ({test.answers?.length || 0})
                            </h4>
                            {test.answers && test.answers.length > 0 ? (
                              <div>
                                {test.answers.map((answer: any, idx: number) => (
                                  <div key={answer.questionId} className="mb-2 p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[11px] w-5 h-5 flex items-center justify-center bg-gantly-blue text-white rounded-full font-semibold">
                                        {idx + 1}
                                      </span>
                                      <strong className="text-sm font-heading text-gantly-text">{answer.questionText}</strong>
                                    </div>
                                    <div className="pl-7">
                                      {answer.answerText ? (
                                        <div>
                                          <p className="m-0 text-sm text-slate-600">
                                            <strong>Respuesta:</strong> {answer.answerText}
                                            {answer.answerValue !== undefined && answer.answerValue !== null && (
                                              <span className="text-slate-400 ml-2">(Valor: {answer.answerValue})</span>
                                            )}
                                          </p>
                                          {answer.textValue && (
                                            <p className="m-0 text-xs text-slate-500 mt-0.5">
                                              <strong>Detalle:</strong> {answer.textValue}
                                            </p>
                                          )}
                                        </div>
                                      ) : answer.textValue ? (
                                        <p className="m-0 text-sm text-slate-600"><strong>Detalle:</strong> {answer.textValue}</p>
                                      ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                                        <p className="m-0 text-sm text-slate-600"><strong>Valor numerico:</strong> {answer.numericValue}</p>
                                      ) : (
                                        <p className="m-0 text-sm text-slate-400 italic">Sin respuesta registrada</p>
                                      )}
                                      {answer.createdAt && (
                                        <p className="text-xs text-slate-400 mt-0.5 m-0">
                                          {new Date(answer.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 text-sm">No hay respuestas registradas para este test.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState icon={<User className="w-12 h-12 text-slate-300" />} title="Paciente no encontrado" description="No se pudieron cargar los detalles del paciente." />
              )}
            </div>
          )}

          {/* Vista de detalles de test asignado */}
          {tab === 'test-details' && viewingTestDetails && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              {loadingTestDetails ? (
                <LoadingSpinner text="Cargando detalles del test..." />
              ) : testDetailsData && testAnswers ? (
                <>
                  {/* Header con botones */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="m-0 text-2xl font-heading font-bold text-gantly-text">{testAnswers.testTitle}</h2>
                      <p className="text-sm text-gantly-muted mt-1 font-mono">Codigo: {testAnswers.testCode}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => testReportRef.current?.exportPdf()}
                        className="px-4 py-2 bg-gantly-blue text-white border-none rounded-xl font-heading font-medium cursor-pointer text-sm flex items-center gap-1.5 hover:bg-gantly-blue/90 transition-all duration-300 shadow-md shadow-gantly-blue/20"
                      >
                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                        Exportar PDF
                      </button>
                      <button
                        onClick={() => {
                          setTab('tests-asignados');
                          setViewingTestDetails(null);
                          setTestDetailsData(null);
                          setTestAnswers(null);
                        }}
                        className="px-4 py-2 bg-slate-100 text-gantly-muted border border-slate-200 rounded-xl font-heading font-medium cursor-pointer text-sm hover:bg-slate-200 transition-colors duration-200"
                      >
                        Volver
                      </button>
                    </div>
                  </div>

                  {/* Informe estilo Delphos */}
                  {(() => {
                    const answers = testAnswers.answers || [];
                    const sortedByTime = answers.filter((a: any) => a.createdAt).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    const startTime = sortedByTime.length > 0 ? sortedByTime[0].createdAt : undefined;
                    const endTime = sortedByTime.length > 0 ? sortedByTime[sortedByTime.length - 1].createdAt : undefined;
                    let duration: string | undefined;
                    if (startTime && endTime) {
                      const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
                      const mins = Math.round(diffMs / 60000);
                      duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`;
                    }
                    const patientName = viewingTestDetails
                      ? (patients.find((p: any) => p.id === viewingTestDetails.patientId)?.name || testDetailsData.userEmail || 'Paciente')
                      : 'Paciente';

                    const reportData: TestReportData = {
                      testTitle: testAnswers.testTitle || '',
                      userName: patientName,
                      startTime,
                      endTime,
                      duration,
                      subfactors: (testDetailsData.subfactors || []).map((sf: any) => ({
                        code: sf.subfactorCode || '',
                        name: sf.subfactorName || sf.subfactorCode || '',
                        score: Number(sf.score) || 0,
                        maxScore: Number(sf.maxScore) || 0,
                        percentage: Number(sf.percentage) || 0,
                        minLabel: sf.minLabel,
                        maxLabel: sf.maxLabel,
                      })),
                      factors: (testDetailsData.factors || []).map((f: any) => ({
                        code: f.factorCode || '',
                        name: f.factorName || f.factorCode || '',
                        score: Number(f.score) || 0,
                        maxScore: Number(f.maxScore) || 0,
                        percentage: Number(f.percentage) || 0,
                        minLabel: f.minLabel,
                        maxLabel: f.maxLabel,
                      })),
                    };
                    return (
                      <div className="mb-6 border border-slate-100 rounded-xl overflow-hidden">
                        <TestReport ref={testReportRef} data={reportData} />
                      </div>
                    );
                  })()}

                  {/* Respuestas (colapsable) */}
                  <details className="mb-6 p-5 bg-white rounded-xl border border-slate-100">
                    <summary className="cursor-pointer text-base font-heading font-semibold text-gantly-text mb-4">
                      Respuestas ({testAnswers.answers?.length || 0})
                    </summary>
                    {testAnswers.answers && testAnswers.answers.length > 0 ? (
                      <div>
                        {testAnswers.answers.map((answer: any, idx: number) => (
                          <div key={answer.questionId} className="mb-2 p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] w-5 h-5 flex items-center justify-center bg-gantly-blue text-white rounded-full font-semibold">
                                {idx + 1}
                              </span>
                              <strong className="text-sm font-heading text-gantly-text">{answer.questionText}</strong>
                            </div>
                            <div className="pl-7">
                              {answer.answerText ? (
                                <div>
                                  <p className="m-0 text-sm text-slate-600">
                                    <strong>Respuesta:</strong> {answer.answerText}
                                    {answer.answerValue !== undefined && answer.answerValue !== null && (
                                      <span className="text-slate-400 ml-2">(Valor: {answer.answerValue})</span>
                                    )}
                                  </p>
                                  {answer.textValue && (
                                    <p className="m-0 text-xs text-slate-500 mt-0.5"><strong>Detalle:</strong> {answer.textValue}</p>
                                  )}
                                </div>
                              ) : answer.textValue ? (
                                <p className="m-0 text-sm text-slate-600"><strong>Detalle:</strong> {answer.textValue}</p>
                              ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                                <p className="m-0 text-sm text-slate-600"><strong>Valor numerico:</strong> {answer.numericValue}</p>
                              ) : (
                                <p className="m-0 text-sm text-slate-400 italic">Sin respuesta registrada</p>
                              )}
                              {answer.createdAt && (
                                <p className="text-xs text-slate-400 mt-0.5 m-0">
                                  {new Date(answer.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No hay respuestas registradas para este test.</p>
                    )}
                  </details>
                </>
              ) : (
                <EmptyState icon={<BarChart3 className="w-12 h-12 text-slate-300" />} title="Test no encontrado" description="No se pudieron cargar los detalles del test." />
              )}
            </div>
          )}

          {/* Videollamada Jitsi - NUNCA desmontar, usar ref para mantener montado */}
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
                  userName={userToUse.name || 'Psicologo'}
                  otherUserEmail={otherUserToUse?.email}
                  otherUserName={otherUserToUse?.name}
                  onClose={handleVideoCallClose}
                />
              </div>
            ) : null;
          })()}

          {/* Facturacion */}
          {tab === 'facturacion' && (
            <PsychBillingTab
              appointments={billingAppointments}
              loading={loadingBillingAppointments}
              onRefresh={loadBillingAppointments}
            />
          )}
        </div>
      </div>

      {/* Modal de Código de Referencia */}
      {showReferralModal && referralCode && referralUrl && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowReferralModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl shadow-slate-900/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-heading font-bold text-gantly-text m-0">Invitar Paciente</h3>
              <button
                onClick={() => setShowReferralModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Comparte este enlace con tus pacientes para que se unan directamente a tu consulta:
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Enlace de invitacion</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(referralUrl);
                      toast.success('Enlace copiado al portapapeles');
                    } catch (error) {
                      toast.error('Error al copiar el enlace');
                    }
                  }}
                  className="px-3 py-2 bg-gantly-blue text-white rounded-lg hover:bg-gantly-blue/90 transition-all duration-300 text-sm font-heading font-medium cursor-pointer border-none shadow-md shadow-gantly-blue/20"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Codigo de referencia</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralCode}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(referralCode);
                      toast.success('Codigo copiado al portapapeles');
                    } catch (error) {
                      toast.error('Error al copiar el codigo');
                    }
                  }}
                  className="px-3 py-2 bg-gantly-blue text-white rounded-lg hover:bg-gantly-blue/90 transition-all duration-300 text-sm font-heading font-medium cursor-pointer border-none shadow-md shadow-gantly-blue/20"
                >
                  Copiar
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Los pacientes que usen este enlace o codigo se uniran automaticamente a tu consulta como pacientes asignados.
            </p>

            <button
              onClick={() => setShowReferralModal(false)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading text-gantly-muted hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
