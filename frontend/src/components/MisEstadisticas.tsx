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
    <div className="bg-white rounded-2xl shadow-card p-10 border border-slate-100">
      <h2 className="text-2xl font-bold text-gantly-text mb-8">
        Mis Estadisticas
      </h2>

      {/* Estadisticas de Estado de Animo */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold text-gantly-muted mb-6">
          Estado de Animo (ultimos 30 dias)
        </h3>
        {moodStats && moodStats.totalEntries > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
            <div className="p-6 bg-gradient-to-br from-gantly-blue-500 to-gantly-blue-700 rounded-2xl text-white">
              <div className="text-sm opacity-90 mb-2">
                Promedio de Estado de Animo
              </div>
              <div className="text-4xl font-bold">
                {moodStats.averageMood?.toFixed(1) || '0.0'}
              </div>
              <div className="text-xs opacity-80 mt-1">
                de 5.0
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-gantly-gold-400 to-gantly-gold-600 rounded-2xl text-white">
              <div className="text-sm opacity-90 mb-2">
                Racha Actual
              </div>
              <div className="text-4xl font-bold">
                {moodStats.streak || 0} dias
              </div>
              <div className="text-xs opacity-80 mt-1">
                dias consecutivos
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-gantly-emerald-500 to-gantly-emerald-700 rounded-2xl text-white">
              <div className="text-sm opacity-90 mb-2">
                Total de Entradas
              </div>
              <div className="text-4xl font-bold">
                {moodStats.totalEntries || 0}
              </div>
              <div className="text-xs opacity-80 mt-1">
                registros
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No hay datos aun"
            description="Comienza a registrar tu estado de animo diario para ver tus estadisticas aqui."
          />
        )}
      </div>

      {/* Estadisticas de Tests */}
      <div>
        <h3 className="text-xl font-semibold text-gantly-muted mb-6">
          Tests Completados
        </h3>
        {testStats && testStats.totalTests > 0 ? (
          <div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mb-8">
              <div className="p-6 bg-gradient-to-br from-gantly-blue-500 to-gantly-blue-700 rounded-2xl text-white">
                <div className="text-sm opacity-90 mb-2">
                  Total de Tests
                </div>
                <div className="text-4xl font-bold">
                  {testStats.totalTests || 0}
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-gantly-gold-400 to-gantly-gold-600 rounded-2xl text-white">
                <div className="text-sm opacity-90 mb-2">
                  Puntuacion Promedio
                </div>
                <div className="text-4xl font-bold">
                  {testStats.averageScore?.toFixed(1) || '0.0'}
                </div>
              </div>
            </div>

            {testStats.testsByTopic && Object.keys(testStats.testsByTopic).length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gantly-text mb-4">
                  Tests por Tema
                </h4>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                  {Object.entries(testStats.testsByTopic).map(([topic, count]: [string, any]) => (
                    <div
                      key={topic}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="text-sm text-gantly-muted mb-1">
                        {topic}
                      </div>
                      <div className="text-2xl font-bold text-gantly-text">
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testStats.recentResults && testStats.recentResults.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gantly-text mb-4">
                  Resultados Recientes
                </h4>
                <div className="flex flex-col gap-3">
                  {testStats.recentResults.map((result: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-base font-semibold text-gantly-text">
                          {result.testTitle}
                        </div>
                        <div className="text-sm text-gantly-muted">
                          {result.topic} • {result.level}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-gantly-blue-500">
                        {result.score.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No hay tests completados"
            description="Completa algunos tests de evaluacion para ver tus estadisticas aqui."
          />
        )}
      </div>
    </div>
  );
}
