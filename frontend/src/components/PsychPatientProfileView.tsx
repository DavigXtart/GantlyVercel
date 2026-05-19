import { useState } from 'react';
import { User, ArrowLeft } from 'lucide-react';
import { resultsService } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';
import BarChart from './BarChart';
import FactorChart from './FactorChart';
import InitialTestSummary from './InitialTestSummary';
import { SkeletonStats } from './ui/SkeletonLoader';
import { toast } from './ui/Toast';

interface PsychPatientProfileViewProps {
  viewingPatientId: number;
  patientDetails: any;
  patientOverallStats: any;
  loadingPatientDetails: boolean;
  availableTests: any[];
  onBack: () => void;
}

export default function PsychPatientProfileView({
  viewingPatientId,
  patientDetails,
  patientOverallStats,
  loadingPatientDetails,
  availableTests,
  onBack,
}: PsychPatientProfileViewProps) {
  const [selectedTestForStats, setSelectedTestForStats] = useState<number | null>(null);
  const [patientStats, setPatientStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadPatientStats = async (testId: number) => {
    try {
      setLoadingStats(true);
      const data = await resultsService.getUserTest(viewingPatientId, testId);
      setPatientStats(data);
    } catch (err: any) {
      toast.error('Error al cargar estadisticas: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80">
      {loadingPatientDetails ? (
        <div className="p-6">
          <LoadingSpinner text="Cargando detalles del paciente..." />
        </div>
      ) : patientDetails ? (
        <>
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="m-0 text-lg font-heading font-bold text-slate-800">{patientDetails.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5 m-0">{patientDetails.email}</p>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white"
            >
              <ArrowLeft size={14} />
              Volver
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Patient info card */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-[11px] text-slate-500 mb-0.5">Fecha de registro</div>
                  <div className="text-sm font-medium text-slate-800">
                    {patientDetails.createdAt ? new Date(patientDetails.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 mb-0.5">Tests completados</div>
                  <div className="text-sm font-medium text-slate-800">{patientDetails.tests?.length || 0}</div>
                </div>
                {patientDetails.gender && (
                  <div>
                    <div className="text-[11px] text-slate-500 mb-0.5">Genero</div>
                    <div className="text-sm font-medium text-slate-800">{patientDetails.gender}</div>
                  </div>
                )}
                {patientDetails.age && (
                  <div>
                    <div className="text-[11px] text-slate-500 mb-0.5">Edad</div>
                    <div className="text-sm font-medium text-slate-800">{patientDetails.age}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Overall factors chart */}
            {patientOverallStats && patientOverallStats.factors && patientOverallStats.factors.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200/80 p-5">
                <h3 className="mt-0 mb-4 text-sm font-heading font-semibold text-slate-800">Media general (todos los tests) - Factores</h3>
                <div className="flex gap-6 items-center flex-wrap">
                  <div className="flex-1 min-w-[260px]">
                    <BarChart
                      data={patientOverallStats.factors.map((f: any) => ({
                        label: f.code || f.name,
                        value: Number(f.percentage) || 0,
                      }))}
                      maxValue={100}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stats per test */}
            <div className="bg-white rounded-lg border border-slate-200/80 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">Estadisticas por Test</h3>
                <select
                  value={selectedTestForStats ?? ''}
                  onChange={(e) => {
                    const testId = e.target.value ? Number(e.target.value) : null;
                    setSelectedTestForStats(testId);
                    if (testId) {
                      loadPatientStats(testId);
                    } else {
                      setPatientStats(null);
                    }
                  }}
                  className="h-9 px-3 rounded-md border border-slate-200 text-sm cursor-pointer"
                >
                  <option value="">Selecciona test...</option>
                  {availableTests.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title || t.code}</option>
                  ))}
                </select>
              </div>
              {!selectedTestForStats && (
                <p className="text-slate-500 text-sm mt-2 m-0">Selecciona un test para ver sus estadisticas.</p>
              )}
              {selectedTestForStats && loadingStats && (
                <SkeletonStats count={3} className="mt-3" />
              )}
              {selectedTestForStats && !loadingStats && patientStats && (
                <div className="mt-4">
                  {patientStats.subfactors && patientStats.subfactors.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-3">Subfactores</h4>
                      <div className="flex gap-6 items-center flex-wrap">
                        <div className="flex-1 min-w-[260px]">
                          <BarChart
                            data={patientStats.subfactors.map((sf: any) => ({
                              label: sf.subfactorName || sf.subfactorCode,
                              value: Number(sf.percentage) || 0,
                              lowPole: sf.minLabel,
                              highPole: sf.maxLabel,
                            }))}
                            maxValue={100}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {patientStats.factors && patientStats.factors.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-3">Factores</h4>
                      <div className="flex gap-6 items-center flex-wrap">
                        <div className="flex-1 min-w-[260px]">
                          <FactorChart
                            data={patientStats.factors.map((f: any) => {
                              const percentage = Number(f.percentage) || 0;
                              const value = Math.round((percentage / 100) * 10);
                              return {
                                label: f.factorName || f.factorCode || '',
                                value: Math.max(1, Math.min(10, value)),
                                lowPole: f.minLabel,
                                highPole: f.maxLabel,
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

            {/* Test answers */}
            {patientDetails.tests && patientDetails.tests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Este paciente aun no ha completado ningun test.</p>
              </div>
            ) : patientDetails.tests && patientDetails.tests.length > 0 ? (
              <div className="space-y-4">
                {patientDetails.tests.map((test: any) => (
                  <div key={test.testId} className="bg-white rounded-lg border border-slate-200/80 p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="m-0 text-sm font-heading font-semibold text-slate-800">{test.testTitle}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono m-0">Código: {test.testCode}</p>
                      </div>
                    </div>
                    <div>
                      {test.testCode === 'INITIAL' && test.answers && test.answers.length > 0 && (
                        <InitialTestSummary test={test} />
                      )}
                      <h4 className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-3">
                        Respuestas ({test.answers?.length || 0})
                      </h4>
                      {test.answers && test.answers.length > 0 ? (
                        <div className="space-y-2">
                          {test.answers.map((answer: any, idx: number) => (
                            <div key={answer.questionId} className="p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] w-5 h-5 flex items-center justify-center bg-gantly-blue text-white rounded-full font-semibold">
                                  {idx + 1}
                                </span>
                                <strong className="text-sm text-slate-800">{answer.questionText}</strong>
                              </div>
                              <div className="pl-7">
                                {answer.answerText ? (
                                  <div>
                                    <p className="m-0 text-sm text-slate-600">
                                      <strong>Respuesta:</strong> {answer.answerText}
                                      {answer.answerValue !== undefined && answer.answerValue !== null && (
                                        <span className="text-slate-400 ml-2">(Valor: {answer.answerValue})</span>
                                      )}
                                    </p>
                                    {answer.textValue && (
                                      <p className="m-0 text-[11px] text-slate-500 mt-0.5">
                                        <strong>Detalle:</strong> {answer.textValue}
                                      </p>
                                    )}
                                  </div>
                                ) : answer.textValue ? (
                                  <p className="m-0 text-sm text-slate-600"><strong>Detalle:</strong> {answer.textValue}</p>
                                ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                                  <p className="m-0 text-sm text-slate-600"><strong>Valor numerico:</strong> {answer.numericValue}</p>
                                ) : (
                                  <p className="m-0 text-sm text-slate-400 italic">Sin respuesta registrada</p>
                                )}
                                {answer.createdAt && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 m-0">
                                    {new Date(answer.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm m-0">No hay respuestas registradas para este test.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="p-6">
          <EmptyState icon={<User className="w-12 h-12 text-slate-400" />} title="Paciente no encontrado" description="No se pudieron cargar los detalles del paciente." />
        </div>
      )}
    </div>
  );
}
