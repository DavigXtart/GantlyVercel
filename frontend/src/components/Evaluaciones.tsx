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
      // Filtrar tests placeholder (los que tienen código que empieza con SECTION_PLACEHOLDER_)
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const filteredTests = selectedTopic 
    ? tests.filter(t => t.topic === selectedTopic)
    : tests;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
      padding: '40px',
      border: '1px solid rgba(90, 146, 112, 0.15)'
    }}>
      <h2 style={{ 
        fontSize: '28px', 
        fontWeight: 700, 
        color: '#1a2e22', 
        marginBottom: '32px',
        fontFamily: "'Inter', sans-serif"
      }}>
        Evaluaciones
      </h2>

      {topics.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#3a5a4a', 
            marginBottom: '16px',
            fontFamily: "'Inter', sans-serif"
          }}>
            Filtrar por tema:
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              onClick={() => setSelectedTopic(null)}
              style={{
                padding: '10px 20px',
                background: selectedTopic === null 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                  : '#f8f9fa',
                color: selectedTopic === null ? '#fff' : '#3a5a4a',
                border: selectedTopic === null 
                  ? '2px solid #f59e0b'
                  : '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              Todos
            </button>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  padding: '10px 20px',
                  background: selectedTopic === topic 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                    : '#f8f9fa',
                  color: selectedTopic === topic ? '#fff' : '#3a5a4a',
                  border: selectedTopic === topic 
                    ? '2px solid #f59e0b'
                    : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredTests.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredTests.map(test => (
            <div
              key={test.id}
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '16px',
                border: '2px solid rgba(217, 119, 6, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(217, 119, 6, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => {
                toast.info('Esta funcionalidad estará disponible próximamente');
              }}
            >
              <div style={{ 
                fontSize: '12px', 
                color: '#d97706', 
                marginBottom: '8px', 
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                {test.topic}
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 700, 
                color: '#1a2e22', 
                marginBottom: '12px',
                fontFamily: "'Inter', sans-serif"
              }}>
                {test.title}
              </h3>
              {test.description && (
                <p style={{ 
                  fontSize: '14px', 
                  color: '#3a5a4a', 
                  marginBottom: '16px',
                  lineHeight: '1.5'
                }}>
                  {test.description}
                </p>
              )}
              <div style={{
                padding: '8px 16px',
                background: '#fff',
                borderRadius: '8px',
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#d97706'
              }}>
                Próximamente
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay tests disponibles"
          description="Los tests de evaluación estarán disponibles próximamente."
        />
      )}
    </div>
  );
}

