import { useState, useEffect } from 'react';
import { testService } from '../services/api';
import { toast } from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { BarChart3, CheckCircle, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Answer {
  id: number;
  text: string;
  value: number;
  position: number;
}

interface SubfactorInfo {
  id: number;
  code: string;
  name: string;
  factor?: { id: number; code: string; name: string } | null;
}

interface Question {
  id: number;
  text: string;
  type: string;
  position: number;
  subfactor?: SubfactorInfo | null;
  answers: Answer[];
}

interface TestDetails {
  id: number;
  code: string;
  title: string;
  description: string;
  questions: Question[];
}

interface SubfactorResult {
  code: string;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: string;
  factorName: string | null;
}

interface TestFlowProps {
  testId: number;
  onBack: () => void;
  onComplete: () => void;
  previewOnly?: boolean;
}

function getLevel(pct: number): { label: string; color: string; bg: string; border: string } {
  if (pct <= 20) return { label: 'Muy Bajo', color: 'text-red-600', bg: 'bg-red-500', border: 'border-red-200' };
  if (pct <= 40) return { label: 'Bajo', color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-200' };
  if (pct <= 60) return { label: 'Medio', color: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-200' };
  if (pct <= 80) return { label: 'Alto', color: 'text-teal-600', bg: 'bg-teal-500', border: 'border-teal-200' };
  return { label: 'Muy Alto', color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-200' };
}

function calculateResults(
  test: TestDetails,
  userAnswers: Record<number, { answerId?: number; numericValue?: number }>
): SubfactorResult[] {
  const subfactorMap = new Map<string, {
    code: string; name: string; factorName: string | null;
    score: number; maxScore: number;
  }>();

  for (const q of test.questions) {
    const ua = userAnswers[q.id];
    if (!ua) continue;

    let answerValue = 0;
    let maxValue = 0;

    if (ua.answerId != null) {
      const selected = q.answers.find(a => a.id === ua.answerId);
      answerValue = selected?.value ?? 0;
      maxValue = Math.max(...q.answers.map(a => a.value), 0);
    } else if (ua.numericValue != null) {
      answerValue = ua.numericValue;
      maxValue = 10;
    }

    const key = q.subfactor?.code || '_general';
    const name = q.subfactor?.name || 'General';
    const factorName = q.subfactor?.factor?.name || null;

    if (!subfactorMap.has(key)) {
      subfactorMap.set(key, { code: key, name, factorName, score: 0, maxScore: 0 });
    }
    const entry = subfactorMap.get(key)!;
    entry.score += answerValue;
    entry.maxScore += maxValue;
  }

  return Array.from(subfactorMap.values()).map(sf => {
    const percentage = sf.maxScore > 0 ? Math.round((sf.score / sf.maxScore) * 100) : 0;
    return {
      ...sf,
      percentage,
      level: getLevel(percentage).label,
    };
  });
}

export default function TestFlow({ testId, onBack, onComplete, previewOnly }: TestFlowProps) {
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerId?: number; numericValue?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SubfactorResult[]>([]);
  const [confirmFinish, setConfirmFinish] = useState<Record<number, { answerId?: number; numericValue?: number }> | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const loadTestWithTimeout = async () => {
      timeoutId = setTimeout(() => {
        if (isMounted && !test) {
          toast.error('El test esta tardando demasiado en cargar. Verifica que el backend este corriendo.');
          if (onBack) onBack();
        }
      }, 10000);

      try {
        await loadTest();
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    loadTestWithTimeout();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [testId, onBack]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const data = await testService.get(testId);
      if (data.questions) {
        data.questions.sort((a: Question, b: Question) => a.position - b.position);
        data.questions.forEach((q: any) => {
          if (q.answers) {
            q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
          } else {
            q.answers = [];
          }
        });
      }
      setTest(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
      toast.error('Error al cargar el test: ' + errorMsg);
      if (onBack) onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answerId?: number, numericValue?: number, autoAdvance: boolean = true) => {
    const newAnswers = { ...answers, [questionId]: { answerId, numericValue } };
    setAnswers(newAnswers);

    if (autoAdvance) {
      setTimeout(() => {
        if (!test) return;
        const currentIndex = test.questions.findIndex(q => q.id === questionId);
        if (currentIndex !== -1 && currentIndex < test.questions.length - 1) {
          setCurrentQuestionIndex(currentIndex + 1);
        } else if (currentIndex === test.questions.length - 1) {
          const allAnswered = test.questions.every(q => newAnswers[q.id]);
          if (allAnswered) {
            handleFinish(newAnswers);
          }
        }
      }, 400);
    }
  };

  const handleFinish = (answersToUse: Record<number, { answerId?: number; numericValue?: number }>) => {
    if (!test) return;
    if (previewOnly) {
      const computed = calculateResults(test, answersToUse);
      setResults(computed);
      setShowResults(true);
    } else {
      setConfirmFinish(answersToUse);
    }
  };

  const handleNext = () => {
    if (!test) return;
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitWithAnswers = async (answersToSubmit: Record<number, { answerId?: number; numericValue?: number }>) => {
    if (!test) return;
    try {
      setSubmitting(true);
      const submitData = test.questions.map(q => ({
        questionId: q.id,
        answerId: answersToSubmit[q.id]?.answerId,
        numericValue: answersToSubmit[q.id]?.numericValue
      }));
      await testService.submitAnswers(testId, submitData);
      toast.success('Test completado correctamente');
      onComplete();
    } catch (err: any) {
      toast.error('Error al enviar las respuestas: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;
    const unanswered = test.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Por favor, responde todas las preguntas. Te faltan ${unanswered.length} pregunta(s).`);
      return;
    }

    if (previewOnly) {
      handleFinish(answers);
      return;
    }

    setConfirmSubmit(true);
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gantly-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-slate-600 font-medium">Cargando test...</p>
        </div>
      </div>
    );
  }

  // --- No questions ---
  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8 md:p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Test no disponible</h2>
          <p className="text-slate-500 mb-6">Este test no tiene preguntas aun.</p>
          <button onClick={onBack} className="bg-gantly-blue hover:bg-gantly-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 cursor-pointer">
            Volver
          </button>
        </div>
      </div>
    );
  }

  // --- Results screen (previewOnly) ---
  if (showResults && previewOnly && test) {
    const totalScore = results.reduce((s, r) => s + r.score, 0);
    const totalMax = results.reduce((s, r) => s + r.maxScore, 0);
    const totalPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const totalLevel = getLevel(totalPct);

    // Group by factor
    const factorGroups = new Map<string, SubfactorResult[]>();
    for (const r of results) {
      const key = r.factorName || '';
      if (!factorGroups.has(key)) factorGroups.set(key, []);
      factorGroups.get(key)!.push(r);
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-gantly-blue" />
              <span className="text-slate-800 font-semibold text-sm sm:text-base">Resultados</span>
            </div>
            <button onClick={onBack} className="text-slate-500 hover:text-slate-600 text-sm cursor-pointer transition-colors duration-200 flex items-center gap-1">
              <ArrowLeft size={14} />
              Volver
            </button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Test title + total score card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 sm:p-8 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">{test.title}</h2>
            <p className="text-sm text-slate-500 mb-6">{test.questions.length} preguntas completadas</p>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gantly-blue/5 to-gantly-cyan/5 border border-gantly-blue/10">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${totalPct * 1.76} 176`}
                    className="text-gantly-blue"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
                  {totalPct}%
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">Puntuacion Global</p>
                <p className={`text-sm font-medium ${totalLevel.color}`}>
                  {totalLevel.label} ({totalScore}/{totalMax})
                </p>
              </div>
            </div>
          </div>

          {/* Subfactor results */}
          {results.length > 1 && (
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-5">Detalle por area</h3>
              <div className="space-y-4">
                {Array.from(factorGroups.entries()).map(([factorName, subfactors]) => (
                  <div key={factorName || '_none'}>
                    {factorName && factorGroups.size > 1 && (
                      <p className="text-xs font-semibold text-gantly-blue uppercase tracking-wide mb-2">{factorName}</p>
                    )}
                    {subfactors.map(sf => {
                      const level = getLevel(sf.percentage);
                      return (
                        <div key={sf.code} className={`p-4 rounded-xl border ${level.border} bg-white mb-3 last:mb-0`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">{sf.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${level.color} bg-opacity-10`}
                                style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}>
                                {level.label}
                              </span>
                              <span className="text-sm font-bold text-slate-800">{sf.percentage}%</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${level.bg} transition-all duration-700 ease-out`}
                              style={{ width: `${sf.percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{sf.score}/{sf.maxScore} puntos</p>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths and areas to improve */}
          {results.length > 1 && (() => {
            const strengths = results.filter(r => r.percentage >= 60).sort((a, b) => b.percentage - a.percentage);
            const improvements = results.filter(r => r.percentage < 40).sort((a, b) => a.percentage - b.percentage);

            if (strengths.length === 0 && improvements.length === 0) return null;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {strengths.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={18} className="text-emerald-500" />
                      <h3 className="font-semibold text-slate-800">Fortalezas</h3>
                    </div>
                    <ul className="space-y-2">
                      {strengths.slice(0, 5).map(s => (
                        <li key={s.code} className="flex items-center gap-2 text-sm">
                          <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                          <span className="text-slate-700">{s.name}</span>
                          <span className="ml-auto text-xs font-semibold text-emerald-600">{s.percentage}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {improvements.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown size={18} className="text-orange-500" />
                      <h3 className="font-semibold text-slate-800">Areas de mejora</h3>
                    </div>
                    <ul className="space-y-2">
                      {improvements.slice(0, 5).map(s => (
                        <li key={s.code} className="flex items-center gap-2 text-sm">
                          <Minus size={14} className="text-orange-500 flex-shrink-0" />
                          <span className="text-slate-700">{s.name}</span>
                          <span className="ml-auto text-xs font-semibold text-orange-600">{s.percentage}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 mb-6">
            Estos resultados son orientativos y no sustituyen una evaluacion profesional.
          </div>

          <div className="flex justify-center">
            <button
              onClick={onBack}
              className="bg-gantly-blue hover:bg-gantly-blue-600 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 cursor-pointer"
            >
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Question flow ---
  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const allAnswered = test.questions.every(q => answers[q.id]);
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-800 font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
              {test.title || test.code || `Test #${test.id}`}
            </span>
          </div>
          <button onClick={onBack} className="text-slate-500 hover:text-slate-600 text-sm cursor-pointer transition-colors duration-200">
            Salir
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">
            Pregunta {currentQuestionIndex + 1} de {test.questions.length}
          </span>
          <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gantly-blue rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Area */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 sm:p-8 md:p-12">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 leading-relaxed">
            {currentQuestion.text}
          </h2>
          <p className="text-sm text-gray-500 mb-8">Tu respuesta es confidencial</p>

          {/* SINGLE type answers */}
          {currentQuestion.type === 'SINGLE' && currentQuestion.answers && currentQuestion.answers.length > 0 && (
            <div className="flex flex-col gap-3">
              {currentQuestion.answers.map((answer) => {
                const isSelected = currentAnswer?.answerId === answer.id;
                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(currentQuestion.id, answer.id)}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-gantly-blue bg-gantly-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-gantly-blue-400 hover:bg-gantly-blue-50/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                      isSelected ? 'bg-gantly-blue border-gantly-blue' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-slate-700 font-medium">{answer.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* MULTI type answers */}
          {currentQuestion.type === 'MULTI' && currentQuestion.answers && currentQuestion.answers.length > 0 && (
            <div className="flex flex-col gap-3">
              {currentQuestion.answers.map((answer) => {
                const isSelected = currentAnswer?.answerId === answer.id;
                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(currentQuestion.id, isSelected ? undefined : answer.id)}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-gantly-blue bg-gantly-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-gantly-blue-400 hover:bg-gantly-blue-50/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                      isSelected ? 'bg-gantly-blue border-gantly-blue' : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-slate-700 font-medium">{answer.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* SCALE type answers */}
          {currentQuestion.type === 'SCALE' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                  const isSelected = currentAnswer?.numericValue === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleAnswer(currentQuestion.id, undefined, value, false)}
                      className={`py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-gantly-blue text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-gantly-blue-50 hover:text-gantly-blue border border-slate-200 hover:border-gantly-blue-400'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-500 px-1">
                <span>0 - Nada</span>
                <span>10 - Totalmente</span>
              </div>
              {currentAnswer?.numericValue !== undefined && (
                <div className="text-center text-sm text-slate-500">
                  Puntaje seleccionado: <strong className="text-gantly-blue">{currentAnswer.numericValue}</strong>
                </div>
              )}
            </div>
          )}

          {/* Unsupported type */}
          {currentQuestion.type !== 'SINGLE' && currentQuestion.type !== 'MULTI' && currentQuestion.type !== 'SCALE' && (
            <p className="text-slate-500 italic text-center py-8">
              Tipo de pregunta no soportado: {currentQuestion.type}
            </p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`font-medium transition-colors duration-200 ${
              currentQuestionIndex === 0
                ? 'text-slate-500 cursor-not-allowed'
                : 'text-slate-500 hover:text-slate-700 cursor-pointer'
            }`}
          >
            ← Anterior
          </button>

          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-600 text-sm cursor-pointer transition-colors duration-200">
              Salir
            </button>

            {isLastQuestion && allAnswered ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`px-6 py-3 rounded-xl font-medium transition-colors duration-200 ${
                  submitting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gantly-blue hover:bg-gantly-blue-600 text-white cursor-pointer'
                }`}
              >
                {submitting ? 'Enviando...' : previewOnly ? 'Ver resultados' : 'Enviar evaluacion'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isLastQuestion}
                className={`px-6 py-3 rounded-xl font-medium transition-colors duration-200 ${
                  isLastQuestion
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gantly-blue hover:bg-gantly-blue-600 text-white cursor-pointer'
                }`}
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmFinish !== null}
        onClose={() => setConfirmFinish(null)}
        onConfirm={async () => {
          if (confirmFinish) await handleSubmitWithAnswers(confirmFinish);
        }}
        title="Enviar test"
        message="Has completado todas las preguntas. ¿Deseas enviar el test?"
        variant="info"
        confirmLabel="Enviar test"
      />

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={async () => {
          await handleSubmitWithAnswers(answers);
        }}
        title="Enviar respuestas"
        message="¿Estas seguro de que deseas enviar tus respuestas? No podras modificarlas despues."
        variant="info"
        confirmLabel="Enviar test"
      />
    </div>
  );
}
