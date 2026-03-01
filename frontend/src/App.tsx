import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
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
const CompanyDashboard = lazy(() => import('./components/CompanyDashboard'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService'));

const LazyFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center', color: '#6b7280' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>Cargando...</div>
    </div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showSoyProfesional, setShowSoyProfesional] = useState(false);
  const [showRegisterPsychologist, setShowRegisterPsychologist] = useState(false);
  const [showRegisterCompany, setShowRegisterCompany] = useState(false);
  const [showCompanyLogin, setShowCompanyLogin] = useState(false);
  const [showInitialTest, setShowInitialTest] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [initialTestSessionId, setInitialTestSessionId] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [role, setRole] = useState<'USER'|'ADMIN'|'PSYCHOLOGIST'|'EMPRESA'|null>(null);
  const [psychologistReferralFromUrl, setPsychologistReferralFromUrl] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'tests'|'users'|'sections'|'admin-tests'|'admin-users'|'patients'|'psychologists'|'statistics'>('users');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  const checkRole = async () => {
    try {
      const userData: any = await authService.me();
      setRole(userData?.role || null);
    } catch (err: any) {
      // Si hay un error de autenticación, limpiar el token
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setShowLanding(true);
      }
      setRole(null);
    }
  };

  // Referencia para evitar actualizar el historial cuando se hace popstate
  const isNavigatingBack = useRef(false);
  const roleCheckInProgress = useRef(false);
  const lastProcessedTestIdRef = useRef<number | null>(null);
  const lastHistoryPath = useRef<string | null>(null);
  const isUserNavigation = useRef(false); // Indica si la navegación fue iniciada por el usuario

  useEffect(() => {
    // Leer token/error del fragment (#) o query string (?) para compatibilidad
    const hash = window.location.hash.substring(1); // quitar el #
    const hashParams = new URLSearchParams(hash);
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = hashParams.get('token') || urlParams.get('token');
    const errorFromUrl = hashParams.get('error') || urlParams.get('error');

    // Inicializar el historial con la URL actual (esto puede borrar ?token= de la barra de direcciones)
    const currentPath = window.location.pathname;
    const initialState = window.history.state;
    
    if (!initialState || !initialState.page) {
      window.history.replaceState({ page: currentPath }, '', currentPath);
      lastHistoryPath.current = currentPath;
    } else {
      lastHistoryPath.current = initialState.page;
    }
    if (tokenFromUrl && window.location.pathname.includes('reset-password')) {
      setResetPasswordToken(tokenFromUrl);
      setShowLanding(false);
      setShowLogin(false);
      setShowRegister(false);
      window.history.replaceState(null, '', '/reset-password');
      return;
    }
    // OAuth2: token en URL (el backend redirige a /#token=xxx)
    if (tokenFromUrl && tokenFromUrl.length > 10) {
      localStorage.setItem('token', tokenFromUrl);
      window.history.replaceState(null, '', window.location.pathname || '/');
      window.location.hash = '';
      setIsAuthenticated(true);
      setShowLanding(false);
      setShowLogin(false);
      setShowRegister(false);
      toast.success('¡Sesión iniciada correctamente!');
      checkRole().catch(() => {});
      return;
    }
    if (errorFromUrl) {
      setOauthError(decodeURIComponent(errorFromUrl));
      setShowLogin(true);
      setShowLanding(false);
      window.history.replaceState(null, '', '/');
      return;
    }

    // Legal pages from URL
    const currentPathname = window.location.pathname || '/';
    if (currentPathname === '/privacidad') {
      setShowPrivacyPolicy(true);
      setShowLanding(false);
      return;
    }
    if (currentPathname === '/terminos') {
      setShowTermsOfService(true);
      setShowLanding(false);
      return;
    }

    // Referral de psicólogo: ?referral=juan-garcia o pathname /juan-garcia
    const referralFromQuery = urlParams.get('referral');
    const pathname = currentPathname;
    const pathSlug = pathname.replace(/^\//, '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const KNOWN_PATHS = ['', 'about', 'login', 'register', 'initial-test', 'reset-password', 'soy-profesional', 'privacidad', 'terminos'];
    const isReferralSlug = pathSlug && pathSlug.length > 2 && !KNOWN_PATHS.includes(pathSlug);

    if (referralFromQuery && referralFromQuery.trim()) {
      setPsychologistReferralFromUrl(referralFromQuery.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''));
      setShowRegister(true);
      setShowLanding(false);
      setShowLogin(false);
      setShowInitialTest(false);
    } else if (isReferralSlug) {
      setPsychologistReferralFromUrl(pathSlug);
      setShowRegister(true);
      setShowLanding(false);
      setShowLogin(false);
      setShowInitialTest(false);
      window.history.replaceState({ page: '/register' }, '', '/register?referral=' + pathSlug);
    }

    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setShowLanding(false);
      setShowCompanyLogin(false);
      // Intentar verificar el rol, pero no bloquear si el backend no está disponible
      checkRole().catch(() => {
        // Si el backend no está disponible, no es crítico - el usuario puede seguir usando la app
      });
    } else {
      // Si no hay token y no viene por referral, mostrar landing
      if (!referralFromQuery && !isReferralSlug) {
        setShowLanding(true);
        setShowAbout(false);
        setShowSoyProfesional(false);
        setShowLogin(false);
        setShowCompanyLogin(false);
        setShowRegister(false);
        setShowInitialTest(false);
        setShowForgotPassword(false);
      }
      setRole(null);
    }
  }, []);

  // Escuchar evento de sesión expirada para mostrar toast y redirigir a login
  useEffect(() => {
    const handleSessionExpired = () => {
      toast.warning('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      setIsAuthenticated(false);
      setRole(null);
      setShowLanding(false);
      setShowLogin(true);
      setShowRegister(false);
    };
    const handleMaintenance = () => setMaintenanceMode(true);
    window.addEventListener('session-expired', handleSessionExpired);
    window.addEventListener('maintenance-mode', handleMaintenance);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
      window.removeEventListener('maintenance-mode', handleMaintenance);
    };
  }, []);

  // Manejar el historial del navegador de forma más simple y segura
  useEffect(() => {
    // Solo manejar el historial después de que el componente se haya renderizado
    if (isNavigatingBack.current) {
      isNavigatingBack.current = false;
      return;
    }

    // Determinar qué página mostrar según el estado
    let currentPath = '/';
    if (showAbout) {
      currentPath = '/about';
    } else if (showSoyProfesional) {
      currentPath = '/soy-profesional';
    } else if (showCompanyLogin) {
      currentPath = '/login-empresa';
    } else if (showLogin) {
      currentPath = '/login';
    } else if (showRegister) {
      currentPath = '/register';
    } else if (showInitialTest) {
      currentPath = '/initial-test';
    } else if (isAuthenticated && !showLanding && !showAbout && !showSoyProfesional && !showLogin && !showRegister && !showInitialTest) {
      currentPath = '/dashboard';
    } else {
      currentPath = '/';
    }

    // Solo actualizar si el path es diferente
    const timer = setTimeout(() => {
      const browserPath = window.location.pathname;
      const currentState = window.history.state;
      const currentHash = window.location.hash;
      
      // Si hay un hash de test, NO actualizar el historial para no perderlo
      if (currentHash && currentHash.startsWith('#/test/')) {
        return;
      }
      
      // Si el path no ha cambiado desde la última vez, no hacer nada
      if (lastHistoryPath.current === currentPath && browserPath === currentPath) {
        return;
      }
      
      const urlToUse = currentPath + (currentHash || '');
      
      // Si es navegación del usuario, usar pushState; si no, replaceState
      if (isUserNavigation.current && currentPath !== lastHistoryPath.current) {
        // Navegación explícita del usuario - crear nueva entrada en el historial
        window.history.pushState({ page: currentPath }, '', urlToUse);
        lastHistoryPath.current = currentPath;
        isUserNavigation.current = false; // Resetear después de usar
      } else if (currentPath !== browserPath || (currentState && currentState.page !== currentPath)) {
        // Actualización interna - reemplazar la entrada actual
        window.history.replaceState({ page: currentPath }, '', urlToUse);
        lastHistoryPath.current = currentPath;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [showLanding, showAbout, showSoyProfesional, showLogin, showCompanyLogin, showRegister, showInitialTest, isAuthenticated]);

  const goToLanding = useCallback(() => {
    isUserNavigation.current = true;
    setShowLanding(true);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowRegister(false);
    setShowInitialTest(false);
    setSelectedTestId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleShowAbout = useCallback(() => {
    isUserNavigation.current = true;
    setShowLanding(false);
    setShowAbout(true);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowRegister(false);
    setShowInitialTest(false);
    setSelectedTestId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleShowSoyProfesional = useCallback(() => {
    isUserNavigation.current = true;
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(true);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowRegister(false);
    setShowInitialTest(false);
    setSelectedTestId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleShowLogin = useCallback(() => {
    isUserNavigation.current = true;
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(true);
    setShowCompanyLogin(false);
    setShowRegister(false);
    setShowInitialTest(false);
    setSelectedTestId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleShowRegister = useCallback(() => {
    isUserNavigation.current = true;
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowRegister(true);
    setShowInitialTest(false);
    setSelectedTestId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Escuchar cambios en el hash para rutas de tests
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastProcessedHash = window.location.hash;

    const checkHashRoute = () => {
      const hash = window.location.hash;
      
      // Si el hash no cambió, no hacer nada
      if (hash === lastProcessedHash) {
        return;
      }
      
      lastProcessedHash = hash;
      
      if (hash && hash.startsWith('#/test/')) {
        const testIdMatch = hash.match(/#\/test\/(\d+)/);
        if (testIdMatch) {
          const testId = parseInt(testIdMatch[1]);
          if (!isNaN(testId) && testId > 0 && testId !== lastProcessedTestIdRef.current) {
            lastProcessedTestIdRef.current = testId;
            setSelectedTestId(testId);
          }
        }
      }
    };

    // Verificar al cargar
    checkHashRoute();

    // Escuchar cambios en el hash
    const handleHashChange = () => {
      checkHashRoute();
    };

    // Verificar periódicamente (solo si hay un hash de test)
    const intervalId = setInterval(() => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/test/')) {
        checkHashRoute();
      }
    }, 100);

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isAuthenticated]);

  // NO limpiar el hash automáticamente - dejarlo para que el usuario pueda usar el botón atrás del navegador

  // Escuchar el evento popstate (botón atrás/adelante del navegador)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      isNavigatingBack.current = true;
      isUserNavigation.current = false; // No es navegación del usuario, es del navegador
      
      // Actualizar lastHistoryPath para evitar actualizaciones innecesarias
      const path = (event.state && event.state.page) ? event.state.page : window.location.pathname;
      lastHistoryPath.current = path;
      
      // Cuando el usuario hace clic en "Atrás", navegar según el historial
      if (event.state && event.state.page) {
        const statePath = event.state.page;
        if (statePath === '/') {
          setShowLanding(true);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowCompanyLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
          setSelectedTestId(null);
        } else if (statePath === '/about') {
          setShowLanding(false);
          setShowAbout(true);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowCompanyLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        } else if (statePath === '/soy-profesional') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(true);
          setShowLogin(false);
          setShowCompanyLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        } else if (statePath === '/login') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(true);
          setShowCompanyLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        } else if (statePath === '/login-empresa') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowCompanyLogin(true);
          setShowRegister(false);
          setShowInitialTest(false);
        } else if (statePath === '/register') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowCompanyLogin(false);
          setShowRegister(true);
          setShowInitialTest(false);
        } else if (statePath === '/initial-test') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowCompanyLogin(false);
          setShowRegister(false);
          setShowInitialTest(true);
        } else if (statePath === '/dashboard') {
          // Si el usuario está autenticado y vuelve al dashboard
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowCompanyLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        } else {
          // Para cualquier otra ruta, volver a la landing
          setShowLanding(true);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowCompanyLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        }
      } else {
        // Si no hay estado, verificar la URL actual
        const currentPath = window.location.pathname;
        if (currentPath === '/' || !currentPath) {
          setShowLanding(true);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        } else {
          // Intentar restaurar según la URL
          lastHistoryPath.current = currentPath;
        }
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogin = () => {
    isUserNavigation.current = true;
    setIsAuthenticated(true);
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowRegister(false);
    setShowInitialTest(false);
    setInitialTestSessionId(null);
    checkRole();
  };

  const handleLogout = () => {
    isUserNavigation.current = true;
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setSelectedTestId(null);
    setRole(null);
    setShowLanding(true);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowRegister(false);
    setShowInitialTest(false);
    setInitialTestSessionId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegister = () => {
    isUserNavigation.current = true;
    setIsAuthenticated(true);
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowRegister(false);
    setInitialTestSessionId(null);
    checkRole();
  };

  const handleGetStarted = () => {
    isUserNavigation.current = true;
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowInitialTest(true);
  };

  const _handleStartInitialTest = useCallback(() => {
    isUserNavigation.current = true;
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
    setShowRegister(false);
    setShowInitialTest(true);
    setSelectedTestId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleInitialTestComplete = (sessionId: string) => {
    isUserNavigation.current = true;
    setInitialTestSessionId(sessionId);
    setShowInitialTest(false);
    setShowRegister(true);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
    setShowCompanyLogin(false);
  };


  // Renderizar según el estado
  // Prioridad: Legal Pages > About > InitialTest > Register/Login > Landing > Authenticated views

  if (showPrivacyPolicy) {
    return (
      <>
        <Suspense fallback={<LazyFallback />}>
          <PrivacyPolicy onBack={() => { setShowPrivacyPolicy(false); setShowLanding(true); window.history.replaceState({ page: '/' }, '', '/'); }} />
        </Suspense>
        <CookieBanner onPrivacyClick={() => {}} />
      </>
    );
  }

  if (showTermsOfService) {
    return (
      <>
        <Suspense fallback={<LazyFallback />}>
          <TermsOfService onBack={() => { setShowTermsOfService(false); setShowLanding(true); window.history.replaceState({ page: '/' }, '', '/'); }} />
        </Suspense>
        <CookieBanner />
      </>
    );
  }

  if (showAbout) {
    return <Suspense fallback={<LazyFallback />}><About onBack={goToLanding} onLogin={handleShowLogin} onGetStarted={handleGetStarted} /></Suspense>;
  }

  if (showRegisterPsychologist) {
    return <Suspense fallback={<LazyFallback />}><RegisterPsychologist 
      onBack={() => {
        isUserNavigation.current = true;
        setShowRegisterPsychologist(false);
        setShowSoyProfesional(true);
      }} 
      onLogin={handleShowLogin} 
      onSuccess={() => {
        setShowRegisterPsychologist(false);
        handleLogin();
      }}
    /></Suspense>;
  }

  if (showRegisterCompany) {
    return <Suspense fallback={<LazyFallback />}><RegisterCompany
      onBack={() => {
        isUserNavigation.current = true;
        setShowRegisterCompany(false);
        setShowSoyProfesional(true);
      }}
      onLogin={handleShowLogin}
      onSuccess={() => {
        setShowRegisterCompany(false);
        handleLogin();
      }}
    /></Suspense>;
  }

  if (showSoyProfesional) {
    return <Suspense fallback={<LazyFallback />}><SoyProfesional 
      onBack={goToLanding} 
      onLogin={handleShowLogin} 
      onGetStarted={() => {
        isUserNavigation.current = true;
        setShowSoyProfesional(false);
        setShowRegisterPsychologist(true);
      }}
      onRegisterCompany={() => {
        isUserNavigation.current = true;
        setShowSoyProfesional(false);
        setShowRegisterCompany(true);
      }}
    /></Suspense>;
  }

  if (showInitialTest) {
    return (
      <div>
        <nav>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 
              onClick={() => { isUserNavigation.current = true; setShowInitialTest(false); setShowLanding(true); }}
              style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Gantly
            </h3>
            <button onClick={() => { isUserNavigation.current = true; setShowInitialTest(false); setShowLanding(true); }} className="btn-secondary">Volver</button>
          </div>
        </nav>
        <Suspense fallback={<LazyFallback />}>
          <InitialTestFlow
            onComplete={handleInitialTestComplete}
            onBack={() => { isUserNavigation.current = true; setShowInitialTest(false); setShowLanding(true); }}
          />
        </Suspense>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Manejar reset de contraseña desde URL
    if (resetPasswordToken) {
      return <Suspense fallback={<LazyFallback />}><ResetPassword 
        token={resetPasswordToken} 
        onSuccess={() => {
          setResetPasswordToken(null);
          window.history.replaceState(null, '', '/login');
          handleShowLogin();
        }}
        onBack={() => {
          setResetPasswordToken(null);
          window.history.replaceState(null, '', '/login');
          handleShowLogin();
        }}
      /></Suspense>;
    }

    if (showForgotPassword) {
      return <Suspense fallback={<LazyFallback />}><ForgotPassword 
        onBack={() => {
          setShowForgotPassword(false);
          handleShowLogin();
        }}
        onSuccess={() => {
          setShowForgotPassword(false);
          handleShowLogin();
        }}
      /></Suspense>;
    }

    if (showRegister) {
      return <Register 
        onRegister={handleRegister} 
        onSwitchToLogin={handleShowLogin}
        sessionId={initialTestSessionId}
        psychologistReferralCode={psychologistReferralFromUrl || undefined}
      />;
    }
    if (showCompanyLogin) {
      return <Login
        variant="company"
        onLogin={handleLogin}
        onSwitchToRegister={handleShowRegister}
        onForgotPassword={() => {
          setShowCompanyLogin(false);
          setShowForgotPassword(true);
        }}
        oauthError={oauthError}
        onClearOauthError={() => setOauthError(null)}
        onSwitchToUserLogin={handleShowLogin}
      />;
    }
    if (showLogin) {
      return <Login 
        onLogin={handleLogin} 
        onSwitchToRegister={handleShowRegister}
        onForgotPassword={() => {
          setShowLogin(false);
          setShowForgotPassword(true);
        }}
        oauthError={oauthError}
        onClearOauthError={() => setOauthError(null)}
        onSwitchToCompanyLogin={() => {
          isUserNavigation.current = true;
          setShowLogin(false);
          setShowCompanyLogin(true);
        }}
      />;
    }
    // Si no hay ninguna vista específica, mostrar la landing (por defecto)
    return <Landing 
      onGetStarted={handleGetStarted} 
      onLogin={handleShowLogin} 
      onShowAbout={handleShowAbout} 
      onShowSoyProfesional={handleShowSoyProfesional}
    />;
  }

  // Usuario autenticado
  const handleBackToList = () => {
    lastProcessedTestIdRef.current = null;
    setSelectedTestId(null);
    // Limpiar el hash cuando se sale del test
    window.history.replaceState(null, '', window.location.pathname);
  };

  if (isAuthenticated && selectedTestId) {
    return (
      <div>
        <nav>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 
              onClick={goToLanding}
              style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Gantly
            </h3>
            <button onClick={handleBackToList} className="btn-secondary">Volver</button>
          </div>
        </nav>
        <Suspense fallback={<LazyFallback />}>
          <TestFlow
            testId={selectedTestId}
            onBack={handleBackToList}
            onComplete={handleBackToList}
          />
        </Suspense>
      </div>
    );
  }


  // Modo mantenimiento
  if (maintenanceMode) {
    return <Maintenance />;
  }

  // Navegación principal autenticado según rol
  return (
    <div>
      <nav>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 
            onClick={goToLanding}
            style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Gantly
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {role === 'ADMIN' && (
              <>
                <button className={`btn-secondary ${adminTab==='users'?'active':''}`} onClick={() => setAdminTab('users')}>Roles</button>
                <button className={`btn-secondary ${adminTab==='admin-tests'?'active':''}`} onClick={() => setAdminTab('admin-tests')}>Tests</button>
                <button className={`btn-secondary ${adminTab==='patients'?'active':''}`} onClick={() => setAdminTab('patients')}>Pacientes</button>
                <button className={`btn-secondary ${adminTab==='psychologists'?'active':''}`} onClick={() => setAdminTab('psychologists')}>Psicólogos</button>
                <button className={`btn-secondary ${adminTab==='sections'?'active':''}`} onClick={() => setAdminTab('sections')}>Secciones</button>
                <button className={`btn-secondary ${adminTab==='statistics'?'active':''}`} onClick={() => setAdminTab('statistics')}>Estadísticas</button>
              </>
            )}
            <button onClick={handleLogout} className="btn-secondary">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      <Suspense fallback={<LazyFallback />}>
        {/* ADMIN: sólo panel admin */}
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

        {/* USER: Mi perfil */}
        {role === 'USER' && (
          <UserDashboard onStartTest={(testId) => {
            lastProcessedTestIdRef.current = testId;
            setSelectedTestId(testId);
          }} />
        )}

        {/* PSYCHOLOGIST: Mi perfil */}
        {role === 'PSYCHOLOGIST' && (
          <PsychDashboard />
        )}

        {/* EMPRESA: Panel de psicólogos */}
        {role === 'EMPRESA' && (
          <CompanyDashboard />
        )}
      </Suspense>

      {/* Si no tenemos el rol aún pero estamos autenticados (ej. tras OAuth) */}
      {isAuthenticated && !role && (
        <div className="container" style={{ maxWidth: '1200px', marginTop: 24, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>Cargando tu cuenta...</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Si esto tarda mucho, verifica que el backend esté funcionando correctamente.
          </div>
        </div>
      )}
      
      {/* Global loading indicator */}
      <GlobalLoader />
      {/* Toast Container para notificaciones */}
      <ToastContainer />
      {/* Cookie consent banner */}
      <CookieBanner onPrivacyClick={() => { setShowPrivacyPolicy(true); }} />
      {/* Crisis button for authenticated users */}
      <CrisisButton />
    </div>
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
