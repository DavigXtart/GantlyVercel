import { useState, useEffect } from 'react';
import { evaluationTestService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';
import EmptyState from './ui/EmptyState';

export default function Descubrimiento() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const response = await evaluationTestService.getTestsByCategory('DISCOVERY');
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

  return (
    <div className="bg-white rounded-2xl shadow-card p-10 border border-slate-100">
      <h2 className="text-2xl font-bold text-gantly-text mb-8">
        Descubrimiento
      </h2>

      {topics.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gantly-muted mb-4">
            Filtrar por tema:
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedTopic(null)}
              className={`px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all border-2 ${
                selectedTopic === null
                  ? 'bg-gantly-blue-500 text-white border-gantly-blue-500 shadow-sm'
                  : 'bg-slate-50 text-gantly-muted border-slate-200 hover:border-gantly-blue-200'
              }`}
            >
              Todos
            </button>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all border-2 ${
                  selectedTopic === topic
                    ? 'bg-gantly-blue-500 text-white border-gantly-blue-500 shadow-sm'
                    : 'bg-slate-50 text-gantly-muted border-slate-200 hover:border-gantly-blue-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {filteredTests.map(test => (
            <div
              key={test.id}
              className="p-6 bg-gradient-to-br from-gantly-blue-50 to-gantly-cloud-200 rounded-2xl border-2 border-gantly-blue-200 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-glow-blue"
              onClick={() => {
                toast.info('Esta funcionalidad estara disponible proximamente');
              }}
            >
              <div className="text-xs text-gantly-blue-500 mb-2 font-semibold uppercase">
                {test.topic}
              </div>
              <h3 className="text-xl font-bold text-gantly-text mb-3">
                {test.title}
              </h3>
              {test.description && (
                <p className="text-sm text-gantly-muted mb-4 leading-relaxed">
                  {test.description}
                </p>
              )}
              <div className="px-4 py-2 bg-white rounded-lg inline-block text-sm font-semibold text-gantly-blue-500">
                Proximamente
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay tests disponibles"
          description="Los tests de descubrimiento estaran disponibles proximamente."
        />
      )}
    </div>
  );
}
