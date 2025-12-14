import { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import Landing from './components/Landing';
import TestFlow from './components/TestFlow';
import InitialTestFlow from './components/InitialTestFlow';
import { authService } from './services/api';
import UserDashboard from './components/UserDashboard';
import PsychDashboard from './components/PsychDashboard';
import AdminUsersPanel from './components/AdminUsersPanel';
import About from './components/About';
import SoyProfesional from './components/SoyProfesional';
import RegisterPsychologist from './components/RegisterPsychologist';
import { ToastContainer } from './components/ui/Toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showSoyProfesional, setShowSoyProfesional] = useState(false);
  const [showRegisterPsychologist, setShowRegisterPsychologist] = useState(false);
  const [showInitialTest, setShowInitialTest] = useState(false);
  const [initialTestSessionId, setInitialTestSessionId] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [role, setRole] = useState<'USER'|'ADMIN'|'PSYCHOLOGIST'|null>(null);
  const [adminTab, setAdminTab] = useState<'tests'|'users'>('users');

  const checkRole = async () => {
    try {
      const userData: any = await authService.me();
      setRole(userData?.role || null);
    } catch (err: any) {
      console.error('Error verificando rol:', err);
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
    // Inicializar el historial con la URL actual
    const currentPath = window.location.pathname;
    const initialState = window.history.state;
    
    if (!initialState || !initialState.page) {
      // Si no hay estado, inicializar con la ruta actual
      window.history.replaceState({ page: currentPath }, '', currentPath);
      lastHistoryPath.current = currentPath;
    } else {
      lastHistoryPath.current = initialState.page;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setShowLanding(false);
      // Intentar verificar el rol, pero no bloquear si el backend no está disponible
      checkRole().catch((err) => {
        // Si el backend no está disponible, no es crítico - el usuario puede seguir usando la app
        console.warn('Backend no disponible, pero continuando...', err);
      });
    } else {
      // Si no hay token, asegurarse de que esté en la landing
      setShowLanding(true);
      setShowAbout(false);
      setShowSoyProfesional(false);
      setShowLogin(false);
      setShowRegister(false);
      setShowInitialTest(false);
      setRole(null);
    }
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
  }, [showLanding, showAbout, showSoyProfesional, showLogin, showRegister, showInitialTest, isAuthenticated]);

  const goToLanding = useCallback(() => {
    isUserNavigation.current = true;
    setShowLanding(true);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
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
          setShowRegister(false);
          setShowInitialTest(false);
          setSelectedTestId(null);
        } else if (statePath === '/about') {
          setShowLanding(false);
          setShowAbout(true);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        } else if (statePath === '/soy-profesional') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(true);
          setShowLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        } else if (statePath === '/login') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(true);
          setShowRegister(false);
          setShowInitialTest(false);
        } else if (statePath === '/register') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowRegister(true);
          setShowInitialTest(false);
        } else if (statePath === '/initial-test') {
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowRegister(false);
          setShowInitialTest(true);
        } else if (statePath === '/dashboard') {
          // Si el usuario está autenticado y vuelve al dashboard
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowRegister(false);
          setShowInitialTest(false);
        } else {
          // Para cualquier otra ruta, volver a la landing
          setShowLanding(true);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
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
    setShowRegister(false);
    setInitialTestSessionId(null);
    checkRole();
  };

  const handleGetStarted = () => {
    isUserNavigation.current = true;
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowInitialTest(true);
  };

  const handleStartInitialTest = useCallback(() => {
    isUserNavigation.current = true;
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowLogin(false);
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
  };


  // Renderizar según el estado
  // Prioridad: About > InitialTest > Register/Login > Landing > Authenticated views
  
  if (showAbout) {
    return <About onBack={goToLanding} onLogin={handleShowLogin} onGetStarted={handleGetStarted} />;
  }

  if (showRegisterPsychologist) {
    return <RegisterPsychologist 
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
    />;
  }

  if (showSoyProfesional) {
    return <SoyProfesional 
      onBack={goToLanding} 
      onLogin={handleShowLogin} 
      onGetStarted={() => {
        isUserNavigation.current = true;
        setShowSoyProfesional(false);
        setShowRegisterPsychologist(true);
      }} 
    />;
  }

  if (showInitialTest) {
    return (
      <div>
        <nav>
          <div className="container" style={{ maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 
              onClick={() => { isUserNavigation.current = true; setShowInitialTest(false); setShowLanding(true); }}
              style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              PSYmatch
            </h3>
            <button onClick={() => { isUserNavigation.current = true; setShowInitialTest(false); setShowLanding(true); }} className="btn-secondary">Volver</button>
          </div>
        </nav>
        <InitialTestFlow 
          onComplete={handleInitialTestComplete}
          onBack={() => { isUserNavigation.current = true; setShowInitialTest(false); setShowLanding(true); }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return <Register 
        onRegister={handleRegister} 
        onSwitchToLogin={handleShowLogin}
        sessionId={initialTestSessionId}
      />;
    }
    if (showLogin) {
      return <Login onLogin={handleLogin} onSwitchToRegister={handleShowRegister} />;
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
          <div className="container" style={{ maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 
              onClick={goToLanding}
              style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              PSYmatch
            </h3>
            <button onClick={handleBackToList} className="btn-secondary">Volver</button>
          </div>
        </nav>
        <TestFlow 
          testId={selectedTestId} 
          onBack={handleBackToList}
          onComplete={handleBackToList}
        />
      </div>
    );
  }


  // Navegación principal autenticado según rol
  return (
    <div>
      <nav>
        <div className="container" style={{ maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 
            onClick={goToLanding}
            style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            PSYmatch
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {role === 'ADMIN' && (
              <>
                <button className={`btn-secondary ${adminTab==='users'?'active':''}`} onClick={() => setAdminTab('users')}>Roles</button>
                <button className={`btn-secondary ${adminTab==='tests'?'active':''}`} onClick={() => setAdminTab('tests')}>Gestión de tests</button>
              </>
            )}
            <button onClick={handleLogout} className="btn-secondary">Cerrar sesión</button>
          </div>
        </div>
      </nav>

      {/* ADMIN: sólo panel admin */}
      {role === 'ADMIN' && (
        <div>
          {adminTab === 'users' ? <AdminUsersPanel /> : <AdminPanel />}
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

      {/* Si no tenemos el rol aún pero estamos autenticados */}
      {isAuthenticated && !role && roleCheckInProgress.current && (
        <div className="container" style={{ maxWidth: '1200px', marginTop: 24, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>Cargando...</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Si esto tarda mucho, verifica que el backend esté funcionando correctamente.
          </div>
        </div>
      )}
      
      {/* Toast Container para notificaciones */}
      <ToastContainer />
    </div>
  );
}

export default App;
