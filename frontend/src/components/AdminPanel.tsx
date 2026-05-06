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
    <div className="max-w-7xl mx-auto px-6">
      <div className="admin-header">
        <div>
          <h1 className="font-heading">Gestión de Tests</h1>
          <p className="text-slate-500">Gestiona todos los tests, preguntas y respuestas</p>
        </div>
      </div>

      <>
      <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-heading font-bold text-slate-800">Gestión de Tests</h2>
          <div className="flex gap-3">
            <button
              className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer w-auto"
              onClick={() => { setShowImportForm(!showImportForm); setShowCreateForm(false); }}
              disabled={loading}
            >
              {showImportForm ? 'Cancelar' : 'Importar Excel'}
            </button>
            <button
              className="px-6 py-3 bg-gantly-blue text-white rounded-xl font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer w-auto"
              onClick={() => { setShowCreateForm(!showCreateForm); setShowImportForm(false); }}
              disabled={loading}
            >
              {showCreateForm ? 'Cancelar' : 'Nuevo Test'}
            </button>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-heading font-bold text-slate-800 mb-4">Crear Nuevo Test</h2>
          <form onSubmit={createTest}>
            <div className="flex flex-col gap-1.5">
              <label>Código del Test *</label>
              <input
                name="code"
                required
                placeholder="test-001, Test Personalizado, etc."
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
              />
              <small className="text-[13px] text-slate-500 block mt-1">
                Puede contener letras, números, espacios y caracteres especiales
              </small>
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Título *</label>
              <input
                name="title"
                required
                placeholder="Nombre del test psicológico"
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Descripción</label>
              <textarea
                name="description"
                placeholder="Descripción del test..."
                rows={3}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 resize-y focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-gantly-blue text-white rounded-xl font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Test'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showImportForm && (
        <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6 mb-6">
          <TestImporter
            onImported={() => { setShowImportForm(false); loadTests(); }}
            onCancel={() => setShowImportForm(false)}
          />
        </div>
      )}

      {editingTest && (
        <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold text-slate-800">Editar Test</h2>
            <button className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer w-auto" onClick={() => setEditingTest(null)}>
              Cerrar
            </button>
          </div>
          <form onSubmit={updateTest}>
            <div className="flex flex-col gap-1.5">
              <label>Código del Test *</label>
              <input
                name="code"
                required
                defaultValue={editingTest.code}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Título *</label>
              <input
                name="title"
                required
                defaultValue={editingTest.title}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Descripción</label>
              <textarea
                name="description"
                defaultValue={editingTest.description || ''}
                rows={3}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 resize-y focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label>Categoría (Opcional)</label>
              <select
                name="category"
                defaultValue={editingTest.category || ''}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
              >
                <option value="">Sin categoría</option>
                <option value="EVALUATION">Evaluación</option>
                <option value="DISCOVERY">Descubrimiento</option>
              </select>
              <small className="text-[13px] text-slate-500 block mt-1">
                Si seleccionas una categoría, el test aparecerá en la sección correspondiente
              </small>
            </div>

            <div className="flex flex-col gap-1.5">
              <label>Sección (Topic) (Opcional)</label>
              <input
                name="topic"
                defaultValue={editingTest.topic || ''}
                list="topics-list-edit"
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-200 focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
              />
              <datalist id="topics-list-edit">
                {availableTopics.map(topic => (
                  <option key={topic} value={topic} />
                ))}
              </datalist>
              <small className="text-[13px] text-slate-500 block mt-1">
                Puedes escribir un nombre nuevo para crear una nueva sección, o seleccionar una existente. Requiere que hayas seleccionado una categoría.
              </small>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-gantly-blue text-white rounded-xl font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setEditingTest(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-soft border border-slate-200 p-6">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-slate-800">Tests ({tests.length})</h2>
            {testSearch.trim() && (
              <p className="m-0 text-sm text-slate-500">
                Mostrando {filteredTests.length} coincidencia(s)
              </p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <input
              type="text"
              placeholder="Buscar por título, código o descripción..."
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-slate-200 text-[15px] min-w-[220px] focus:border-gantly-blue-500 focus:ring-1 focus:ring-gantly-blue-200 outline-none"
            />
          </div>
        </div>

        {loading && tests.length === 0 ? (
          <div className="loading">Cargando tests...</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>No hay tests creados aún.</p>
            <p>Crea tu primer test usando el botón "Nuevo Test"</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>No se encontraron tests que coincidan con "{testSearch}".</p>
          </div>
        ) : (
          <div className="tests-grid-admin">
            {filteredTests.filter((t: any) => t && t.id).map(test => (
              <div key={test.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 bg-gradient-to-b from-white to-gantly-cloud-100 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    {test.category && (
                      <div className="mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-gantly-blue-50 text-gantly-blue-600">
                          {test.category === 'EVALUATION' ? 'Evaluación' : 'Descubrimiento'}
                        </span>
                      </div>
                    )}
                    <h3 className="font-heading font-bold text-slate-800">{test.title}</h3>
                    <p className="text-[13px] text-slate-500 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                      <strong>Código:</strong> {test.code}
                    </p>
                  </div>
                  <span
                    className={`cursor-pointer flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${test.active ? 'bg-gantly-emerald-100 text-gantly-emerald-800' : 'bg-red-100 text-red-700'}`}
                    onClick={() => toggleTestActive(test)}
                    title={test.active ? 'Click para desactivar' : 'Click para activar'}
                  >
                    {test.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {test.description && (
                    <p className="text-sm text-slate-500 m-0 overflow-hidden line-clamp-2">
                      {test.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap mt-auto pt-3">
                  <button
                    className="flex-1 min-w-[80px] px-3 py-2 text-[13px] bg-gantly-blue text-white rounded-full font-medium hover:bg-gantly-blue-600 transition-colors cursor-pointer"
                    onClick={() => setSelectedTestId(test.id)}
                  >
                    Gestionar
                  </button>
                  <button
                    className="px-3 py-2 text-[13px] bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setEditingTest(test)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-2 text-[13px] bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                    onClick={() => deleteTest(test.id)}
                    disabled={loading}
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
