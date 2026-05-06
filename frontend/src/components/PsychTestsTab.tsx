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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gantly-blue to-gantly-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">psychology</span>
          </div>
          <h3 className="m-0 text-2xl font-bold text-slate-800">Tests Asignados</h3>
        </div>
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
          className="px-5 py-2.5 bg-gradient-to-r from-gantly-blue to-gantly-blue-600 text-white border-none rounded-xl font-medium cursor-pointer text-sm hover:shadow-lg hover:shadow-gantly-blue/25 transition-all duration-300"
        >
          Asignar Test
        </button>
      </div>

      {showAssignTestForm && (
        <div className="mb-6 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="m-0 mb-4 text-base font-semibold text-slate-800">Asignar Test a Paciente</h4>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-slate-700">Paciente:</label>
              <select
                value={assignTestForm.userId}
                onChange={(e) => setAssignTestForm({ ...assignTestForm, userId: e.target.value })}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
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
                <div className="text-xs text-red-500 mt-1.5">
                  No tienes pacientes asignados. Pide al administrador que asigne pacientes a tu perfil.
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-slate-700">Test:</label>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Buscar test por nombre o codigo..."
                  value={testSearchTerm}
                  onChange={(e) => setTestSearchTerm(e.target.value)}
                  className="h-12 w-full pl-10 pr-10 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue bg-white transition-all duration-200"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
                {testSearchTerm.trim() && (
                  <button
                    onClick={() => setTestSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-lg text-slate-400 hover:text-red-500 p-1 flex items-center justify-center transition-colors duration-200"
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
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
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
                      <div className="text-xs text-emerald-600 font-medium mt-1.5">
                        Mostrando {filteredTests.length} de {availableTests.length} tests
                      </div>
                    )}
                    {availableTests.length === 0 && (
                      <div className="text-xs text-red-500 mt-1.5">
                        No hay tests disponibles. Verifica que haya tests activos en el sistema.
                      </div>
                    )}
                    {testSearchTerm.trim() && filteredTests.length === 0 && availableTests.length > 0 && (
                      <div className="text-xs text-red-500 mt-1.5">
                        No se encontraron tests que coincidan con &ldquo;{testSearchTerm}&rdquo;
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="flex gap-2 mt-1">
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
                className="px-5 py-2.5 bg-gradient-to-r from-gantly-blue to-gantly-blue-600 text-white border-none rounded-xl font-medium cursor-pointer text-sm hover:shadow-lg hover:shadow-gantly-blue/25 transition-all duration-300"
              >
                Asignar
              </button>
              <button
                onClick={() => {
                  setShowAssignTestForm(false);
                  setAssignTestForm({ userId: '', testId: '' });
                  setTestSearchTerm('');
                }}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-medium cursor-pointer text-sm transition-all duration-300 hover:bg-slate-200"
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
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">quiz</span>
              <div className="text-sm text-slate-400 max-w-xs mx-auto">No hay tests asignados. Asigna tests a tus pacientes para que los completen.</div>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-4">
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
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-gantly-blue/5 transition-all duration-300"
                >
                  <div
                    className={`p-5 cursor-pointer flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-all duration-300 ${isExpanded ? 'bg-slate-50/50' : ''}`}
                    onClick={() => {
                      const newExpanded = new Set(expandedPatients);
                      if (newExpanded.has(userId)) {
                        newExpanded.delete(userId);
                      } else {
                        newExpanded.add(userId);
                      }
                      setExpandedPatients(newExpanded);
                    }}
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-gantly-blue to-gantly-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                        {patientAvatarUrl ? (
                          <img
                            src={patientAvatarUrl}
                            alt={patient.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.textContent = '\u{1F464}';
                                parent.style.fontSize = '18px';
                              }
                            }}
                          />
                        ) : (
                          (patient.name || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{patient.name}</div>
                        <div className="text-xs text-slate-400">{patient.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-slate-500">{patientTests.length} test{patientTests.length !== 1 ? 's' : ''}</span>
                        {completedCount > 0 && (
                          <span className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                            {completedCount}
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">
                            {pendingCount}
                          </span>
                        )}
                      </div>
                      <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>chevron_right</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-5 bg-slate-50/30 border-t border-slate-100">
                      <div className="flex flex-col gap-3">
                        {patientTests.map((at: any) => (
                          <div
                            key={at.id}
                            onClick={() => {
                              if (at.completedAt && at.testId && at.userId) {
                                onViewTestDetails(at.userId, at.testId, at.id);
                              }
                            }}
                            className={`bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-gantly-blue/10 transition-all duration-300 ${
                              at.completedAt
                                ? 'border-l-4 border-l-emerald-500 cursor-pointer'
                                : 'border-l-4 border-l-amber-400 cursor-default'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                    at.completedAt
                                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200'
                                      : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {at.completedAt ? 'Completado' : 'Pendiente'}
                                  </span>
                                  {at.assignedAt && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                      Asignado: {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  )}
                                  {at.completedAt && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                      Completado: {new Date(at.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold text-slate-800 mb-0.5">
                                  {at.testTitle || at.test?.title || 'Test'}
                                </div>
                                {at.testCode && (
                                  <div className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded inline-block">Codigo: {at.testCode}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {at.completedAt && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (at.testId && at.userId) {
                                        onViewTestDetails(at.userId, at.testId, at.id);
                                      }
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-gantly-blue to-gantly-blue-600 text-white border-none rounded-xl text-sm font-medium cursor-pointer hover:shadow-lg hover:shadow-gantly-blue/25 transition-all duration-300"
                                  >
                                    Ver resultados
                                  </button>
                                )}
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
                                    className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer transition-colors duration-200"
                                  >
                                    Desasignar
                                  </button>
                                )}
                              </div>
                            </div>
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
