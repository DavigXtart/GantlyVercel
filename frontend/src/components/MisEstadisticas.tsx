import { useState, useEffect, useMemo } from 'react';
import { personalAgendaService, evaluationTestService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';
import { LineChart, Smile, Flame, FileEdit, HelpCircle, TrendingUp, LayoutGrid, History, BarChart3, Eye, ChevronRight } from 'lucide-react';
import MoodFace from './ui/MoodFace';

interface MisEstadisticasProps {
  onViewTest?: (testId: number, testCode: string, testTitle: string) => void;
}

export default function MisEstadisticas({ onViewTest }: MisEstadisticasProps = {}) {
  const [loading, setLoading] = useState(true);
  const [moodStats, setMoodStats] = useState<any>(null);
  const [testStats, setTestStats] = useState<any>(null);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [moodData, testData, entriesData] = await Promise.all([
        personalAgendaService.getStatistics(30),
        evaluationTestService.getUserStatistics(),
        personalAgendaService.getUserEntries().catch(() => ({ entries: [] })),
      ]);
      setMoodStats(moodData);
      setTestStats(testData);
      setMoodEntries(entriesData.entries || []);
    } catch (error: any) {
      toast.error('No se pudieron cargar las estadísticas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Build chart data: last 30 days
  const chartData = useMemo(() => {
    const now = new Date();
    const days: { date: string; label: string; mood: number | null }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = moodEntries.find((e: any) => e.entryDate === dateStr);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }),
        mood: entry ? entry.moodRating : null,
      });
    }
    return days;
  }, [moodEntries]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
          <LineChart size={20} className="text-gantly-blue" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-gantly-text">
          Mis Estadisticas
        </h2>
      </div>

      {/* Mood stats */}
      <div className="mb-10">
        <h3 className="text-xs font-heading font-semibold text-gantly-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gantly-blue"></div>
          Estado de animo (ultimos 30 dias)
        </h3>
        {moodStats && moodStats.totalEntries > 0 ? (
          <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hero metric — average mood */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:shadow-gantly-blue/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gantly-blue/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gantly-blue/10 flex items-center justify-center flex-shrink-0">
                  <Smile size={28} className="text-gantly-blue" />
                </div>
                <div>
                  <p className="text-xs font-body text-gantly-muted uppercase tracking-wide mb-1">Promedio de animo</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-heading font-bold text-gantly-text">
                      {moodStats.averageMood?.toFixed(1) || '0.0'}
                    </p>
                    <span className="text-sm font-body text-gantly-muted">/ 5.0</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-3 w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gantly-blue rounded-full transition-all duration-500"
                      style={{ width: `${((moodStats.averageMood || 0) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Companion metrics stacked */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-gantly-gold/5 transition-all duration-300 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gantly-gold/10 flex items-center justify-center">
                    <Flame size={20} className="text-gantly-gold" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold text-gantly-text">
                      {moodStats.streak || 0}
                    </p>
                    <p className="text-xs font-body text-gantly-muted">Dias de racha</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:shadow-gantly-emerald/5 transition-all duration-300 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gantly-emerald/10 flex items-center justify-center">
                    <FileEdit size={20} className="text-gantly-emerald" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold text-gantly-text">
                      {moodStats.totalEntries || 0}
                    </p>
                    <p className="text-xs font-body text-gantly-muted">Total registros</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Mood Trend Chart */}
          {chartData.filter(d => d.mood !== null).length >= 2 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 mt-4">
              <h4 className="text-sm font-heading font-semibold text-gantly-text mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gantly-blue/10 flex items-center justify-center">
                  <LineChart size={14} className="text-gantly-blue" />
                </span>
                Tendencia de ánimo (30 días)
              </h4>
              {(() => {
                const VB_W = 600;
                const VB_H = 200;
                const PAD = 16;
                const chartH = VB_H - PAD * 2;
                const chartW = VB_W - PAD * 2;
                const toX = (i: number) => PAD + (i / 29) * chartW;
                const toY = (mood: number) => PAD + chartH - ((mood - 1) / 4) * chartH;
                const points = chartData
                  .map((d, i) => d.mood !== null ? { x: toX(i), y: toY(d.mood) } : null)
                  .filter(Boolean) as { x: number; y: number }[];
                return (
                  <div className="relative mt-2">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-3 bottom-8 flex flex-col justify-between w-8 z-10">
                      {[5, 4, 3, 2, 1].map(v => (
                        <span key={v} className="leading-none"><MoodFace value={v} size={18} /></span>
                      ))}
                    </div>
                    {/* Chart area */}
                    <div className="ml-10">
                      <svg
                        viewBox={`0 0 ${VB_W} ${VB_H}`}
                        className="w-full"
                        style={{ height: 220 }}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <defs>
                          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2E93CC" />
                            <stop offset="100%" stopColor="#2E93CC" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[1, 2, 3, 4, 5].map(v => (
                          <line
                            key={v}
                            x1={PAD}
                            x2={VB_W - PAD}
                            y1={toY(v)}
                            y2={toY(v)}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                          />
                        ))}
                        {/* Area fill */}
                        {points.length >= 2 && (
                          <polygon
                            fill="url(#moodGradient)"
                            opacity="0.15"
                            points={
                              points.map(p => `${p.x},${p.y}`).join(' ') +
                              ` ${points[points.length - 1].x},${toY(1)} ${points[0].x},${toY(1)}`
                            }
                          />
                        )}
                        {/* Line */}
                        {points.length >= 2 && (
                          <polyline
                            fill="none"
                            stroke="#2E93CC"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            points={points.map(p => `${p.x},${p.y}`).join(' ')}
                          />
                        )}
                        {/* Dots */}
                        {points.map((p, i) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="#2E93CC"
                            stroke="white"
                            strokeWidth="2"
                          />
                        ))}
                        {/* X-axis labels */}
                        {chartData.map((d, i) => {
                          if (i % 7 !== 0) return null;
                          return (
                            <text
                              key={i}
                              x={toX(i)}
                              y={VB_H - 2}
                              textAnchor="middle"
                              className="fill-slate-400"
                              fontSize="11"
                            >
                              {d.label}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          </>
        ) : (
          <div className="bg-gantly-cloud rounded-2xl border border-slate-100 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Smile size={28} className="text-gantly-muted" />
            </div>
            <EmptyState
              title="No hay datos aun"
              description="Comienza a registrar tu estado de animo diario para ver tus estadisticas aqui."
            />
          </div>
        )}
      </div>

      {/* Test stats */}
      <div>
        <h3 className="text-xs font-heading font-semibold text-gantly-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gantly-navy"></div>
          Tests completados
        </h3>
        {testStats && testStats.totalTests > 0 ? (
          <div>
            {/* Horizontal summary bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 mb-6 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gantly-navy/10 flex items-center justify-center">
                  <HelpCircle size={20} className="text-gantly-navy" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-gantly-text">
                    {testStats.totalTests || 0}
                  </p>
                  <p className="text-xs font-body text-gantly-muted">Total de tests</p>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gantly-blue/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-gantly-blue" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-gantly-text">
                    {testStats.averageScore?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs font-body text-gantly-muted">Puntuacion promedio</p>
                </div>
              </div>
            </div>

            {/* Tests by topic — pills/tags */}
            {testStats.testsByTopic && Object.keys(testStats.testsByTopic).length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
                <h4 className="text-sm font-heading font-semibold text-gantly-text mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-gantly-ice flex items-center justify-center">
                    <LayoutGrid size={14} className="text-gantly-blue" />
                  </span>
                  Tests por tema
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(testStats.testsByTopic).map(([topic, count]: [string, any]) => (
                    <div
                      key={topic}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gantly-cloud rounded-full border border-slate-100 hover:border-gantly-blue/30 hover:bg-gantly-ice transition-all duration-200"
                    >
                      <span className="text-sm font-body font-medium text-gantly-text">
                        {topic}
                      </span>
                      <span className="text-xs font-heading font-bold text-white bg-gantly-blue rounded-full w-6 h-6 flex items-center justify-center">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent results — table-like list */}
            {testStats.recentResults && testStats.recentResults.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h4 className="text-sm font-heading font-semibold text-gantly-text flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gantly-ice flex items-center justify-center">
                      <History size={14} className="text-gantly-blue" />
                    </span>
                    Resultados recientes
                  </h4>
                </div>
                <div className="divide-y divide-slate-50">
                  {testStats.recentResults.map((result: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (onViewTest && result.testId) {
                          onViewTest(result.testId, result.testCode || '', result.testTitle);
                        }
                      }}
                      className={`w-full flex justify-between items-center px-6 py-4 hover:bg-gantly-blue/5 transition-all duration-200 cursor-pointer group ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gantly-blue/10 flex items-center justify-center group-hover:bg-gantly-blue/20 transition-colors">
                          <BarChart3 size={16} className="text-gantly-blue" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-body font-semibold text-gantly-text group-hover:text-gantly-blue transition-colors">
                            {result.testTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-body text-gantly-muted">
                              {result.topic}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${
                              result.level === 'ALTO' || result.level === 'MUY_ALTO'
                                ? 'bg-red-50 text-red-600'
                                : result.level === 'MODERADO'
                                ? 'bg-gantly-gold/10 text-gantly-gold'
                                : 'bg-gantly-emerald/10 text-gantly-emerald'
                            }`}>
                              {result.level}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-heading font-bold text-gantly-blue">
                          {result.score.toFixed(1)}
                        </p>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-gantly-blue transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gantly-cloud rounded-2xl border border-slate-100 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <HelpCircle size={28} className="text-gantly-muted" />
            </div>
            <EmptyState
              title="No hay tests completados"
              description="Completa algunos tests de evaluacion para ver tus estadisticas aqui."
            />
          </div>
        )}
      </div>
    </div>
  );
}
