import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
});

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
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('❌ Error de conexión: El backend no está disponible en http://localhost:8080');
      error.message = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (name: string, email: string, password: string, sessionId?: string) => {
    await api.post('/auth/register', { name, email, password, sessionId });
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

export const testService = {
  list: async () => {
    const { data } = await api.get('/tests');
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get(`/tests/${id}`);
    return data;
  },
  submitAnswers: async (testId: number, answers: { questionId: number; answerId?: number; numericValue?: number }[]) => {
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
  submitAnswers: async (sessionId: string, answers: { questionId: number; answerId?: number; numericValue?: number }[]) => {
    const { data } = await api.post(`/initial-test/submit?sessionId=${sessionId}`, { answers });
    return data;
  },
  getStatus: async (sessionId: string) => {
    const { data } = await api.get(`/initial-test/status?sessionId=${sessionId}`);
    return data;
  },
};

export const resultsService = {
  getMyResults: async (testId: number) => {
    const { data } = await api.get('/results/my-results', { params: { testId } });
    return data;
  },
  getUserTest: async (userId: number, testId: number) => {
    const { data } = await api.get(`/results/user/${userId}/test/${testId}`);
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
  updateTest: async (id: number, updates: { code?: string; title?: string; description?: string; active?: boolean }) => {
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
  // Answers
  getAnswers: async (questionId: number) => {
    const { data } = await api.get(`/admin/questions/${questionId}/answers`);
    return data;
  },
  createAnswer: async (questionId: number, text: string, value: number, position: number) => {
    const { data } = await api.post('/admin/answers', { questionId, text, value, position });
    return data;
  },
  updateAnswer: async (id: number, updates: { text?: string; value?: number; position?: number }) => {
    const { data } = await api.put(`/admin/answers/${id}`, updates);
    return data;
  },
  deleteAnswer: async (id: number) => {
    await api.delete(`/admin/answers/${id}`);
  },
  // Users
  listUsers: async () => {
    const { data } = await api.get('/admin/users');
    return data;
  },
  getUserDetails: async (userId: number) => {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  },
  getTestUserAnswers: async (testId: number) => {
    const { data } = await api.get(`/admin/tests/${testId}/user-answers`);
    return data;
  },
};

export default api;
