import { useState, useEffect } from 'react';
import { adminService, resultsService } from '../services/api';
import BarChart from './BarChart';
import FactorChart from './FactorChart';
import InitialTestSummary from './InitialTestSummary';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  testsCompleted?: number;
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
      questionPosition?: number;
      questionType?: string;
      answerId?: number;
      answerText?: string;
      answerValue?: number;
      numericValue?: number;
      textValue?: string;
      createdAt: string;
    }>;
  }>;
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestForStats, setSelectedTestForStats] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<any | null>(null);
  const [overallStats, setOverallStats] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    loadUsers();
    loadTests();
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

  const loadTests = async () => {
    try {
      const data = await adminService.listTests();
      setTests(data || []);
    } catch (err) {
      console.error('Error cargando tests:', err);
    }
  };

  const loadUserStats = async (userId: number, testId: number) => {
    try {
      setLoading(true);
      const data = await resultsService.getUserTest(userId, testId);
      setUserStats(data);
    } catch (err) {
      console.error('Error cargando estadísticas de usuario:', err);
      alert('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: number) => {
    try {
      setLoading(true);
      const data = await adminService.getUserDetails(userId);
      setUserDetails(data);
      // precalcular media general de factores entre tests completados por el usuario
      try {
        const testIds = (data?.tests || []).map((t: any) => t.testId);
        if (testIds.length > 0) {
          const results = await Promise.all(
            testIds.map((tid: number) => resultsService.getUserTest(userId, tid).catch(() => null))
          );
          const factors: Record<string, { name: string; sum: number; count: number }> = {};
          for (const r of results) {
            if (!r || !r.factors) continue;
            for (const f of r.factors) {
              const key = f.factorCode || f.factorName || String(f.factorId);
              if (!factors[key]) factors[key] = { name: f.factorName || key, sum: 0, count: 0 };
              factors[key].sum += Number(f.percentage) || 0;
              factors[key].count += 1;
            }
          }
          const averaged = Object.entries(factors).map(([code, v]) => ({
            code,
            name: v.name,
            percentage: v.count > 0 ? v.sum / v.count : 0,
          }));
          setOverallStats({ factors: averaged });
        } else {
          setOverallStats(null);
        }
      } catch (e) {
        console.warn('No se pudo calcular media general', e);
      }
    } catch (err) {
      console.error('Error cargando detalles del usuario:', err);
      alert('Error al cargar los detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
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
              <h2>{userDetails.name}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{userDetails.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
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
              <button
                className="btn"
                onClick={async () => {
                  try {
                    const blob = new Blob([await resultsService.exportUserAll(userDetails.id)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const safeName = userDetails.name.replace(/[^a-zA-Z0-9]/g, '_');
                    a.download = `resultados_${safeName}.xlsx`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error(e);
                    alert('Error al exportar los datos del paciente');
                  }
                }}
                style={{ width: 'auto', padding: '12px 24px' }}
              >
                Exportar paciente
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px' }}>
            <p><strong>Rol:</strong> {userDetails.role}</p>
            <p><strong>Fecha de registro:</strong> {formatDate(userDetails.createdAt)}</p>
            <p><strong>Tests completados:</strong> {userDetails.tests.length}</p>
          </div>

          {overallStats && overallStats.factors && overallStats.factors.length > 0 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3>Media general (todos los tests) - Factores</h3>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <BarChart
                    data={overallStats.factors.map((f: any) => ({
                      label: f.code || f.name,
                      value: Number(f.percentage) || 0,
                    }))}
                    maxValue={100}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Estadísticas por Test</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={selectedTestForStats ?? ''}
                  onChange={(e) => {
                    const testId = e.target.value ? Number(e.target.value) : null;
                    setSelectedTestForStats(testId);
                    if (testId && userDetails) {
                      loadUserStats(userDetails.id, testId);
                    } else {
                      setUserStats(null);
                    }
                  }}
                  style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                >
                  <option value="">Selecciona test…</option>
                  {tests.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title || t.code}</option>
                  ))}
                </select>
              </div>
            </div>
            {!selectedTestForStats && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Selecciona un test para ver sus estadísticas.</p>
            )}
            {selectedTestForStats && loading && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Cargando estadísticas...</p>
            )}
            {selectedTestForStats && !loading && userStats && (
              <div style={{ marginTop: '16px' }}>
                {userStats.subfactors && userStats.subfactors.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4>Subfactores (gráfico)</h4>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <BarChart
                        data={userStats.subfactors.map((sf: any) => ({
                          label: sf.subfactorName || sf.subfactorCode,
                          value: Number(sf.percentage) || 0,
                        }))}
                        maxValue={100}
                      />
                    </div>
                    </div>
                  </div>
                )}
                {userStats.factors && userStats.factors.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4>Factores (gráfico)</h4>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <FactorChart
                        data={userStats.factors.map((f: any) => {
                          // Convertir porcentaje a escala 1-10
                          const percentage = Number(f.percentage) || 0;
                          const value = Math.round((percentage / 100) * 10);
                          const code = f.factorCode || '';
                          return {
                            label: code,
                            value: Math.max(1, Math.min(10, value)),
                          };
                        })}
                        maxValue={10}
                      />
                    </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                      {test.testCode === 'INITIAL' && test.answers.length > 0 && (
                        <InitialTestSummary test={test} />
                      )}
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
                                  {answer.textValue && (
                                    <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                      <strong>Detalle:</strong> {answer.textValue}
                                    </p>
                                  )}
                                </div>
                              ) : answer.textValue ? (
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                  <strong>Detalle:</strong> {answer.textValue}
                                </p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2>Usuarios Registrados ({users.length})</h2>
            {searchTerm.trim() && (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Mostrando {filteredUsers.length} coincidencia(s)
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar usuario por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '15px',
                minWidth: '220px'
              }}
            />
            <button 
              className="btn-secondary" 
              onClick={loadUsers} 
              disabled={loading}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="loading">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No hay usuarios registrados aún.</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No se encontraron usuarios que coincidan con “{searchTerm}”.</p>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map(user => (
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
                    <strong>Tests completados:</strong> {user.testsCompleted ?? 0}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Registrado: {formatDate(user.createdAt)}
                  </p>
                </div>
                <button 
                  className="btn btn-compact" 
                  onClick={() => setSelectedUserId(user.id)}
                >
                  Ver detalles
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

