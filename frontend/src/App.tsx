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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showSoyProfesional, setShowSoyProfesional] = useState(false);
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

  useEffect(() => {
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

    // Solo actualizar si el path es diferente (con un pequeño delay para evitar loops)
    // IMPORTANTE: Preservar el hash si existe (para rutas de tests)
    const timer = setTimeout(() => {
      const browserPath = window.location.pathname;
      const currentState = window.history.state;
      const currentHash = window.location.hash; // Preservar el hash
      
      // Si hay un hash de test, NO actualizar el historial para no perderlo
      if (currentHash && currentHash.startsWith('#/test/')) {
        return; // No hacer nada, dejar el hash intacto
      }
      
      if (currentPath !== browserPath || (currentState && currentState.page !== currentPath)) {
        const urlToUse = currentPath + (currentHash || ''); // Incluir hash si existe
        if (!currentState || !currentState.page) {
          window.history.replaceState({ page: currentPath }, '', urlToUse);
        } else {
          window.history.pushState({ page: currentPath }, '', urlToUse);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [showLanding, showAbout, showSoyProfesional, showLogin, showRegister, showInitialTest, isAuthenticated]);

  const goToLanding = useCallback(() => {
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
      
      // Cuando el usuario hace clic en "Atrás", navegar según el historial
      if (event.state && event.state.page) {
        const path = event.state.page;
        if (path === '/') {
          goToLanding();
        } else if (path === '/about') {
          handleShowAbout();
        } else if (path === '/soy-profesional') {
          handleShowSoyProfesional();
        } else if (path === '/login') {
          handleShowLogin();
        } else if (path === '/register') {
          setShowRegister(true);
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowInitialTest(false);
        } else if (path === '/initial-test') {
          setShowInitialTest(true);
          setShowLanding(false);
          setShowAbout(false);
          setShowSoyProfesional(false);
          setShowLogin(false);
          setShowRegister(false);
        } else {
          // Para cualquier otra ruta, volver a la landing
          goToLanding();
        }
      } else {
        // Si no hay estado, significa que el usuario está intentando salir de la app
        // Volver inmediatamente a la landing
        goToLanding();
        // Asegurar que la landing esté en el historial
        window.history.replaceState({ page: '/' }, '', '/');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [goToLanding, handleShowAbout, handleShowSoyProfesional, handleShowLogin]);

  const handleLogin = () => {
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
    setShowLanding(false);
    setShowAbout(false);
    setShowSoyProfesional(false);
    setShowInitialTest(true);
  };

  const handleStartInitialTest = useCallback(() => {
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

  if (showSoyProfesional) {
    return <SoyProfesional onBack={goToLanding} onLogin={handleShowLogin} onGetStarted={handleGetStarted} />;
  }

  if (showInitialTest) {
    return (
      <div>
        <nav>
          <div className="container" style={{ maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 
              onClick={() => { setShowInitialTest(false); setShowLanding(true); }}
              style={{ cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              PSYmatch
            </h3>
            <button onClick={() => { setShowInitialTest(false); setShowLanding(true); }} className="btn-secondary">Volver</button>
          </div>
        </nav>
        <InitialTestFlow 
          onComplete={handleInitialTestComplete}
          onBack={() => { setShowInitialTest(false); setShowLanding(true); }}
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
    </div>
  );
}

export default App;
