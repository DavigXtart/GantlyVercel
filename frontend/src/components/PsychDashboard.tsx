import { useEffect, useState, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { profileService, psychService, calendarService, tasksService, assignedTestsService, testService, jitsiService, resultsService, matchingService, consentService, calendarNotesService, API_BASE_URL } from '../services/api';
import ChatWidget from './ChatWidget';
import CalendarWeek from './CalendarWeek';
import JitsiVideoCall from './JitsiVideoCall';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';
import { toast } from './ui/Toast';
import BarChart from './BarChart';
import FactorChart from './FactorChart';
import InitialTestSummary from './InitialTestSummary';
import PsychologistMatchingTest from './PsychologistMatchingTest';
import NotificationBell from './ui/NotificationBell';

const GroupSessions = lazy(() => import('./GroupSessions'));

type Tab = 'perfil' | 'pacientes' | 'calendario' | 'tareas' | 'chat' | 'citas-pasadas' | 'tests-asignados' | 'patient-profile' | 'test-details' | 'editar-perfil-profesional' | 'matching-test' | 'grupos';

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
  const [_editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', gender: '', age: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ userId: '', title: '', description: '', dueDate: '' });
  const [showAssignTestForm, setShowAssignTestForm] = useState(false);
  const [assignTestForm, setAssignTestForm] = useState({ userId: '', testId: '' });
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [taskFiles, setTaskFiles] = useState<Record<number, any[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
  const [selectedPatientForTasks, setSelectedPatientForTasks] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskComments, setTaskComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState<string>('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState<string | null>(null);
  const [videoCallOtherUser, setVideoCallOtherUser] = useState<{ email: string; name: string } | null>(null);
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // Estados para filtros de pacientes
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientFilterGender, setPatientFilterGender] = useState<string>('');
  const [patientFilterLastVisit, setPatientFilterLastVisit] = useState<string>('');

  // Consentimientos para menores
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentDocTypes, setConsentDocTypes] = useState<any[]>([]);
  const [consentForm, setConsentForm] = useState({ userId: 0, documentTypeId: 0, place: '' });
  const [sendingConsent, setSendingConsent] = useState(false);
  
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
  const [myRating, setMyRating] = useState<{ averageRating: number | null; totalRatings: number } | null>(null);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [ratingsList, setRatingsList] = useState<Array<{ rating: number; comment: string; patientName: string; createdAt: string }>>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  
  // Estados para perfil profesional del psicólogo
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);
  const [loadingPsychProfile, setLoadingPsychProfile] = useState(false);
  const [psychProfileForm, setPsychProfileForm] = useState({
    bio: '',
    education: [] as Array<{ degree: string; field: string; institution: string; startDate: string; endDate: string }>,
    certifications: [] as Array<{ name: string; issuer: string; date: string; credentialId: string }>,
    interests: [] as string[],
    specializations: [] as string[],
    experience: [] as Array<{ title: string; company: string; description: string; startDate: string; endDate: string }>,
    languages: [] as Array<{ language: string; level: string }>,
    linkedinUrl: '',
    website: ''
  });
  
  // Estados para test de matching
  const [matchingTestCompleted, setMatchingTestCompleted] = useState<boolean | null>(null);
  const [checkingMatchingTest, setCheckingMatchingTest] = useState(false);
  const [hasCheckedInitialStatus, setHasCheckedInitialStatus] = useState(false);
  
  // Ref para mantener el componente montado incluso si showVideoCall cambia temporalmente
  const videoCallRef = useRef<{ room: string | null; user: any; otherUser: any } | null>(null);
  
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

  // Filtrar pacientes según búsqueda, género y última visita
  const filteredPatients = useMemo(() => {
    let filtered = patients;
    
    // Filtro por búsqueda
    if (patientSearchTerm.trim()) {
      const query = patientSearchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || '').toLowerCase().includes(query) ||
        (p.email || '').toLowerCase().includes(query)
      );
    }
    
    // Filtro por género
    if (patientFilterGender) {
      filtered = filtered.filter(p => p.gender === patientFilterGender);
    }
    
    // Filtro por última visita
    if (patientFilterLastVisit) {
      const now = new Date();
      filtered = filtered.filter(p => {
        if (!p.lastVisit) {
          return patientFilterLastVisit === 'none';
        }
        
        const lastVisitDate = new Date(p.lastVisit);
        const daysDiff = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (patientFilterLastVisit) {
          case 'week':
            return daysDiff <= 7;
          case 'month':
            return daysDiff <= 30;
          case '3months':
            return daysDiff <= 90;
          case 'more3months':
            return daysDiff > 90;
          case 'none':
            return false; // Ya se maneja arriba
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [patients, patientSearchTerm, patientFilterGender, patientFilterLastVisit]);

  // Separar pacientes por status
  const isPatientMinor = (p: any) => p.isMinor === true || p.minor === true;
  const minorPatients = useMemo(() => filteredPatients.filter(isPatientMinor), [filteredPatients]);
  const activePatients = useMemo(() => filteredPatients.filter(p => !isPatientMinor(p) && (p.status || 'ACTIVE') === 'ACTIVE'), [filteredPatients]);
  const dischargedPatients = useMemo(() => filteredPatients.filter(p => !isPatientMinor(p) && p.status === 'DISCHARGED'), [filteredPatients]);

  // Agrupar tareas por paciente
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

  // Obtener pacientes que tienen tareas
  const patientsWithTasks = patients.filter((p: any) => tasksByPatient[p.id] && tasksByPatient[p.id].length > 0);

  const _toggleTaskExpanded = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
      if (!taskFiles[taskId]) {
        loadTaskFiles(taskId);
      }
    }
    setExpandedTasks(newExpanded);
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

  useEffect(() => {
    if (tab === 'tareas' && tasks.length > 0) {
      // Cargar archivos de todas las tareas solo una vez
      tasks.forEach(t => {
        if (!taskFiles[t.id]) {
          loadTaskFiles(t.id);
        }
      });
    }
  }, [tab, tasks.length]); // Solo dependemos de la longitud, no del array completo

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
      setLoadingPsychProfile(true);
      const profile = await psychService.getProfile();
      setPsychologistProfile(profile);
      // Convertir JSON strings a arrays
      const parseJsonField = (field: string | null, defaultValue: any) => {
        if (!field) return defaultValue;
        try {
          return JSON.parse(field);
        } catch {
          return defaultValue;
        }
      };
      setPsychProfileForm({
        bio: profile.bio || '',
        education: parseJsonField(profile.education, []),
        certifications: parseJsonField(profile.certifications, []),
        interests: parseJsonField(profile.interests, []),
        specializations: parseJsonField(profile.specializations, []),
        experience: parseJsonField(profile.experience, []),
        languages: parseJsonField(profile.languages, []),
        linkedinUrl: profile.linkedinUrl || '',
        website: profile.website || ''
      });
    } catch (error: any) {
      toast.error('Error al cargar el perfil profesional');
    } finally {
      setLoadingPsychProfile(false);
    }
  };

  const savePsychologistProfile = async () => {
    try {
      setLoadingPsychProfile(true);
      // Convertir arrays a JSON strings antes de enviar
      const profileToSave = {
        bio: psychProfileForm.bio,
        education: psychProfileForm.education.length > 0 ? JSON.stringify(psychProfileForm.education) : undefined,
        certifications: psychProfileForm.certifications.length > 0 ? JSON.stringify(psychProfileForm.certifications) : undefined,
        interests: psychProfileForm.interests.length > 0 ? JSON.stringify(psychProfileForm.interests) : undefined,
        specializations: psychProfileForm.specializations.length > 0 ? JSON.stringify(psychProfileForm.specializations) : undefined,
        experience: psychProfileForm.experience.length > 0 ? JSON.stringify(psychProfileForm.experience) : undefined,
        languages: psychProfileForm.languages.length > 0 ? JSON.stringify(psychProfileForm.languages) : undefined,
        linkedinUrl: psychProfileForm.linkedinUrl,
        website: psychProfileForm.website
      };
      await psychService.updateProfile(profileToSave);
      await loadPsychologistProfile();
      toast.success('Perfil profesional actualizado exitosamente');
      setTab('perfil');
    } catch (error: any) {
      toast.error('Error al guardar el perfil profesional: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoadingPsychProfile(false);
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
      <aside className="w-24 bg-white border-r border-sage/10 h-screen sticky top-0 flex flex-col items-center py-10 z-40">
        <nav className="flex flex-col gap-4 w-full px-3 pt-2">
          {[
            { id: 'perfil', icon: 'person', label: 'Perfil' },
            { id: 'pacientes', icon: 'people', label: 'Pacientes' },
            { id: 'tareas', icon: 'task_alt', label: 'Tareas' },
            { id: 'tests-asignados', icon: 'assignment', label: 'Tests' },
            { id: 'calendario', icon: 'calendar_today', label: 'Calendario' },
            { id: 'chat', icon: 'chat', label: 'Chat' },
            { id: 'citas-pasadas', icon: 'history', label: 'Citas' },
            { id: 'grupos', icon: 'group', label: 'Grupos' },
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
      <main className="flex-1 p-8 lg:p-12 relative overflow-x-hidden">
      {/* Notification bell */}
      <div className="flex justify-end mb-4">
        <NotificationBell />
      </div>
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

      {/* Editar Perfil Profesional - Página completa estilo LinkedIn */}
      {tab === 'editar-perfil-profesional' && (
        <div className="mt-10 bg-white rounded-3xl p-8 lg:p-12 border border-sage/10 soft-shadow max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-normal text-forest">
              Editar Perfil Profesional
            </h2>
            <button
              onClick={() => setTab('perfil')}
              className="px-6 py-3 bg-sage/10 text-forest rounded-full font-medium hover:bg-sage hover:text-white transition border border-sage/20"
            >
              ← Volver al Perfil
            </button>
          </div>

          {loadingPsychProfile ? (
            <LoadingSpinner text="Cargando perfil profesional..." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Biografía */}
              <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                  Biografía / Sobre mí
                </h3>
                <textarea
                  value={psychProfileForm.bio}
                  onChange={(e) => setPsychProfileForm({ ...psychProfileForm, bio: e.target.value })}
                  placeholder="Escribe una breve biografía sobre ti, tu experiencia y tu enfoque profesional..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    lineHeight: '1.6'
                  }}
                />
              </div>

              {/* Educación */}
              <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                    Educación
                  </h3>
                  <button
                    onClick={() => setPsychProfileForm({
                      ...psychProfileForm,
                      education: [...psychProfileForm.education, { degree: '', field: '', institution: '', startDate: '', endDate: '' }]
                    })}
                    style={{
                      padding: '8px 16px',
                      background: '#5a9270',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Añadir
                  </button>
                </div>
                {psychProfileForm.education.map((edu, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Título</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const newEducation = [...psychProfileForm.education];
                            newEducation[idx].degree = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                          }}
                          placeholder="Ej: Licenciatura, Grado, Máster..."
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Campo de estudio</label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => {
                            const newEducation = [...psychProfileForm.education];
                            newEducation[idx].field = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                          }}
                          placeholder="Ej: Psicología, Psicología Clínica..."
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Institución</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEducation = [...psychProfileForm.education];
                          newEducation[idx].institution = e.target.value;
                          setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                        }}
                        placeholder="Ej: Universidad Complutense de Madrid"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha inicio</label>
                        <input
                          type="text"
                          value={edu.startDate}
                          onChange={(e) => {
                            const newEducation = [...psychProfileForm.education];
                            newEducation[idx].startDate = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                          }}
                          placeholder="Ej: 2010"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha fin</label>
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => {
                            const newEducation = [...psychProfileForm.education];
                            newEducation[idx].endDate = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                          }}
                          placeholder="Ej: 2014 o 'En curso'"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newEducation = psychProfileForm.education.filter((_, i) => i !== idx);
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {psychProfileForm.education.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                    No hay educación añadida. Haz clic en "+ Añadir" para agregar una entrada.
                  </div>
                )}
              </div>

              {/* Certificaciones */}
              <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                    Certificaciones
                  </h3>
                  <button
                    onClick={() => setPsychProfileForm({
                      ...psychProfileForm,
                      certifications: [...psychProfileForm.certifications, { name: '', issuer: '', date: '', credentialId: '' }]
                    })}
                    style={{
                      padding: '8px 16px',
                      background: '#5a9270',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Añadir
                  </button>
                </div>
                {psychProfileForm.certifications.map((cert, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Nombre de la certificación</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const newCerts = [...psychProfileForm.certifications];
                          newCerts[idx].name = e.target.value;
                          setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                        }}
                        placeholder="Ej: Certificación en Terapia Cognitivo-Conductual"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Emitido por</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => {
                            const newCerts = [...psychProfileForm.certifications];
                            newCerts[idx].issuer = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                          }}
                          placeholder="Ej: Colegio Oficial de Psicólogos"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha</label>
                        <input
                          type="text"
                          value={cert.date}
                          onChange={(e) => {
                            const newCerts = [...psychProfileForm.certifications];
                            newCerts[idx].date = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                          }}
                          placeholder="Ej: 2020"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>ID de credencial (opcional)</label>
                      <input
                        type="text"
                        value={cert.credentialId}
                        onChange={(e) => {
                          const newCerts = [...psychProfileForm.certifications];
                          newCerts[idx].credentialId = e.target.value;
                          setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                        }}
                        placeholder="Ej: ABC123"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newCerts = psychProfileForm.certifications.filter((_, i) => i !== idx);
                        setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {psychProfileForm.certifications.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                    No hay certificaciones añadidas. Haz clic en "+ Añadir" para agregar una entrada.
                  </div>
                )}
              </div>

              {/* Experiencia */}
              <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                    Experiencia Profesional
                  </h3>
                  <button
                    onClick={() => setPsychProfileForm({
                      ...psychProfileForm,
                      experience: [...psychProfileForm.experience, { title: '', company: '', description: '', startDate: '', endDate: '' }]
                    })}
                    style={{
                      padding: '8px 16px',
                      background: '#5a9270',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Añadir
                  </button>
                </div>
                {psychProfileForm.experience.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Cargo / Título</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const newExp = [...psychProfileForm.experience];
                            newExp[idx].title = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                          }}
                          placeholder="Ej: Psicólogo Clínico"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Empresa / Centro</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = [...psychProfileForm.experience];
                            newExp[idx].company = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                          }}
                          placeholder="Ej: Centro de Psicología Clínica"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Descripción</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => {
                          const newExp = [...psychProfileForm.experience];
                          newExp[idx].description = e.target.value;
                          setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                        }}
                        placeholder="Describe tus responsabilidades y logros..."
                        rows={3}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha inicio</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const newExp = [...psychProfileForm.experience];
                            newExp[idx].startDate = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                          }}
                          placeholder="Ej: 2015"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha fin</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => {
                            const newExp = [...psychProfileForm.experience];
                            newExp[idx].endDate = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                          }}
                          placeholder="Ej: 2020 o 'Actual'"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newExp = psychProfileForm.experience.filter((_, i) => i !== idx);
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {psychProfileForm.experience.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                    No hay experiencia añadida. Haz clic en "+ Añadir" para agregar una entrada.
                  </div>
                )}
              </div>

              {/* Especializaciones */}
              <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                    Especializaciones
                  </h3>
                  <button
                    onClick={() => {
                      const newSpec = prompt('Ingresa una especialización:');
                      if (newSpec && newSpec.trim()) {
                        setPsychProfileForm({
                          ...psychProfileForm,
                          specializations: [...psychProfileForm.specializations, newSpec.trim()]
                        });
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#5a9270',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Añadir
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {psychProfileForm.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#dcfce7',
                        color: '#15803d',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      {spec}
                      <button
                        onClick={() => {
                          const newSpecs = psychProfileForm.specializations.filter((_, i) => i !== idx);
                          setPsychProfileForm({ ...psychProfileForm, specializations: newSpecs });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#15803d',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: 0,
                          marginLeft: '4px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {psychProfileForm.specializations.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                    No hay especializaciones añadidas. Haz clic en "+ Añadir" para agregar una.
                  </div>
                )}
              </div>

              {/* Intereses */}
              <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                    Intereses y Pasiones
                  </h3>
                  <button
                    onClick={() => {
                      const newInterest = prompt('Ingresa un interés o pasión:');
                      if (newInterest && newInterest.trim()) {
                        setPsychProfileForm({
                          ...psychProfileForm,
                          interests: [...psychProfileForm.interests, newInterest.trim()]
                        });
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#5a9270',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Añadir
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {psychProfileForm.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    >
                      {interest}
                      <button
                        onClick={() => {
                          const newInterests = psychProfileForm.interests.filter((_, i) => i !== idx);
                          setPsychProfileForm({ ...psychProfileForm, interests: newInterests });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#92400e',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: 0,
                          marginLeft: '4px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {psychProfileForm.interests.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                    No hay intereses añadidos. Haz clic en "+ Añadir" para agregar uno.
                  </div>
                )}
              </div>

              {/* Idiomas */}
              <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                    Idiomas
                  </h3>
                  <button
                    onClick={() => setPsychProfileForm({
                      ...psychProfileForm,
                      languages: [...psychProfileForm.languages, { language: '', level: '' }]
                    })}
                    style={{
                      padding: '8px 16px',
                      background: '#5a9270',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Añadir
                  </button>
                </div>
                {psychProfileForm.languages.map((lang, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Idioma</label>
                        <input
                          type="text"
                          value={lang.language}
                          onChange={(e) => {
                            const newLangs = [...psychProfileForm.languages];
                            newLangs[idx].language = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                          }}
                          placeholder="Ej: Español, Inglés, Francés..."
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Nivel</label>
                        <input
                          type="text"
                          value={lang.level}
                          onChange={(e) => {
                            const newLangs = [...psychProfileForm.languages];
                            newLangs[idx].level = e.target.value;
                            setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                          }}
                          placeholder="Ej: Nativo, Avanzado, Intermedio..."
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newLangs = psychProfileForm.languages.filter((_, i) => i !== idx);
                        setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {psychProfileForm.languages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                    No hay idiomas añadidos. Haz clic en "+ Añadir" para agregar uno.
                  </div>
                )}
              </div>

              {/* LinkedIn y Sitio Web */}
              <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                  Enlaces Profesionales
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      URL de LinkedIn
                    </label>
                    <input
                      type="url"
                      value={psychProfileForm.linkedinUrl}
                      onChange={(e) => setPsychProfileForm({ ...psychProfileForm, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/tu-perfil"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Sitio Web Personal
                    </label>
                    <input
                      type="url"
                      value={psychProfileForm.website}
                      onChange={(e) => setPsychProfileForm({ ...psychProfileForm, website: e.target.value })}
                      placeholder="https://tu-sitio-web.com"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
                <button
                  onClick={savePsychologistProfile}
                  disabled={loadingPsychProfile}
                  style={{
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: loadingPsychProfile ? 'not-allowed' : 'pointer',
                    opacity: loadingPsychProfile ? 0.6 : 1,
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    flex: 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingPsychProfile) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {loadingPsychProfile ? '⏳ Guardando...' : '💾 Guardar Perfil Profesional'}
                </button>
                <button
                  onClick={() => {
                    setTab('perfil');
                    // Restaurar valores originales
                    if (psychologistProfile) {
                      setPsychProfileForm({
                        bio: psychologistProfile.bio || '',
                        education: psychologistProfile.education || '',
                        certifications: psychologistProfile.certifications || '',
                        interests: psychologistProfile.interests || '',
                        specializations: psychologistProfile.specializations || '',
                        experience: psychologistProfile.experience || '',
                        languages: psychologistProfile.languages || '',
                        linkedinUrl: psychologistProfile.linkedinUrl || '',
                        website: psychologistProfile.website || ''
                      });
                    }
                  }}
                  style={{
                    padding: '14px 28px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pacientes */}
      {tab === 'pacientes' && (
        <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Mis Pacientes
            </h3>
            <button
              onClick={loadData}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Refrescar
            </button>
          </div>

          {/* Buscador y filtros */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={patientSearchTerm}
              onChange={(e) => setPatientSearchTerm(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                fontSize: '15px',
                minWidth: '220px',
                flex: 1
              }}
            />
            <select
              value={patientFilterGender}
              onChange={(e) => setPatientFilterGender(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                fontSize: '15px',
                minWidth: '150px'
              }}
            >
              <option value="">Todos los géneros</option>
              <option value="MALE">Hombre</option>
              <option value="FEMALE">Mujer</option>
              <option value="OTHER">Otro</option>
            </select>
            <select
              value={patientFilterLastVisit}
              onChange={(e) => setPatientFilterLastVisit(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                fontSize: '15px',
                minWidth: '180px'
              }}
            >
              <option value="">Todas las visitas</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="3months">Últimos 3 meses</option>
              <option value="more3months">Más de 3 meses</option>
              <option value="none">Sin visitas</option>
            </select>
          </div>

          {loadingPatients ? (
            <LoadingSpinner text="Cargando pacientes..." />
          ) : filteredPatients.length === 0 ? (
            <EmptyState
              icon="👥"
              title={patientSearchTerm.trim() || patientFilterGender || patientFilterLastVisit ? "No se encontraron pacientes" : "No hay pacientes asignados"}
              description={patientSearchTerm.trim() || patientFilterGender || patientFilterLastVisit ? "Intenta cambiar los filtros de búsqueda." : "Aún no tienes pacientes asignados. Los pacientes aparecerán aquí una vez que se registren y te seleccionen."}
            />
          ) : (
            <>
              {/* Pacientes Activos */}
              {activePatients.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>
                    Pacientes Activos ({activePatients.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {activePatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          loadPatientDetails(p.id);
                          setTab('patient-profile');
                        }}
                        style={{
                          padding: '24px',
                          background: '#f9fafb',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '260px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#5a9270';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flex: 1, minHeight: 0 }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            flexShrink: 0,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            border: '3px solid white',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}>
                            {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.email}>
                              {p.email}
                            </div>
                            {p.lastVisit && (
                              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '4px' }}>
                                Última visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </div>
                            )}
                            {!p.lastVisit && (
                              <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginTop: '4px' }}>
                                Sin visitas registradas
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(p.id);
                              setTab('chat');
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            💬 Abrir Chat
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePatientStatus(p.id, 'DISCHARGED');
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: '#f3f4f6',
                              color: '#6b7280',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '13px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e5e7eb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f3f4f6';
                            }}
                          >
                            Dar de Alta
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menores de edad */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>
                  Menores de edad ({minorPatients.length})
                </h4>
                {minorPatients.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                    Los pacientes con fecha de nacimiento o edad menor de 18 años aparecerán aquí. Pueden requerir consentimiento firmado antes de acceder a todo el contenido.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {minorPatients.map((p: any) => {
                      const consentSigned = p.consentStatus === 'SIGNED';
                      const canOpenFullProfile = consentSigned;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (!canOpenFullProfile) {
                              toast.warning('Consentimiento pendiente: solo puedes abrir chat o enviar el consentimiento.');
                              return;
                            }
                            loadPatientDetails(p.id);
                            setTab('patient-profile');
                          }}
                          style={{
                            padding: '24px',
                            background: consentSigned ? '#f9fafb' : 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
                            border: consentSigned ? '2px solid #e5e7eb' : '2px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '12px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '280px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = consentSigned ? '#5a9270' : 'rgba(245, 158, 11, 0.55)';
                            e.currentTarget.style.boxShadow = consentSigned ? '0 4px 12px rgba(102, 126, 234, 0.15)' : '0 6px 18px rgba(245, 158, 11, 0.18)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = consentSigned ? '#e5e7eb' : 'rgba(245, 158, 11, 0.35)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flex: 1, minHeight: 0 }}>
                            <div style={{
                              width: '60px',
                              height: '60px',
                              flexShrink: 0,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              background: '#e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px',
                              border: '3px solid white',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}>
                              {p.avatarUrl ? (
                                <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                '👤'
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.email}>
                                {p.email}
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: consentSigned ? '#059669' : '#b45309' }}>
                                {consentSigned ? '✅ Consentimiento firmado' : '⚠️ Consentimiento pendiente'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', flexShrink: 0 }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(p.id);
                                setTab('chat');
                              }}
                              style={{
                                width: '100%',
                                padding: '10px',
                                background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                              }}
                            >
                              💬 Abrir Chat
                            </button>

                            {!consentSigned ? (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const types = await consentService.listDocumentTypes();
                                    setConsentDocTypes(types || []);
                                    const first = (types || [])[0];
                                    setConsentForm({ userId: p.id, documentTypeId: first?.id || 0, place: '' });
                                    setShowConsentModal(true);
                                  } catch (err: any) {
                                    toast.error('No se pudieron cargar los tipos de documento');
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  background: '#fff7ed',
                                  color: '#b45309',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                📎 Adjuntar consentimiento
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePatientStatus(p.id, 'DISCHARGED');
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  background: '#f3f4f6',
                                  color: '#6b7280',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                Dar de Alta
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pacientes Dados de Alta */}
              {dischargedPatients.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>
                    Pacientes Dados de Alta ({dischargedPatients.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {dischargedPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          loadPatientDetails(p.id);
                          setTab('patient-profile');
                        }}
                        style={{
                          padding: '24px',
                          background: '#f9fafb',
                          border: '2px solid #d1d5db',
                          borderRadius: '12px',
                          opacity: 0.7,
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          minHeight: '260px',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#5a9270';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.opacity = '0.7';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flex: 1, minHeight: 0 }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            flexShrink: 0,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            border: '3px solid white',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}>
                            {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.email}>
                              {p.email}
                            </div>
                            {p.lastVisit && (
                              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '4px' }}>
                                Última visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </div>
                            )}
                            {!p.lastVisit && (
                              <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginTop: '4px' }}>
                                Sin visitas registradas
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(p.id);
                              setTab('chat');
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            💬 Abrir Chat
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePatientStatus(p.id, 'ACTIVE');
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              border: '1px solid #93c5fd',
                              borderRadius: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '13px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#bfdbfe';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#dbeafe';
                            }}
                          >
                            Reactivar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal: Enviar consentimiento a menor */}
          {showConsentModal && (
            <div
              onClick={() => !sendingConsent && setShowConsentModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                zIndex: 9999,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid rgba(90, 146, 112, 0.2)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                  padding: '22px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a2e22' }}>Adjuntar consentimiento</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                      Selecciona el tipo de documento y el lugar. El contenido se rellenará automáticamente (psicólogo, fecha, hora, etc.).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => !sendingConsent && setShowConsentModal(false)}
                    style={{ border: 'none', background: 'transparent', cursor: sendingConsent ? 'not-allowed' : 'pointer', color: '#6b7280', fontSize: '18px' }}
                    aria-label="Cerrar"
                    disabled={sendingConsent}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginTop: '18px', display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>
                      Tipo de documento
                    </label>
                    <select
                      value={consentForm.documentTypeId || 0}
                      onChange={(e) => setConsentForm({ ...consentForm, documentTypeId: parseInt(e.target.value, 10) })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    >
                      {(consentDocTypes || []).length === 0 && <option value={0}>No hay tipos disponibles</option>}
                      {(consentDocTypes || []).map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>
                      Lugar (opcional)
                    </label>
                    <input
                      type="text"
                      value={consentForm.place}
                      onChange={(e) => setConsentForm({ ...consentForm, place: e.target.value })}
                      placeholder="Ej: Madrid"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={() => !sendingConsent && setShowConsentModal(false)}
                    disabled={sendingConsent}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      background: '#f3f4f6',
                      color: '#374151',
                      fontWeight: 700,
                      cursor: sendingConsent ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={sendingConsent || !consentForm.userId || !consentForm.documentTypeId}
                    onClick={async () => {
                      try {
                        setSendingConsent(true);
                        await consentService.sendConsent(consentForm.userId, consentForm.documentTypeId, consentForm.place || undefined);
                        toast.success('Consentimiento enviado');
                        setShowConsentModal(false);
                        await loadData();
                      } catch (err: any) {
                        toast.error(err.response?.data?.error || err.response?.data?.message || 'Error al enviar el consentimiento');
                      } finally {
                        setSendingConsent(false);
                      }
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: sendingConsent ? '#cbd5d1' : 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                      color: 'white',
                      fontWeight: 800,
                      cursor: sendingConsent ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {sendingConsent ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tareas */}
      {tab === 'tareas' && (
        <>
          {selectedTaskId && selectedTask ? (
            // Vista detallada de la tarea (igual que en UserDashboard)
            <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '28px', 
                  fontWeight: 700, 
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '-0.02em'
                }}>
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
                    fontFamily: "'Inter', sans-serif"
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
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px',
                marginBottom: '32px'
              }}>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(90, 146, 112, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#5a9270', 
                    marginBottom: '8px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Creada el
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif"
                  }}>
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
                  <div style={{
                    padding: '20px',
                    background: new Date(selectedTask.dueDate) < new Date() 
                      ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                      : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '16px',
                    border: `1px solid ${new Date(selectedTask.dueDate) < new Date() ? 'rgba(220, 38, 38, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: new Date(selectedTask.dueDate) < new Date() ? '#dc2626' : '#d97706', 
                      marginBottom: '8px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Vence el
                    </div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1a2e22',
                      fontFamily: "'Inter', sans-serif"
                    }}>
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
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#3a5a4a',
                        marginTop: '8px',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        {Math.ceil((new Date(selectedTask.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(90, 146, 112, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#5a9270', 
                    marginBottom: '8px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {selectedTask.createdBy === 'PSYCHOLOGIST' ? 'Asignada por' : 'Enviada por'}
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {selectedTask.createdBy === 'PSYCHOLOGIST' ? selectedTask.psychologistName : selectedTask.userName}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedTask.description && (
                <div style={{ 
                  marginBottom: '32px',
                  padding: '24px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(90, 146, 112, 0.15)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px', 
                    fontWeight: 600, 
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Descripción
                  </h4>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#3a5a4a', 
                    lineHeight: '1.7',
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedTask.description}
                  </div>
                </div>
              )}

              {/* Archivos */}
              <div style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(90, 146, 112, 0.15)',
                boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: '#1a2e22',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    📎 Archivos adjuntos
                  </h4>
                  <label style={{
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
                    boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
                    e.currentTarget.style.background = '#4a8062';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                    e.currentTarget.style.background = '#5a9270';
                  }}
                  >
                    ➕ Subir archivo
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await tasksService.uploadFile(selectedTaskId, file);
                            await loadTaskFiles(selectedTaskId);
                            // Archivo subido exitosamente (sin pop-up)
                            // Resetear el input para permitir subir el mismo archivo de nuevo
                            e.target.value = '';
                          } catch (error: any) {
                            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.response?.data?.details || error.message || 'Error desconocido';
                            toast.error('Error al subir el archivo: ' + errorMessage);
                            // Resetear el input incluso si hay error
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {taskFiles[selectedTaskId] && taskFiles[selectedTaskId].length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {taskFiles[selectedTaskId].map((file: any) => (
                      <div key={file.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '16px', 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(90, 146, 112, 0.15)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                          <span style={{ fontSize: '24px' }}>📄</span>
                          <div>
                            <div style={{ 
                              fontSize: '15px', 
                              fontWeight: 600, 
                              color: '#1a2e22',
                              fontFamily: "'Inter', sans-serif"
                            }}>{file.originalName}</div>
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#3a5a4a', 
                              marginTop: '4px',
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              {(file.fileSize / 1024).toFixed(1)} KB • Subido por {file.uploaderName}
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
                            boxShadow: '0 2px 8px rgba(90, 146, 112, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#4a8062';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#5a9270';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.3)';
                          }}
                        >
                          Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '15px', 
                    color: '#3a5a4a', 
                    textAlign: 'center', 
                    padding: '40px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    No hay archivos adjuntos aún
                  </div>
                )}
              </div>

              {/* Comentarios */}
              <div style={{ 
                padding: '24px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(90, 146, 112, 0.15)',
                boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)'
              }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  💬 Comentarios
                </h4>
                
                {/* Lista de comentarios */}
                {taskComments[selectedTaskId] && taskComments[selectedTaskId].length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {taskComments[selectedTaskId].map((comment: any) => (
                      <div key={comment.id} style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(90, 146, 112, 0.15)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#1a2e22',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {comment.userName}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#3a5a4a',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '15px', 
                          color: '#3a5a4a', 
                          lineHeight: '1.6',
                          fontFamily: "'Inter', sans-serif",
                          whiteSpace: 'pre-wrap'
                        }}>
                          {comment.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '15px', 
                    color: '#3a5a4a', 
                    textAlign: 'center', 
                    padding: '40px',
                    marginBottom: '24px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    No hay comentarios aún. Sé el primero en comentar.
                  </div>
                )}

                {/* Formulario de nuevo comentario */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid rgba(90, 146, 112, 0.2)',
                      fontSize: '15px',
                      fontFamily: "'Inter', sans-serif",
                      color: '#1a2e22',
                      resize: 'vertical',
                      minHeight: '80px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5a9270';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(90, 146, 112, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(90, 146, 112, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(selectedTaskId)}
                    disabled={!newComment.trim()}
                    style={{
                      padding: '12px 24px',
                      background: newComment.trim() ? '#5a9270' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: newComment.trim() ? '0 4px 12px rgba(90, 146, 112, 0.3)' : 'none',
                      alignSelf: 'flex-start'
                    }}
                    onMouseEnter={(e) => {
                      if (newComment.trim()) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
                        e.currentTarget.style.background = '#4a8062';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newComment.trim()) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                        e.currentTarget.style.background = '#5a9270';
                      }
                    }}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          ) : selectedPatientForTasks ? (
            // Lista de tareas de un paciente específico
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '32px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <button
                    onClick={() => setSelectedPatientForTasks(null)}
                    style={{
                      padding: '8px 16px',
                      background: '#f0f5f3',
                      color: '#5a9270',
                      border: '2px solid rgba(90, 146, 112, 0.3)',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginBottom: '12px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e8f0ed'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f0f5f3'}
                  >
                    ← Volver a pacientes
                  </button>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Tareas de {patients.find((p: any) => p.id === selectedPatientForTasks)?.name || 'Paciente'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setTaskForm({ ...taskForm, userId: selectedPatientForTasks.toString() });
                    setShowTaskForm(true);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  + Nueva Tarea
                </button>
              </div>
              
              {showTaskForm && (
                <div style={{
                  marginBottom: '24px',
                  padding: '24px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Crear Nueva Tarea</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Título de la tarea"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px'
                      }}
                    />
                    <textarea
                      placeholder="Descripción (opcional)"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                    />
                    <input
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={async () => {
                          if (!taskForm.title) {
                            toast.warning('Por favor completa el título de la tarea');
                            return;
                          }
                          if (!me || !me.id) {
                            toast.error('Error: No se pudo obtener la información del psicólogo. Por favor recarga la página.');
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
                            await loadData();
                            setShowTaskForm(false);
                            setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                            // Tarea creada exitosamente (sin pop-up)
                          } catch (error: any) {
                            toast.error('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                          }
                        }}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Crear
                      </button>
                      <button
                        onClick={() => {
                          setShowTaskForm(false);
                          setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#e5e7eb',
                          color: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tasksByPatient[selectedPatientForTasks] && tasksByPatient[selectedPatientForTasks].length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tasksByPatient[selectedPatientForTasks].map((t: any) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        loadTaskDetails(t.id);
                      }}
                      style={{
                        padding: '28px',
                        background: t.createdBy === 'PSYCHOLOGIST' ? 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)' : '#ffffff',
                        border: `2px solid ${t.createdBy === 'PSYCHOLOGIST' ? 'rgba(90, 146, 112, 0.3)' : 'rgba(90, 146, 112, 0.15)'}`,
                        borderRadius: '16px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.08)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <div style={{
                              padding: '6px 12px',
                              background: t.createdBy === 'PSYCHOLOGIST' ? '#5a9270' : '#7fb3a3',
                              color: 'white',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              {t.createdBy === 'PSYCHOLOGIST' ? '📤 Creada por mí' : '📥 Enviada por paciente'}
                            </div>
                            {t.createdAt && (
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                Creada: {new Date(t.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            )}
                            {t.dueDate && (
                              <div style={{
                                padding: '4px 8px',
                                background: new Date(t.dueDate) < new Date() ? '#fee2e2' : '#fef3c7',
                                color: new Date(t.dueDate) < new Date() ? '#dc2626' : '#d97706',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600
                              }}>
                                ⏰ Vence: {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '22px', 
                            fontWeight: 700, 
                            color: '#1a2e22', 
                            marginBottom: '12px',
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '-0.01em'
                          }}>
                            {t.title}
                          </div>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#3a5a4a', 
                            lineHeight: '1.6', 
                            marginBottom: '16px',
                            fontFamily: "'Inter', sans-serif",
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {t.description || 'Sin descripción'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '60px 40px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                    No hay tareas para este paciente
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Lista de pacientes con tareas
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '32px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Tareas por Paciente
                </h3>
                <button
                  onClick={() => setShowTaskForm(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  + Nueva Tarea
                </button>
              </div>
          
          {showTaskForm && (
            <div style={{
              marginBottom: '24px',
              padding: '24px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Crear Nueva Tarea</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select
                  value={taskForm.userId}
                  onChange={(e) => setTaskForm({ ...taskForm, userId: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Selecciona un paciente</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Título de la tarea"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
                <input
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      if (!taskForm.userId || !taskForm.title) {
                        toast.warning('Por favor completa todos los campos requeridos');
                        return;
                      }
                      if (!me || !me.id) {
                        toast.error('Error: No se pudo obtener la información del psicólogo. Por favor recarga la página.');
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
                        await loadData();
                        setShowTaskForm(false);
                        setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                        // Tarea creada exitosamente (sin pop-up)
                      } catch (error: any) {
                        toast.error('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => {
                      setShowTaskForm(false);
                      setTaskForm({ userId: '', title: '', description: '', dueDate: '' });
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#e5e7eb',
                      color: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {patientsWithTasks.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientForTasks(p.id)}
                  style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                    border: '2px solid rgba(90, 146, 112, 0.3)',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(90, 146, 112, 0.08)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      border: '3px solid white',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#1a2e22', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#3a5a4a', fontFamily: "'Inter', sans-serif" }}>
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
      )}

      {/* Tests Asignados */}
      {tab === 'tests-asignados' && (
        <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tests Asignados
            </h3>
            <button
              onClick={async () => {
                setShowAssignTestForm(true);
                // Asegurar que los tests estén cargados
                try {
                  const tests = await testService.list();

                  // Filtrar tests activos
                  const activeTests = (tests || []).filter((t: any) => {
                    if (t.active === false) {
                      return false;
                    }
                    return true;
                  });

                  setAvailableTests(activeTests);
                  
                  if (activeTests.length === 0) {
                    toast.warning('No hay tests disponibles para asignar. Verifica que haya tests activos en el sistema.');
                  }
                } catch (error: any) {
                  toast.error('Error al cargar los tests. Por favor intenta de nuevo.');
                }
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Asignar Test
            </button>
          </div>

          {showAssignTestForm && (
            <div style={{
              marginBottom: '24px',
              padding: '24px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Asignar Test a Paciente</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                    Paciente:
                  </label>
                  <select
                    value={assignTestForm.userId}
                    onChange={(e) => setAssignTestForm({ ...assignTestForm, userId: e.target.value })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  >
                    <option value="">Selecciona un paciente</option>
                    {patients.length === 0 ? (
                      <option value="" disabled>No hay pacientes asignados</option>
                    ) : (
                      patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                      ))
                    )}
                  </select>
                  {patients.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      ⚠️ No tienes pacientes asignados. Pide al administrador que asigne pacientes a tu perfil.
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                    Test:
                  </label>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Buscar test por nombre o código..."
                      value={testSearchTerm}
                      onChange={(e) => setTestSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        paddingLeft: '40px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        background: '#ffffff'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#5a9270'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '16px',
                      color: '#9ca3af'
                    }}>🔍</span>
                    {testSearchTerm.trim() && (
                      <button
                        onClick={() => setTestSearchTerm('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#9ca3af',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {(() => {
                    const filteredTests = availableTests.filter((t: any) => {
                      if (!testSearchTerm.trim()) return true;
                      const query = testSearchTerm.toLowerCase();
                      return (
                        (t.title || '').toLowerCase().includes(query) ||
                        (t.code || '').toLowerCase().includes(query)
                      );
                    });
                    
                    return (
                      <>
                        <select
                          value={assignTestForm.testId}
                          onChange={(e) => setAssignTestForm({ ...assignTestForm, testId: e.target.value })}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb',
                            fontSize: '14px',
                            width: '100%',
                            background: '#ffffff'
                          }}
                        >
                          <option value="">{testSearchTerm.trim() ? `Selecciona de ${filteredTests.length} resultado(s)` : 'Selecciona un test'}</option>
                          {availableTests.length === 0 ? (
                            <option value="" disabled>Cargando tests...</option>
                          ) : filteredTests.length === 0 ? (
                            <option value="" disabled>No se encontraron tests</option>
                          ) : (
                            filteredTests.map((t: any) => (
                              <option key={t.id} value={t.id}>{t.title} {t.code ? `(${t.code})` : ''}</option>
                            ))
                          )}
                        </select>
                        {testSearchTerm.trim() && filteredTests.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '4px' }}>
                            ✓ Mostrando {filteredTests.length} de {availableTests.length} tests
                          </div>
                        )}
                        {availableTests.length === 0 && (
                          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                            ⚠️ No hay tests disponibles. Verifica que haya tests activos en el sistema.
                          </div>
                        )}
                        {testSearchTerm.trim() && filteredTests.length === 0 && availableTests.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                            ⚠️ No se encontraron tests que coincidan con "{testSearchTerm}"
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      if (!assignTestForm.userId || !assignTestForm.testId) {
                        toast.warning('Por favor selecciona un paciente y un test');
                        return;
                      }
                      try {
                        const userId = parseInt(assignTestForm.userId);
                        const testId = parseInt(assignTestForm.testId);

                        if (isNaN(userId) || isNaN(testId)) {
                          toast.error('Error: Los valores seleccionados no son válidos');
                          return;
                        }
                        
                        const result = await assignedTestsService.assign({
                          userId,
                          testId
                        });
                        
                        // Test asignado exitosamente (sin pop-up)
                        await loadData();
                        setShowAssignTestForm(false);
                        setAssignTestForm({ userId: '', testId: '' });
                        setTestSearchTerm('');
                      } catch (error: any) {
                        let errorMessage = 'Error desconocido al asignar el test';
                        if (error.response?.data) {
                          // El backend puede devolver { error: "mensaje" } o { message: "mensaje" }
                          errorMessage = error.response.data.error || error.response.data.message || JSON.stringify(error.response.data);
                        } else if (error.message) {
                          errorMessage = error.message;
                        }
                        
                        toast.error(`Error al asignar el test: ${errorMessage}`);
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Asignar
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignTestForm(false);
                      setAssignTestForm({ userId: '', testId: '' });
                      setTestSearchTerm('');
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#e5e7eb',
                      color: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {(() => {
            // Agrupar tests por paciente
            const testsByPatient = new Map<number, any[]>();
            assignedTests.forEach(at => {
              const userId = at.userId;
              if (!testsByPatient.has(userId)) {
                testsByPatient.set(userId, []);
              }
              testsByPatient.get(userId)!.push(at);
            });

            if (testsByPatient.size === 0) {
              return (
                <div style={{
                  padding: '60px 40px',
                  textAlign: 'center',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                    No hay tests asignados
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Asigna tests a tus pacientes para que los completen
                  </div>
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Array.from(testsByPatient.entries()).map(([userId, patientTests]) => {
                  const patient = patients.find(p => p.id === userId) || { 
                    id: userId, 
                    name: patientTests[0]?.userName || 'Usuario', 
                    email: patientTests[0]?.userEmail || '',
                    avatarUrl: patientTests[0]?.userAvatarUrl || null
                  };
                  const isExpanded = expandedPatients.has(userId);
                  const completedCount = patientTests.filter(t => t.completedAt).length;
                  const pendingCount = patientTests.length - completedCount;
                  const patientAvatarUrl = patient.avatarUrl || patientTests[0]?.userAvatarUrl;

                  return (
                    <div
                      key={userId}
                      style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div
                        style={{
                          padding: '20px',
                          background: isExpanded ? '#f3f4f6' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px'
                        }}
                        onClick={() => {
                          const newExpanded = new Set(expandedPatients);
                          if (newExpanded.has(userId)) {
                            newExpanded.delete(userId);
                          } else {
                            newExpanded.add(userId);
                          }
                          setExpandedPatients(newExpanded);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isExpanded ? '#f3f4f6' : '#ffffff';
                        }}
                      >
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            flexShrink: 0,
                            border: '2px solid #d1d5db'
                          }}>
                            {patientAvatarUrl ? (
                              <img 
                                src={patientAvatarUrl} 
                                alt={patient.name}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover' 
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '👤';
                                    parent.style.fontSize = '24px';
                                  }
                                }}
                              />
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                              {patient.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                              {patient.email}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                              {patientTests.length} test{patientTests.length !== 1 ? 's' : ''}
                            </div>
                            {completedCount > 0 && (
                              <div style={{
                                padding: '4px 8px',
                                background: '#22c55e',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {completedCount} completado{completedCount !== 1 ? 's' : ''}
                              </div>
                            )}
                            {pendingCount > 0 && (
                              <div style={{
                                padding: '4px 8px',
                                background: '#f59e0b',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '20px', color: '#9ca3af' }}>
                            {isExpanded ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {patientTests.map(at => (
                              <div
                                key={at.id}
                                onClick={() => {
                                  if (at.completedAt && at.testId && at.userId) {
                                    loadTestDetails(at.userId, at.testId, at.id);
                                    setTab('test-details');
                                  }
                                }}
                                style={{
                                  padding: '16px',
                                  background: at.completedAt ? '#f0fdf4' : '#fef3c7',
                                  border: `2px solid ${at.completedAt ? '#22c55e' : '#f59e0b'}`,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: '16px',
                                  cursor: at.completedAt ? 'pointer' : 'default',
                                  transition: at.completedAt ? 'all 0.2s' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                  if (at.completedAt) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (at.completedAt) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{
                                      padding: '4px 8px',
                                      background: at.completedAt ? '#22c55e' : '#f59e0b',
                                      color: 'white',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}>
                                      {at.completedAt ? 'Completado' : 'Pendiente'}
                                    </div>
                                    {at.assignedAt && (
                                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        Asignado: {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                    )}
                                    {at.completedAt && (
                                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        Completado: {new Date(at.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                    {at.testTitle || at.test?.title || 'Test'}
                                  </div>
                                  {at.testCode && (
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                      Código: {at.testCode}
                                    </div>
                                  )}
                                </div>
                                {!at.completedAt && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm('¿Estás seguro de que deseas desasignar este test?')) {
                                        try {
                                          await assignedTestsService.unassign(at.id);
                                          await loadData();
                                        } catch (error) {
                                          toast.error('Error al desasignar el test');
                                        }
                                      }
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                  >
                                    Desasignar
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
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
                        <div style={{ fontSize: '14px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                          {parseFloat(apt.price).toFixed(2)}€
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
                                  label: code,
                                  value: Math.max(1, Math.min(10, value)),
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{testAnswers.testTitle}</h2>
                  <p style={{ color: '#6b7280', marginTop: '4px' }}>
                    Código: {testAnswers.testCode}
                  </p>
                </div>
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
                  ← Volver
                </button>
              </div>

              {/* Gráficas de factores y subfactores */}
              {testDetailsData.subfactors && testDetailsData.subfactors.length > 0 && (
                <div style={{ marginBottom: '24px', padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Subfactores</h3>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <BarChart
                        data={testDetailsData.subfactors.map((sf: any) => ({
                          label: sf.subfactorName || sf.subfactorCode,
                          value: Number(sf.percentage) || 0,
                        }))}
                        maxValue={100}
                      />
                    </div>
                  </div>
                </div>
              )}

              {testDetailsData.factors && testDetailsData.factors.length > 0 && (
                <div style={{ marginBottom: '24px', padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Factores</h3>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <FactorChart
                        data={testDetailsData.factors.map((f: any) => {
                          const percentage = Number(f.percentage) || 0;
                          const value = Math.round((percentage / 100) * 10);
                          const code = f.factorCode || '';
                          return {
                            label: code,
                            value: Math.max(1, Math.min(10, value)),
                          };
                        })}
                        maxValue={10}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Respuestas */}
              <div style={{ marginBottom: '24px', padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
                  Respuestas ({testAnswers.answers?.length || 0})
                </h3>
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
              </div>
            </>
          ) : (
            <EmptyState icon="📊" title="Test no encontrado" description="No se pudieron cargar los detalles del test." />
          )}
        </div>
      )}

      {/* Tab: Grupos */}
      {tab === 'grupos' && (
        <Suspense fallback={<LoadingSpinner />}>
          <GroupSessions role="PSYCHOLOGIST" />
        </Suspense>
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