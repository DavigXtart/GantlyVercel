import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import Login from './components/Login';
import Register from './components/Register';
import Landing from './components/landing/Landing';
import { authService, gdprService, safeStorage } from './services/api';
import { ToastContainer, toast } from './components/ui/Toast';
import GlobalLoader from './components/ui/GlobalLoader';
import Maintenance from './components/Maintenance';
import CookieBanner from './components/ui/CookieBanner';
import CrisisButton from './components/CrisisButton';
import LogoSvg from './assets/logo-gantly.svg';

// Lazy-loaded heavy components
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const TestFlow = lazy(() => import('./components/TestFlow'));
const InitialTestFlow = lazy(() => import('./components/InitialTestFlow'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));
const PsychDashboard = lazy(() => import('./components/PsychDashboard'));
const AdminUsersPanel = lazy(() => import('./components/AdminUsersPanel'));
const AdminSectionsManager = lazy(() => import('./components/AdminSectionsManager'));
const AdminStatistics = lazy(() => import('./components/AdminStatistics'));
const UsersManager = lazy(() => import('./components/UsersManager'));
const About = lazy(() => import('./components/About'));
const SoyProfesional = lazy(() => import('./components/SoyProfesional'));
const RegisterPsychologist = lazy(() => import('./components/RegisterPsychologist'));
const RegisterCompany = lazy(() => import('./components/RegisterCompany'));
const ClinicDashboard = lazy(() => import('./components/ClinicDashboard'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService'));
const PricingPage = lazy(() => import('./components/PricingPage'));
const TestResultsView = lazy(() => import('./components/TestResultsView'));
const ClinicPublicPage = lazy(() => import('./components/ClinicPublicPage'));

const LazyFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>Cargando...</div>
    </div>
  </div>
);

// Auth context shared across routes
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!safeStorage.get('token'));
  const [role, setRole] = useState<'USER' | 'ADMIN' | 'PSYCHOLOGIST' | 'EMPRESA' | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const roleCheckInProgress = useRef(false);

  const checkRole = useCallback(async () => {
    if (roleCheckInProgress.current) return;
    roleCheckInProgress.current = true;
    try {
      const userData: any = await authService.me();
      setRole(userData?.role || null);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        safeStorage.remove('token');
        setIsAuthenticated(false);
      }
      setRole(null);
    } finally {
      roleCheckInProgress.current = false;
    }
  }, []);

  const login = useCallback(() => {
    setIsAuthenticated(true);
    checkRole();
  }, [checkRole]);

  const logout = useCallback(async () => {
    try {
      const token = safeStorage.get('token');
      const refreshToken = safeStorage.get('refreshToken');
      if (token) {
        await authService.logout(refreshToken || undefined);
      }
    } catch {
      // Ignore errors — we clear local state regardless
    }
    safeStorage.remove('token');
    safeStorage.remove('refreshToken');
    setIsAuthenticated(false);
    setRole(null);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkRole().catch(() => {});
    }
  }, [isAuthenticated, checkRole]);

  useEffect(() => {
    const handleSessionExpired = () => {
      toast.warning('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      logout();
    };
    const handleMaintenance = () => setMaintenanceMode(true);
    window.addEventListener('session-expired', handleSessionExpired);
    window.addEventListener('maintenance-mode', handleMaintenance);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
      window.removeEventListener('maintenance-mode', handleMaintenance);
    };
  }, [logout]);

  return { isAuthenticated, role, maintenanceMode, login, logout, checkRole };
}

// Component to handle OAuth callback via one-time code exchange (secure: no tokens in URL)
function OAuthHandler({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorFromUrl = urlParams.get('error');

    // Sanitize OAuth error messages — never display raw backend strings
    const safeErrors: Record<string, string> = {
      'access_denied': 'Acceso denegado',
      'invalid_request': 'Solicitud invalida',
      'server_error': 'Error del servidor',
      'temporarily_unavailable': 'Servicio no disponible temporalmente',
    };

    // New flow: exchange one-time code for token (no tokens in URL)
    if (code && code.length > 10) {
      authService.exchangeOAuthCode(code)
        .then(() => {
          // Clear query params from URL
          window.history.replaceState({}, '', location.pathname);
          onLogin();
          toast.success('Sesion iniciada correctamente!');
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          navigate('/login', { replace: true, state: { oauthError: 'Error al iniciar sesion con Google' } });
        });
      return;
    }

    // Legacy fallback: token in URL hash (backwards compat — will be removed)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const tokenFromUrl = hashParams.get('token') || urlParams.get('token');

    if (tokenFromUrl && location.pathname.includes('reset-password')) {
      return; // Let ResetPassword route handle it
    }

    if (tokenFromUrl && tokenFromUrl.length > 10) {
      console.warn('[OAuth] Token found in URL — this flow is deprecated. Migrate backend to use code exchange.');
      safeStorage.set('token', tokenFromUrl);
      window.location.hash = '';
      onLogin();
      toast.success('Sesion iniciada correctamente!');
      navigate('/dashboard', { replace: true });
      return;
    }

    if (errorFromUrl) {
      const safeError = safeErrors[errorFromUrl] || 'Error de autenticacion';
      navigate('/login', { replace: true, state: { oauthError: safeError } });
    }
  }, []);

  return null;
}

// Detect referral slug from URL path
function ReferralRedirect() {
  const location = useLocation();
  const pathSlug = location.pathname.replace(/^\//, '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const KNOWN_PATHS = ['', 'about', 'login', 'register', 'initial-test', 'reset-password', 'soy-profesional', 'privacidad', 'privacy', 'terminos', 'login-empresa', 'register-psicologo', 'register-empresa', 'forgot-password', 'dashboard', 'test', 'oauth-callback', 'clinica', 'pricing', 'test-results'];

  if (pathSlug && pathSlug.length > 2 && !KNOWN_PATHS.includes(pathSlug)) {
    return <Navigate to={`/register?referral=${pathSlug}`} replace />;
  }

  return <Navigate to="/" replace />;
}

// Protected route wrapper
function ProtectedRoute({ isAuthenticated, children }: { isAuthenticated: boolean; children: React.ReactNode }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Dashboard component that renders based on role
function Dashboard({ role, logout, onStartTest }: {
  role: 'USER' | 'ADMIN' | 'PSYCHOLOGIST' | 'EMPRESA' | null;
  logout: () => void;
  onStartTest: (testId: number) => void;
}) {
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState<'tests' | 'users' | 'sections' | 'admin-tests' | 'admin-users' | 'patients' | 'psychologists' | 'statistics'>('users');

  // For USER, PSYCHOLOGIST, and EMPRESA roles, their dashboards handle their own navbar
  if (role === 'USER') {
    return (
      <Suspense fallback={<LazyFallback />}>
        <UserDashboard onStartTest={onStartTest} />
      </Suspense>
    );
  }

  if (role === 'PSYCHOLOGIST') {
    return (
      <Suspense fallback={<LazyFallback />}>
        <PsychDashboard />
      </Suspense>
    );
  }

  if (role === 'EMPRESA') {
    return (
      <Suspense fallback={<LazyFallback />}>
        <ClinicDashboard />
      </Suspense>
    );
  }

  // ADMIN role: render the outer nav with tabs
  if (role === 'ADMIN') {
    return (
      <div>
        <nav>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img src={LogoSvg} alt="Gantly" className="h-7 cursor-pointer" onClick={() => navigate('/')} />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className={`btn-secondary ${adminTab === 'users' ? 'active' : ''}`} onClick={() => setAdminTab('users')}>Roles</button>
              <button className={`btn-secondary ${adminTab === 'admin-tests' ? 'active' : ''}`} onClick={() => setAdminTab('admin-tests')}>Tests</button>
              <button className={`btn-secondary ${adminTab === 'patients' ? 'active' : ''}`} onClick={() => setAdminTab('patients')}>Pacientes</button>
              <button className={`btn-secondary ${adminTab === 'psychologists' ? 'active' : ''}`} onClick={() => setAdminTab('psychologists')}>Psicólogos</button>
              <button className={`btn-secondary ${adminTab === 'sections' ? 'active' : ''}`} onClick={() => setAdminTab('sections')}>Secciones</button>
              <button className={`btn-secondary ${adminTab === 'statistics' ? 'active' : ''}`} onClick={() => setAdminTab('statistics')}>Estadísticas</button>
              <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary">Cerrar sesión</button>
            </div>
          </div>
        </nav>

        <Suspense fallback={<LazyFallback />}>
          <div>
            {adminTab === 'users' ? <AdminUsersPanel /> :
              adminTab === 'admin-tests' ? <AdminPanel /> :
                adminTab === 'patients' ? <UsersManager filterRole="USER" /> :
                  adminTab === 'psychologists' ? <UsersManager filterRole="PSYCHOLOGIST" /> :
                    adminTab === 'sections' ? <AdminSectionsManager /> :
                      adminTab === 'statistics' ? <AdminStatistics /> :
                        <AdminPanel />}
          </div>
        </Suspense>

        <GlobalLoader />
        <ToastContainer />
      </div>
    );
  }

  // No role yet (loading state)
  return (
    <div>
      <div className="container" style={{ maxWidth: '1200px', marginTop: 24, padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '16px' }}>Cargando tu cuenta...</div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Si esto tarda mucho, verifica que el backend esté funcionando correctamente.
        </div>
      </div>
      <GlobalLoader />
      <ToastContainer />
    </div>
  );
}

// Test flow page
function TestPage({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const testIdStr = location.pathname.split('/test/')[1];
  const testId = testIdStr ? parseInt(testIdStr) : null;
  const previewOnly = (location.state as any)?.previewOnly === true;

  if (!testId || isNaN(testId)) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleBack = () => {
    onBack();
    navigate('/dashboard');
  };

  return (
    <div>
      <nav>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={LogoSvg} alt="Gantly" className="h-7 cursor-pointer" onClick={() => navigate('/')} />
          <button onClick={handleBack} className="btn-secondary">Volver</button>
        </div>
      </nav>
      <Suspense fallback={<LazyFallback />}>
        <TestFlow testId={testId} onBack={handleBack} onComplete={handleBack} previewOnly={previewOnly} />
      </Suspense>
    </div>
  );
}

// RGPD-12: Re-consent modal when privacy policy is updated
function ConsentRenewalModal({ onAccept }: { onAccept: () => void }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    setLoading(true);
    try {
      await gdprService.renewConsent();
      onAccept();
    } catch {
      // silent — user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <h2 id="consent-title" className="font-heading text-lg font-bold text-slate-800 mb-3">
          Politica de privacidad actualizada
        </h2>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Hemos actualizado nuestra politica de privacidad. Para continuar usando Gantly, necesitamos que aceptes los nuevos terminos.
        </p>
        <button
          onClick={() => navigate('/privacidad')}
          className="text-sm text-gantly-blue underline mb-4 block hover:text-gantly-blue/80"
        >
          Leer politica de privacidad
        </button>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-md bg-gantly-blue text-white font-semibold text-sm hover:bg-gantly-blue/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gantly-blue/20"
        >
          {loading ? 'Guardando...' : 'Acepto la nueva politica de privacidad'}
        </button>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, role, maintenanceMode, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialTestSessionId, setInitialTestSessionId] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [consentRequired, setConsentRequired] = useState(false);

  // RGPD-12: Listen for consent-required event from Axios interceptor
  useEffect(() => {
    const handleConsentRequired = () => setConsentRequired(true);
    window.addEventListener('consent-required', handleConsentRequired);
    return () => window.removeEventListener('consent-required', handleConsentRequired);
  }, []);

  // Pick up OAuth error from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.oauthError) {
      setOauthError(state.oauthError);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // Dark mode initialization from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      if (saved === 'true') {
        document.documentElement.classList.add('dark');
      }
    } catch { /* silent */ }
  }, []);

  if (maintenanceMode) {
    return <Maintenance />;
  }

  const handleLogin = () => {
    login();
    setInitialTestSessionId(null);
    navigate('/dashboard', { replace: true });
  };

  const handleStartTest = (testId: number) => {
    navigate(`/dashboard/test/${testId}`);
  };

  return (
    <>
      <OAuthHandler onLogin={login} />
      <Routes>
        {/* Public legal pages */}
        <Route path="/privacidad" element={
          <Suspense fallback={<LazyFallback />}>
            <PrivacyPolicy onBack={() => navigate('/')} />
          </Suspense>
        } />
        <Route path="/terminos" element={
          <Suspense fallback={<LazyFallback />}>
            <TermsOfService onBack={() => navigate('/')} />
          </Suspense>
        } />
        <Route path="/privacy" element={<Navigate to="/privacidad" replace />} />

        {/* Public pages */}
        <Route path="/about" element={
          <Suspense fallback={<LazyFallback />}>
            <About onBack={() => navigate('/')} onLogin={() => navigate('/login')} onGetStarted={() => navigate('/initial-test')} />
          </Suspense>
        } />
        <Route path="/soy-profesional" element={
          <Suspense fallback={<LazyFallback />}>
            <SoyProfesional
              onBack={() => navigate('/')}
              onLogin={() => navigate('/login')}
              onGetStarted={() => navigate('/register-psicologo')}
              onRegisterCompany={() => navigate('/register-empresa')}
            />
          </Suspense>
        } />
        <Route path="/register-psicologo" element={
          <Suspense fallback={<LazyFallback />}>
            <RegisterPsychologist
              onBack={() => navigate('/soy-profesional')}
              onLogin={() => navigate('/login')}
              onSuccess={handleLogin}
            />
          </Suspense>
        } />
        <Route path="/register-empresa" element={
          <Suspense fallback={<LazyFallback />}>
            <RegisterCompany
              onBack={() => navigate('/soy-profesional')}
              onLogin={() => navigate('/login')}
              onSuccess={handleLogin}
            />
          </Suspense>
        } />

        <Route path="/pricing" element={
          <Suspense fallback={<LazyFallback />}>
            <PricingPage onBack={() => navigate('/')} />
          </Suspense>
        } />

        {/* Public clinic page */}
        <Route path="/clinica/:slug" element={
          <Suspense fallback={<LazyFallback />}>
            <ClinicPublicPage />
          </Suspense>
        } />

        {/* Initial test */}
        <Route path="/initial-test" element={
          <div>
            <nav>
              <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <img src={LogoSvg} alt="Gantly" className="h-7 cursor-pointer" onClick={() => navigate('/')} />
                <button onClick={() => navigate('/')} className="btn-secondary">Volver</button>
              </div>
            </nav>
            <Suspense fallback={<LazyFallback />}>
              <InitialTestFlow
                onComplete={(sessionId: string) => {
                  setInitialTestSessionId(sessionId);
                  navigate('/register');
                }}
                onBack={() => navigate('/')}
              />
            </Suspense>
          </div>
        } />

        {/* Auth pages */}
        <Route path="/forgot-password" element={
          <Suspense fallback={<LazyFallback />}>
            <ForgotPassword onBack={() => navigate('/login')} onSuccess={() => navigate('/login')} />
          </Suspense>
        } />
        <Route path="/reset-password" element={
          <ResetPasswordRoute />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> :
            <RegisterRoute initialTestSessionId={initialTestSessionId} onRegister={handleLogin} />
        } />
        <Route path="/login-empresa" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> :
            <Login
              variant="company"
              onLogin={handleLogin}
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
              oauthError={oauthError}
              onClearOauthError={() => setOauthError(null)}
              onSwitchToUserLogin={() => navigate('/login')}
            />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> :
            <Login
              onLogin={handleLogin}
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
              oauthError={oauthError}
              onClearOauthError={() => setOauthError(null)}
              onSwitchToCompanyLogin={() => navigate('/login-empresa')}
            />
        } />

        {/* Authenticated routes */}
        <Route path="/test-results" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Suspense fallback={<LazyFallback />}><TestResultsView /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/test/:testId" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <TestPage onBack={() => {}} />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Dashboard role={role} logout={logout} onStartTest={handleStartTest} />
          </ProtectedRoute>
        } />

        {/* Landing / catch-all */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> :
            <Landing
              onGetStarted={() => navigate('/initial-test')}
              onLogin={() => navigate('/login')}
              onShowAbout={() => navigate('/about')}
              onShowSoyProfesional={() => navigate('/soy-profesional')}
            />
        } />

        {/* OAuth callback route: shows loading while code is exchanged for tokens */}
        <Route path="/oauth-callback" element={<GlobalLoader />} />

        {/* Catch-all: detect referral slugs or redirect to landing */}
        <Route path="*" element={<ReferralRedirect />} />
      </Routes>
      <CookieBanner onPrivacyClick={() => navigate('/privacidad')} />
      {isAuthenticated && consentRequired && (
        <ConsentRenewalModal onAccept={() => setConsentRequired(false)} />
      )}
    </>
  );
}

// Sub-route components
function ResetPasswordRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  const tokenFromHash = hashParams.get('token');
  const resetToken = token || tokenFromHash;

  if (!resetToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<LazyFallback />}>
      <ResetPassword
        token={resetToken}
        onSuccess={() => navigate('/login')}
        onBack={() => navigate('/login')}
      />
    </Suspense>
  );
}

function RegisterRoute({ initialTestSessionId, onRegister }: { initialTestSessionId: string | null; onRegister: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referral = searchParams.get('referral');
  const inviteToken = searchParams.get('inviteToken');

  return (
    <Register
      onRegister={onRegister}
      onSwitchToLogin={() => navigate('/login')}
      sessionId={initialTestSessionId}
      psychologistReferralCode={referral || undefined}
      inviteToken={inviteToken || undefined}
    />
  );
}

function AppWithErrorBoundary() {
  return (
    <Sentry.ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-gantly-cloud px-6">
        <div className="text-center max-w-md">
          <img src={LogoSvg} alt="Gantly" className="h-8 mx-auto mb-8 opacity-40" />
          <h2 className="font-heading text-2xl font-bold text-slate-800 mb-3">Ha ocurrido un error inesperado</h2>
          <p className="font-body text-slate-500 mb-8">Lo sentimos, algo salio mal. Por favor, recarga la pagina o vuelve al inicio.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-xl bg-gantly-blue text-white font-heading font-semibold text-sm cursor-pointer hover:bg-gantly-blue/90 transition-colors">
              Recargar pagina
            </button>
            <button onClick={() => { window.location.href = '/'; }} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-heading font-semibold text-sm cursor-pointer hover:bg-slate-50 transition-colors">
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    }>
      <App />
    </Sentry.ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
