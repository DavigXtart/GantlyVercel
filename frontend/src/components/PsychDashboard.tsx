import { useEffect, useState, useCallback, useRef } from 'react';
import { profileService, psychService, calendarService, tasksService, assignedTestsService, testService, resultsService, matchingService, calendarNotesService, API_BASE_URL } from '../services/api';
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
    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(90,146,112,0.1)', paddingTop: '12px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#5a9270', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{expanded ? 'expand_less' : 'expand_more'}</span>
        Notas de sesión {existingNotes ? '(editadas)' : ''}
      </button>
      {expanded && (
        <div style={{ marginTop: '8px' }}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Escribe notas sobre esta sesión..."
            style={{ width: '100%', minHeight: '80px', padding: '12px', border: '1px solid rgba(90,146,112,0.2)', borderRadius: '12px', fontSize: '14px', fontFamily: "'Inter', sans-serif", resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{notes.length}/500</span>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '6px 16px', background: '#5a9270', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
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
      // Si es un 404, significa que el endpoint aún no está disponible (servidor no reiniciado)
      // En ese caso, asumimos que el test no está completo para mostrar el banner
      if (error.response?.status === 404) {
        setMatchingTestCompleted(false);
      } else {
        // Para otros errores, también asumimos false para mostrar el banner
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
    if (!me || checkingMatchingTest || matchingTestCompleted === null) return; // Esperar a que todo cargue
    if (hasCheckedInitialStatus) return; // Ya se verificó

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

  // El calendario se actualiza solo al cambiar a la pestaña de calendario (ya está en el useEffect de arriba)


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
      // Permitir seleccionar el mismo archivo nuevamente
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
      <div className="container" style={{ maxWidth: '1200px', padding: '40px' }}>
        <LoadingSpinner text="Cargando perfil..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-forest flex">
      {/* Sidebar */}
      <aside className="w-24 bg-cream sticky top-0 h-screen flex flex-col items-center pt-2 pb-10 z-40 border-none">
        <nav className="flex flex-col gap-4 w-full px-3">
          {[
            { id: 'perfil', icon: 'person', label: 'Perfil' },
            { id: 'pacientes', icon: 'people', label: 'Pacientes' },
            { id: 'tareas', icon: 'task_alt', label: 'Tareas' },
            { id: 'tests-asignados', icon: 'assignment', label: 'Tests' },
            { id: 'calendario', icon: 'calendar_today', label: 'Calendario' },
            { id: 'chat', icon: 'chat', label: 'Chat' },
            { id: 'citas-pasadas', icon: 'history', label: 'Citas' },
            { id: 'facturacion', icon: 'receipt_long', label: 'Facturac.' },
          ].map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as Tab)}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
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
      {showRatingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}
          onClick={() => setShowRatingsModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Reseñas de pacientes</h3>
              <button
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
                onClick={() => setShowRatingsModal(false)}
              >
                Cerrar
              </button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {loadingRatings ? (
                <p style={{ color: 'var(--text-secondary)' }}>Cargando reseñas...</p>
              ) : ratingsList.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No hay reseñas</p>
              ) : (
                ratingsList.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      marginBottom: '12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong>{r.patientName}</strong>
                      <span style={{ color: '#fbbf24', fontSize: '16px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{r.comment}</p>}
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{formatDate(r.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulseAlert {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
          }
          50% {
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
          }
        }
      `}</style>

        {/* Header hero solo en PERFIL */}
        {tab === 'perfil' && (
          <header className="bg-sage/10 rounded-[4rem] p-8 lg:p-12 mb-10 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <div className="size-28 md:size-32 rounded-full overflow-hidden border-4 border-white soft-shadow bg-sage/20 flex items-center justify-center">
                    {me?.avatarUrl ? (
                      <img
                        src={me.avatarUrl}
                        alt={me.name || 'Psicólogo'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl md:text-4xl text-forest font-semibold">
                        {me?.name ? me.name.charAt(0).toUpperCase() : 'P'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-2">
                    Hola,{' '}
                    <span className="italic text-sage">
                      {me?.name || 'tu espacio profesional'}.
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
                </div>
              </div>
              {/* Toggle Aceptando nuevos pacientes - integrado en el header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-sage/20 shadow-sm hover:bg-white/80 transition-all">
                <div className="text-right">
                  <div className="text-sm font-medium text-forest">
                    {me?.isFull ? 'Lleno' : 'Aceptando nuevos pacientes'}
                  </div>
                  <div className="text-xs text-sage/60">
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
                  <span className={`absolute inset-0 rounded-full transition-colors ${me?.isFull ? 'bg-red-400' : 'bg-green-400'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${me?.isFull ? 'translate-x-4' : ''}`} />
                  </span>
                </label>
              </div>
            </div>
          </header>
        )}

      {/* Perfil */}
      {/* Vista PERFIL: tarjetas resumen como en el diseño */}
      {tab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información del perfil */}
            <div className="bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
              <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                <div className="flex-1">
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
                      className="flex items-center gap-2 mb-3 cursor-pointer"
                      title={myRating.totalRatings > 0 ? 'Click para ver todas las reseñas' : undefined}
                    >
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= Math.round(myRating.averageRating!) ? 'text-yellow-400' : 'text-gray-300'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-forest">
                        {myRating.averageRating.toFixed(1)} ({myRating.totalRatings} valoraciones)
                      </span>
                    </div>
                  )}
                  <div className="flex gap-4 flex-wrap mt-4">
                    <button
                      onClick={async () => {
                        await loadPsychologistProfile();
                        setTab('editar-perfil-profesional');
                      }}
                      className="px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition"
                    >
                      Editar Perfil Profesional
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
                      className="px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition"
                    >
                      Invitar Paciente
                    </button>
                  </div>
                </div>
              </div>

              {/* Test de Matching - Aviso si no está completo */}
              {matchingTestCompleted === false && (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-2xl mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        ⚠️ Test de Matching Pendiente
                      </h3>
                      <p className="text-sm text-yellow-800">
                        Completa el test de matching para que los pacientes puedan encontrarte. Este test ayuda a conectar a los pacientes con psicólogos que mejor se adapten a sus necesidades.
                      </p>
                    </div>
                    <button
                      onClick={() => setTab('matching-test')}
                      className="px-6 py-3 bg-yellow-500 text-white rounded-full font-semibold hover:bg-yellow-600 transition shadow-sm whitespace-nowrap"
                    >
                      Completar Test
                    </button>
                  </div>
                </div>
              )}

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-sage/5 rounded-2xl border border-sage/20">
                  <div className="text-xs text-sage/70 mb-2 font-semibold uppercase tracking-wider">
                    Pacientes asignados
                  </div>
                  <div className="text-3xl font-bold text-forest">
                    {patients.length}
                  </div>
                </div>

                <div className="p-6 bg-sage/5 rounded-2xl border border-sage/20">
                  <div className="text-xs text-sage/70 mb-2 font-semibold uppercase tracking-wider">
                    Tareas creadas
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {tasks.filter(t => t.createdBy === 'PSYCHOLOGIST').length}
                  </div>
                </div>

                <div 
                  className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                    pendingRequests.length > 0 
                      ? 'bg-red-50 border-red-300 shadow-md animate-pulse' 
                      : 'bg-sage/5 border-sage/20'
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
                  <div className={`text-xs mb-2 font-semibold uppercase tracking-wider ${
                    pendingRequests.length > 0 ? 'text-red-700' : 'text-sage/70'
                  }`}>
                    {pendingRequests.length > 0 ? '⚠️ ' : ''}Citas por confirmar
                  </div>
                  <div className={`text-3xl font-bold ${
                    pendingRequests.length > 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {pendingRequests.length}
                  </div>
                </div>

              </div>
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

              {(() => {
                const now = new Date();
                const upcomingAppointment = slots
                  .filter(s => (s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user)
                  .filter(apt => {
                    if (!apt.startTime || !apt.endTime) return false;
                    const aptDate = new Date(apt.startTime);
                    return aptDate > now;
                  })
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

                return upcomingAppointment ? (
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
                        {upcomingAppointment.user && (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="material-symbols-outlined text-lg">
                              person
                            </span>
                            <span className="font-light">
                              {upcomingAppointment.user.name || upcomingAppointment.user.email}
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
                        if (me && upcomingAppointment.user) {
                          try {
                            const roomInfo = await jitsiService.getRoomInfo(
                              upcomingAppointment.user.email,
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
                          const citasSection = document.querySelector('[data-section="citas-confirmadas"]');
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
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Test de Matching */}
      {tab === 'matching-test' && (
        <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
          <PsychologistMatchingTest
            onComplete={async () => {
              // Marcar como completado optimísticamente
              setMatchingTestCompleted(true);
              // Verificar el estado real (si el endpoint está disponible)
              try {
                await checkMatchingTestStatus();
              } catch (error) {
                // Si falla (por ejemplo, 404 porque el servidor no se reinició), mantener true
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
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-3xl font-normal text-forest">
              Gestión de Calendario
            </h3>
          </div>
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
                // Calcular y guardar la semana de la cita antes de crearla
                const slotDate = new Date(start);
                const day = (slotDate.getDay() + 6) % 7; // Monday=0
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
                // Crear múltiples slots
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
                // Primero eliminar el slot libre para evitar solapamiento al crear la cita
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
              className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[22px] font-normal text-forest flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-sage">
                    schedule
                  </span>
                  Citas por confirmar
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow border border-sage/15 flex flex-col min-h-[190px] bg-white"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <p className="text-[10px] tracking-[0.25em] font-bold text-sage/50 uppercase">
                        Próxima cita
                      </p>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FAF5E6]">
                        <span className="material-symbols-outlined text-xl text-[#B29D6B]">
                          psychology
                        </span>
                      </div>
                    </div>

                    <h4 className="serif-font text-3xl text-forest mb-1">
                      {new Date(req.appointment.startTime).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                      })}
                    </h4>

                    <p className="text-sm text-sage/70 font-medium mb-4">
                      {new Date(req.appointment.startTime).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(req.appointment.endTime).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    {req.appointment.price && (
                      <p className="text-sm text-sage font-semibold mb-2">
                        {req.appointment.price} €
                      </p>
                    )}

                    <p className="text-sm text-sage/80 font-medium mb-2">
                      {req.user.name || req.user.email}
                    </p>

                    <p className="text-xs text-sage/60 mb-6">
                      Solicitada: {new Date(req.requestedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })} {new Date(req.requestedAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    <div className="mt-auto flex gap-3">
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
                        className="flex-1 px-4 py-2 bg-sage text-white rounded-xl hover:bg-sage/90 transition font-medium text-sm"
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
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium text-sm"
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
              style={{
                marginTop: '32px',
                background: '#ffffff',
                borderRadius: '20px',
                boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
                border: '1px solid rgba(90, 146, 112, 0.15)',
                padding: '32px'
              }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[22px] font-normal text-forest flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-sage">
                    calendar_today
                  </span>
                  Citas Confirmadas y Reservadas
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slots.filter(s => (s.status === 'CONFIRMED' || s.status === 'BOOKED') && s.user).map(apt => {
                  const status = apt.status as string | undefined;
                  const isConfirmed = status === 'CONFIRMED';
                  const isBooked = status === 'BOOKED';
                  
                  const statusLabel = isConfirmed ? 'Confirmada' : isBooked ? 'Reservada' : 'Programada';
                  const statusClasses = isConfirmed 
                    ? 'bg-[#F1F8F6] text-[#6B8B7E]'
                    : 'bg-[#FAF5E6] text-[#9A8754]';
                  const badgeBg = isConfirmed ? 'bg-[#E9F0EE]' : 'bg-[#F7F3E6]';
                  const badgeIconColor = isConfirmed ? 'text-[#8DA399]' : 'text-[#B29D6B]';
                  
                  return (
                    <div
                      key={apt.id}
                      className="rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow border border-sage/15 flex flex-col min-h-[190px] bg-white"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <p className="text-[10px] tracking-[0.25em] font-bold text-sage/50 uppercase">
                          Próxima cita
                        </p>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${badgeBg}`}>
                          <span className={`material-symbols-outlined text-xl ${badgeIconColor}`}>
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
                          {apt.user?.name || 'Paciente'}
                        </span>
                        <span className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-[13px] font-medium shadow-sm ${statusClasses}`}>
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
        <div className="mt-10 w-full">
          <div className="bg-white rounded-3xl p-8 border border-sage/10 soft-shadow mb-6">
            <h3 className="text-3xl font-normal text-forest mb-6">
              Mis Citas Pasadas
            </h3>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '16px',
                  cursor: myRating.totalRatings > 0 ? 'pointer' : 'default'
                }}
                title={myRating.totalRatings > 0 ? 'Click para ver todas las reseñas' : undefined}
              >
                <span style={{ fontSize: '24px', color: '#fbbf24' }}>
                  {'★'.repeat(Math.round(myRating.averageRating))}
                  {'☆'.repeat(5 - Math.round(myRating.averageRating))}
                </span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                  {myRating.averageRating.toFixed(1)} de 5.0 ({myRating.totalRatings} valoraciones)
                </span>
              </div>
            )}
          </div>

          {loadingPastAppointmentsPsych ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>Cargando citas pasadas...</p>
            </div>
          ) : pastAppointmentsPsych.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
              padding: '60px',
              border: '1px solid rgba(90, 146, 112, 0.15)',
              textAlign: 'center'
            }}>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>No tienes citas pasadas aún</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {pastAppointmentsPsych.map((apt: any) => (
                <div
                  key={apt.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    padding: '24px',
                    border: '1px solid rgba(90, 146, 112, 0.15)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                        Cita con {apt.user?.name || 'Paciente'}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        {new Date(apt.startTime).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {apt.price && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '14px', color: '#059669', fontWeight: 600 }}>
                            {parseFloat(apt.price).toFixed(2)}€
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                            background: apt.paymentStatus === 'PAID' ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
                            color: apt.paymentStatus === 'PAID' ? '#16a34a' : '#ca8a04',
                          }}>
                            {apt.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                      )}
                    </div>
                    {apt.rating ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{
                                fontSize: '20px',
                                color: star <= apt.rating.rating ? '#fbbf24' : '#d1d5db'
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {apt.rating.comment && (
                          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontStyle: 'italic', maxWidth: '200px', textAlign: 'right' }}>
                            "{apt.rating.comment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>
                        Sin valorar
                      </div>
                    )}
                  </div>
                  {/* Session Notes */}
                  <SessionNotesSection appointmentId={apt.id} existingNotes={apt.notes} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {tab === 'chat' && (
        <div className="mt-10">
          <div className="flex gap-6 items-start">
            <div className="w-80 bg-white rounded-3xl p-6 border border-sage/10 soft-shadow max-h-[600px] overflow-y-auto">
              <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                Seleccionar Paciente
              </h4>
              {patients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>
                  No hay pacientes asignados
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p.id)}
                      style={{
                        padding: '12px',
                        background: selectedPatient === p.id ? 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)' : '#f9fafb',
                        color: selectedPatient === p.id ? 'white' : '#1f2937',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: selectedPatient === p.id ? 'none' : '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPatient !== p.id) {
                          e.currentTarget.style.background = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPatient !== p.id) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>{p.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ flex: 1, width: '100%', minWidth: 0 }}>
              <ChatWidget mode="PSYCHOLOGIST" otherId={selectedPatient || undefined} />
            </div>
          </div>
        </div>
      )}

      {/* Vista de perfil de paciente */}
      {tab === 'patient-profile' && viewingPatientId && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          {loadingPatientDetails ? (
            <LoadingSpinner text="Cargando detalles del paciente..." />
          ) : patientDetails ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{patientDetails.name}</h2>
                  <p style={{ color: '#6b7280', marginTop: '4px' }}>{patientDetails.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setTab('pacientes');
                      setViewingPatientId(null);
                      setPatientDetails(null);
                      setPatientOverallStats(null);
                      setPatientStats(null);
                      setSelectedTestForStats(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#f3f4f6',
                      color: '#1f2937',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ← Volver
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                <p><strong>Fecha de registro:</strong> {patientDetails.createdAt ? new Date(patientDetails.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                <p><strong>Tests completados:</strong> {patientDetails.tests?.length || 0}</p>
                {patientDetails.gender && <p><strong>Género:</strong> {patientDetails.gender}</p>}
                {patientDetails.age && <p><strong>Edad:</strong> {patientDetails.age}</p>}
              </div>

              {patientOverallStats && patientOverallStats.factors && patientOverallStats.factors.length > 0 && (
                <div style={{ marginBottom: '24px', padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Media general (todos los tests) - Factores</h3>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
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

              <div style={{ marginBottom: '24px', padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Estadísticas por Test</h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                      style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    >
                      <option value="">Selecciona test…</option>
                      {availableTests.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title || t.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {!selectedTestForStats && (
                  <p style={{ color: '#6b7280', marginTop: '8px' }}>Selecciona un test para ver sus estadísticas.</p>
                )}
                {selectedTestForStats && loadingPatientDetails && (
                  <p style={{ color: '#6b7280', marginTop: '8px' }}>Cargando estadísticas...</p>
                )}
                {selectedTestForStats && !loadingPatientDetails && patientStats && (
                  <div style={{ marginTop: '16px' }}>
                    {patientStats.subfactors && patientStats.subfactors.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <h4>Subfactores (gráfico)</h4>
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 260 }}>
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
                      <div style={{ marginBottom: '24px' }}>
                        <h4>Factores (gráfico)</h4>
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 260 }}>
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
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p>Este paciente aún no ha completado ningún test.</p>
                </div>
              ) : patientDetails.tests && patientDetails.tests.length > 0 ? (
                <div>
                  {patientDetails.tests.map((test: any) => (
                    <div key={test.testId} style={{ marginBottom: '24px', padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>{test.testTitle}</h3>
                          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            Código: {test.testCode}
                          </p>
                        </div>
                      </div>
                      <div style={{ marginTop: '20px' }}>
                        {test.testCode === 'INITIAL' && test.answers && test.answers.length > 0 && (
                          <InitialTestSummary test={test} />
                        )}
                        <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>
                          Respuestas ({test.answers?.length || 0})
                        </h4>
                        {test.answers && test.answers.length > 0 ? (
                          <div>
                            {test.answers.map((answer: any, idx: number) => (
                              <div key={answer.questionId} style={{ marginBottom: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '12px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#5a9270', color: 'white', borderRadius: '50%', fontWeight: 600 }}>
                                    {idx + 1}
                                  </span>
                                  <strong style={{ fontSize: '15px' }}>{answer.questionText}</strong>
                                </div>
                                <div style={{ paddingLeft: '32px' }}>
                                  {answer.answerText ? (
                                    <div>
                                      <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                        <strong>Respuesta:</strong> {answer.answerText}
                                        {answer.answerValue !== undefined && answer.answerValue !== null && (
                                          <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                                            (Valor: {answer.answerValue})
                                          </span>
                                        )}
                                      </p>
                                      {answer.textValue && (
                                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                                          <strong>Detalle:</strong> {answer.textValue}
                                        </p>
                                      )}
                                    </div>
                                  ) : answer.textValue ? (
                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                      <strong>Detalle:</strong> {answer.textValue}
                                    </p>
                                  ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                      <strong>Valor numérico:</strong> {answer.numericValue}
                                    </p>
                                  ) : (
                                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                                      Sin respuesta registrada
                                    </p>
                                  )}
                                  {answer.createdAt && (
                                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                      {new Date(answer.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#6b7280' }}>No hay respuestas registradas para este test.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState icon="👤" title="Paciente no encontrado" description="No se pudieron cargar los detalles del paciente." />
          )}
        </div>
      )}

      {/* Vista de detalles de test asignado */}
      {tab === 'test-details' && viewingTestDetails && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          {loadingTestDetails ? (
            <LoadingSpinner text="Cargando detalles del test..." />
          ) : testDetailsData && testAnswers ? (
            <>
              {/* Header con botones */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{testAnswers.testTitle}</h2>
                  <p style={{ color: '#6b7280', marginTop: '4px' }}>
                    Código: {testAnswers.testCode}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => testReportRef.current?.exportPdf()}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => {
                      setTab('tests-asignados');
                      setViewingTestDetails(null);
                      setTestDetailsData(null);
                      setTestAnswers(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#f3f4f6',
                      color: '#1f2937',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
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
                  <div style={{ marginBottom: '24px', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                    <TestReport ref={testReportRef} data={reportData} />
                  </div>
                );
              })()}

              {/* Respuestas (colapsable) */}
              <details style={{ marginBottom: '24px', padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <summary style={{ cursor: 'pointer', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                  Respuestas ({testAnswers.answers?.length || 0})
                </summary>
                {testAnswers.answers && testAnswers.answers.length > 0 ? (
                  <div>
                    {testAnswers.answers.map((answer: any, idx: number) => (
                      <div key={answer.questionId} style={{ marginBottom: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#5a9270', color: 'white', borderRadius: '50%', fontWeight: 600 }}>
                            {idx + 1}
                          </span>
                          <strong style={{ fontSize: '15px' }}>{answer.questionText}</strong>
                        </div>
                        <div style={{ paddingLeft: '32px' }}>
                          {answer.answerText ? (
                            <div>
                              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                <strong>Respuesta:</strong> {answer.answerText}
                                {answer.answerValue !== undefined && answer.answerValue !== null && (
                                  <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                                    (Valor: {answer.answerValue})
                                  </span>
                                )}
                              </p>
                              {answer.textValue && (
                                <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                                  <strong>Detalle:</strong> {answer.textValue}
                                </p>
                              )}
                            </div>
                          ) : answer.textValue ? (
                            <p style={{ margin: '4px 0', fontSize: '14px' }}>
                              <strong>Detalle:</strong> {answer.textValue}
                            </p>
                          ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                            <p style={{ margin: '4px 0', fontSize: '14px' }}>
                              <strong>Valor numérico:</strong> {answer.numericValue}
                            </p>
                          ) : (
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                              Sin respuesta registrada
                            </p>
                          )}
                          {answer.createdAt && (
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              {new Date(answer.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280' }}>No hay respuestas registradas para este test.</p>
                )}
              </details>
            </>
          ) : (
            <EmptyState icon="📊" title="Test no encontrado" description="No se pudieron cargar los detalles del test." />
          )}
        </div>
      )}

      {/* Videollamada Jitsi - NUNCA desmontar, usar ref para mantener montado */}
      {(() => {
        // Si tenemos una referencia, renderizar el componente incluso si showVideoCall es false temporalmente
        const shouldRender = showVideoCall || (videoCallRef.current && videoCallRef.current.room);
        const roomToUse: string | undefined = showVideoCall ? (videoCallRoom ?? undefined) : (videoCallRef.current?.room ?? undefined);
        const userToUse = showVideoCall ? me : videoCallRef.current?.user;
        const otherUserToUse = showVideoCall ? videoCallOtherUser : videoCallRef.current?.otherUser;
        
        return shouldRender && roomToUse && userToUse ? (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, pointerEvents: 'auto' }}>
            <JitsiVideoCall
              key={`jitsi-${roomToUse}`} // Key estable para evitar re-montajes
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

      {/* Facturación */}
      {tab === 'facturacion' && (
        <PsychBillingTab
          appointments={billingAppointments}
          loading={loadingBillingAppointments}
          onRefresh={loadBillingAppointments}
        />
      )}
      </main>

      {/* Modal de Código de Referencia */}
      {showReferralModal && referralCode && referralUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReferralModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full border border-sage/10 soft-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-normal text-forest">
                Invitar Paciente
              </h3>
              <button
                onClick={() => setShowReferralModal(false)}
                className="text-sage/60 hover:text-forest transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-sage/70 mb-4">
              Comparte este enlace con tus pacientes para que se unan directamente a tu consulta:
            </p>

            <div className="bg-sage/5 rounded-2xl p-4 mb-4 border border-sage/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-sage/70 font-semibold uppercase tracking-wider">
                  Enlace de invitación
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 bg-white border border-sage/20 rounded-xl px-4 py-2 text-sm text-forest"
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
                  className="px-4 py-2 bg-sage text-white rounded-xl hover:bg-sage/90 transition text-sm font-medium"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="bg-sage/5 rounded-2xl p-4 mb-4 border border-sage/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-sage/70 font-semibold uppercase tracking-wider">
                  Código de referencia
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralCode}
                  className="flex-1 bg-white border border-sage/20 rounded-xl px-4 py-2 text-sm text-forest font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(referralCode);
                      toast.success('Código copiado al portapapeles');
                    } catch (error) {
                      toast.error('Error al copiar el código');
                    }
                  }}
                  className="px-4 py-2 bg-sage text-white rounded-xl hover:bg-sage/90 transition text-sm font-medium"
                >
                  Copiar
                </button>
              </div>
            </div>

            <p className="text-xs text-sage/60 mb-4">
              Los pacientes que usen este enlace o código se unirán automáticamente a tu consulta como pacientes asignados.
            </p>

            <button
              onClick={() => setShowReferralModal(false)}
              className="w-full px-4 py-2 rounded-full border border-sage/30 text-sm text-sage hover:bg-sage hover:text-white transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}