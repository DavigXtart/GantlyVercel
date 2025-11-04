import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import TestsList from './components/TestsList';
import AdminPanel from './components/AdminPanel';
import Landing from './components/Landing';
import TestFlow from './components/TestFlow';
import InitialTestFlow from './components/InitialTestFlow';
import { authService } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showInitialTest, setShowInitialTest] = useState(false);
  const [initialTestSessionId, setInitialTestSessionId] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setShowLanding(false);
      checkAdminRole();
    }
  }, []);

  const checkAdminRole = async () => {
    try {
      const userData: any = await authService.me();
      console.log('User data:', userData); // Debug
      if (userData && userData.role === 'ADMIN') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false); // Asegurar que solo ADMIN ve el panel
      }
    } catch (err) {
      console.error('Error verificando rol:', err);
      setIsAdmin(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    checkAdminRole(); // Verificar rol después de login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setSelectedTestId(null);
    setShowAdmin(false);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setShowLanding(false);
    setShowRegister(false);
    setInitialTestSessionId(null);
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    setShowInitialTest(true);
  };

  const handleInitialTestComplete = (sessionId: string) => {
    setInitialTestSessionId(sessionId);
    setShowInitialTest(false);
    setShowRegister(true);
  };

  const handleShowLogin = () => {
    setShowLanding(false);
    setShowLogin(true);
  };

  if (showLanding) {
    return <Landing onGetStarted={handleGetStarted} onLogin={handleShowLogin} />;
  }

  if (showInitialTest) {
    return (
      <div>
        <nav>
          <div className="container" style={{ maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Psico App</h3>
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

  const handleSelectTest = (id: number) => {
    setSelectedTestId(id);
  };

  const handleBackToList = () => {
    setSelectedTestId(null);
  };

  if (isAuthenticated && selectedTestId) {
    return (
      <div>
        <nav>
          <div className="container" style={{ maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Psico App</h3>
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

  return (
    <div>
      <nav>
        <div className="container" style={{ maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Psico App</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin && !showAdmin && (
              <button onClick={() => setShowAdmin(true)} className="btn-secondary">Panel Admin</button>
            )}
            {showAdmin && (
              <button onClick={() => setShowAdmin(false)} className="btn-secondary">Tests</button>
            )}
            <button onClick={handleLogout} className="btn-secondary">Cerrar sesión</button>
          </div>
        </div>
      </nav>
      {showAdmin ? <AdminPanel /> : <TestsList onSelectTest={handleSelectTest} />}
    </div>
  );
}

export default App;
