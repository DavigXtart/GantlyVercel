import { useState, useEffect } from 'react';
import { matchingService } from '../services/api';
import { toast } from './ui/Toast';
import LogoSvg from '../assets/logo-gantly.svg';

interface Question {
  id: number;
  text: string;
  type: string;
  position: number;
  answers: Answer[];
}

interface Answer {
  id: number;
  text: string;
  value: number | null;
  position: number;
}

interface TestDetails {
  id: number;
  code: string;
  title: string;
  description: string;
  questions: Question[];
}

interface PatientMatchingTestProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function PatientMatchingTest({ onComplete, onBack }: PatientMatchingTestProps) {
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerId?: number; answerIds?: number[]; textValue?: string; numericValue?: number }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest = async () => {
    try {
      setLoading(true);
      const testData = await matchingService.getPatientTest();
      if (testData.questions) {
        testData.questions.sort((a: Question, b: Question) => a.position - b.position);
        testData.questions.forEach((q: Question) => {
          if (q.answers) {
            q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
          }
        });
      }
      setTest(testData);
    } catch (error: any) {
      toast.error('Error al cargar el test: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar preguntas visibles basado en respuestas anteriores
  const getVisibleQuestions = (): Question[] => {
    if (!test) return [];

    const visible: Question[] = [];
    const question3 = test.questions.find(q => q.position === 3); // Ocupacion principal
    const question4 = test.questions.find(q => q.position === 4); // Toma de decisiones

    for (const question of test.questions) {
      // La pregunta 4 (posicion 4) solo se muestra si la pregunta 3 tiene respuesta con posicion 3, 4, 5 o 6
      // Estas posiciones corresponden a: Profesional cualificado (3), Mando intermedio (4), Directivo (5), Autonomo (6)
      if (question.position === 4 && question4) {
        if (question3) {
          const answer3 = answers[question3.id];
          if (answer3?.answerId) {
            const selectedAnswer = question3.answers.find(a => a.id === answer3.answerId);
            if (selectedAnswer) {
              // Verificar si la posicion de la respuesta es 3, 4, 5 o 6
              const answerPosition = selectedAnswer.position;
              if (answerPosition >= 3 && answerPosition <= 6) {
                visible.push(question);
              }
            } else {
              // Si no hay respuesta valida, no mostrar la pregunta 4
              continue;
            }
          } else {
            // Si no hay respuesta a la pregunta 3, no mostrar la pregunta 4
            continue;
          }
        } else {
          continue;
        }
      } else {
        visible.push(question);
      }
    }

    return visible;
  };

  const visibleQuestions = getVisibleQuestions();

  const handleAnswer = (questionId: number, answerId?: number, numericValue?: number, textValue?: string, autoAdvance: boolean = true) => {
    if (!test) return;

    const question = test.questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => {
      const prevEntry = prev[questionId] || {};

      if (question.type === 'MULTIPLE' || question.type === 'MULTI') {
        const currentIds = prevEntry.answerIds || [];
        const nextIds = answerId !== undefined
          ? (currentIds.includes(answerId)
              ? currentIds.filter(id => id !== answerId)
              : [...currentIds, answerId])
          : currentIds;

        return {
          ...prev,
          [questionId]: {
            ...prevEntry,
            answerIds: nextIds,
            textValue: textValue !== undefined ? textValue : prevEntry.textValue,
          }
        };
      } else {
        return {
          ...prev,
          [questionId]: {
            answerId: answerId !== undefined ? answerId : prevEntry.answerId,
            numericValue: numericValue !== undefined ? numericValue : prevEntry.numericValue,
            textValue: textValue !== undefined ? textValue : prevEntry.textValue,
          }
        };
      }
    });

    // Auto-avance a la siguiente pregunta (solo para preguntas SINGLE, no para MULTIPLE, TEXT o DATE)
    if (autoAdvance && question.type !== 'MULTIPLE' && question.type !== 'MULTI' && question.type !== 'TEXT' && question.type !== 'DATE') {
      setTimeout(() => {
        if (visibleQuestions.length === 0) return;
        setCurrentQuestionIndex(prevIndex => {
          const currentIndex = visibleQuestions.findIndex(q => q.id === questionId);
          if (currentIndex !== -1 && currentIndex < visibleQuestions.length - 1) {
            return currentIndex + 1;
          }
          return prevIndex;
        });
      }, 220);
    }
  };

  const isQuestionAnswered = (question: Question): boolean => {
    const answer = answers[question.id];
    if (!answer) return false;

    if (question.type === 'TEXT' || question.type === 'DATE') {
      return !!(answer.textValue && answer.textValue.trim());
    }
    if (question.type === 'MULTIPLE' || question.type === 'MULTI') {
      return !!(answer.answerIds && answer.answerIds.length > 0);
    }
    return answer.answerId !== undefined || answer.numericValue !== undefined;
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;

    // Verificar que todas las preguntas visibles esten respondidas
    const unansweredQuestions = visibleQuestions.filter(q => !isQuestionAnswered(q));
    if (unansweredQuestions.length > 0) {
      toast.error('Por favor responde todas las preguntas antes de continuar');
      return;
    }

    try {
      setSubmitting(true);

      // Convertir respuestas al formato esperado por el backend
      const submitAnswers: any[] = [];

      // Solo enviar respuestas de preguntas visibles
      for (const question of visibleQuestions) {
        const answer = answers[question.id];
        if (!answer) continue;

        if (question.type === 'MULTIPLE' || question.type === 'MULTI') {
          if (answer.answerIds && answer.answerIds.length > 0) {
            for (const answerId of answer.answerIds) {
              submitAnswers.push({
                questionId: question.id,
                answerId: answerId
              });
            }
          }
        } else {
          const submitAnswer: any = { questionId: question.id };
          if (answer.answerId !== undefined) submitAnswer.answerId = answer.answerId;
          if (answer.numericValue !== undefined) submitAnswer.numericValue = answer.numericValue;
          if (answer.textValue !== undefined && answer.textValue.trim()) submitAnswer.textValue = answer.textValue;
          submitAnswers.push(submitAnswer);
        }
      }

      await matchingService.submitPatientTest(submitAnswers);
      toast.success('Test completado correctamente');
      onComplete();
    } catch (error: any) {
      toast.error('Error al enviar el test: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Actualizar el indice cuando cambian las preguntas visibles
  useEffect(() => {
    if (visibleQuestions.length > 0) {
      // Si el indice actual esta fuera de rango, ajustarlo
      if (currentQuestionIndex >= visibleQuestions.length) {
        setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
      }
    }
  }, [visibleQuestions.length, currentQuestionIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gantly-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-slate-600 font-medium">Cargando test de matching...</p>
        </div>
      </div>
    );
  }

  if (!test || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8 md:p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Test no disponible</h2>
          <p className="text-slate-500 mb-6">El test de matching no esta configurado.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-gantly-blue hover:bg-gantly-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 cursor-pointer"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  if (visibleQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gantly-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-slate-600 font-medium">No hay preguntas disponibles</p>
        </div>
      </div>
    );
  }

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const isCurrentAnswered = isQuestionAnswered(currentQuestion);

  const renderSingleOptions = () => (
    <div className="flex flex-col gap-3">
      {currentQuestion.answers.map(answer => {
        const isSelected = currentAnswer?.answerId === answer.id;
        return (
          <button
            key={answer.id}
            onClick={() => handleAnswer(currentQuestion.id, answer.id, undefined, undefined, true)}
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
  );

  const renderMultiOptions = () => {
    const selectedIds = new Set(currentAnswer?.answerIds || []);
    return (
      <div className="flex flex-col gap-3">
        {currentQuestion.answers.map(answer => {
          const isSelected = selectedIds.has(answer.id);
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
    );
  };

  const renderTextInput = () => {
    // Detectar si es una pregunta de fecha de nacimiento
    const isDateQuestion = currentQuestion.text.toLowerCase().includes('fecha de nacimiento') ||
                          currentQuestion.text.toLowerCase().includes('fecha de nac') ||
                          currentQuestion.type === 'DATE';

    if (isDateQuestion) {
      return (
        <div className="mt-3">
          <input
            type="date"
            value={currentAnswer?.textValue || ''}
            onChange={(e) => handleAnswer(currentQuestion.id, undefined, undefined, e.target.value, false)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-4 border border-slate-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue-400 transition-all"
          />
        </div>
      );
    }

    return (
      <div className="mt-3">
        <textarea
          value={currentAnswer?.textValue || ''}
          onChange={(e) => handleAnswer(currentQuestion.id, undefined, undefined, e.target.value, false)}
          rows={4}
          placeholder="Escribe tu respuesta aqui..."
          className="w-full px-4 py-4 border border-slate-200 rounded-xl text-base resize-y focus:outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue-400 transition-all"
        />
      </div>
    );
  };

  const renderQuestionContent = () => {
    if (currentQuestion.type === 'MULTIPLE' || currentQuestion.type === 'MULTI') return renderMultiOptions();
    if (currentQuestion.type === 'TEXT' || currentQuestion.type === 'DATE') return renderTextInput();
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
          {onBack && (
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer transition-colors duration-200"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">
            Pregunta {currentQuestionIndex + 1} de {visibleQuestions.length}
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
              disabled={!isCurrentAnswered || submitting}
              className={`px-6 py-3 rounded-xl font-medium transition-colors duration-200 ${
                !isCurrentAnswered || submitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gantly-blue hover:bg-gantly-blue-600 text-white cursor-pointer'
              }`}
            >
              {submitting ? 'Enviando...' : 'Completar Test'}
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
