import { useState, useEffect } from 'react';
import { evaluationTestService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';

export default function Evaluaciones() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const response = await evaluationTestService.getTestsByCategory('EVALUATION');
      // Filtrar tests placeholder (los que tienen codigo que empieza con SECTION_PLACEHOLDER_)
      const filteredTests = (response.tests || []).filter((t: any) =>
        !t.code || !t.code.startsWith('SECTION_PLACEHOLDER_')
      );
      setTests(filteredTests);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar tests');
    } finally {
      setLoading(false);
    }
  };

  const topics = Array.from(new Set(tests.map(t => t.topic)));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredTests = selectedTopic
    ? tests.filter(t => t.topic === selectedTopic)
    : tests;

  const topicIcons: Record<string, string> = {
    'Ansiedad': 'psychology',
    'Depresion': 'sentiment_dissatisfied',
    'Estres': 'bolt',
    'Autoestima': 'favorite',
    'Relaciones': 'group',
  };

  const topicGradients: Record<string, string> = {
    'Ansiedad': 'from-amber-500 to-orange-500',
    'Depresion': 'from-gantly-blue to-gantly-blue-600',
    'Estres': 'from-red-500 to-rose-500',
    'Autoestima': 'from-pink-500 to-fuchsia-500',
    'Relaciones': 'from-emerald-500 to-teal-500',
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gantly-blue to-gantly-blue-600 flex items-center justify-center shadow-sm shadow-gantly-blue/20">
          <span className="material-symbols-outlined text-white text-lg">assignment</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Evaluaciones
          </h2>
          {tests.length > 0 && (
            <p className="text-sm text-slate-500">
              {tests.length} test{tests.length !== 1 ? 's' : ''} disponible{tests.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Topic filter pills */}
      {topics.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTopic(null)}
              className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium transition-all duration-300 ${
                selectedTopic === null
                  ? 'bg-gradient-to-r from-gantly-blue-600 to-gantly-blue-700 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-gantly-blue-50 hover:text-gantly-blue hover:border-blue-200'
              }`}
            >
              Todos
            </button>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium transition-all duration-300 ${
                  selectedTopic === topic
                    ? 'bg-gradient-to-r from-gantly-blue-600 to-gantly-blue-700 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-gantly-blue-50 hover:text-gantly-blue hover:border-blue-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test cards grid */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map(test => {
            const gradient = topicGradients[test.topic] || 'from-gantly-blue to-gantly-blue-600';
            const icon = topicIcons[test.topic] || 'psychology';
            return (
              <div
                key={test.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={() => {
                  toast.info('Esta funcionalidad estara disponible proximamente');
                }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                  {test.topic}
                </p>
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-gantly-blue transition-colors mb-2">
                  {test.title}
                </h3>
                {test.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                    {test.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-gradient-to-r from-slate-50 to-slate-100 text-slate-500 border border-slate-200">
                    Proximamente
                  </span>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-gantly-blue transition-colors text-lg">
                    arrow_forward
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-400">assignment</span>
          </div>
          <EmptyState
            title="No hay tests disponibles"
            description="Los tests de evaluacion estaran disponibles proximamente."
          />
        </div>
      )}
    </div>
  );
}
