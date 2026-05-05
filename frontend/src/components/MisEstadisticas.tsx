import { useState, useEffect } from 'react';
import { personalAgendaService, evaluationTestService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';

export default function MisEstadisticas() {
  const [loading, setLoading] = useState(true);
  const [moodStats, setMoodStats] = useState<any>(null);
  const [testStats, setTestStats] = useState<any>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [moodData, testData] = await Promise.all([
        personalAgendaService.getStatistics(30),
        evaluationTestService.getUserStatistics()
      ]);
      setMoodStats(moodData);
      setTestStats(testData);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar estadisticas');
    } finally {
      setLoading(false);
    }
  };

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
          <span className="material-symbols-outlined text-gantly-blue text-xl">analytics</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hero metric — average mood */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:shadow-gantly-blue/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gantly-blue/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gantly-blue/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-gantly-blue text-3xl">mood</span>
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
                    <span className="material-symbols-outlined text-gantly-gold text-xl">local_fire_department</span>
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
                    <span className="material-symbols-outlined text-gantly-emerald text-xl">edit_note</span>
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
        ) : (
          <div className="bg-gantly-cloud rounded-2xl border border-slate-100 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="material-symbols-outlined text-3xl text-gantly-muted">mood</span>
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
                  <span className="material-symbols-outlined text-gantly-navy text-xl">quiz</span>
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
                  <span className="material-symbols-outlined text-gantly-blue text-xl">trending_up</span>
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
                    <span className="material-symbols-outlined text-gantly-blue text-sm">category</span>
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
                      <span className="material-symbols-outlined text-gantly-blue text-sm">history</span>
                    </span>
                    Resultados recientes
                  </h4>
                </div>
                <div className="divide-y divide-slate-50">
                  {testStats.recentResults.map((result: any, index: number) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center px-6 py-4 hover:bg-gantly-cloud/50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gantly-blue/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-gantly-blue text-base">assessment</span>
                        </div>
                        <div>
                          <p className="text-sm font-body font-semibold text-gantly-text">
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
                      <div className="text-right">
                        <p className="text-xl font-heading font-bold text-gantly-blue">
                          {result.score.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gantly-cloud rounded-2xl border border-slate-100 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="material-symbols-outlined text-3xl text-gantly-muted">quiz</span>
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
