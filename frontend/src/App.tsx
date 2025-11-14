import { useState, useEffect } from 'react';
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showInitialTest, setShowInitialTest] = useState(false);
  const [initialTestSessionId, setInitialTestSessionId] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [role, setRole] = useState<'USER'|'ADMIN'|'PSYCHOLOGIST'|null>(null);
  const [adminTab, setAdminTab] = useState<'tests'|'users'>('users');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setShowLanding(false);
      checkRole();
    }
  }, []);

  const checkRole = async () => {
    try {
      const userData: any = await authService.me();
      setRole(userData?.role || null);
    } catch (err) {
      console.error('Error verificando rol:', err);
      setRole(null);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowLanding(false);
    setShowAbout(false);
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
    setShowLogin(false);
    setShowRegister(false);
    setInitialTestSessionId(null);
    checkRole();
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    setShowAbout(false);
    setShowInitialTest(true);
  };

  const handleInitialTestComplete = (sessionId: string) => {
    setInitialTestSessionId(sessionId);
    setShowInitialTest(false);
    setShowRegister(true);
    setShowAbout(false);
  };

  const handleShowLogin = () => {
    setShowLanding(false);
    setShowAbout(false);
    setShowLogin(true);
  };

  const handleShowAbout = () => {
    setShowLanding(false);
    setShowAbout(true);
    setShowLogin(false);
    setShowRegister(false);
    setShowInitialTest(false);
    setSelectedTestId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToLanding = () => {
    setShowLanding(true);
    setShowAbout(false);
    setShowLogin(false);
    setShowRegister(false);
    setShowInitialTest(false);
    setSelectedTestId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showAbout) {
    return <About onBack={goToLanding} onLogin={handleShowLogin} onGetStarted={handleGetStarted} />;
  }

  if (showLanding) {
    return <Landing onGetStarted={handleGetStarted} onLogin={handleShowLogin} onShowAbout={handleShowAbout} />;
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

  const handleBackToList = () => {
    setSelectedTestId(null);
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

  if (!isAuthenticated) {
    if (showRegister) {
      return <Register 
        onRegister={handleRegister} 
        onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} 
        sessionId={initialTestSessionId}
      />;
    }
    if (showLogin) {
      return <Login onLogin={handleLogin} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />;
    }
    return null;
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
        <UserDashboard />
      )}

      {/* PSYCHOLOGIST: Mi perfil */}
      {role === 'PSYCHOLOGIST' && (
        <PsychDashboard />
      )}

      {/* Si no tenemos el rol aún */}
      {!role && (
        <div className="container" style={{ maxWidth: '1200px', marginTop: 24 }}>Cargando...</div>
      )}
    </div>
  );
}

export default App;
