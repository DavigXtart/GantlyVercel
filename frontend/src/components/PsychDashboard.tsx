import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { profileService, psychService, calendarService, tasksService, assignedTestsService, testService, jitsiService, resultsService, matchingService } from '../services/api';
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

type Tab = 'perfil' | 'pacientes' | 'calendario' | 'tareas' | 'chat' | 'citas-pasadas' | 'tests-asignados' | 'patient-profile' | 'test-details' | 'editar-perfil-profesional' | 'matching-test';

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
  
  // Estados para filtros de pacientes
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientFilterGender, setPatientFilterGender] = useState<string>('');
  const [patientFilterLastVisit, setPatientFilterLastVisit] = useState<string>('');
  
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
      console.error('Error cargando datos:', error);
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
        console.error('Error cargando tests asignados (no crítico):', error);
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
        console.error('Error cargando tests disponibles (no crítico):', error);
        setAvailableTests([]);
      }
    }, 200);
  };

  const loadTaskFiles = async (taskId: number) => {
    try {
      const files = await tasksService.getFiles(taskId);
      setTaskFiles((prev) => ({ ...prev, [taskId]: files }));
    } catch (error) {
      console.error('Error cargando archivos de tarea:', error);
    }
  };

  const loadTaskDetails = async (taskId: number) => {
    try {
      const task = await tasksService.get(taskId);
      setSelectedTask(task);
      await loadTaskFiles(taskId);
      await loadTaskComments(taskId);
    } catch (error) {
      console.error('Error cargando detalles de tarea:', error);
      toast.error('Error al cargar los detalles de la tarea');
    }
  };

  const loadTaskComments = async (taskId: number) => {
    try {
      const comments = await tasksService.getComments(taskId);
      setTaskComments((prev) => ({ ...prev, [taskId]: comments }));
    } catch (error) {
      console.error('Error cargando comentarios:', error);
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
      console.error('Error agregando comentario:', error);
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
        console.warn('No se pudo calcular media general', e);
      }
    } catch (err: any) {
      console.error('Error cargando detalles del paciente:', err);
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
      console.error('Error cargando estadísticas:', err);
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
      console.error('Error cargando detalles del test:', err);
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
      console.error('Error actualizando status del paciente:', err);
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
  const activePatients = useMemo(() => filteredPatients.filter(p => (p.status || 'ACTIVE') === 'ACTIVE'), [filteredPatients]);
  const dischargedPatients = useMemo(() => filteredPatients.filter(p => p.status === 'DISCHARGED'), [filteredPatients]);

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
      console.error('Error verificando estado del test de matching:', error);
      // Si es un 404, significa que el endpoint aún no está disponible (servidor no reiniciado)
      // En ese caso, asumimos que el test no está completo para mostrar el banner
      if (error.response?.status === 404) {
        console.warn('Endpoint de estado del test de matching no disponible aún. Reinicia el servidor backend.');
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
  // No forzar el cambio de pestaña si el usuario ya navegó a otra parte
  useEffect(() => {
    if (me && me.role === 'PSYCHOLOGIST' && me.emailVerified && 
        matchingTestCompleted === false && !checkingMatchingTest && 
        !hasCheckedInitialStatus && tab === 'perfil') {
      setHasCheckedInitialStatus(true);
      setTab('matching-test');
    } else if (matchingTestCompleted !== null) {
      setHasCheckedInitialStatus(true);
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
      console.error('Error cargando slots:', error);
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
      console.error('Error cargando solicitudes pendientes:', error);
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
      console.error('Error al subir avatar:', error);
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
      console.error('Error cargando perfil profesional:', error);
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
      console.error('Error guardando perfil profesional:', error);
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
      console.error('Error cargando citas pasadas:', err);
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
      console.error('Error cargando valoración:', err);
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
    <div className="container" style={{ maxWidth: '1200px' }}>
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
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        overflowX: 'auto'
      }}>
        {[
          { id: 'perfil', label: '👤 Mi Perfil', icon: '👤' },
          { id: 'pacientes', label: '👥 Mis Pacientes', icon: '👥' },
          { id: 'tareas', label: '📋 Tareas', icon: '📋' },
          { id: 'tests-asignados', label: '📝 Tests Asignados', icon: '📝' },
          { id: 'calendario', label: '📅 Calendario', icon: '📅' },
          { id: 'chat', label: '💬 Chat', icon: '💬' },
          { id: 'citas-pasadas', label: 'Citas Pasadas', icon: '📅' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            style={{
              padding: '12px 24px',
              background: tab === t.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: tab === t.id ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: tab === t.id ? '3px solid #764ba2' : '3px solid transparent',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: tab === t.id ? 600 : 500,
              fontSize: '14px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (tab !== t.id) {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#1f2937';
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== t.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Perfil */}
      {tab === 'perfil' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header con gradiente */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px',
            color: 'white',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                {me?.avatarUrl ? (
                  <img
                    src={me.avatarUrl}
                    alt="avatar"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                    }}
                  />
                ) : null}
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: me?.avatarUrl ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  👤
                </div>
                <label style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: 'white',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  📷
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange} />
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700 }}>
                  {me?.name || 'Psicólogo'}
                </h2>
                {myRating && myRating.averageRating !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px', color: '#fbbf24' }}>
                      {'★'.repeat(Math.round(myRating.averageRating))}
                      {'☆'.repeat(5 - Math.round(myRating.averageRating))}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 600, opacity: 0.9 }}>
                      {myRating.averageRating.toFixed(1)} ({myRating.totalRatings} valoraciones)
                    </span>
                  </div>
                )}
                <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '16px' }}>
                  {me?.email}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', opacity: 0.9 }}>
                  {me?.age && <div>👤 {me.age} años</div>}
                  {me?.gender && <div>{me.gender === 'MALE' ? '♂️' : me.gender === 'FEMALE' ? '♀️' : '⚧️'} {me.gender === 'MALE' ? 'Masculino' : me.gender === 'FEMALE' ? 'Femenino' : 'Otro'}</div>}
                  {me?.createdAt && <div>📅 Miembro desde {formatDate(me.createdAt)}</div>}
                </div>
                <button
                  onClick={async () => {
                    await loadPsychologistProfile();
                    setTab('editar-perfil-profesional');
                  }}
                  style={{
                    marginTop: '16px',
                    padding: '10px 24px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  ✏️ Editar Perfil
                </button>
              </div>
            </div>
          </div>

          {/* Test de Matching - Aviso si no está completo */}
          {matchingTestCompleted === false && (
            <div style={{
              padding: '24px 32px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderBottom: '1px solid #e5e7eb',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#92400e' }}>
                    ⚠️ Test de Matching Pendiente
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#78350f', lineHeight: 1.5 }}>
                    Completa el test de matching para que los pacientes puedan encontrarte. Este test ayuda a conectar a los pacientes con psicólogos que mejor se adapten a sus necesidades.
                  </p>
                </div>
                <button
                  onClick={() => setTab('matching-test')}
                  style={{
                    padding: '12px 24px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#d97706';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f59e0b';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Completar Test
                </button>
              </div>
            </div>
          )}

          {/* Toggle "Estoy lleno" */}
          <div style={{ padding: '0 32px 24px 32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              padding: '16px 20px',
              background: me?.isFull ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              border: `2px solid ${me?.isFull ? '#ef4444' : '#22c55e'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              position: 'relative',
              maxWidth: '600px',
              width: '100%'
            }}>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: me?.isFull ? '#dc2626' : '#15803d', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {me?.isFull ? '🔴 Estoy lleno - No acepto nuevos pacientes' : '🟢 Aceptando nuevos pacientes'}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {me?.isFull ? 'No aparecerás en las recomendaciones para nuevos pacientes' : 'Apareces en las recomendaciones para nuevos pacientes'}
                </div>
              </div>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '52px',
                height: '28px',
                cursor: 'pointer',
                flexShrink: 0
              }}>
                <input
                  type="checkbox"
                  checked={me?.isFull || false}
                  onChange={async (e) => {
                    const newValue = e.target.checked;
                    const previousValue = me?.isFull || false;
                    // Actualizar el estado inmediatamente para feedback visual
                    setMe({ ...me, isFull: newValue });
                    try {
                      const response: any = await psychService.updateIsFull(newValue);
                      // El servidor devuelve el nuevo estado en la respuesta según el backend
                      if (response && response.isFull !== undefined) {
                        setMe({ ...me, isFull: response.isFull });
                        toast.success(response.isFull ? 'Ahora estás marcado como lleno' : 'Ahora aceptas nuevos pacientes');
                      } else {
                        // Si no viene en la respuesta, recargar el perfil del psicólogo
                        const psychProfile: any = await psychService.getProfile();
                        if (psychProfile && psychProfile.isFull !== undefined) {
                          setMe({ ...me, isFull: psychProfile.isFull });
                          toast.success(psychProfile.isFull ? 'Ahora estás marcado como lleno' : 'Ahora aceptas nuevos pacientes');
                        } else {
                          // Si todo falla, mantener el nuevo valor que ya establecimos
                          toast.success(newValue ? 'Ahora estás marcado como lleno' : 'Ahora aceptas nuevos pacientes');
                        }
                      }
                    } catch (error: any) {
                      // Revertir el estado en caso de error
                      setMe({ ...me, isFull: previousValue });
                      toast.error('Error al actualizar el estado: ' + (error.response?.data?.error || error.message));
                    }
                  }}
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: me?.isFull ? '#ef4444' : '#22c55e',
                  borderRadius: '28px',
                  transition: 'background-color 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}>
                  <span style={{
                    content: '""',
                    position: 'absolute',
                    height: '24px',
                    width: '24px',
                    left: me?.isFull ? '24px' : '2px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* Estadísticas */}
          <div style={{ padding: '0 32px 32px 32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', maxWidth: '1200px', width: '100%' }}>
            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pacientes asignados
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>
                {patients.length}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tareas creadas
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>
                {tasks.filter(t => t.createdBy === 'PSYCHOLOGIST').length}
              </div>
            </div>

            <div 
              style={{
                padding: '20px',
                background: pendingRequests.length > 0 
                  ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' 
                  : '#f9fafb',
                borderRadius: '12px',
                border: pendingRequests.length > 0 
                  ? '3px solid #ef4444' 
                  : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: pendingRequests.length > 0 
                  ? '0 4px 12px rgba(239, 68, 68, 0.25)' 
                  : 'none',
                animation: pendingRequests.length > 0 
                  ? 'pulseAlert 2s ease-in-out infinite' 
                  : 'none'
              }}
              onClick={() => {
                setTab('calendario');
                setTimeout(() => {
                  const pendingSection = document.getElementById('solicitudes-pendientes');
                  if (pendingSection) {
                    pendingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = pendingRequests.length > 0 
                  ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                  : '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = pendingRequests.length > 0 
                  ? '0 6px 16px rgba(239, 68, 68, 0.35)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = pendingRequests.length > 0 
                  ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' 
                  : '#f9fafb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = pendingRequests.length > 0 
                  ? '0 4px 12px rgba(239, 68, 68, 0.25)' 
                  : 'none';
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                color: pendingRequests.length > 0 ? '#dc2626' : '#6b7280', 
                marginBottom: '8px', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px' 
              }}>
                {pendingRequests.length > 0 ? '⚠️ ' : ''}Citas por confirmar
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: pendingRequests.length > 0 ? '#dc2626' : '#f59e0b' 
              }}>
                {pendingRequests.length}
              </div>
            </div>

            {/* Citas Próximas - Nueva tarjeta */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '12px',
              border: '2px solid rgba(217, 119, 6, 0.3)',
              gridColumn: 'span 1'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⏰ Próximas Citas
              </div>
              {(() => {
                const now = new Date();
                const upcomingAppointments = slots
                  .filter(s => (s.status === 'BOOKED' || s.status === 'CONFIRMED') && s.user)
                  .filter(apt => {
                    if (!apt.startTime || !apt.endTime) return false;
                    const aptDate = new Date(apt.startTime);
                    const aptEndDate = new Date(apt.endTime);
                    // Incluir citas en curso (ya comenzaron pero no han terminado) o futuras
                    const nowTime = now.getTime();
                    const aptStartTime = aptDate.getTime();
                    const aptEndTime = aptEndDate.getTime();
                    
                    const isInProgress = aptStartTime <= nowTime && aptEndTime >= nowTime;
                    const isUpcoming = aptStartTime >= nowTime;
                    return isInProgress || isUpcoming;
                  })
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 2); // Mostrar las 2 más próximas

                if (upcomingAppointments.length === 0) {
                  return (
                    <div style={{ fontSize: '14px', color: '#92400e', fontFamily: "'Inter', sans-serif" }}>
                      No hay citas próximas
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {upcomingAppointments.map(apt => {
                      const aptDate = new Date(apt.startTime);
                      const aptEndDate = new Date(apt.endTime);
                      const isInProgress = aptDate <= now && aptEndDate >= now;
                      
                      // Calcular si está dentro del rango permitido (máximo 1 hora antes, hasta 1 hora después del final)
                      const oneHourBefore = new Date(aptDate.getTime() - 60 * 60 * 1000);
                      const oneHourAfterEnd = new Date(aptEndDate.getTime() + 60 * 60 * 1000);
                      const canStartCall = now >= oneHourBefore && now <= oneHourAfterEnd;
                      
                      // Formatear fecha y hora para mostrar: "martes a las 12:30"
                      const weekday = aptDate.toLocaleDateString('es-ES', { weekday: 'long' });
                      const time = aptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      const dateTimeText = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} a las ${time}`;
                      
                      return (
                        <div
                          key={apt.id}
                          style={{
                            padding: '12px',
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid rgba(217, 119, 6, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: 1
                          }}
                          onClick={async () => {
                            if (canStartCall && me && apt.user) {
                              // Si está en curso (una hora antes), ir a la videollamada
                              try {
                                const roomInfo = await jitsiService.getRoomInfo(apt.user.email);
                                setVideoCallRoom(roomInfo.roomName);
                                setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                                setShowVideoCall(true);
                              } catch (error: any) {
                                toast.error(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                              }
                            } else {
                              // Si no está en curso, ir al apartado de citas en el calendario
                              setTab('calendario');
                              setTimeout(() => {
                                const appointmentsSection = document.getElementById('citas-confirmadas');
                                if (appointmentsSection) {
                                  appointmentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#d97706';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(217, 119, 6, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.2)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a2e22', marginBottom: '4px' }}>
                            {aptDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div style={{ fontSize: '12px', color: '#3a5a4a', marginBottom: '2px' }}>
                            🕐 {aptDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {apt.user && (
                            <div style={{ fontSize: '11px', color: '#5a9270', fontWeight: 600, marginBottom: '4px' }}>
                              👤 {apt.user.name || apt.user.email}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: isInProgress ? '#059669' : '#d97706', fontWeight: 600 }}>
                            {isInProgress ? '🟢 En curso' : dateTimeText}
                          </div>
                          {!canStartCall && now < oneHourBefore && (
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>
                              Disponible 1h antes
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Test de Matching */}
      {tab === 'matching-test' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          <PsychologistMatchingTest
            onComplete={async () => {
              // Marcar como completado optimísticamente
              setMatchingTestCompleted(true);
              // Verificar el estado real (si el endpoint está disponible)
              try {
                await checkMatchingTestStatus();
              } catch (error) {
                // Si falla (por ejemplo, 404 porque el servidor no se reinició), mantener true
                console.warn('No se pudo verificar el estado, pero el test se completó');
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
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          border: '1px solid #e5e7eb',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>
              Editar Perfil Profesional
            </h2>
            <button
              onClick={() => setTab('perfil')}
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
                      background: '#667eea',
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
                      background: '#667eea',
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
                      background: '#667eea',
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
                      background: '#667eea',
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
                      background: '#667eea',
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
                      background: '#667eea',
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Mis Pacientes
            </h3>
            <button
              onClick={loadData}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              🔄 Refrescar
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
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
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
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                              {p.email}
                            </div>
                            {p.lastVisit && (
                              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '4px' }}>
                                📅 Última visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', { 
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
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(p.id);
                              setTab('chat');
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.opacity = '0.7';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
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
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                              {p.email}
                            </div>
                            {p.lastVisit && (
                              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '4px' }}>
                                📅 Última visita: {new Date(p.lastVisit).toLocaleDateString('es-ES', { 
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
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(p.id);
                              setTab('chat');
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        </div>
      )}

      {/* Tareas */}
      {tab === 'tareas' && (
        <>
          {selectedTaskId && selectedTask ? (
            // Vista detallada de la tarea (igual que en UserDashboard)
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
              padding: '40px',
              border: '1px solid rgba(90, 146, 112, 0.15)'
            }}>
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
                            console.error('Error al subir archivo:', error);
                            console.error('Error completo:', JSON.stringify(error, null, 2));
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
                          href={`http://localhost:8080${file.filePath}`}
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
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  ➕ Nueva Tarea
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
                            console.error('Error al crear la tarea:', error);
                            toast.error('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                          }
                        }}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                                📅 Creada: {new Date(t.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Tareas por Paciente
                </h3>
                <button
                  onClick={() => setShowTaskForm(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  ➕ Nueva Tarea
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
                        console.error('Error al crear la tarea:', error);
                        toast.error('Error al crear la tarea: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tests Asignados
            </h3>
            <button
              onClick={async () => {
                setShowAssignTestForm(true);
                // Asegurar que los tests estén cargados
                try {
                  console.log('Cargando tests al abrir formulario...');
                  const tests = await testService.list();
                  console.log('Tests recibidos del servidor:', tests);
                  console.log('Número de tests recibidos:', tests?.length || 0);
                  
                  // Filtrar tests activos
                  const activeTests = (tests || []).filter((t: any) => {
                    if (t.active === false) {
                      console.log(`Test ${t.id} (${t.title}) excluido: active=false`);
                      return false;
                    }
                    console.log(`Test ${t.id} (${t.title}) incluido: active=${t.active}`);
                    return true;
                  });
                  
                  console.log('Tests activos después del filtro:', activeTests);
                  console.log('Número de tests activos:', activeTests.length);
                  setAvailableTests(activeTests);
                  
                  if (activeTests.length === 0) {
                    toast.warning('No hay tests disponibles para asignar. Verifica que haya tests activos en el sistema.');
                  }
                } catch (error: any) {
                  console.error('Error cargando tests:', error);
                  toast.error('Error al cargar los tests. Por favor intenta de nuevo.');
                }
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              ➕ Asignar Test
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
                      onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
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
                        
                        console.log('Asignando test:', { userId, testId });
                        console.log('Valores del formulario:', assignTestForm);
                        
                        if (isNaN(userId) || isNaN(testId)) {
                          toast.error('Error: Los valores seleccionados no son válidos');
                          return;
                        }
                        
                        const result = await assignedTestsService.assign({
                          userId,
                          testId
                        });
                        
                        console.log('Test asignado exitosamente:', result);
                        // Test asignado exitosamente (sin pop-up)
                        await loadData();
                        setShowAssignTestForm(false);
                        setAssignTestForm({ userId: '', testId: '' });
                        setTestSearchTerm('');
                      } catch (error: any) {
                        console.error('Error al asignar el test:', error);
                        console.error('Detalles del error:', error.response?.data || error.message);
                        console.error('Status code:', error.response?.status);
                        
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
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                                ✅ {completedCount} completado{completedCount !== 1 ? 's' : ''}
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
                                ⏳ {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
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
                                      {at.completedAt ? '✅ Completado' : '⏳ Pendiente'}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
                console.error('Error al eliminar la cita:', e);
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
              style={{
                marginTop: '32px',
                background: '#ffffff',
                borderRadius: '20px',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.12)',
                border: '1px solid rgba(102, 126, 234, 0.15)',
                padding: '32px'
              }}>
              <h4 style={{
                margin: '0 0 24px 0',
                fontSize: '24px',
                fontWeight: 700,
                color: '#1a2e22',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.01em'
              }}>
                ⏳ Solicitudes de Citas Pendientes
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {pendingRequests.map((req: any) => (
                  <div
                    key={req.id}
                    style={{
                      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%)',
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                      borderRadius: '16px',
                      padding: '24px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.08)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.08)';
                    }}
                  >
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 700, 
                      color: '#1a2e22', 
                      marginBottom: '12px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {new Date(req.appointment.startTime).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: '#3a5a4a', 
                      marginBottom: '8px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      🕐 {new Date(req.appointment.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(req.appointment.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {req.appointment.price && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#667eea', 
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '12px'
                      }}>
                        {req.appointment.price} €
                      </div>
                    )}
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#5a9270', 
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: '16px'
                    }}>
                      👤 {req.user.name || req.user.email}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: '16px'
                    }}>
                      📅 Solicitada: {new Date(req.requestedAt).toLocaleString('es-ES')}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
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
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        ✅ Confirmar
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
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        ❌ Cancelar
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
              style={{
                marginTop: '32px',
                background: '#ffffff',
                borderRadius: '20px',
                boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
                border: '1px solid rgba(90, 146, 112, 0.15)',
                padding: '32px'
              }}>
              <h4 style={{
                margin: '0 0 24px 0',
                fontSize: '24px',
                fontWeight: 700,
                color: '#1a2e22',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.01em'
              }}>
                📅 Citas Confirmadas y Reservadas
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {slots.filter(s => (s.status === 'CONFIRMED' || s.status === 'BOOKED') && s.user).map(apt => (
                  <div
                    key={apt.id}
                    style={{
                      background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
                      border: '2px solid rgba(90, 146, 112, 0.3)',
                      borderRadius: '16px',
                      padding: '24px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(90, 146, 112, 0.08)'
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
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 700, 
                      color: '#1a2e22', 
                      marginBottom: '12px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {new Date(apt.startTime).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: '#3a5a4a', 
                      marginBottom: '8px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      🕐 {new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {apt.user && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#5a9270', 
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '12px'
                      }}>
                        👤 {apt.user.name || apt.user.email}
                      </div>
                    )}
                    {apt.status === 'CONFIRMED' && apt.paymentStatus && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: apt.paymentStatus === 'PAID' ? '#059669' : apt.paymentStatus === 'EXPIRED' ? '#dc2626' : '#d97706',
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '8px',
                        padding: '8px 12px',
                        background: apt.paymentStatus === 'PAID' ? '#d1fae5' : apt.paymentStatus === 'EXPIRED' ? '#fee2e2' : '#fef3c7',
                        borderRadius: '8px'
                      }}>
                        💳 Estado de pago: {apt.paymentStatus === 'PAID' ? '✅ Pagado' : apt.paymentStatus === 'EXPIRED' ? '❌ Expirado' : '⏳ Pendiente'}
                        {apt.paymentDeadline && apt.paymentStatus === 'PENDING' && (
                          <div style={{ fontSize: '11px', marginTop: '4px', color: '#6b7280' }}>
                            Plazo: {new Date(apt.paymentDeadline).toLocaleString('es-ES')}
                          </div>
                        )}
                      </div>
                    )}
                    {apt.status === 'CONFIRMED' && (
                      <button
                        onClick={async () => {
                          if (confirm('¿Cancelar esta cita confirmada?')) {
                            try {
                              await calendarService.cancelAppointment(apt.id);
                              toast.success('Cita cancelada exitosamente');
                              await loadMySlots();
                              await loadPendingRequests();
                            } catch (e: any) {
                              toast.error(e?.response?.data?.error || 'Error al cancelar la cita');
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                          transition: 'all 0.3s ease',
                          marginBottom: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        ❌ Cancelar Cita
                      </button>
                    )}
                    {(() => {
                      const now = new Date();
                      const aptDate = new Date(apt.startTime);
                      const aptEndDate = new Date(apt.endTime);
                      // Calcular si está dentro del rango permitido (máximo 1 hora antes, hasta 1 hora después del final)
                      const oneHourBefore = new Date(aptDate.getTime() - 60 * 60 * 1000);
                      const oneHourAfterEnd = new Date(aptEndDate.getTime() + 60 * 60 * 1000);
                      const canStartCall = now >= oneHourBefore && now <= oneHourAfterEnd;
                      
                      if (!canStartCall) {
                        if (now < oneHourBefore) {
                          const minutesUntil = Math.floor((oneHourBefore.getTime() - now.getTime()) / (1000 * 60));
                          return (
                            <div style={{
                              width: '100%',
                              padding: '12px 20px',
                              background: '#f3f4f6',
                              color: '#6b7280',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              fontSize: '14px',
                              textAlign: 'center',
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              Disponible en {Math.floor(minutesUntil / 60)}h {minutesUntil % 60}m
                            </div>
                          );
                        }
                        return null;
                      }
                      
                      return (
                        <button
                          onClick={async () => {
                            if (me && apt.user) {
                              try {
                                // Validar con backend antes de iniciar
                                const roomInfo = await jitsiService.getRoomInfo(apt.user.email);
                                setVideoCallRoom(roomInfo.roomName);
                                setVideoCallOtherUser({ email: roomInfo.otherUser.email, name: roomInfo.otherUser.name });
                                setShowVideoCall(true);
                              } catch (error: any) {
                                toast.error(error.response?.data?.error || 'No tienes permiso para iniciar esta videollamada');
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 20px',
                            background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 4px 12px rgba(90, 146, 112, 0.3)',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(90, 146, 112, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(90, 146, 112, 0.3)';
                          }}
                        >
                          📹 Iniciar Videollamada
                        </button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* Citas Pasadas */}
      {tab === 'citas-pasadas' && (
        <div style={{ width: '100%' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
            padding: '32px',
            border: '1px solid rgba(90, 146, 112, 0.15)',
            marginBottom: '24px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 700,
              color: '#1a2e22',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em'
            }}>
              Mis Citas Pasadas
            </h3>
            {myRating && myRating.averageRating !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {tab === 'chat' && (
        <div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{
              width: '300px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '20px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
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
                        background: selectedPatient === p.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f9fafb',
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
                                  <span style={{ fontSize: '12px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#667eea', color: 'white', borderRadius: '50%', fontWeight: 600 }}>
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
                          <span style={{ fontSize: '12px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#667eea', color: 'white', borderRadius: '50%', fontWeight: 600 }}>
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
    </div>
  );
}