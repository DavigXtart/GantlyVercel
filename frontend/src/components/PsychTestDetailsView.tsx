import { useRef, useState } from 'react';
import { BarChart3, FileDown, ArrowLeft, Loader2 } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';
import type { TestReportHandle, TestReportData } from './TestReport';
import TestReport from './TestReport';

interface PsychTestDetailsViewProps {
  viewingTestDetails: { patientId: number; testId: number; assignedTestId: number };
  testDetailsData: any;
  testAnswers: any;
  loadingTestDetails: boolean;
  patients: any[];
  onBack: () => void;
}

export default function PsychTestDetailsView({
  viewingTestDetails,
  testDetailsData,
  testAnswers,
  loadingTestDetails,
  patients,
  onBack,
}: PsychTestDetailsViewProps) {
  const testReportRef = useRef<TestReportHandle>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await testReportRef.current?.exportPdf();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80">
      {loadingTestDetails ? (
        <div className="p-6">
          <LoadingSpinner />
        </div>
      ) : testDetailsData && testAnswers ? (
        <>
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="m-0 text-lg font-heading font-bold text-slate-800">{testAnswers.testTitle}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono m-0">Código: {testAnswers.testCode}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-2 bg-gantly-blue text-white rounded-md text-sm font-medium cursor-pointer border-none hover:bg-gantly-blue/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                {exporting ? 'Generando PDF...' : 'Exportar PDF'}
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-200 cursor-pointer bg-white"
              >
                <ArrowLeft size={14} />
                Volver
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Test report (Delphos style) */}
            {(() => {
              const answers = testAnswers.answers || [];
              const sortedByTime = answers.filter((a: any) => a.createdAt).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              const startTime = sortedByTime.length > 0 ? sortedByTime[0].createdAt : undefined;
              const endTime = sortedByTime.length > 0 ? sortedByTime[sortedByTime.length - 1].createdAt : undefined;
              let duration: string | undefined;
              if (startTime && endTime) {
                const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
                const mins = Math.round(diffMs / 60000);
                duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`;
              }
              const patientName = patients.find((p: any) => p.id === viewingTestDetails.patientId)?.name
                || testDetailsData.userEmail
                || 'Paciente';

              const reportData: TestReportData = {
                testTitle: testAnswers.testTitle || '',
                userName: patientName,
                startTime,
                endTime,
                duration,
                subfactors: (testDetailsData.subfactors || []).map((sf: any) => ({
                  code: sf.subfactorCode || '',
                  name: sf.subfactorName || sf.subfactorCode || '',
                  score: Number(sf.score) || 0,
                  maxScore: Number(sf.maxScore) || 0,
                  percentage: Number(sf.percentage) || 0,
                  minLabel: sf.minLabel,
                  maxLabel: sf.maxLabel,
                })),
                factors: (testDetailsData.factors || []).map((f: any) => ({
                  code: f.factorCode || '',
                  name: f.factorName || f.factorCode || '',
                  score: Number(f.score) || 0,
                  maxScore: Number(f.maxScore) || 0,
                  percentage: Number(f.percentage) || 0,
                  minLabel: f.minLabel,
                  maxLabel: f.maxLabel,
                })),
              };

              return (
                <div className="border border-slate-200/80 rounded-lg overflow-hidden">
                  <TestReport ref={testReportRef} data={reportData} />
                </div>
              );
            })()}

            {/* Answers (collapsible) */}
            <details className="bg-white rounded-lg border border-slate-200/80 p-5">
              <summary className="cursor-pointer text-sm font-heading font-semibold text-slate-800 mb-4">
                Respuestas ({testAnswers.answers?.length || 0})
              </summary>
              {testAnswers.answers && testAnswers.answers.length > 0 ? (
                <div className="space-y-2">
                  {testAnswers.answers.map((answer: any, idx: number) => (
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
                              <p className="m-0 text-[11px] text-slate-500 mt-0.5"><strong>Detalle:</strong> {answer.textValue}</p>
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
            </details>
          </div>
        </>
      ) : (
        <div className="p-6">
          <EmptyState icon={<BarChart3 className="w-12 h-12 text-slate-400" />} title="Test no encontrado" description="No se pudieron cargar los detalles del test." />
        </div>
      )}
    </div>
  );
}
