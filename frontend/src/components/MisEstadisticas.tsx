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
      toast.error(error.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

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
        Mis Estadísticas
      </h2>

      {/* Estadísticas de Estado de Ánimo */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 600, 
          color: '#3a5a4a', 
          marginBottom: '24px',
          fontFamily: "'Inter', sans-serif"
        }}>
          📊 Estado de Ánimo (últimos 30 días)
        </h3>
        {moodStats && moodStats.totalEntries > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                Promedio de Estado de Ánimo
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700 }}>
                {moodStats.averageMood?.toFixed(1) || '0.0'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                de 5.0
              </div>
            </div>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
              borderRadius: '16px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                Racha Actual
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700 }}>
                {moodStats.streak || 0} días
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                días consecutivos
              </div>
            </div>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
              borderRadius: '16px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                Total de Entradas
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700 }}>
                {moodStats.totalEntries || 0}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                registros
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No hay datos aún"
            description="Comienza a registrar tu estado de ánimo diario para ver tus estadísticas aquí."
          />
        )}
      </div>

      {/* Estadísticas de Tests */}
      <div>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 600, 
          color: '#3a5a4a', 
          marginBottom: '24px',
          fontFamily: "'Inter', sans-serif"
        }}>
          📝 Tests Completados
        </h3>
        {testStats && testStats.totalTests > 0 ? (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                color: '#fff'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                  Total de Tests
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700 }}>
                  {testStats.totalTests || 0}
                </div>
              </div>
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                borderRadius: '16px',
                color: '#fff'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                  Puntuación Promedio
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700 }}>
                  {testStats.averageScore?.toFixed(1) || '0.0'}
                </div>
              </div>
            </div>

            {testStats.testsByTopic && Object.keys(testStats.testsByTopic).length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#1a2e22', 
                  marginBottom: '16px',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  Tests por Tema
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {Object.entries(testStats.testsByTopic).map(([topic, count]: [string, any]) => (
                    <div
                      key={topic}
                      style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#3a5a4a', marginBottom: '4px' }}>
                        {topic}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a2e22' }}>
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testStats.recentResults && testStats.recentResults.length > 0 && (
              <div>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#1a2e22', 
                  marginBottom: '16px',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  Resultados Recientes
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {testStats.recentResults.map((result: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a2e22' }}>
                          {result.testTitle}
                        </div>
                        <div style={{ fontSize: '14px', color: '#3a5a4a' }}>
                          {result.topic} • {result.level}
                        </div>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#667eea' }}>
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
            description="Completa algunos tests de evaluación para ver tus estadísticas aquí."
          />
        )}
      </div>
    </div>
  );
}

