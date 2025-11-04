import { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import TestManager from './TestManager';
import UsersManager from './UsersManager';

interface Test {
  id: number;
  code: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
}

export default function AdminPanel() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'users'>('tests');

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await adminService.listTests();
      console.log('Tests cargados en admin:', data);
      setTests(data || []);
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
      await adminService.updateTest(editingTest.id, {
        code: formData.get('code') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string || '',
        active: formData.get('active') === 'true'
      });
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
      await adminService.deleteTest(id);
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
      await adminService.updateTest(test.id, { active: !test.active });
      await loadTests();
    } catch (err: any) {
      alert('Error al actualizar test: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Panel de Administración</h1>
          <p>Gestiona todos los tests, preguntas, respuestas y usuarios</p>
        </div>
        <button 
          className="btn" 
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
          style={{ width: 'auto', padding: '12px 24px' }}
        >
          {showCreateForm ? '✕ Cancelar' : '+ Nuevo Test'}
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('tests')}
        >
          📋 Tests
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios
        </button>
      </div>

      {activeTab === 'users' && (
        <UsersManager />
      )}

      {activeTab === 'tests' && (
        <>
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
              <label>
                <input 
                  type="checkbox" 
                  name="active" 
                  defaultChecked={editingTest.active}
                  style={{ marginRight: '8px' }}
                />
                Test activo (visible para usuarios)
              </label>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Tests ({tests.length})</h2>
          <button className="btn-secondary" onClick={loadTests} disabled={loading} style={{ width: 'auto', padding: '8px 16px' }}>
            🔄 Actualizar
          </button>
        </div>

        {loading && tests.length === 0 ? (
          <div className="loading">Cargando tests...</div>
        ) : tests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No hay tests creados aún.</p>
            <p>Crea tu primer test usando el botón "Nuevo Test"</p>
          </div>
        ) : (
          <div className="tests-grid-admin">
            {tests.filter((t: any) => t && t.id).map(test => (
              <div key={test.id} className="test-card-admin">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
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