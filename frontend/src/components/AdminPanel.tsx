import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import TestManager from './TestManager';
import UsersManager from './UsersManager';
import AdminStatistics from './AdminStatistics';

interface Test {
  id: number;
  code: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  category?: 'EVALUATION' | 'DISCOVERY' | null;
  topic?: string | null;
}

interface AdminPanelProps {
  initialTab?: 'tests' | 'users';
}

export default function AdminPanel({ initialTab = 'tests' }: AdminPanelProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'users' | 'statistics'>(initialTab);
  const [testSearch, setTestSearch] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    // Cargar topics disponibles de todos los tests
    const topics = Array.from(new Set(tests.map(t => t.topic).filter(t => t && t.trim() !== '')));
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
      const allTestsCombined = [
        ...(testsData || []),
        ...(evaluationTestsData || []).filter((et: any) => !et.code || !et.code.startsWith('SECTION_PLACEHOLDER_'))
      ];
      
      console.log('Tests cargados en admin:', allTestsCombined);
      setTests(allTestsCombined);
    } catch (err: any) {
      console.error('Error cargando tests:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
      console.error('Detalles del error:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: errorMsg
      });
      alert(`Error al cargar los tests: ${errorMsg}\n\nVerifica que:\n- El backend esté corriendo en http://localhost:8080\n- Estés autenticado como ADMIN\n- No haya errores en la consola del navegador`);
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
        active: formData.get('active') === 'true',
        category: (formData.get('category') as string) || null,
        topic: (formData.get('topic') as string) || null
      };
      
      // Determinar si es un evaluation test (tiene category y topic definidos y no es placeholder)
      const isEvaluationTest = editingTest.category !== null && editingTest.category !== undefined 
        && editingTest.topic !== null && editingTest.topic !== undefined
        && editingTest.code && !editingTest.code.startsWith('SECTION_PLACEHOLDER_');
      
      if (isEvaluationTest) {
        // Intentar actualizar como evaluation test primero
        try {
          await adminService.updateEvaluationTest(editingTest.id, updateData);
        } catch (e) {
          // Si falla, intentar como test normal
          await adminService.updateTest(editingTest.id, updateData);
        }
      } else {
        // Actualizar como test normal
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
      // Buscar el test para determinar su tipo
      const test = tests.find(t => t.id === id);
      const isEvaluationTest = test && test.category !== null && test.category !== undefined 
        && test.topic !== null && test.topic !== undefined
        && test.code && !test.code.startsWith('SECTION_PLACEHOLDER_');
      
      if (isEvaluationTest) {
        try {
          await adminService.deleteEvaluationTest(id);
        } catch (e) {
          await adminService.deleteTest(id);
        }
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
    try {
      setLoading(true);
      // Determinar si es un evaluation test
      const isEvaluationTest = test.category !== null && test.category !== undefined 
        && test.topic !== null && test.topic !== undefined
        && test.code && !test.code.startsWith('SECTION_PLACEHOLDER_');
      
      if (isEvaluationTest) {
        try {
          await adminService.updateEvaluationTest(test.id, { active: !test.active });
        } catch (e) {
          await adminService.updateTest(test.id, { active: !test.active });
        }
      } else {
        await adminService.updateTest(test.id, { active: !test.active });
      }
      await loadTests();
    } catch (err: any) {
      alert('Error al actualizar test: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
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
          <h1>
            {activeTab === 'users' ? 'Gestión de Usuarios' : 
             activeTab === 'statistics' ? 'Estadísticas del Sistema' : 
             'Gestión de Tests'}
          </h1>
          <p>
            {activeTab === 'users' ? 'Gestiona usuarios y sus asignaciones' : 
             activeTab === 'statistics' ? 'Visualiza estadísticas generales del sistema' :
             'Gestiona todos los tests, preguntas y respuestas'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('tests')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'tests' ? '#5a9270' : 'transparent',
            color: activeTab === 'tests' ? 'white' : '#1f2937',
            border: 'none',
            borderBottom: activeTab === 'tests' ? '3px solid #5a9270' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '15px',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          Tests
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'users' ? '#5a9270' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#1f2937',
            border: 'none',
            borderBottom: activeTab === 'users' ? '3px solid #5a9270' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '15px',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'statistics' ? '#5a9270' : 'transparent',
            color: activeTab === 'statistics' ? 'white' : '#1f2937',
            border: 'none',
            borderBottom: activeTab === 'statistics' ? '3px solid #5a9270' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '15px',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          Estadísticas
        </button>
      </div>

      {activeTab === 'users' && (
        <UsersManager />
      )}

      {activeTab === 'statistics' && <AdminStatistics />}

      {activeTab === 'tests' && (
        <>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Gestión de Tests</h2>
          <button 
            className="btn" 
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={loading}
            style={{ width: 'auto', padding: '12px 24px' }}
          >
            {showCreateForm ? '✕ Cancelar' : '+ Nuevo Test'}
          </button>
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

      {editingTest && (
        <div className="card admin-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Editar Test</h2>
            <button className="btn-secondary" onClick={() => setEditingTest(null)} style={{ width: 'auto', padding: '8px 16px' }}>
              ✕ Cerrar
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
              
            <div className="form-group">
              <label>
                <input 
                  type="checkbox" 
                  name="active" 
                  defaultChecked={editingTest.active}
                  style={{ marginRight: '8px' }}
                />
                Test activo (disponible para psicólogos y usuarios)
              </label>
              <small style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Si está activo, estará disponible para psicólogos asignar a pacientes y aparecerá en las secciones correspondientes si tiene categoría asignada.
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
            <button className="btn-secondary" onClick={loadTests} disabled={loading} style={{ width: 'auto', padding: '8px 16px' }}>
              🔄 Actualizar
            </button>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    {test.category && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: test.category === 'EVALUATION' ? '#fef3c7' : '#e0e7ff',
                          color: test.category === 'EVALUATION' ? '#d97706' : '#6366f1'
                        }}>
                          {test.category === 'EVALUATION' ? '📊 Evaluación' : '🔍 Descubrimiento'}
                        </span>
                        {test.topic && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#f3f4f6',
                            color: '#6b7280'
                          }}>
                            {test.topic}
                          </span>
                        )}
                      </div>
                    )}
                    <h3>{test.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <strong>Código:</strong> {test.code}
                    </p>
                  </div>
                  <span 
                    className={`status-badge ${test.active ? 'status-active' : 'status-inactive'}`}
                    onClick={() => toggleTestActive(test)}
                    style={{ cursor: 'pointer' }}
                    title={test.active ? 'Click para desactivar' : 'Click para activar'}
                  >
                    {test.active ? '✓ Activo' : '✕ Inactivo'}
                  </span>
                </div>
                {test.description && (
                  <p style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    {test.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn" 
                    onClick={() => setSelectedTestId(test.id)}
                    style={{ flex: 1, minWidth: '120px', padding: '10px 16px', fontSize: '15px' }}
                  >
                    📝 Gestionar
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setEditingTest(test)}
                    style={{ padding: '10px 16px', fontSize: '15px' }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => deleteTest(test.id)}
                    disabled={loading}
                    style={{ padding: '10px 16px', fontSize: '15px' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}