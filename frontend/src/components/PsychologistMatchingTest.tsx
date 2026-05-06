import { useState, useEffect } from 'react';
import { matchingService, psychService } from '../services/api';
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

interface PsychologistMatchingTestProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function PsychologistMatchingTest({ onComplete, onBack }: PsychologistMatchingTestProps) {
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
      const testData = await matchingService.getPsychologistTest();
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
    const question1 = test.questions.find(q => q.position === 1); // Modalidades
    const _question2 = test.questions.find(q => q.position === 2); // Formación en menores
    const _question3 = test.questions.find(q => q.position === 3); // Experiencia con menores
    const questionPriceIndividual = test.questions.find(q => q.position === 18); // Precio individual
    const questionPricePareja = test.questions.find(q => q.position === 19); // Precio pareja
    const questionPriceMenores = test.questions.find(q => q.position === 20); // Precio menores

    // Obtener modalidades seleccionadas
    let hasIndividual = false;
    let hasPareja = false;
    let hasMenores = false;

    if (question1) {
      const answer1 = answers[question1.id];
      if (answer1?.answerIds && answer1.answerIds.length > 0) {
        const selectedAnswers = question1.answers.filter(a => answer1.answerIds?.includes(a.id));
        hasIndividual = selectedAnswers.some(a =>
          a.text.toLowerCase().includes('individual adultos') ||
          a.text.toLowerCase().includes('individual')
        );
        hasPareja = selectedAnswers.some(a =>
          a.text.toLowerCase().includes('pareja')
        );
        hasMenores = selectedAnswers.some(a =>
          a.text.toLowerCase().includes('infantojuvenil') ||
          a.text.toLowerCase().includes('menores')
        );
      }
    }

    for (const question of test.questions) {
      // Las preguntas 2 y 3 solo se muestran si en la pregunta 1 se marcó "Terapia infantojuvenil (menores)"
      if (question.position === 2 || question.position === 3) {
        if (hasMenores) {
          visible.push(question);
        }
        continue;
      }

      // Preguntas de precios: solo mostrar si se seleccionó la modalidad correspondiente
      if (question.position === 18) { // Precio individual
        if (hasIndividual && questionPriceIndividual) {
          visible.push(question);
        }
        continue;
      }
      if (question.position === 19) { // Precio pareja
        if (hasPareja && questionPricePareja) {
          visible.push(question);
        }
        continue;
      }
      if (question.position === 20) { // Precio menores
        if (hasMenores && questionPriceMenores) {
          visible.push(question);
        }
        continue;
      }

      // Todas las demás preguntas se muestran normalmente
      visible.push(question);
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

    if (question.type === 'TEXT') {
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

    // Verificar que todas las preguntas visibles estén respondidas
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

      await matchingService.submitPsychologistTest(submitAnswers);

      // Guardar precios de sesión en el perfil del psicólogo
      const questionPriceIndividual = test.questions.find(q => q.position === 18);
      const questionPricePareja = test.questions.find(q => q.position === 19);
      const questionPriceMenores = test.questions.find(q => q.position === 20);

      const sessionPrices: any = {};
      if (questionPriceIndividual) {
        const answerIndividual = answers[questionPriceIndividual.id];
        if (answerIndividual?.numericValue !== undefined) {
          sessionPrices.individual = answerIndividual.numericValue;
        }
      }
      if (questionPricePareja) {
        const answerPareja = answers[questionPricePareja.id];
        if (answerPareja?.numericValue !== undefined) {
          sessionPrices.pareja = answerPareja.numericValue;
        }
      }
      if (questionPriceMenores) {
        const answerMenores = answers[questionPriceMenores.id];
        if (answerMenores?.numericValue !== undefined) {
          sessionPrices.menores = answerMenores.numericValue;
        }
      }

      // Guardar precios en el perfil si hay alguno
      if (Object.keys(sessionPrices).length > 0) {
        try {
          await psychService.updateProfile({ sessionPrices: JSON.stringify(sessionPrices) });
        } catch (error: any) {
          // No fallar el test si hay error guardando precios
        }
      }

      toast.success('Test completado correctamente');
      onComplete();
    } catch (error: any) {
      toast.error('Error al enviar el test: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Actualizar el índice cuando cambian las preguntas visibles
  useEffect(() => {
    if (visibleQuestions.length > 0) {
      // Si el índice actual está fuera de rango, ajustarlo
      if (currentQuestionIndex >= visibleQuestions.length) {
        setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
      }
    }
  }, [visibleQuestions.length, currentQuestionIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gantly-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Cargando test de matching...</p>
        </div>
      </div>
    );
  }

  if (!test || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8 md:p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Test no disponible</h2>
          <p className="text-slate-500 mb-6">El test de matching no está configurado.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-gantly-blue hover:bg-gantly-blue-600 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-colors duration-200"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-8 text-center">
          <p className="text-slate-600 font-medium">No hay preguntas disponibles</p>
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
    <div className="grid gap-3">
      {currentQuestion.answers.map(answer => {
        const isSelected = currentAnswer?.answerId === answer.id;
        return (
          <button
            key={answer.id}
            onClick={() => handleAnswer(currentQuestion.id, answer.id, undefined, undefined, true)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200
              ${isSelected
                ? 'border-gantly-blue bg-gantly-blue-50 shadow-sm'
                : 'border-slate-200 hover:border-gantly-blue-400 hover:bg-gantly-blue-50/50'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
              ${isSelected ? 'border-gantly-blue bg-gantly-blue' : 'border-slate-300'}`}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
            <span className="text-base font-medium text-slate-700">{answer.text}</span>
          </button>
        );
      })}
    </div>
  );

  const renderMultiOptions = () => {
    const selectedIds = new Set(currentAnswer?.answerIds || []);
    return (
      <div className="grid gap-3">
        {currentQuestion.answers.map(answer => {
          const isSelected = selectedIds.has(answer.id);
          return (
            <button
              key={answer.id}
              onClick={() => handleAnswer(currentQuestion.id, answer.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'border-gantly-blue bg-gantly-blue-50 shadow-sm'
                  : 'border-slate-200 hover:border-gantly-blue-400 hover:bg-gantly-blue-50/50'}`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                ${isSelected ? 'border-gantly-blue bg-gantly-blue' : 'border-slate-300'}`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-base font-medium text-slate-700">{answer.text}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTextInput = () => (
    <div className="mt-3">
      <textarea
        value={currentAnswer?.textValue || ''}
        onChange={(e) => handleAnswer(currentQuestion.id, undefined, undefined, e.target.value, false)}
        rows={4}
        placeholder="Escribe tu respuesta aquí..."
        className="w-full p-4 rounded-xl border border-slate-200 text-base resize-y focus:ring-2 focus:ring-gantly-blue focus:border-gantly-blue outline-none transition-all duration-200"
      />
    </div>
  );

  const renderQuestionContent = () => {
    if (currentQuestion.type === 'MULTIPLE' || currentQuestion.type === 'MULTI') return renderMultiOptions();
    if (currentQuestion.type === 'TEXT') return renderTextInput();
    return renderSingleOptions();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LogoSvg} alt="Gantly" className="h-7" />
          <span className="hidden sm:inline text-sm font-medium text-slate-600 border-l border-slate-200 pl-3">
            {test.title}
          </span>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors duration-200"
          >
            Guardar y salir
          </button>
        )}
      </header>

      {/* Progress bar */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Progreso</span>
            <span className="text-xs font-medium text-gantly-blue bg-gantly-blue-50 px-2 py-0.5 rounded-full">
              Pregunta {currentQuestionIndex + 1} de {visibleQuestions.length}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gantly-blue rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8 md:py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 sm:p-8 md:p-12">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 leading-relaxed">
              {currentQuestion.text}
            </h3>
            {(currentQuestion.type === 'MULTIPLE' || currentQuestion.type === 'MULTI') && (
              <p className="text-sm text-slate-500 mb-6">Puedes seleccionar varias opciones</p>
            )}
            {currentQuestion.type !== 'MULTIPLE' && currentQuestion.type !== 'MULTI' && (
              <div className="mb-6"></div>
            )}
            {renderQuestionContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0 || submitting}
              className={`text-sm font-medium transition-colors duration-200
                ${currentQuestionIndex === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
            >
              &larr; Anterior
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!isCurrentAnswered || submitting}
                className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-200
                  ${!isCurrentAnswered || submitting
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gantly-blue hover:bg-gantly-blue-600 shadow-md hover:shadow-lg cursor-pointer'}`}
              >
                {submitting ? 'Enviando...' : 'Completar Test'}
              </button>
            ) : (
              <button
                onClick={goToNextQuestion}
                disabled={!isCurrentAnswered}
                className={`px-6 py-3 rounded-xl font-medium text-white transition-all duration-200
                  ${!isCurrentAnswered
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gantly-blue hover:bg-gantly-blue-600 shadow-md hover:shadow-lg cursor-pointer'}`}
              >
                Siguiente &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
