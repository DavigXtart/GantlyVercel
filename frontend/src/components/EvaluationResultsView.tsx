import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Calendar, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { getTestDefinition, type ScoringLevel } from '../data/evaluationTestDefinitions';

interface EvalResult {
  id: number;
  score: number;
  level: string;
  completedAt: string;
  test: { id: number; code: string; title: string; topic?: string };
}

interface EvaluationResultsViewProps {
  results: EvalResult[];
  testCode: string;
  testTitle: string;
  onClose: () => void;
  onRetake: () => void;
}

const levelColorMap: Record<string, { bg: string; text: string; ring: string; bar: string; dot: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', bar: 'bg-red-500', dot: 'bg-red-500' },
};

function getLevelInfo(testCode: string, score: number): { level: ScoringLevel; colors: typeof levelColorMap['emerald'] } | null {
  const def = getTestDefinition(testCode);
  if (!def) return null;
  const level = def.scoringLevels.find(l => score >= l.min && score <= l.max)
    || def.scoringLevels[def.scoringLevels.length - 1];
  const colors = levelColorMap[level.color] || levelColorMap.amber;
  return { level, colors };
}

export default function EvaluationResultsView({ results, testCode, testTitle, onClose, onRetake }: EvaluationResultsViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const definition = getTestDefinition(testCode);
  if (!definition || results.length === 0) return null;

  const sorted = [...results].sort((a, b) =>
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  const latest = sorted[0];
  const previous = sorted.length > 1 ? sorted[1] : null;
  const history = sorted.slice(1);

  const info = getLevelInfo(testCode, latest.score);
  if (!info) return null;
  const { level, colors } = info;
  const percentage = Math.round((latest.score / definition.maxScore) * 100);

  // Trend calculation
  let trend: 'up' | 'down' | 'same' | null = null;
  if (previous) {
    const diff = latest.score - previous.score;
    if (diff > 0) trend = 'up';
    else if (diff < 0) trend = 'down';
    else trend = 'same';
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-heading font-semibold text-slate-800 truncate">
              {testTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(latest.completedAt).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ml-3"
            aria-label="Cerrar"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Score circle */}
          <div className="text-center mb-6">
            <div className={`w-28 h-28 rounded-full ${colors.bg} ring-4 ${colors.ring} flex flex-col items-center justify-center mx-auto mb-4`}>
              <span className={`text-3xl font-heading font-bold ${colors.text}`}>
                {latest.score}
              </span>
              <span className="text-xs text-slate-500">
                de {definition.maxScore}
              </span>
            </div>

            {/* Level badge */}
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${colors.bg} ${colors.text} ring-1 ${colors.ring} mb-3`}>
              {level.label}
            </span>

            {/* Trend indicator */}
            {trend && (
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {trend === 'up' && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                    <TrendingUp size={12} />
                    +{latest.score - previous!.score} vs anterior
                  </span>
                )}
                {trend === 'down' && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <TrendingDown size={12} />
                    {latest.score - previous!.score} vs anterior
                  </span>
                )}
                {trend === 'same' && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                    <Minus size={12} />
                    Sin cambios vs anterior
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              {level.description}
            </p>
          </div>

          {/* Score bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>0</span>
              <span>{percentage}%</span>
              <span>{definition.maxScore}</span>
            </div>
            <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Scoring levels reference */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-slate-600 mb-3">Escala de referencia</p>
            <div className="space-y-2">
              {definition.scoringLevels.map(sl => {
                const slColors = levelColorMap[sl.color] || levelColorMap.amber;
                const isActive = sl.level === level.level;
                return (
                  <div
                    key={sl.level}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? slColors.bg : ''}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${slColors.dot}`} />
                    <span className={`text-xs font-medium flex-1 ${isActive ? slColors.text : 'text-slate-600'}`}>
                      {sl.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {sl.min}-{sl.max}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 cursor-pointer hover:text-gantly-blue transition-colors"
              >
                <Calendar size={14} />
                Historial ({history.length + 1} resultado{history.length > 0 ? 's' : ''})
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showHistory && (
                <div className="space-y-2">
                  {sorted.map((r, idx) => {
                    const rInfo = getLevelInfo(testCode, r.score);
                    if (!rInfo) return null;
                    const isLatest = idx === 0;
                    return (
                      <div
                        key={r.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isLatest ? 'border-gantly-blue/20 bg-gantly-blue/5' : 'border-slate-100 bg-white'}`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rInfo.colors.dot}`} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${isLatest ? 'text-gantly-blue' : 'text-slate-700'}`}>
                            {r.score}/{definition.maxScore}
                          </span>
                          <span className={`text-xs ml-2 ${rInfo.colors.text}`}>
                            {rInfo.level.label}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {new Date(r.completedAt).toLocaleDateString('es-ES', {
                            day: '2-digit', month: 'short', year: '2-digit'
                          })}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gantly-blue/10 text-gantly-blue font-medium flex-shrink-0">
                            Último
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Este resultado es orientativo y no sustituye un diagnóstico profesional.
              Comparte estos resultados con tu psicólogo para una valoración completa.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onRetake}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-gantly-blue hover:text-gantly-blue transition-all cursor-pointer"
          >
            <RotateCcw size={16} />
            Repetir test
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 bg-gantly-blue text-white rounded-xl text-sm font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
