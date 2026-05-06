import { useState, useEffect } from 'react';
import { testService } from '../services/api';
import { toast } from './ui/Toast';
import LogoSvg from '../assets/logo-gantly.svg';

interface Question {
  id: number;
  text: string;
  type: string;
  position: number;
}

interface Answer {
  id: number;
  text: string;
  value: number;
  position: number;
}

interface TestDetails {
  id: number;
  code: string;
  title: string;
  description: string;
  questions: Array<Question & { answers: Answer[] }>;
}

interface TestFlowProps {
  testId: number;
  onBack: () => void;
  onComplete: () => void;
}

export default function TestFlow({ testId, onBack, onComplete }: TestFlowProps) {
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerId?: number; numericValue?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Cargar el test con timeout para evitar que se quede cargando indefinidamente
    const loadTestWithTimeout = async () => {
      timeoutId = setTimeout(() => {
        if (isMounted && !test) {
          toast.error('El test está tardando demasiado en cargar. Verifica que el backend esté corriendo.');
          if (onBack) {
            onBack();
          }
        }
      }, 10000); // 10 segundos de timeout

      try {
        await loadTest();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    loadTestWithTimeout();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
      // Volver atrás si hay error
      if (onBack) {
        onBack();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answerId?: number, numericValue?: number, autoAdvance: boolean = true) => {
    const newAnswers = {
      ...answers,
      [questionId]: { answerId, numericValue }
    };

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
            if (confirm('¿Has completado todas las preguntas. ¿Deseas enviar el test?')) {
              handleSubmitWithAnswers(newAnswers);
            }
          }
        }
      }, 400);
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

    if (!confirm('¿Estás seguro de que deseas enviar tus respuestas? No podrás modificarlas después.')) {
      return;
    }

    await handleSubmitWithAnswers(answers);
  };

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

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8 md:p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Test no disponible</h2>
          <p className="text-slate-500 mb-6">Este test no tiene preguntas aun.</p>
          <button
            onClick={onBack}
            className="bg-gantly-blue hover:bg-gantly-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

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
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer transition-colors duration-200"
          >
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
          <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
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
          {/* Question Text */}
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
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-gantly-blue border-gantly-blue'
                          : 'border-slate-300'
                      }`}
                    >
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
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-gantly-blue border-gantly-blue'
                          : 'border-slate-300'
                      }`}
                    >
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
              <div className="flex justify-between text-xs text-slate-400 px-1">
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
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-500 hover:text-slate-700 cursor-pointer'
            }`}
          >
            ← Anterior
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer transition-colors duration-200"
            >
              Guardar y salir
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
                {submitting ? 'Enviando...' : 'Enviar evaluacion'}
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
    </div>
  );
}
