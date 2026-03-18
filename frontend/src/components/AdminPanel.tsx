import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import TestManager from './TestManager';
import TestImporter from './TestImporter';

interface Test {
  id: number;
  code: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  category?: 'EVALUATION' | 'DISCOVERY' | null;
  topic?: string | null;
  /** Indica si el test viene de evaluation_tests o de tests (para usar el endpoint correcto) */
  _source?: 'test' | 'evaluation';
}

export default function AdminPanel() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testSearch, setTestSearch] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    // Cargar topics disponibles de todos los tests
    const topics = Array.from(new Set(tests.map(t => t.topic).filter((t): t is string => t != null && t.trim() !== '')));
    setAvailableTopics(topics.sort());
  }, [tests]);

  const loadTests = async () => {
    try {
      setLoading(true);
      // Cargar tanto tests normales como evaluation tests
      const [testsData, evaluationTestsData] = await Promise.all([
        adminService.listTests().catch(() => []),
        adminService.listEvaluationTests().catch(() => [])
      ]);
      
      // Combinar ambos tipos de tests, excluyendo placeholders
      const fromTests = (testsData || []).map((t: any) => ({ ...t, _source: 'test' as const }));
      const fromEvaluation = (evaluationTestsData || [])
        .filter((et: any) => !et.code || !et.code.startsWith('SECTION_PLACEHOLDER_'))
        .map((et: any) => ({ ...et, _source: 'evaluation' as const }));
      const allTestsCombined = [...fromTests, ...fromEvaluation];
      
      setTests(allTestsCombined);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
      alert(`Error al cargar los tests: ${errorMsg}\n\nVerifica que:\n- El backend esté corriendo\n- Estés autenticado como ADMIN`);
    } finally {
      setLoading(false);
    }
  };


  const createTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      await adminService.createTest(
        formData.get('code') as string,
        formData.get('title') as string,
        formData.get('description') as string || ''
      );
      await loadTests();
      setShowCreateForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al crear test: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTest) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      
      const updateData = {
        code: formData.get('code') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string || '',
        category: (formData.get('category') as string) || undefined,
        topic: (formData.get('topic') as string) || undefined
      };
      
      if (editingTest._source === 'evaluation') {
        await adminService.updateEvaluationTest(editingTest.id, {
          ...updateData,
          category: (updateData.category as 'EVALUATION' | 'DISCOVERY') || undefined,
          topic: updateData.topic || undefined
        });
      } else {
        await adminService.updateTest(editingTest.id, updateData);
      }
      
      await loadTests();
      setEditingTest(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al actualizar test: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este test? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      setLoading(true);
      const test = tests.find(t => t.id === id);
      if (test?._source === 'evaluation') {
        await adminService.deleteEvaluationTest(id);
      } else {
        await adminService.deleteTest(id);
      }
      
      await loadTests();
      if (selectedTestId === id) {
        setSelectedTestId(null);
      }
    } catch (err: any) {
      alert('Error al eliminar test: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleTestActive = async (test: Test) => {
    const newActive = !test.active;
    // Actualización optimista: cambia el badge al instante
    setTests(prev => prev.map(t =>
      t.id === test.id && t._source === test._source ? { ...t, active: newActive } : t
    ));
    try {
      if (test._source === 'evaluation') {
        await adminService.updateEvaluationTest(test.id, { active: newActive });
      } else {
        await adminService.updateTest(test.id, { active: newActive });
      }
      await loadTests();
    } catch (err: any) {
      // Revertir si falla
      setTests(prev => prev.map(t =>
        t.id === test.id && t._source === test._source ? { ...t, active: test.active } : t
      ));
      alert('Error al actualizar test: ' + (err.response?.data?.message || err.message));
    }
  };


  const filteredTests = tests.filter(test => {
    if (!testSearch.trim()) return true;
    const query = testSearch.toLowerCase();
    return (
      test.title.toLowerCase().includes(query) ||
      test.code.toLowerCase().includes(query) ||
      (test.description || '').toLowerCase().includes(query)
    );
  });

  if (selectedTestId) {
    return (
      <TestManager 
        testId={selectedTestId} 
        onBack={() => {
          setSelectedTestId(null);
          loadTests();
        }} 
      />
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Gestión de Tests</h1>
          <p>Gestiona todos los tests, preguntas y respuestas</p>
        </div>
      </div>

      <>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Gestión de Tests</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-secondary"
              onClick={() => { setShowImportForm(!showImportForm); setShowCreateForm(false); }}
              disabled={loading}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              {showImportForm ? 'Cancelar' : 'Importar Excel'}
            </button>
            <button
              className="btn"
              onClick={() => { setShowCreateForm(!showCreateForm); setShowImportForm(false); }}
              disabled={loading}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              {showCreateForm ? 'Cancelar' : 'Nuevo Test'}
            </button>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="card admin-form-card">
          <h2>Crear Nuevo Test</h2>
          <form onSubmit={createTest}>
            <div className="form-group">
              <label>Código del Test *</label>
              <input 
                name="code" 
                required 
                placeholder="test-001, Test Personalizado, etc."
              />
              <small style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Puede contener letras, números, espacios y caracteres especiales
              </small>
            </div>
            <div className="form-group">
              <label>Título *</label>
              <input 
                name="title" 
                required 
                placeholder="Nombre del test psicológico"
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                name="description" 
                placeholder="Descripción del test..."
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  fontSize: '17px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Test'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showImportForm && (
        <div className="card admin-form-card">
          <TestImporter
            onImported={() => { setShowImportForm(false); loadTests(); }}
            onCancel={() => setShowImportForm(false)}
          />
        </div>
      )}

      {editingTest && (
        <div className="card admin-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Editar Test</h2>
            <button className="btn-secondary" onClick={() => setEditingTest(null)} style={{ width: 'auto', padding: '8px 16px' }}>
              Cerrar
            </button>
          </div>
          <form onSubmit={updateTest}>
            <div className="form-group">
              <label>Código del Test *</label>
              <input 
                name="code" 
                required 
                defaultValue={editingTest.code}
              />
            </div>
            <div className="form-group">
              <label>Título *</label>
              <input 
                name="title" 
                required 
                defaultValue={editingTest.title}
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                name="description" 
                defaultValue={editingTest.description || ''}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  fontSize: '17px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div className="form-group">
              <label>Categoría (Opcional)</label>
              <select 
                name="category"
                defaultValue={editingTest.category || ''}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '17px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit'
                }}
              >
                <option value="">Sin categoría</option>
                <option value="EVALUATION">Evaluación</option>
                <option value="DISCOVERY">Descubrimiento</option>
              </select>
              <small style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Si seleccionas una categoría, el test aparecerá en la sección correspondiente
              </small>
            </div>
            
            <div className="form-group">
              <label>Sección (Topic) (Opcional)</label>
              <input 
                name="topic"
                defaultValue={editingTest.topic || ''}
                list="topics-list-edit"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '17px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit'
                }}
              />
              <datalist id="topics-list-edit">
                {availableTopics.map(topic => (
                  <option key={topic} value={topic} />
                ))}
              </datalist>
              <small style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Puedes escribir un nombre nuevo para crear una nueva sección, o seleccionar una existente. Requiere que hayas seleccionado una categoría.
              </small>
            </div>
              
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditingTest(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2>Tests ({tests.length})</h2>
            {testSearch.trim() && (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Mostrando {filteredTests.length} coincidencia(s)
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por título, código o descripción..."
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '15px',
                minWidth: '220px'
              }}
            />
          </div>
        </div>

        {loading && tests.length === 0 ? (
          <div className="loading">Cargando tests...</div>
        ) : tests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No hay tests creados aún.</p>
            <p>Crea tu primer test usando el botón "Nuevo Test"</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No se encontraron tests que coincidan con "{testSearch}".</p>
          </div>
        ) : (
          <div className="tests-grid-admin">
            {filteredTests.filter((t: any) => t && t.id).map(test => (
              <div key={test.id} className="test-card-admin">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {test.category && (
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(90, 146, 112, 0.15)',
                          color: '#5a9270'
                        }}>
                          {test.category === 'EVALUATION' ? 'Evaluación' : 'Descubrimiento'}
                        </span>
                      </div>
                    )}
                    <h3>{test.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>Código:</strong> {test.code}
                    </p>
                  </div>
                  <span
                    className={`status-badge ${test.active ? 'status-active' : 'status-inactive'}`}
                    onClick={() => toggleTestActive(test)}
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                    title={test.active ? 'Click para desactivar' : 'Click para activar'}
                  >
                    {test.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  {test.description && (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                      {test.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '12px' }}>
                  <button
                    className="btn"
                    onClick={() => setSelectedTestId(test.id)}
                    style={{ flex: 1, minWidth: '80px', padding: '8px 12px', fontSize: '13px', borderRadius: '9999px' }}
                  >
                    Gestionar
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setEditingTest(test)}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-muted"
                    onClick={() => deleteTest(test.id)}
                    disabled={loading}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
    </div>
  );
}