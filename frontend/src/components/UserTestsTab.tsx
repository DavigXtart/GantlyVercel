import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, CheckSquare, HelpCircle, ArrowRight, ChevronRight, Compass,
} from 'lucide-react';
import { resultsService } from '../services/api';
import EmptyState from './ui/EmptyState';
import { toast } from './ui/Toast';

interface UserTestsTabProps {
  me: any;
  assignedTests: any[];
  onStartTest?: (testId: number) => void;
  setTab: (tab: string) => void;
}

export default function UserTestsTab({
  me,
  assignedTests,
  onStartTest,
  setTab,
}: UserTestsTabProps) {
  const nav = useNavigate();
  const [expandedTestId, setExpandedTestId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, any>>({});
  const [loadingTestResult, setLoadingTestResult] = useState(false);

  return (
    <div>
      {/* Header with summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gantly-gold/10 flex items-center justify-center">
            <ClipboardList size={20} className="text-gantly-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-gantly-text">Tests asignados</h2>
            {assignedTests.length > 0 && (
              <p className="text-sm font-body text-gantly-muted mt-0.5">
                {assignedTests.filter((t: any) => !t.completedAt).length} pendientes · {assignedTests.filter((t: any) => t.completedAt).length} completados
              </p>
            )}
          </div>
        </div>
      </div>

      {assignedTests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12 text-gantly-blue/40" />}
          title="No hay tests pendientes"
          description="Tu psicologo te asignara tests aqui. Mientras tanto, puedes explorar las evaluaciones clinicas disponibles."
          action={
            <button
              type="button"
              onClick={() => setTab('evaluaciones')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gantly-blue text-white font-heading font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-gantly-blue/90 shadow-lg shadow-gantly-blue/20"
            >
              <Compass size={16} />
              Explorar evaluaciones
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Pending tests first */}
          {assignedTests.filter((t: any) => !t.completedAt).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 rounded-full bg-gantly-gold" />
                <span className="text-xs font-body font-semibold text-gantly-muted uppercase tracking-widest">Pendientes</span>
              </div>
              <div className="space-y-3">
                {assignedTests.filter((t: any) => !t.completedAt).map((at: any) => (
                  <div
                    key={at.id}
                    className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-l-[3px] border-l-gantly-gold hover:shadow-lg hover:shadow-gantly-blue/10 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    onClick={async () => {
                      if (at.testId || at.test?.id) {
                        const testId = at.testId || at.test?.id;
                        try {
                          if (onStartTest) {
                            onStartTest(testId);
                          }
                        } catch (error) {
                          toast.error('Error al iniciar el test. Por favor intenta de nuevo.');
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gantly-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gantly-gold/20 transition-colors duration-300">
                          <HelpCircle size={18} className="text-gantly-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-heading font-semibold text-gantly-text group-hover:text-gantly-blue transition-colors truncate">
                            {at.testTitle || at.test?.title || 'Test'}
                          </p>
                          {at.assignedAt && (
                            <p className="text-xs font-body text-gantly-muted mt-0.5">
                              Asignado el {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-heading font-semibold bg-gantly-gold/10 text-gantly-gold px-2.5 py-1 rounded-full">Pendiente</span>
                        <span className="bg-gantly-blue text-white px-4 py-2 rounded-xl font-heading font-semibold text-sm hover:shadow-lg hover:shadow-gantly-blue/25 transition-all duration-300 flex items-center gap-1.5">
                          Comenzar
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed tests */}
          {assignedTests.filter((t: any) => t.completedAt).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 rounded-full bg-gantly-emerald" />
                <span className="text-xs font-body font-semibold text-gantly-muted uppercase tracking-widest">Completados</span>
              </div>
              <div className="space-y-2">
                {assignedTests.filter((t: any) => t.completedAt).map((at: any) => {
                  const isLoading = loadingTestResult && expandedTestId === at.id;
                  return (
                    <div
                      key={at.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-[3px] border-l-gantly-emerald transition-all duration-300"
                    >
                      <div
                        className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-2xl"
                        onClick={async () => {
                          const testId = at.testId || at.test?.id;
                          const mapResult = (result: any) => {
                            const subs = result.subfactors || result.subfactorResults || [];
                            const facs = result.factors || result.factorResults || [];
                            return {
                              testTitle: at.testTitle || at.test?.title || 'Test',
                              userName: me?.name || me?.email || 'Paciente',
                              endTime: at.completedAt,
                              subfactors: subs.map((sf: any) => ({
                                code: sf.subfactorCode || sf.code || '',
                                name: sf.subfactorName || sf.name || sf.code || '',
                                score: Number(sf.score) || 0,
                                maxScore: Number(sf.maxScore) || 0,
                                percentage: Number(sf.percentage ?? ((sf.score / (sf.maxScore || 1)) * 100)) || 0,
                                minLabel: sf.minLabel,
                                maxLabel: sf.maxLabel,
                              })),
                              factors: facs.map((f: any) => ({
                                code: f.factorCode || f.code || '',
                                name: f.factorName || f.name || f.code || '',
                                score: Number(f.score) || 0,
                                maxScore: Number(f.maxScore) || 0,
                                percentage: Number(f.percentage ?? ((f.score / (f.maxScore || 1)) * 100)) || 0,
                                minLabel: f.minLabel,
                                maxLabel: f.maxLabel,
                              })),
                            };
                          };

                          if (testResults[at.id] && (testResults[at.id].subfactors || testResults[at.id].subfactorResults)) {
                            nav('/test-results', { state: mapResult(testResults[at.id]) });
                            return;
                          }
                          setExpandedTestId(at.id);
                          setLoadingTestResult(true);
                          try {
                            const res = await resultsService.getMyResults();
                            const resultsArr = Array.isArray(res) ? res : (res?.results || []);
                            const testTitle = at.testTitle || at.test?.title || '';
                            const matchingResult = resultsArr.find((r: any) => r.testId === testId)
                              || resultsArr.find((r: any) => testTitle && r.testTitle === testTitle)
                              || null;
                            setTestResults(prev => ({ ...prev, [at.id]: matchingResult }));
                            if (matchingResult && (matchingResult.subfactors || matchingResult.subfactorResults)) {
                              nav('/test-results', { state: mapResult(matchingResult) });
                            } else {
                              toast.error('Los resultados detallados no estan disponibles.');
                            }
                          } catch {
                            setTestResults(prev => ({ ...prev, [at.id]: null }));
                            toast.error('Error al cargar los resultados del test.');
                          } finally {
                            setLoadingTestResult(false);
                            setExpandedTestId(null);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-gantly-emerald/10 flex items-center justify-center flex-shrink-0">
                            <CheckSquare size={18} className="text-gantly-emerald" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-heading font-semibold text-gantly-text truncate">
                              {at.testTitle || at.test?.title || 'Test'}
                            </p>
                            {at.completedAt && (
                              <p className="text-xs font-body text-gantly-muted mt-0.5">
                                Completado el {new Date(at.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-heading font-semibold bg-gantly-emerald/10 text-gantly-emerald px-2.5 py-1 rounded-full">Completado</span>
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
                          ) : (
                            <ChevronRight size={16} className="text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
