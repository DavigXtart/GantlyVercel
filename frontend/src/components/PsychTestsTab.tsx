import { useState } from 'react';
import { testService, assignedTestsService } from '../services/api';
import { toast } from './ui/Toast';

interface PsychTestsTabProps {
  patients: any[];
  assignedTests: any[];
  onRefresh: () => Promise<void>;
  onViewTestDetails: (patientId: number, testId: number, assignedTestId: number) => void;
}

export default function PsychTestsTab({ patients, assignedTests, onRefresh, onViewTestDetails }: PsychTestsTabProps) {
  const [showAssignTestForm, setShowAssignTestForm] = useState(false);
  const [assignTestForm, setAssignTestForm] = useState<{ userId: string; testId: string }>({ userId: '', testId: '' });
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());

  return (
    <div className="mt-10 bg-white rounded-3xl p-8 border border-sage/10 soft-shadow">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Tests Asignados
        </h3>
        <button
          onClick={async () => {
            setShowAssignTestForm(true);
            try {
              const tests = await testService.list();
              const activeTests = (tests || []).filter((t: any) => {
                if (t.active === false) {
                  return false;
                }
                return true;
              });
              setAvailableTests(activeTests);
              if (activeTests.length === 0) {
                toast.warning('No hay tests disponibles para asignar. Verifica que haya tests activos en el sistema.');
              }
            } catch (error: any) {
              toast.error('Error al cargar los tests. Por favor intenta de nuevo.');
            }
          }}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Asignar Test
        </button>
      </div>

      {showAssignTestForm && (
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Asignar Test a Paciente</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                Paciente:
              </label>
              <select
                value={assignTestForm.userId}
                onChange={(e) => setAssignTestForm({ ...assignTestForm, userId: e.target.value })}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                <option value="">Selecciona un paciente</option>
                {patients.length === 0 ? (
                  <option value="" disabled>No hay pacientes asignados</option>
                ) : (
                  patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))
                )}
              </select>
              {patients.length === 0 && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                  No tienes pacientes asignados. Pide al administrador que asigne pacientes a tu perfil.
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                Test:
              </label>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Buscar test por nombre o codigo..."
                  value={testSearchTerm}
                  onChange={(e) => setTestSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingLeft: '40px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#ffffff'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#5a9270'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '16px',
                  color: '#9ca3af'
                }}>&#x1F50D;</span>
                {testSearchTerm.trim() && (
                  <button
                    onClick={() => setTestSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      color: '#9ca3af',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    &times;
                  </button>
                )}
              </div>
              {(() => {
                const filteredTests = availableTests.filter((t: any) => {
                  if (!testSearchTerm.trim()) return true;
                  const query = testSearchTerm.toLowerCase();
                  return (
                    (t.title || '').toLowerCase().includes(query) ||
                    (t.code || '').toLowerCase().includes(query)
                  );
                });

                return (
                  <>
                    <select
                      value={assignTestForm.testId}
                      onChange={(e) => setAssignTestForm({ ...assignTestForm, testId: e.target.value })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        fontSize: '14px',
                        width: '100%',
                        background: '#ffffff'
                      }}
                    >
                      <option value="">{testSearchTerm.trim() ? `Selecciona de ${filteredTests.length} resultado(s)` : 'Selecciona un test'}</option>
                      {availableTests.length === 0 ? (
                        <option value="" disabled>Cargando tests...</option>
                      ) : filteredTests.length === 0 ? (
                        <option value="" disabled>No se encontraron tests</option>
                      ) : (
                        filteredTests.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.title} {t.code ? `(${t.code})` : ''}</option>
                        ))
                      )}
                    </select>
                    {testSearchTerm.trim() && filteredTests.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '4px' }}>
                        Mostrando {filteredTests.length} de {availableTests.length} tests
                      </div>
                    )}
                    {availableTests.length === 0 && (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                        No hay tests disponibles. Verifica que haya tests activos en el sistema.
                      </div>
                    )}
                    {testSearchTerm.trim() && filteredTests.length === 0 && availableTests.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                        No se encontraron tests que coincidan con "{testSearchTerm}"
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={async () => {
                  if (!assignTestForm.userId || !assignTestForm.testId) {
                    toast.warning('Por favor selecciona un paciente y un test');
                    return;
                  }
                  try {
                    const userId = parseInt(assignTestForm.userId);
                    const testId = parseInt(assignTestForm.testId);

                    if (isNaN(userId) || isNaN(testId)) {
                      toast.error('Error: Los valores seleccionados no son validos');
                      return;
                    }

                    await assignedTestsService.assign({
                      userId,
                      testId
                    });

                    await onRefresh();
                    setShowAssignTestForm(false);
                    setAssignTestForm({ userId: '', testId: '' });
                    setTestSearchTerm('');
                  } catch (error: any) {
                    let errorMessage = 'Error desconocido al asignar el test';
                    if (error.response?.data) {
                      errorMessage = error.response.data.error || error.response.data.message || JSON.stringify(error.response.data);
                    } else if (error.message) {
                      errorMessage = error.message;
                    }

                    toast.error(`Error al asignar el test: ${errorMessage}`);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Asignar
              </button>
              <button
                onClick={() => {
                  setShowAssignTestForm(false);
                  setAssignTestForm({ userId: '', testId: '' });
                  setTestSearchTerm('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const testsByPatient = new Map<number, any[]>();
        assignedTests.forEach(at => {
          const userId = at.userId;
          if (!testsByPatient.has(userId)) {
            testsByPatient.set(userId, []);
          }
          testsByPatient.get(userId)!.push(at);
        });

        if (testsByPatient.size === 0) {
          return (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#x1F4DD;</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                No hay tests asignados
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                Asigna tests a tus pacientes para que los completen
              </div>
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from(testsByPatient.entries()).map(([userId, patientTests]) => {
              const patient = patients.find(p => p.id === userId) || {
                id: userId,
                name: patientTests[0]?.userName || 'Usuario',
                email: patientTests[0]?.userEmail || '',
                avatarUrl: patientTests[0]?.userAvatarUrl || null
              };
              const isExpanded = expandedPatients.has(userId);
              const completedCount = patientTests.filter((t: any) => t.completedAt).length;
              const pendingCount = patientTests.length - completedCount;
              const patientAvatarUrl = patient.avatarUrl || patientTests[0]?.userAvatarUrl;

              return (
                <div
                  key={userId}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                >
                  <div
                    style={{
                      padding: '20px',
                      background: isExpanded ? '#f3f4f6' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                    onClick={() => {
                      const newExpanded = new Set(expandedPatients);
                      if (newExpanded.has(userId)) {
                        newExpanded.delete(userId);
                      } else {
                        newExpanded.add(userId);
                      }
                      setExpandedPatients(newExpanded);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isExpanded ? '#f3f4f6' : '#ffffff';
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                        border: '2px solid #d1d5db'
                      }}>
                        {patientAvatarUrl ? (
                          <img
                            src={patientAvatarUrl}
                            alt={patient.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.textContent = '\u{1F464}';
                                parent.style.fontSize = '24px';
                              }
                            }}
                          />
                        ) : (
                          '\u{1F464}'
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                          {patient.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {patient.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {patientTests.length} test{patientTests.length !== 1 ? 's' : ''}
                        </div>
                        {completedCount > 0 && (
                          <div style={{
                            padding: '4px 8px',
                            background: '#22c55e',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {completedCount} completado{completedCount !== 1 ? 's' : ''}
                          </div>
                        )}
                        {pendingCount > 0 && (
                          <div style={{
                            padding: '4px 8px',
                            background: '#f59e0b',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '20px', color: '#9ca3af' }}>
                        {isExpanded ? '\u25BC' : '\u25B6'}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {patientTests.map((at: any) => (
                          <div
                            key={at.id}
                            onClick={() => {
                              if (at.completedAt && at.testId && at.userId) {
                                onViewTestDetails(at.userId, at.testId, at.id);
                              }
                            }}
                            style={{
                              padding: '16px',
                              background: at.completedAt ? '#f0fdf4' : '#fef3c7',
                              border: `2px solid ${at.completedAt ? '#22c55e' : '#f59e0b'}`,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '16px',
                              cursor: at.completedAt ? 'pointer' : 'default',
                              transition: at.completedAt ? 'all 0.2s' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (at.completedAt) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (at.completedAt) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <div style={{
                                  padding: '4px 8px',
                                  background: at.completedAt ? '#22c55e' : '#f59e0b',
                                  color: 'white',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}>
                                  {at.completedAt ? 'Completado' : 'Pendiente'}
                                </div>
                                {at.assignedAt && (
                                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                    Asignado: {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                )}
                                {at.completedAt && (
                                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                    Completado: {new Date(at.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                )}
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                {at.testTitle || at.test?.title || 'Test'}
                              </div>
                              {at.testCode && (
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                  Codigo: {at.testCode}
                                </div>
                              )}
                            </div>
                            {!at.completedAt && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm('¿Estas seguro de que deseas desasignar este test?')) {
                                    try {
                                      await assignedTestsService.unassign(at.id);
                                      await onRefresh();
                                    } catch (error) {
                                      toast.error('Error al desasignar el test');
                                    }
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                Desasignar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
