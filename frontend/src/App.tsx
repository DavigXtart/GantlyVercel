import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import Login from './components/Login';
import Register from './components/Register';
import Landing from './components/Landing';
import { authService } from './services/api';
import { ToastContainer, toast } from './components/ui/Toast';
import GlobalLoader from './components/ui/GlobalLoader';
import Maintenance from './components/Maintenance';
import CookieBanner from './components/ui/CookieBanner';
import CrisisButton from './components/CrisisButton';
import NotificationBell from './components/ui/NotificationBell';

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

const LazyFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>Cargando...</div>
    </div>
  </div>
);

// Auth context shared across routes
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
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
        localStorage.removeItem('token');
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

  const logout = useCallback(() => {
    localStorage.removeItem('token');
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

// Component to handle OAuth callback (token in URL hash or query)
function OAuthHandler({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = hashParams.get('token') || urlParams.get('token');
    const errorFromUrl = hashParams.get('error') || urlParams.get('error');

    if (tokenFromUrl && location.pathname.includes('reset-password')) {
      return; // Let ResetPassword route handle it
    }

    if (tokenFromUrl && tokenFromUrl.length > 10) {
      localStorage.setItem('token', tokenFromUrl);
      window.location.hash = '';
      onLogin();
      toast.success('¡Sesión iniciada correctamente!');
      navigate('/dashboard', { replace: true });
      return;
    }

    if (errorFromUrl) {
      navigate('/login', { replace: true, state: { oauthError: decodeURIComponent(errorFromUrl) } });
    }
  }, []);

  return null;
}

// Detect referral slug from URL path
function ReferralRedirect() {
  const location = useLocation();
  const pathSlug = location.pathname.replace(/^\//, '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const KNOWN_PATHS = ['', 'about', 'login', 'register', 'initial-test', 'reset-password', 'soy-profesional', 'privacidad', 'terminos', 'login-empresa', 'register-psicologo', 'register-empresa', 'forgot-password', 'dashboard', 'test'];

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

  return (
    <div>
      <nav>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Gantly
          </h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {role === 'ADMIN' && (
              <>
                <button className={`btn-secondary ${adminTab === 'users' ? 'active' : ''}`} onClick={() => setAdminTab('users')}>Roles</button>
                <button className={`btn-secondary ${adminTab === 'admin-tests' ? 'active' : ''}`} onClick={() => setAdminTab('admin-tests')}>Tests</button>
                <button className={`btn-secondary ${adminTab === 'patients' ? 'active' : ''}`} onClick={() => setAdminTab('patients')}>Pacientes</button>
                <button className={`btn-secondary ${adminTab === 'psychologists' ? 'active' : ''}`} onClick={() => setAdminTab('psychologists')}>Psicólogos</button>
                <button className={`btn-secondary ${adminTab === 'sections' ? 'active' : ''}`} onClick={() => setAdminTab('sections')}>Secciones</button>
                <button className={`btn-secondary ${adminTab === 'statistics' ? 'active' : ''}`} onClick={() => setAdminTab('statistics')}>Estadísticas</button>
              </>
            )}
            {(role === 'USER' || role === 'PSYCHOLOGIST' || role === 'EMPRESA') && <NotificationBell />}
            <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <Suspense fallback={<LazyFallback />}>
        {role === 'ADMIN' && (
          <div>
            {adminTab === 'users' ? <AdminUsersPanel /> :
              adminTab === 'admin-tests' ? <AdminPanel /> :
                adminTab === 'patients' ? <UsersManager filterRole="USER" /> :
                  adminTab === 'psychologists' ? <UsersManager filterRole="PSYCHOLOGIST" /> :
                    adminTab === 'sections' ? <AdminSectionsManager /> :
                      adminTab === 'statistics' ? <AdminStatistics /> :
                        <AdminPanel />}
          </div>
        )}
        {role === 'USER' && <UserDashboard onStartTest={onStartTest} />}
        {role === 'PSYCHOLOGIST' && <PsychDashboard />}
        {role === 'EMPRESA' && <ClinicDashboard />}
      </Suspense>

      {!role && (
        <div className="container" style={{ maxWidth: '1200px', marginTop: 24, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>Cargando tu cuenta...</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Si esto tarda mucho, verifica que el backend esté funcionando correctamente.
          </div>
        </div>
      )}

      <GlobalLoader />
      <ToastContainer />
      <CookieBanner onPrivacyClick={() => navigate('/privacidad')} />
      {role === 'USER' && <CrisisButton />}
    </div>
  );
}

// Test flow page
function TestPage({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const testIdStr = location.pathname.split('/test/')[1];
  const testId = testIdStr ? parseInt(testIdStr) : null;

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
          <h3
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Gantly
          </h3>
          <button onClick={handleBack} className="btn-secondary">Volver</button>
        </div>
      </nav>
      <Suspense fallback={<LazyFallback />}>
        <TestFlow testId={testId} onBack={handleBack} onComplete={handleBack} />
      </Suspense>
    </div>
  );
}

function App() {
  const { isAuthenticated, role, maintenanceMode, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialTestSessionId, setInitialTestSessionId] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Pick up OAuth error from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.oauthError) {
      setOauthError(state.oauthError);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  if (maintenanceMode) {
    return <Maintenance />;
  }

  const handleLogin = () => {
    login();
    setInitialTestSessionId(null);
    navigate('/dashboard');
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
            <CookieBanner onPrivacyClick={() => {}} />
          </Suspense>
        } />
        <Route path="/terminos" element={
          <Suspense fallback={<LazyFallback />}>
            <TermsOfService onBack={() => navigate('/')} />
            <CookieBanner />
          </Suspense>
        } />

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

        {/* Initial test */}
        <Route path="/initial-test" element={
          <div>
            <nav>
              <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 onClick={() => navigate('/')} style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
                  Gantly
                </h3>
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

        {/* Catch-all: detect referral slugs or redirect to landing */}
        <Route path="*" element={<ReferralRedirect />} />
      </Routes>
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
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
        <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Ha ocurrido un error inesperado</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Lo sentimos, algo salió mal. Por favor, recarga la página.</p>
        <button onClick={() => window.location.reload()} style={{ background: '#5a9270', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
          Recargar página
        </button>
      </div>
    }>
      <App />
    </Sentry.ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
