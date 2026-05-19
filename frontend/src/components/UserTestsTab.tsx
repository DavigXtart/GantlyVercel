import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, CheckSquare, HelpCircle, ArrowRight, Eye, Compass, Stethoscope,
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
          description="Tu psicólogo te asignará tests aquí. Mientras tanto, puedes explorar las evaluaciones clínicas disponibles."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Pending tests */}
          {assignedTests.filter((t: any) => !t.completedAt).map((at: any) => {
            const isEval = !!at.evaluationTestId;
            return (
              <div
                key={at.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={async () => {
                  if (isEval) {
                    setTab('evaluaciones');
                  } else if (at.testId || at.test?.id) {
                    try {
                      if (onStartTest) {
                        onStartTest(at.testId || at.test?.id);
                      }
                    } catch {
                      toast.error('Error al iniciar el test. Por favor intenta de nuevo.');
                    }
                  }
                }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${isEval ? 'from-teal-500 to-teal-600' : 'from-gantly-gold to-amber-500'} flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  {isEval ? <Stethoscope size={24} /> : <HelpCircle size={24} />}
                </div>
                <p className={`text-xs font-semibold ${isEval ? 'text-teal-600' : 'text-gantly-gold'} uppercase tracking-wide mb-2`}>
                  {isEval ? 'Test clínico asignado' : 'Asignado por tu psicólogo'}
                </p>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-gantly-blue transition-colors mb-2">
                  {at.testTitle || at.test?.title || 'Test'}
                </h3>
                {at.assignedAt && (
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    Asignado el {new Date(at.assignedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${isEval ? 'bg-teal-50 text-teal-600 border border-teal-200' : 'bg-gantly-gold/10 text-gantly-gold border border-gantly-gold/20'}`}>
                    Pendiente
                  </span>
                  <ArrowRight size={18} className="text-slate-500 group-hover:text-gantly-blue transition-colors" />
                </div>
              </div>
            );
          })}

          {/* Completed tests */}
          {assignedTests.filter((t: any) => t.completedAt).map((at: any) => {
            const isLoading = loadingTestResult && expandedTestId === at.id;
            const isEval = !!at.evaluationTestId;
            return (
              <div
                key={at.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={async () => {
                  // For evaluation tests, navigate to evaluaciones tab to see results
                  if (isEval) {
                    setTab('evaluaciones');
                    return;
                  }

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
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${isEval ? 'from-teal-500 to-teal-600' : 'from-gantly-emerald to-emerald-600'} flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  {isEval ? <Stethoscope size={24} /> : <CheckSquare size={24} />}
                </div>
                <p className={`text-xs font-semibold ${isEval ? 'text-teal-600' : 'text-gantly-emerald'} uppercase tracking-wide mb-2`}>
                  {isEval ? 'Test clínico completado' : 'Asignado por tu psicólogo'}
                </p>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-gantly-blue transition-colors mb-2">
                  {at.testTitle || at.test?.title || 'Test'}
                </h3>
                {at.completedAt && (
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    Completado el {new Date(at.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${isEval ? 'bg-teal-50 text-teal-600 border border-teal-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    <CheckSquare size={12} />
                    Completado
                  </span>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
                  ) : (
                    <Eye size={18} className={`${isEval ? 'text-teal-500' : 'text-emerald-500'} group-hover:text-gantly-blue transition-colors`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
