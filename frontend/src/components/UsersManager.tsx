import { useState, useEffect } from 'react';
import { adminService, calendarService, resultsService } from '../services/api';
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

interface UsersManagerProps {
  filterRole?: 'USER' | 'PSYCHOLOGIST';
}

interface PsychologistSummary {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  averageRating: number | null;
  totalRatings: number;
  activePatients: Array<{ id: number; name: string; email: string; status: string; assignedAt: string }>;
  dischargedPatients: Array<{ id: number; name: string; email: string; status: string; assignedAt: string }>;
  scheduledAppointments: Array<{ id: number; startTime: string; endTime: string; status: string; price: number; patientName: string; patientEmail: string }>;
  pastAppointments: Array<{ id: number; startTime: string; endTime: string; status: string; price: number; patientName: string; patientEmail: string }>;
  totalBilled: number;
}

export default function UsersManager({ filterRole }: UsersManagerProps = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetail | null>(null);
  const [psychologistSummary, setPsychologistSummary] = useState<PsychologistSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestForStats, setSelectedTestForStats] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<any | null>(null);
  const [overallStats, setOverallStats] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [ratingsList, setRatingsList] = useState<Array<{ rating: number; comment: string; patientName: string; createdAt: string }>>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query)
    );
  });

  const regularUsers = filteredUsers.filter(user => user.role === 'USER');
  const psychologists = filteredUsers.filter(user => user.role === 'PSYCHOLOGIST');
  const displayedUsers = filterRole === 'USER' ? regularUsers : filterRole === 'PSYCHOLOGIST' ? psychologists : filteredUsers;

  useEffect(() => {
    loadUsers();
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      if (filterRole === 'PSYCHOLOGIST') {
        loadPsychologistSummary(selectedUserId);
      } else {
        loadUserDetails(selectedUserId);
      }
    } else {
      setUserDetails(null);
      setPsychologistSummary(null);
    }
  }, [selectedUserId, filterRole]);

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

  const loadPsychologistSummary = async (psychologistId: number) => {
    try {
      setLoading(true);
      setUserDetails(null);
      const data = await adminService.getPsychologistSummary(psychologistId);
      setPsychologistSummary(data);
    } catch (err) {
      console.error('Error cargando resumen del psicólogo:', err);
      alert('Error al cargar los datos del psicólogo');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: number) => {
    try {
      setLoading(true);
      setPsychologistSummary(null);
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

  // Panel de psicólogo (admin)
  if (filterRole === 'PSYCHOLOGIST' && selectedUserId) {
    if (loading && !psychologistSummary) {
      return (
        <div className="card">
          <div className="loading">Cargando datos del psicólogo...</div>
        </div>
      );
    }
    if (!psychologistSummary) return null;
    const ps = psychologistSummary;
    return (
      <div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2>{ps.name}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{ps.email}</p>
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedUserId(null);
                setPsychologistSummary(null);
              }}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              ← Volver
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div
                  onClick={async () => {
                    if (ps.totalRatings === 0) return;
                    setShowRatingsModal(true);
                    setLoadingRatings(true);
                    try {
                      const list = await calendarService.getPsychologistRatings(ps.id);
                      setRatingsList(list);
                    } catch (e) {
                      console.error(e);
                      setRatingsList([]);
                    } finally {
                      setLoadingRatings(false);
                    }
                  }}
                  style={{
                    padding: '16px',
                    background: '#f0f5f3',
                    borderRadius: '12px',
                    border: '1px solid rgba(90, 146, 112, 0.2)',
                    cursor: ps.totalRatings > 0 ? 'pointer' : 'default',
                    opacity: ps.totalRatings > 0 ? 1 : 0.8
                  }}
                  title={ps.totalRatings > 0 ? 'Click para ver todas las reseñas' : undefined}
                >
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Valoración media</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#5a9270' }}>
                    {ps.averageRating != null ? `${ps.averageRating.toFixed(1)} ★` : '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>({ps.totalRatings} valoraciones)</div>
                </div>
                <div style={{ padding: '16px', background: '#f0f5f3', borderRadius: '12px', border: '1px solid rgba(90, 146, 112, 0.2)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total facturado</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#5a9270' }}>
                    {ps.totalBilled != null ? `${Number(ps.totalBilled).toFixed(2)} €` : '0 €'}
                  </div>
                </div>
                <div style={{ padding: '16px', background: '#f0f5f3', borderRadius: '12px', border: '1px solid rgba(90, 146, 112, 0.2)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pacientes activos</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#5a9270' }}>{ps.activePatients.length}</div>
                </div>
                <div style={{ padding: '16px', background: '#f0f5f3', borderRadius: '12px', border: '1px solid rgba(90, 146, 112, 0.2)' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pacientes dados de alta</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#5a9270' }}>{ps.dischargedPatients.length}</div>
                </div>
              </div>

              {showRatingsModal && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '24px'
                  }}
                  onClick={() => setShowRatingsModal(false)}
                >
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      maxWidth: '520px',
                      width: '100%',
                      maxHeight: '80vh',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>Reseñas de pacientes</h3>
                      <button
                        className="btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        onClick={() => setShowRatingsModal(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                      {loadingRatings ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Cargando reseñas...</p>
                      ) : ratingsList.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay reseñas</p>
                      ) : (
                        ratingsList.map((r, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '16px',
                              marginBottom: '12px',
                              background: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <strong>{r.patientName}</strong>
                              <span style={{ color: '#fbbf24', fontSize: '16px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                            </div>
                            {r.comment && <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{r.comment}</p>}
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>{formatDate(r.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px' }}>
                <p><strong>Registrado:</strong> {formatDate(ps.createdAt)}</p>
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Pacientes activos ({ps.activePatients.length})</h3>
                {ps.activePatients.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay pacientes activos</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {ps.activePatients.map(p => (
                      <li key={p.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{p.name}</strong> — {p.email}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asignado: {formatDate(p.assignedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Pacientes dados de alta ({ps.dischargedPatients.length})</h3>
                {ps.dischargedPatients.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay pacientes dados de alta</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {ps.dischargedPatients.map(p => (
                      <li key={p.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{p.name}</strong> — {p.email}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asignado: {formatDate(p.assignedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Citas agendadas ({ps.scheduledAppointments.length})</h3>
                {ps.scheduledAppointments.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay citas agendadas</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {ps.scheduledAppointments.map(a => (
                      <li key={a.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div><strong>{a.patientName}</strong> — {a.patientEmail}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {formatDate(a.startTime)} — {a.price != null ? `${Number(a.price).toFixed(2)} €` : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Citas pasadas ({ps.pastAppointments.length})</h3>
                {ps.pastAppointments.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay citas pasadas</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
                    {ps.pastAppointments.slice(0, 50).map(a => (
                      <li key={a.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div><strong>{a.patientName}</strong> — {a.patientEmail}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {formatDate(a.startTime)} — {a.price != null ? `${Number(a.price).toFixed(2)} €` : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {ps.pastAppointments.length > 50 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Mostrando las 50 más recientes de {ps.pastAppointments.length} citas
                  </p>
                )}
              </div>
        </div>
      </div>
    );
  }

  // Panel de paciente (respuestas a tests)
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
            <p><strong>Fecha de registro:</strong> {formatDate(userDetails.createdAt)}</p>
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
            <h2>
              {filterRole === 'USER' ? 'Pacientes' : 
               filterRole === 'PSYCHOLOGIST' ? 'Psicólogos' : 
               'Usuarios Registrados'} ({displayedUsers.length})
            </h2>
            {searchTerm.trim() && (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Mostrando {displayedUsers.length} coincidencia(s)
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
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="loading">Cargando usuarios...</div>
        ) : displayedUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>
              {filterRole === 'USER' ? 'No hay pacientes registrados aún.' :
               filterRole === 'PSYCHOLOGIST' ? 'No hay psicólogos registrados aún.' :
               searchTerm.trim() ? `No se encontraron usuarios que coincidan con "${searchTerm}".` :
               'No hay usuarios registrados aún.'}
            </p>
          </div>
        ) : (
          <div className="users-grid">
            {displayedUsers.map(user => (
              <div
                key={user.id}
                className="user-card-admin"
                onClick={() => setSelectedUserId(user.id)}
                style={{ cursor: 'pointer' }}
              >
                <h3>{user.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {user.email}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Registrado: {formatDate(user.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

