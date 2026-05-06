import { useState, useEffect } from 'react';
import { initialTestService } from '../services/api';
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
  value: number | null;
  position: number;
}

interface QuestionResponse {
  answerId?: number;
  answerIds?: number[];
  numericValue?: number;
  textValue?: string;
  multiTextValues?: Record<number, string>;
}

interface QuestionMeta {
  block: string;
  helper?: string;
  badge?: string;
}

interface TestDetails {
  id: number;
  code: string;
  title: string;
  description: string;
  questions: Array<Question & { answers: Answer[] }>;
}

const DETAIL_INPUT_PATTERN = /especificar/i;

const getQuestionMeta = (position: number): QuestionMeta | null => {
  if (position === 1) {
    return { block: 'Bloque 1 · Motivo principal', helper: 'Cuentanos que te trae a terapia.' };
  }
  if (position === 2 || position === 3) {
    return { block: 'Bloque 2 · Preferencias del profesional', helper: 'Ayudanos a adaptar el estilo del psicologo.' };
  }
  if (position >= 4 && position <= 7) {
    return { block: 'Bloque 3 · Tu estilo y personalidad', helper: 'Escala de 1 (muy en desacuerdo) a 5 (muy de acuerdo).' };
  }
  if (position === 8 || position === 9) {
    return { block: 'Bloque 4 · Experiencia previa', helper: 'Nos ayuda a saber que ha funcionado antes.' };
  }
  if (position === 10 || position === 11) {
    return { block: 'Bloque 5 · Disponibilidad', helper: 'Puedes elegir varias franjas si lo necesitas.' };
  }
  if (position === 12 || position === 13) {
    return { block: 'Bloque 6 · Presupuesto y urgencia', helper: 'Esto nos permite priorizar y ajustar sugerencias.' };
  }
  if (position === 14 || position === 15) {
    return { block: 'Bloque 7 · Contexto personal', helper: 'Informacion para ajustar el matching.' };
  }
  if (position === 16) {
    return { block: 'Resumen final', helper: 'Comparte cualquier detalle adicional.' };
  }
  return null;
};

interface InitialTestFlowProps {
  onComplete: (sessionId: string) => void;
  onBack: () => void;
}

export default function InitialTestFlow({ onComplete, onBack }: InitialTestFlowProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuestionResponse>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeTest();
  }, []);

  const initializeTest = async () => {
    try {
      setLoading(true);
      // Crear sesion temporal
      const newSessionId = await initialTestService.createSession();
      setSessionId(newSessionId);

      // Obtener el test inicial
      const testData = await initialTestService.getTest(newSessionId);
      if (testData.questions) {
        testData.questions.sort((a: Question, b: Question) => a.position - b.position);
        testData.questions.forEach((q: any) => {
          if (q.answers) {
            q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
          } else {
            q.answers = [];
          }
        });
      }
      setTest(testData);
    } catch (err: any) {
      toast.error('Error al cargar el test inicial: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (questionId: number, value: string) => {
    const numericValue = value === '' ? undefined : Number(value);
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        numericValue,
      },
    }));
  };

  const handleTextChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        textValue: value,
      },
    }));
  };

  const handleMultiAnswerDetailChange = (questionId: number, answerId: number, value: string) => {
    setAnswers(prev => {
      const prevEntry = prev[questionId] || {};
      const nextTextMap = { ...(prevEntry.multiTextValues || {}) };
      nextTextMap[answerId] = value;
      return {
        ...prev,
        [questionId]: {
          ...prevEntry,
          multiTextValues: nextTextMap,
        },
      };
    });
  };

  const isQuestionAnswered = (question: Question & { answers: Answer[] }) => {
    const response = answers[question.id];
    if (!response) return false;

    if (question.type === 'MULTI') {
      return (response.answerIds || []).length > 0;
    }

    if (question.type === 'TEXT') {
      return Boolean(response.textValue && response.textValue.trim());
    }

    if (question.type === 'NUMBER') {
      return response.numericValue !== undefined && response.numericValue !== null && !Number.isNaN(response.numericValue);
    }

    if (question.type === 'SCALE') {
      return response.numericValue !== undefined && response.numericValue !== null;
    }

    return response.answerId !== undefined;
  };

  const goToPreviousQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextQuestion = () => {
    if (!test) return;
    setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1));
  };

  const handleAnswer = (questionId: number, answerId?: number, numericValue?: number, autoAdvance: boolean = true) => {
    if (!test) return;
    const question = test.questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => {
      const prevEntry = prev[questionId] || {};
      const nextEntries = { ...prev };

      if (question.type === 'MULTI') {
        const currentIds = new Set(prevEntry.answerIds || []);
        const nextTextValues = { ...(prevEntry.multiTextValues || {}) };
        if (answerId) {
          if (currentIds.has(answerId)) {
            currentIds.delete(answerId);
            delete nextTextValues[answerId];
          } else {
            currentIds.add(answerId);
          }
        }
        nextEntries[questionId] = {
          ...prevEntry,
          answerIds: Array.from(currentIds),
          multiTextValues: nextTextValues,
        };
      } else {
        nextEntries[questionId] = {
          ...prevEntry,
          answerId,
          numericValue,
        };
      }

      return nextEntries;
    });

    // Manejar la logica especial para la pregunta 8 (si ha ido al psicologo)
    let shouldSkipQuestion9 = false;
    if (question.position === 8 && test) {
      const selectedAnswer = question.answers.find(a => a.id === answerId);
      const experienceQuestion = test.questions.find(q => q.position === 9);
      if (experienceQuestion) {
        // Verificar si la respuesta indica que nunca ha asistido
        const neverAttended = selectedAnswer && (
          selectedAnswer.text.toLowerCase().includes('nunca') ||
          selectedAnswer.text.toLowerCase().includes('no he ido') ||
          selectedAnswer.text.toLowerCase().includes('no he asistido') ||
          (selectedAnswer.text.toLowerCase().startsWith('no') && !selectedAnswer.text.toLowerCase().includes('si'))
        );

        if (neverAttended) {
          shouldSkipQuestion9 = true;
          // Auto-responder la pregunta 9 con "nunca he ido" o la primera opcion que indique eso
          const autoOption = experienceQuestion.answers.find(a =>
            a.text.toLowerCase().includes('nunca') ||
            a.text.toLowerCase().includes('no he ido') ||
            a.text.toLowerCase().includes('no he asistido') ||
            a.text.toLowerCase().includes('ninguna')
          ) || experienceQuestion.answers[0]; // Si no encuentra, usar la primera opcion

          if (autoOption) {
            setAnswers(prev => ({
              ...prev,
              [experienceQuestion.id]: {
                ...prev[experienceQuestion.id],
                answerId: autoOption.id,
              },
            }));
          }
        } else {
          // Si ha asistido, limpiar la respuesta de la pregunta 9 para que la responda manualmente
          setAnswers(prev => {
            const updated = { ...prev };
            const current = updated[experienceQuestion.id];
            if (current && current.answerId) {
              delete updated[experienceQuestion.id];
            }
            return updated;
          });
        }
      }
    }

    // Auto-avance a la siguiente pregunta
    if (autoAdvance && question.type !== 'MULTI') {
      setTimeout(() => {
        if (!test) return;
        setCurrentQuestionIndex(prevIndex => {
          const currentIndex = test.questions.findIndex(q => q.id === questionId);
          if (currentIndex !== -1 && currentIndex < test.questions.length - 1) {
            // Si es la pregunta 8 y nunca ha asistido, saltar la pregunta 9
            if (shouldSkipQuestion9) {
              const question9Index = test.questions.findIndex(q => q.position === 9);
              if (question9Index !== -1 && question9Index < test.questions.length - 1) {
                return question9Index + 1; // Saltar a la pregunta despues de la 9
              }
            }
            return currentIndex + 1;
          }
          return prevIndex;
        });
      }, 220);
    }
  };

  const buildSubmitPayload = (): { questionId: number; answerId?: number; numericValue?: number; textValue?: string }[] => {
    if (!test) return [];
    const payload: { questionId: number; answerId?: number; numericValue?: number; textValue?: string }[] = [];

    test.questions.forEach(question => {
      const response = answers[question.id];
      if (!response) return;

      if (question.type === 'MULTI') {
        (response.answerIds || []).forEach(answerId => {
          payload.push({
            questionId: question.id,
            answerId,
            textValue: response.multiTextValues?.[answerId]?.trim(),
          });
        });
        return;
      }

      if (question.type === 'TEXT') {
        if (response.textValue && response.textValue.trim()) {
          payload.push({ questionId: question.id, textValue: response.textValue.trim() });
        }
        return;
      }

      if (question.type === 'NUMBER') {
        if (response.numericValue !== undefined && response.numericValue !== null && !Number.isNaN(response.numericValue)) {
          payload.push({ questionId: question.id, numericValue: response.numericValue });
        }
        return;
      }

      payload.push({
        questionId: question.id,
        answerId: response.answerId,
        numericValue: response.numericValue,
        textValue: response.textValue && response.textValue.trim() ? response.textValue.trim() : undefined,
      });
    });

    return payload;
  };

  const handleSubmitWithAnswers = async () => {
    if (!test || !sessionId) return;

    try {
      setSubmitting(true);
      const submitData = buildSubmitPayload();
      await initialTestService.submitAnswers(sessionId, submitData);
      onComplete(sessionId);
    } catch (err: any) {
      toast.error('Error al enviar las respuestas: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!test || !sessionId) return;

    // Filtrar preguntas que deben ser respondidas
    // Si la pregunta 8 indica que nunca ha asistido, la pregunta 9 ya esta auto-respondida
    const question8 = test.questions.find(q => q.position === 8);
    const question9 = test.questions.find(q => q.position === 9);
    let questionsToCheck = test.questions;

    if (question8 && question9) {
      const answer8 = answers[question8.id];
      if (answer8?.answerId) {
        const selectedAnswer8 = question8.answers.find(a => a.id === answer8.answerId);
        const neverAttended = selectedAnswer8 && (
          selectedAnswer8.text.toLowerCase().includes('nunca') ||
          selectedAnswer8.text.toLowerCase().includes('no he ido') ||
          selectedAnswer8.text.toLowerCase().includes('no he asistido') ||
          (selectedAnswer8.text.toLowerCase().startsWith('no') && !selectedAnswer8.text.toLowerCase().includes('si'))
        );

        // Si nunca ha asistido, excluir la pregunta 9 de la validacion (ya esta auto-respondida)
        if (neverAttended) {
          questionsToCheck = test.questions.filter(q => q.position !== 9);
        }
      }
    }

    const unanswered = questionsToCheck.filter(q => !isQuestionAnswered(q));
    if (unanswered.length > 0) {
      toast.warning(`Por favor, responde todas las preguntas. Te faltan ${unanswered.length} pregunta(s).`);
      return;
    }

    await handleSubmitWithAnswers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gantly-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-slate-600 font-medium">Cargando evaluacion inicial...</p>
        </div>
      </div>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8 md:p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Test no disponible</h2>
          <p className="text-slate-500 mb-6">El test inicial aun no esta configurado.</p>
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
  const totalQuestions = test.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const allAnswered = test.questions.every(q => isQuestionAnswered(q));
  const isCurrentAnswered = isQuestionAnswered(currentQuestion);
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const questionMeta = getQuestionMeta(currentQuestion.position);

  const renderSingleOptions = () => (
    <div className="flex flex-col gap-3">
      {currentQuestion.answers.map(answer => {
        const isSelected = currentAnswer?.answerId === answer.id;
        const requiresDetail = DETAIL_INPUT_PATTERN.test(answer.text);
        return (
          <div key={answer.id} className="flex flex-col gap-2">
            <button
              onClick={() => handleAnswer(currentQuestion.id, answer.id, answer.value || undefined)}
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
            {isSelected && requiresDetail && (
              <input
                type="text"
                value={currentAnswer?.textValue || ''}
                onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                placeholder="Especifica aqui..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue-400 transition-all"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderMultiOptions = () => {
    const selectedIds = new Set(currentAnswer?.answerIds || []);
    return (
      <div className="flex flex-col gap-3">
        {currentQuestion.answers.map(answer => {
          const isSelected = selectedIds.has(answer.id);
          const requiresDetail = DETAIL_INPUT_PATTERN.test(answer.text);
          return (
            <div key={answer.id} className="flex flex-col gap-2">
              <button
                onClick={() => handleAnswer(currentQuestion.id, answer.id, undefined, false)}
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
              {isSelected && requiresDetail && (
                <input
                  type="text"
                  value={currentAnswer?.multiTextValues?.[answer.id] || ''}
                  onChange={(e) => handleMultiAnswerDetailChange(currentQuestion.id, answer.id, e.target.value)}
                  placeholder="Especifica aqui..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue-400 transition-all"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderScaleOptions = () => (
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
        <span>Muy en desacuerdo</span>
        <span>Muy de acuerdo</span>
      </div>
    </div>
  );

  const renderNumberInput = () => (
    <div className="mt-3">
      <input
        type="number"
        min={1}
        max={120}
        value={currentAnswer?.numericValue ?? ''}
        onChange={(e) => handleNumberChange(currentQuestion.id, e.target.value)}
        placeholder="Ej. 28"
        className="w-full px-4 py-4 border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue-400 transition-all"
      />
    </div>
  );

  const renderTextInput = () => (
    <div className="mt-3">
      <textarea
        value={currentAnswer?.textValue || ''}
        onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
        rows={4}
        placeholder="Comparte cualquier detalle que quieras que tengamos en cuenta..."
        className="w-full px-4 py-4 border border-slate-200 rounded-xl text-base resize-y focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue-400 transition-all"
      />
    </div>
  );

  const renderQuestionContent = () => {
    if (currentQuestion.type === 'MULTI') return renderMultiOptions();
    if (currentQuestion.type === 'NUMBER') return renderNumberInput();
    if (currentQuestion.type === 'TEXT') return renderTextInput();
    if (currentQuestion.type === 'SCALE') return renderScaleOptions();
    return renderSingleOptions();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LogoSvg} alt="Gantly" className="h-7" />
            <span className="text-slate-800 font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
              {test.title}
            </span>
          </div>
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer transition-colors duration-200"
          >
            Guardar y salir
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">
            Pregunta {currentQuestionIndex + 1} de {totalQuestions}
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
          {/* Block Meta */}
          {questionMeta && (
            <div className="mb-6">
              <span className="text-xs font-bold text-gantly-blue uppercase tracking-wide">
                {questionMeta.block}
              </span>
              {questionMeta.helper && (
                <p className="mt-1 text-sm text-slate-500">{questionMeta.helper}</p>
              )}
            </div>
          )}

          {/* Question Text */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
            {currentQuestion.text}
          </h2>

          {/* Answer Options */}
          {renderQuestionContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0 || submitting}
            className={`font-medium transition-colors duration-200 ${
              currentQuestionIndex === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-500 hover:text-slate-700 cursor-pointer'
            }`}
          >
            ← Anterior
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={`px-6 py-3 rounded-xl font-medium transition-colors duration-200 ${
                !allAnswered || submitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gantly-blue hover:bg-gantly-blue-600 text-white cursor-pointer'
              }`}
            >
              {submitting ? 'Enviando...' : 'Enviar evaluacion'}
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              disabled={!isCurrentAnswered}
              className={`px-6 py-3 rounded-xl font-medium transition-colors duration-200 ${
                !isCurrentAnswered
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
  );
}
