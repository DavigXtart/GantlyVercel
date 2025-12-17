import axios from 'axios';

const API_URL = 'http://localhost:8080/api';
const API_BASE_URL = API_URL.replace(/\/$/, '').replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_URL,
});

const resolveAssetUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = API_BASE_URL;
  if (!base) return trimmed;
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
};

// Interceptor para añadir token a las peticiones
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  response => response,
  error => {
    // Manejar errores comunes sin depender de toast (evitar importación circular)
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('❌ Error de conexión: El backend no está disponible en http://localhost:8080');
      error.message = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
    } else if (error.response?.status === 401) {
      console.warn('Sesión expirada');
      localStorage.removeItem('token');
      // No recargar automáticamente, dejar que el componente maneje esto
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (name: string, email: string, password: string, sessionId?: string, role?: string) => {
    const { data } = await api.post<{ token: string }>('/auth/register', { name, email, password, sessionId, role });
    localStorage.setItem('token', data.token);
    return data.token;
  },
  login: async (email: string, password: string) => {
    const { data } = await api.post<{ token: string }>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    return data.token;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

type SubmitAnswerPayload = { questionId: number; answerId?: number; numericValue?: number; textValue?: string };

export const testService = {
  list: async () => {
    const { data } = await api.get('/tests');
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get(`/tests/${id}`);
    return data;
  },
  submitAnswers: async (testId: number, answers: SubmitAnswerPayload[]) => {
    await api.post('/flow/submit', { answers, testId });
  },
};

export const initialTestService = {
  createSession: async () => {
    const { data } = await api.post('/initial-test/session');
    return data.sessionId;
  },
  getTest: async (sessionId: string) => {
    const { data } = await api.get(`/initial-test?sessionId=${sessionId}`);
    return data;
  },
  submitAnswers: async (sessionId: string, answers: SubmitAnswerPayload[]) => {
    const { data } = await api.post(`/initial-test/submit?sessionId=${sessionId}`, { answers });
    return data;
  },
  getStatus: async (sessionId: string) => {
    const { data } = await api.get(`/initial-test/status?sessionId=${sessionId}`);
    return data;
  },
};

export const resultsService = {
  getMyResults: async () => {
    const { data } = await api.get('/results/my-results');
    return data;
  },
  getUserTest: async (userId: number, testId: number) => {
    const { data } = await api.get(`/results/user/${userId}/test/${testId}`);
    return data;
  },
  getTestDetails: async (testId: number) => {
    const { data } = await api.get(`/results/test/${testId}`);
    return data;
  },
  exportUserTest: async (userId: number, testId: number) => {
    const { data } = await api.get(`/results/user/${userId}/test/${testId}/export`, { responseType: 'arraybuffer' });
    return data as ArrayBuffer;
  },
  exportUserAll: async (userId: number) => {
    const { data } = await api.get(`/results/user/${userId}/export`, { responseType: 'arraybuffer' });
    return data as ArrayBuffer;
  },
};

export const adminService = {
  // Tests
  listTests: async () => {
    const { data } = await api.get('/admin/tests');
    return data;
  },
  getTest: async (id: number) => {
    const { data } = await api.get(`/admin/tests/${id}`);
    return data;
  },
  createTest: async (code: string, title: string, description: string) => {
    const { data } = await api.post('/admin/tests', { code, title, description });
    return data;
  },
  updateTest: async (id: number, updates: { code?: string; title?: string; description?: string; active?: boolean; category?: string | null; topic?: string | null }) => {
    const { data } = await api.put(`/admin/tests/${id}`, updates);
    return data;
  },
  deleteTest: async (id: number) => {
    await api.delete(`/admin/tests/${id}`);
  },
  // Questions
  getQuestions: async (testId: number) => {
    const { data } = await api.get(`/admin/tests/${testId}/questions`);
    return data;
  },
  getTestStructure: async (testId: number) => {
    const { data } = await api.get(`/admin/tests/${testId}/structure`);
    return data;
  },
  initDefaultStructure: async (testId: number) => {
    const { data } = await api.post(`/admin/tests/${testId}/init-structure`);
    return data;
  },
  createFactor: async (testId: number, code: string, name: string, description?: string, position?: number) => {
    const { data } = await api.post('/admin/factors', { testId, code, name, description, position });
    return data;
  },
  createSubfactor: async (testId: number, code: string, name: string, description?: string, factorId?: number, position?: number) => {
    const { data } = await api.post('/admin/subfactors', { testId, code, name, description, factorId, position });
    return data;
  },
  createQuestion: async (testId: number, text: string, type: string, position: number, answers?: Array<{ text: string; value: number; position: number }>, subfactorId?: number) => {
    const { data } = await api.post('/admin/questions', { testId, text, type, position, answers, subfactorId });
    return data;
  },
  updateQuestion: async (id: number, updates: { text?: string; type?: string; position?: number; subfactorId?: number }) => {
    const { data } = await api.put(`/admin/questions/${id}`, updates);
    return data;
  },
  setQuestionSubfactor: async (id: number, subfactorId?: number) => {
    await api.put(`/admin/questions/${id}/subfactor`, { subfactorId });
  },
  deleteQuestion: async (id: number) => {
    await api.delete(`/admin/questions/${id}`);
  },
  getAnswers: async (questionId: number) => {
    const { data } = await api.get(`/admin/questions/${questionId}/answers`);
    return data as Array<{ id: number; text: string; value?: number; position: number }>;
  },
  createAnswer: async (questionId: number, text: string, value: number, position: number) => {
    const { data } = await api.post('/admin/answers', { questionId, text, value, position });
    return data as { id: number; text: string; value?: number; position: number };
  },
  updateAnswer: async (answerId: number, updates: { text?: string; value?: number; position?: number }) => {
    const { data } = await api.put(`/admin/answers/${answerId}`, updates);
    return data as { id: number; text: string; value?: number; position: number };
  },
  deleteAnswer: async (answerId: number) => {
    await api.delete(`/admin/answers/${answerId}`);
  },
  // Users
  listUsers: async () => {
    const { data } = await api.get('/admin/users');
    return (data as Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      createdAt?: string;
      testsCompleted?: number;
      psychologistId?: number | null;
      psychologistName?: string | null;
    }>);
  },
  getUserDetails: async (userId: number) => {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  },
  getTestUserAnswers: async (testId: number) => {
    const { data } = await api.get(`/admin/tests/${testId}/user-answers`);
    return data;
  },
  // Roles y asignaciones
  setUserRole: async (userId: number, role: 'USER'|'ADMIN'|'PSYCHOLOGIST') => {
    await api.post('/admin/users/role', { userId, role });
  },
  listPsychologists: async () => {
    const { data } = await api.get('/admin/users/psychologists');
    return data as Array<{ id: number; name: string; email: string }>;
  },
  assignPsychologist: async (userId: number, psychologistId: number) => {
    await api.post('/admin/users/assign', { userId, psychologistId });
  },
  unassignPsychologist: async (userId: number) => {
    await api.delete(`/admin/users/assign/${userId}`);
  },
  // Evaluation Tests (Evaluaciones y Descubrimiento)
  listEvaluationTests: async () => {
    const { data } = await api.get('/admin/evaluation-tests');
    return data;
  },
  getEvaluationTest: async (id: number) => {
    const { data } = await api.get(`/admin/evaluation-tests/${id}`);
    return data;
  },
  createEvaluationTest: async (testData: {
    code: string;
    title: string;
    description?: string;
    category: 'EVALUATION' | 'DISCOVERY';
    topic: string;
    active?: boolean;
  }) => {
    const { data } = await api.post('/admin/evaluation-tests', testData);
    return data;
  },
  updateEvaluationTest: async (id: number, updates: {
    code?: string;
    title?: string;
    description?: string;
    category?: 'EVALUATION' | 'DISCOVERY';
    topic?: string;
    active?: boolean;
  }) => {
    const { data } = await api.put(`/admin/evaluation-tests/${id}`, updates);
    return data;
  },
  deleteEvaluationTest: async (id: number) => {
    await api.delete(`/admin/evaluation-tests/${id}`);
  },
};

// Perfil de usuario
export const profileService = {
  me: async () => {
    const { data } = await api.get('/profile');
    const user = data as { id: number; name: string; email: string; role: string; avatarUrl?: string | null; darkMode?: boolean; gender?: string; age?: number; createdAt?: string };
    return { ...user, avatarUrl: resolveAssetUrl(user.avatarUrl) };
  },
  update: async (updates: { name?: string; darkMode?: boolean; gender?: string | null; age?: number | null }) => {
    await api.put('/profile', updates);
  },
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const response = data as { avatarUrl: string };
    return { avatarUrl: resolveAssetUrl(response.avatarUrl) };
  },
  myPsychologist: async () => {
    const { data } = await api.get('/profile/my-psychologist');
    const result = data as { status: 'PENDING'|'ASSIGNED'; psychologist?: { id: number; name: string; email: string; avatarUrl?: string | null } };
    if (result.psychologist) {
      result.psychologist.avatarUrl = resolveAssetUrl(result.psychologist.avatarUrl) ?? undefined;
    }
    return result;
  },
  getPsychologistProfile: async (psychologistId: number) => {
    const { data } = await api.get(`/profile/psychologist/${psychologistId}`);
    const profile = data as any;
    if (profile.avatarUrl) {
      profile.avatarUrl = resolveAssetUrl(profile.avatarUrl) ?? undefined;
    }
    return profile;
  }
};

// Tareas
export const tasksService = {
  list: async () => {
    const { data } = await api.get('/tasks');
    return data as Array<any>;
  },
  get: async (taskId: number) => {
    const { data } = await api.get(`/tasks/${taskId}`);
    return data as any;
  },
  create: async (payload: { userId: number; psychologistId: number; title: string; description?: string; dueDate?: string }) => {
    const { data } = await api.post('/tasks', payload);
    return data as any;
  },
  getFiles: async (taskId: number) => {
    const { data } = await api.get(`/tasks/${taskId}/files`);
    return data as Array<any>;
  },
  uploadFile: async (taskId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post(`/tasks/${taskId}/files`, form, { 
        headers: { 
          'Content-Type': 'multipart/form-data' 
        },
        timeout: 30000 // 30 segundos de timeout
      });
      return data as any;
    } catch (error: any) {
      console.error('Error en uploadFile service:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },
  getComments: async (taskId: number) => {
    const { data } = await api.get(`/tasks/${taskId}/comments`);
    return data as Array<any>;
  },
  addComment: async (taskId: number, content: string) => {
    const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
    return data as any;
  }
};

// Tests asignados
export const assignedTestsService = {
  list: async () => {
    const { data } = await api.get('/assigned-tests');
    // Resolver URLs de avatar para cada test asignado
    return (data as Array<any>).map((at: any) => ({
      ...at,
      userAvatarUrl: at.userAvatarUrl ? resolveAssetUrl(at.userAvatarUrl) : null
    }));
  },
  assign: async (payload: { userId: number; testId: number }) => {
    const { data } = await api.post('/assigned-tests', payload);
    return data as any;
  },
  unassign: async (id: number) => {
    await api.delete(`/assigned-tests/${id}`);
  },
  markCompleted: async (id: number) => {
    const { data } = await api.post(`/assigned-tests/${id}/complete`);
    return data as any;
  }
};

// Calendario
export const calendarService = {
  createSlot: async (start: string, end: string, price?: number) => {
    const { data } = await api.post('/calendar/slots', { start, end, price });
    return data as any;
  },
  mySlots: async (from: string, to: string) => {
    const { data } = await api.get('/calendar/slots', { params: { from, to } });
    return data as Array<any>;
  },
  availability: async (from: string, to: string) => {
    const { data } = await api.get('/calendar/availability', { params: { from, to } });
    return data as Array<any>;
  },
  book: async (appointmentId: number) => {
    const { data } = await api.post(`/calendar/book/${appointmentId}`);
    return data;
  },
  myAppointments: async () => {
    const { data } = await api.get('/calendar/my-appointments');
    return data as Array<{ id: number; startTime: string; endTime: string; status: string; psychologist?: { id: number; name: string; email: string }; paymentStatus?: string; paymentDeadline?: string; confirmedAt?: string }>;
  },
  getPendingRequests: async () => {
    const { data } = await api.get('/calendar/requests/pending');
    return data as Array<any>;
  },
  confirmAppointment: async (requestId: number) => {
    const { data } = await api.post(`/calendar/confirm/${requestId}`);
    return data;
  },
  cancelAppointment: async (appointmentId: number) => {
    const { data } = await api.post(`/calendar/cancel/${appointmentId}`);
    return data;
  },
  createForPatient: async (userId: number, start: string, end: string, price?: number) => {
    const { data } = await api.post('/calendar/create-for-patient', { userId, start, end, price });
    return data;
  },
  deleteSlot: async (appointmentId: number) => {
    const { data } = await api.delete(`/calendar/slots/${appointmentId}`);
    return data;
  },
  updateSlot: async (appointmentId: number, updates: { price?: number; startTime?: string; endTime?: string }) => {
    const { data } = await api.put(`/calendar/slots/${appointmentId}`, updates);
    return data;
  },
  getPastAppointments: async () => {
    const { data } = await api.get('/calendar/past-appointments');
    return data;
  },
  rateAppointment: async (appointmentId: number, rating: number, comment?: string) => {
    const { data } = await api.post(`/calendar/appointments/${appointmentId}/rate`, { rating, comment });
    return data;
  },
  getPsychologistRating: async (psychologistId: number) => {
    const { data } = await api.get(`/calendar/psychologist/${psychologistId}/rating`);
    return data;
  },
  getPsychologistPastAppointments: async () => {
    const { data } = await api.get('/calendar/psychologist/past-appointments');
    return data;
  }
};

// Psicólogo
export const psychService = {
  patients: async () => {
    const { data } = await api.get('/psych/patients');
    const list = data as Array<{ id: number; name: string; email: string; avatarUrl?: string | null }>;
    return list.map((patient) => ({
      ...patient,
      avatarUrl: resolveAssetUrl(patient.avatarUrl) ?? undefined,
    }));
  },
  getPatientDetails: async (patientId: number) => {
    const { data } = await api.get(`/psych/patients/${patientId}`);
    return data;
  },
  getPatientTestAnswers: async (patientId: number, testId: number) => {
    const { data } = await api.get(`/psych/patients/${patientId}/tests/${testId}/answers`);
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get('/psych/profile');
    return data;
  },
  updateProfile: async (profile: {
    bio?: string;
    education?: string;
    certifications?: string;
    interests?: string;
    specializations?: string;
    experience?: string;
    languages?: string;
    linkedinUrl?: string;
    website?: string;
  }) => {
    const { data } = await api.put('/psych/profile', profile);
    return data;
  }
};

// Jitsi
export const jitsiService = {
  getRoomInfo: async (otherUserEmail: string) => {
    const { data } = await api.get('/jitsi/room-info', { 
      params: { otherUserEmail } 
    });
    return data as { 
      roomName: string; 
      currentUser: { email: string; name: string };
      otherUser: { email: string; name: string };
      hasActiveAppointment: boolean;
    };
  }
};

// Stripe
export const stripeService = {
  createCheckoutSession: async (planId: string, isYearly: boolean) => {
    const { data } = await api.post('/stripe/create-checkout-session', {
      planId,
      isYearly
    });
    return data as { sessionId: string; url: string };
  },
  getPublicKey: async () => {
    const { data } = await api.get('/stripe/public-key');
    return data as { publicKey: string };
  }
};

export const personalAgendaService = {
  saveEntry: async (entryData: any) => {
    try {
      const { data } = await api.post('/personal-agenda/entry', entryData);
      return data;
    } catch (error: any) {
      console.error('API Error in personalAgendaService.saveEntry:', error);
      console.error('Request payload:', entryData);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },
  getTodayEntry: async () => {
    const { data } = await api.get('/personal-agenda/entry/today');
    return data;
  },
  getUserEntries: async () => {
    const { data } = await api.get('/personal-agenda/entries');
    return data;
  },
  getStatistics: async (days: number = 30) => {
    const { data } = await api.get(`/personal-agenda/statistics?days=${days}`);
    return data;
  }
};

export const evaluationTestService = {
  getTestsByCategory: async (category: string) => {
    const { data } = await api.get(`/evaluation-tests/category/${category}`);
    return data;
  },
  getTestsByTopic: async (category: string, topic: string) => {
    const { data } = await api.get(`/evaluation-tests/category/${category}/topic/${topic}`);
    return data;
  },
  getAllTests: async () => {
    const { data } = await api.get('/evaluation-tests/all');
    return data;
  },
  submitResult: async (testId: number, resultData: any) => {
    const { data } = await api.post(`/evaluation-tests/${testId}/submit`, resultData);
    return data;
  },
  getUserResults: async () => {
    const { data } = await api.get('/evaluation-tests/results');
    return data;
  },
  getUserStatistics: async () => {
    const { data } = await api.get('/evaluation-tests/statistics');
    return data;
  }
};

export default api;
