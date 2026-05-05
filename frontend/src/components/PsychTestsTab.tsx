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
    <div className="mt-10 bg-white rounded-2xl p-8 border border-slate-100 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="m-0 text-2xl font-bold text-gantly-blue-600">
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
          className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer text-sm transition-all hover:scale-105"
        >
          Asignar Test
        </button>
      </div>

      {showAssignTestForm && (
        <div className="mb-6 p-6 bg-slate-50 rounded-xl border-2 border-slate-200">
          <h4 className="m-0 mb-4 text-lg font-semibold">Asignar Test a Paciente</h4>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-800">
                Paciente:
              </label>
              <select
                value={assignTestForm.userId}
                onChange={(e) => setAssignTestForm({ ...assignTestForm, userId: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
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
                <div className="text-xs text-red-500 mt-1">
                  No tienes pacientes asignados. Pide al administrador que asigne pacientes a tu perfil.
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-800">
                Test:
              </label>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Buscar test por nombre o codigo..."
                  value={testSearchTerm}
                  onChange={(e) => setTestSearchTerm(e.target.value)}
                  className="w-full p-2.5 pl-10 rounded-lg border-2 border-slate-200 text-sm outline-none focus:border-gantly-blue-500 bg-white transition-colors"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400">&#x1F50D;</span>
                {testSearchTerm.trim() && (
                  <button
                    onClick={() => setTestSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-lg text-slate-400 hover:text-red-500 p-1 flex items-center justify-center"
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
                      className="w-full p-2.5 rounded-lg border-2 border-slate-200 text-sm bg-white"
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
                      <div className="text-xs text-emerald-600 font-medium mt-1">
                        Mostrando {filteredTests.length} de {availableTests.length} tests
                      </div>
                    )}
                    {availableTests.length === 0 && (
                      <div className="text-xs text-red-500 mt-1">
                        No hay tests disponibles. Verifica que haya tests activos en el sistema.
                      </div>
                    )}
                    {testSearchTerm.trim() && filteredTests.length === 0 && availableTests.length > 0 && (
                      <div className="text-xs text-red-500 mt-1">
                        No se encontraron tests que coincidan con "{testSearchTerm}"
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="flex gap-2">
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
                className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer text-sm"
              >
                Asignar
              </button>
              <button
                onClick={() => {
                  setShowAssignTestForm(false);
                  setAssignTestForm({ userId: '', testId: '' });
                  setTestSearchTerm('');
                }}
                className="px-5 py-2.5 bg-slate-200 text-slate-800 border-none rounded-xl font-semibold cursor-pointer text-sm"
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
            <div className="py-14 px-10 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <div className="text-5xl mb-4">&#x1F4DD;</div>
              <div className="text-lg font-semibold text-slate-500 mb-2">
                No hay tests asignados
              </div>
              <div className="text-sm text-slate-400">
                Asigna tests a tus pacientes para que los completen
              </div>
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
                  className="border-2 border-slate-200 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    className={`p-5 cursor-pointer flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-100' : 'bg-white'}`}
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
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-xl flex-shrink-0 border-2 border-slate-300">
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
                                parent.style.fontSize = '24px';
                              }
                            }}
                          />
                        ) : (
                          '\u{1F464}'
                        )}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-slate-800">
                          {patient.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {patient.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 items-center">
                        <div className="text-sm text-slate-500">
                          {patientTests.length} test{patientTests.length !== 1 ? 's' : ''}
                        </div>
                        {completedCount > 0 && (
                          <div className="px-2 py-1 bg-emerald-500 text-white rounded-md text-[11px] font-semibold">
                            {completedCount} completado{completedCount !== 1 ? 's' : ''}
                          </div>
                        )}
                        {pendingCount > 0 && (
                          <div className="px-2 py-1 bg-amber-500 text-white rounded-md text-[11px] font-semibold">
                            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div className="text-xl text-slate-400">
                        {isExpanded ? '\u25BC' : '\u25B6'}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      <div className="flex flex-col gap-3">
                        {patientTests.map((at: any) => (
                          <div
                            key={at.id}
                            onClick={() => {
                              if (at.completedAt && at.testId && at.userId) {
                                onViewTestDetails(at.userId, at.testId, at.id);
                              }
                            }}
                            className={`p-4 rounded-lg flex items-start justify-between gap-4 transition-all ${
                              at.completedAt
                                ? 'bg-emerald-50 border-2 border-emerald-500 cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
                                : 'bg-amber-50 border-2 border-amber-500 cursor-default'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`px-2 py-1 text-white rounded-md text-[11px] font-semibold ${at.completedAt ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                  {at.completedAt ? 'Completado' : 'Pendiente'}
                                </div>
                                {at.assignedAt && (
                                  <div className="text-xs text-slate-400">
                                    Asignado: {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                )}
                                {at.completedAt && (
                                  <div className="text-xs text-slate-400">
                                    Completado: {new Date(at.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                )}
                              </div>
                              <div className="text-base font-semibold text-slate-800 mb-1">
                                {at.testTitle || at.test?.title || 'Test'}
                              </div>
                              {at.testCode && (
                                <div className="text-xs text-slate-400">
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
                                className="px-3 py-1.5 bg-red-500 text-white border-none rounded-md font-semibold cursor-pointer text-[11px]"
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
