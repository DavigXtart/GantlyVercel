import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { evaluationTestService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';
import type { EvaluationTestDefinition, ScoringLevel } from '../data/evaluationTestDefinitions';
import { calculateResult } from '../data/evaluationTestDefinitions';

interface EvaluationTestFlowProps {
  test: {
    id: number;
    code: string;
    title: string;
    description?: string;
    topic?: string;
  };
  definition: EvaluationTestDefinition;
  onClose: () => void;
  onComplete: () => void;
}

type Phase = 'intro' | 'questions' | 'submitting' | 'results';

const levelColorMap: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', bar: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', bar: 'bg-amber-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', bar: 'bg-orange-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', bar: 'bg-red-500' },
};

export default function EvaluationTestFlow({ test, definition, onClose, onComplete }: EvaluationTestFlowProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(definition.questions.length).fill(null)
  );
  const [result, setResult] = useState<{ score: number; level: ScoringLevel } | null>(null);

  const totalQuestions = definition.questions.length;
  const answeredCount = answers.filter(a => a !== null).length;
  const allAnswered = answeredCount === totalQuestions;
  const question = definition.questions[currentQuestion];

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
    }, 300);
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;

    setPhase('submitting');
    const validAnswers = answers as number[];
    const calcResult = calculateResult(definition, validAnswers);
    setResult(calcResult);

    try {
      const answersMap: Record<string, number> = {};
      validAnswers.forEach((val, idx) => {
        answersMap[`q${idx + 1}`] = val;
      });

      await evaluationTestService.submitResult(test.id, {
        score: calcResult.score,
        level: calcResult.level.level,
        answers: JSON.stringify(answersMap),
      });

      setPhase('results');
    } catch (error: any) {
      toast.error('No se pudieron enviar los resultados. Inténtalo de nuevo.');
      setPhase('questions');
    }
  };

  const scorePercentage = result ? Math.round((result.score / definition.maxScore) * 100) : 0;
  const colors = result ? (levelColorMap[result.level.color] || levelColorMap.amber) : levelColorMap.amber;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-heading font-semibold text-slate-800 truncate">{test.title}</h2>
            {phase === 'questions' && (
              <p className="text-xs text-slate-500 mt-0.5">
                Pregunta {currentQuestion + 1} de {totalQuestions}
              </p>
            )}
          </div>
          {phase !== 'submitting' && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ml-3"
              aria-label="Cerrar"
            >
              <X size={18} className="text-slate-500" />
            </button>
          )}
        </div>

        {/* ─── Progress bar (questions phase) ─── */}
        {phase === 'questions' && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-gantly-blue transition-all duration-500 ease-out"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        )}

        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Intro phase */}
          {phase === 'intro' && (
            <div className="text-center max-w-md mx-auto py-4">
              <div className="w-16 h-16 rounded-2xl bg-gantly-blue/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-gantly-blue" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-slate-800 mb-3">
                {test.title}
              </h3>
              {test.description && (
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {test.description}
                </p>
              )}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-700">Instrucciones: </span>
                  {definition.instructions}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  <span className="font-semibold text-slate-600">Periodo: </span>
                  {definition.timeframe}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  <span className="font-semibold text-slate-600">Preguntas: </span>
                  {totalQuestions}
                </p>
              </div>

              {test.code === 'PHQ9' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-left">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Este cuestionario incluye una pregunta sobre pensamientos de autolesión.
                    Si estás en crisis, llama al <strong>024</strong> (Línea de Atención a la Conducta Suicida).
                  </p>
                </div>
              )}

              <button
                onClick={() => setPhase('questions')}
                className="w-full px-6 py-3 bg-gantly-blue text-white rounded-xl text-sm font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                Empezar
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Questions phase */}
          {phase === 'questions' && (
            <div>
              {/* Timeframe reminder */}
              <p className="text-xs text-slate-400 text-center mb-6 uppercase tracking-wide font-medium">
                {definition.timeframe}
              </p>

              {/* Question */}
              <div className="text-center mb-8">
                <p className="text-lg font-heading font-medium text-slate-800 leading-relaxed">
                  {question.text}
                </p>
              </div>

              {/* Answer options */}
              <div className="space-y-3 max-w-md mx-auto">
                {question.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion] === option.value;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border-2 text-left ${
                        isSelected
                          ? 'bg-gantly-blue text-white border-gantly-blue shadow-md shadow-gantly-blue/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-gantly-blue/40 hover:bg-gantly-blue/5'
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>

              {/* Question dots */}
              <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
                {definition.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                      idx === currentQuestion
                        ? 'bg-gantly-blue scale-125'
                        : answers[idx] !== null
                        ? 'bg-gantly-blue/40'
                        : 'bg-slate-200'
                    }`}
                    aria-label={`Pregunta ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Submitting phase */}
          {phase === 'submitting' && (
            <div className="text-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Results phase */}
          {phase === 'results' && result && (
            <div className="text-center max-w-md mx-auto py-2">
              {/* Score circle */}
              <div className={`w-28 h-28 rounded-full ${colors.bg} ring-4 ${colors.ring} flex flex-col items-center justify-center mx-auto mb-6`}>
                <span className={`text-3xl font-heading font-bold ${colors.text}`}>
                  {result.score}
                </span>
                <span className="text-xs text-slate-500">
                  de {definition.maxScore}
                </span>
              </div>

              {/* Level label */}
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${colors.bg} ${colors.text} ring-1 ${colors.ring} mb-4`}>
                {result.level.label}
              </span>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {result.level.description}
              </p>

              {/* Score bar */}
              <div className="bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className={`h-full ${colors.bar} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${scorePercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mb-8">
                {scorePercentage}% del máximo
              </p>

              {/* Disclaimer */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Este resultado es orientativo y no sustituye un diagnóstico profesional.
                  Comparte estos resultados con tu psicólogo para una valoración completa.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onComplete();
                    onClose();
                  }}
                  className="flex-1 px-5 py-3 bg-gantly-blue text-white rounded-xl text-sm font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer nav (questions phase) ─── */}
        {phase === 'questions' && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => currentQuestion > 0 && setCurrentQuestion(currentQuestion - 1)}
              disabled={currentQuestion === 0}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Anterior
            </button>

            <span className="text-xs text-slate-400 font-medium">
              {answeredCount}/{totalQuestions} respondidas
            </span>

            {currentQuestion < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex items-center gap-1.5 text-sm text-gantly-blue hover:text-gantly-blue-600 font-medium transition-colors cursor-pointer"
              >
                Siguiente
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="flex items-center gap-1.5 px-4 py-2 bg-gantly-blue text-white rounded-xl text-sm font-medium hover:bg-gantly-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Ver resultados
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
