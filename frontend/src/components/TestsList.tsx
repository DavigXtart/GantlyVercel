import { useState, useEffect } from 'react';
import { testService } from '../services/api';

interface Test {
  id: number;
  code: string;
  title?: string;
  description?: string;
  active?: boolean;
}

export default function TestsList({ onSelectTest }: { onSelectTest: (id: number) => void }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await testService.list();
      console.log('Tests cargados:', data);
      // Filtrar solo tests activos
      const activeTests = data.filter((test: any) => test.active !== false);
      setTests(activeTests);
    } catch (err: any) {
      console.error('Error cargando tests:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
      console.error('Detalles del error:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: errorMsg
      });
      alert(`Error al cargar los tests: ${errorMsg}\n\nVerifica que:\n- El backend esté corriendo en http://localhost:8080\n- No haya errores en la consola del navegador`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando tests...</div>;
  }

  return (
    <div className="container">
      <h1>Tests disponibles</h1>
      <p>Selecciona un test para comenzar</p>

      <div className="tests-grid">
        {tests.map(test => (
          <div key={test.id} className="test-card" onClick={() => onSelectTest(test.id)}>
            <h3>{test.title || test.code || `Test #${test.id}`}</h3>
            <p>{test.description || 'Sin descripción'}</p>
            {test.code && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Código: {test.code}
              </p>
            )}
          </div>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No hay tests disponibles aún
          </p>
        </div>
      )}
    </div>
  );
}

