import { useState, useEffect } from 'react';
import { adminService } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  testsCompleted: number;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  tests: Array<{
    testId: number;
    testCode: string;
    testTitle: string;
    answers: Array<{
      questionId: number;
      questionText: string;
      answerId?: number;
      answerText?: string;
      answerValue?: number;
      numericValue?: number;
      createdAt: string;
    }>;
  }>;
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserDetails(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.listUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      alert('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: number) => {
    try {
      setLoading(true);
      const data = await adminService.getUserDetails(userId);
      setUserDetails(data);
    } catch (err) {
      console.error('Error cargando detalles del usuario:', err);
      alert('Error al cargar los detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (selectedUserId && userDetails) {
    return (
      <div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2>Detalles del Usuario</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                {userDetails.name} ({userDetails.email})
              </p>
            </div>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setSelectedUserId(null);
                setUserDetails(null);
              }}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              ← Volver
            </button>
          </div>

          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px' }}>
            <p><strong>Rol:</strong> {userDetails.role}</p>
            <p><strong>Fecha de registro:</strong> {formatDate(userDetails.createdAt)}</p>
            <p><strong>Tests completados:</strong> {userDetails.tests.length}</p>
          </div>

          {userDetails.tests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <p>Este usuario aún no ha completado ningún test.</p>
            </div>
          ) : (
            <div className="tests-list">
              {userDetails.tests.map((test) => (
                <div key={test.testId} className="card" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3>{test.testTitle}</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Código: {test.testCode}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>
                      Respuestas ({test.answers.length})
                    </h4>
                    <div className="answers-list">
                      {test.answers.map((answer, idx) => (
                        <div key={answer.questionId} className="answer-card-admin" style={{ marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span className="question-number" style={{ fontSize: '12px', width: '24px', height: '24px' }}>
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
                                      <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                        (Valor: {answer.answerValue})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                  <strong>Valor numérico:</strong> {answer.numericValue}
                                </p>
                              ) : (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Sin respuesta registrada
                                </p>
                              )}
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {formatDate(answer.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Usuarios Registrados ({users.length})</h2>
          <button 
            className="btn-secondary" 
            onClick={loadUsers} 
            disabled={loading}
            style={{ width: 'auto', padding: '8px 16px' }}
          >
            🔄 Actualizar
          </button>
        </div>

        {loading && users.length === 0 ? (
          <div className="loading">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No hay usuarios registrados aún.</p>
          </div>
        ) : (
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card-admin">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3>{user.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {user.email}
                    </p>
                  </div>
                  <span className={`status-badge ${user.role === 'ADMIN' ? 'status-active' : 'status-inactive'}`}>
                    {user.role === 'ADMIN' ? '👑 Admin' : '👤 Usuario'}
                  </span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <strong>Tests completados:</strong> {user.testsCompleted}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Registrado: {formatDate(user.createdAt)}
                  </p>
                </div>
                <button 
                  className="btn" 
                  onClick={() => setSelectedUserId(user.id)}
                  style={{ width: '100%', padding: '10px 16px', fontSize: '15px' }}
                >
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

