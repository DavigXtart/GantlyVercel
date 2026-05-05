import { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { toast } from './ui/Toast';
import LoadingSpinner from './ui/LoadingSpinner';

interface EvaluationTest {
  id: number;
  code: string;
  title: string;
  description?: string;
  category: 'EVALUATION' | 'DISCOVERY';
  topic: string;
  active: boolean;
}

export default function AdminSectionsManager() {
  const [loading, setLoading] = useState(true);
  const [allTests, setAllTests] = useState<EvaluationTest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'EVALUATION' | 'DISCOVERY'>('EVALUATION');
  const [newTopicName, setNewTopicName] = useState('');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [draggedTest, setDraggedTest] = useState<EvaluationTest | null>(null);

  useEffect(() => {
    loadAllTests();
  }, []);

  const loadAllTests = async () => {
    try {
      setLoading(true);
      // Cargar tanto evaluation tests como tests normales
      const [evaluationTestsData, testsData] = await Promise.all([
        adminService.listEvaluationTests().catch(() => []),
        adminService.listTests().catch(() => [])
      ]);

      // Combinar ambos tipos de tests y eliminar duplicados por ID
      const allTestsMap = new Map<number, any>();

      // Primero agregar evaluation tests
      (evaluationTestsData || []).forEach((test: any) => {
        if (test.id) {
          allTestsMap.set(test.id, test);
        }
      });

      // Luego agregar tests normales (sobrescribirán si tienen el mismo ID)
      (testsData || []).forEach((test: any) => {
        if (test.id) {
          allTestsMap.set(test.id, test);
        }
      });

      // Convertir el Map a array
      const allTestsCombined = Array.from(allTestsMap.values());

      setAllTests(allTestsCombined);
    } catch (error: any) {
      toast.error('Error al cargar tests: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getTestsByCategory = (category: 'EVALUATION' | 'DISCOVERY') => {
    // Incluir tests que tienen esta categoría Y tests activos sin categoría que deberían estar visibles
    return allTests.filter(t =>
      t.category === category ||
      (t.active && !t.category && !t.code?.startsWith('SECTION_PLACEHOLDER_'))
    );
  };

  const getTopicsByCategory = (category: 'EVALUATION' | 'DISCOVERY') => {
    const tests = getTestsByCategory(category);
    // Obtener todos los topics únicos, incluyendo los de los placeholders
    // Usar un Map para asegurar unicidad y normalizar (trim y case-insensitive)
    const topicsMap = new Map<string, string>();

    tests.forEach(t => {
      if (t.topic && t.topic.trim() !== '') {
        const normalizedTopic = t.topic.trim();
        // Usar el primer valor encontrado como clave canónica
        if (!topicsMap.has(normalizedTopic.toLowerCase())) {
          topicsMap.set(normalizedTopic.toLowerCase(), normalizedTopic);
        }
      }
    });

    return Array.from(topicsMap.values()).sort();
  };

  const getTestsByTopic = (category: 'EVALUATION' | 'DISCOVERY', topic: string) => {
    // Filtrar tests que no sean placeholders (los placeholders tienen código que empieza con SECTION_PLACEHOLDER_)
    return allTests.filter(t =>
      t.category === category &&
      t.topic === topic &&
      !t.code.startsWith('SECTION_PLACEHOLDER_')
    );
  };

  const getUnassignedTests = (_category: 'EVALUATION' | 'DISCOVERY') => {
    // Obtener TODOS los tests activos sin topic asignado, independientemente de su categoría
    // Estos tests pueden asignarse a cualquier sección de esta categoría
    return allTests.filter(t =>
      t.active &&
      (!t.topic || t.topic.trim() === '') &&
      (!t.code || !t.code.startsWith('SECTION_PLACEHOLDER_'))
    );
  };


  const createNewTopic = async () => {
    const topicName = newTopicName.trim();
    if (!topicName) {
      toast.error('Por favor ingresa un nombre para la sección');
      return;
    }

    // Verificar si ya existe un topic con ese nombre en esta categoría
    const existingTopics = getTopicsByCategory(selectedCategory);
    if (existingTopics.includes(topicName)) {
      toast.error('Ya existe una sección con ese nombre');
      return;
    }

    try {
      setLoading(true);
      // Crear un test placeholder para que la sección persista en la base de datos
      // Este test será invisible para los usuarios (active=false) y se identificará por su código
      const placeholderCode = `SECTION_PLACEHOLDER_${selectedCategory}_${topicName.toUpperCase().replace(/\s+/g, '_')}`;

      await adminService.createEvaluationTest({
        code: placeholderCode,
        title: `[Sección: ${topicName}]`,
        description: 'Sección creada - Puedes agregar tests aquí',
        category: selectedCategory,
        topic: topicName,
        active: false // Inactivo para que no aparezca en las vistas públicas
      });

      await loadAllTests();
      setShowNewTopicForm(false);
      setNewTopicName('');
      toast.success(`Sección "${topicName}" creada. Ahora puedes arrastrar tests aquí o hacer clic en tests sin asignar para agregarlos.`);
    } catch (error: any) {
      toast.error('Error al crear sección: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const updateTestTopic = async (testId: number, newTopic: string) => {
    try {
      setLoading(true);
      // Buscar el test para determinar su tipo
      const test = allTests.find(t => t.id === testId);
      if (!test) {
        toast.error('Test no encontrado');
        return;
      }

      // Si el test no tiene categoría y se está asignando a un topic, asignarle la categoría actual
      const updateData: any = { topic: newTopic };
      if (!test.category && newTopic && newTopic.trim() !== '') {
        updateData.category = selectedCategory;
      }

      // Determinar si es un evaluation test o un test normal
      // Intentar actualizar como evaluation test primero
      try {
        await adminService.updateEvaluationTest(testId, updateData);
      } catch (e) {
        // Si falla, intentar como test normal
        await adminService.updateTest(testId, updateData);
      }

      await loadAllTests();
      toast.success('Test actualizado exitosamente');
    } catch (error: any) {
      toast.error('Error al actualizar test: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (test: EvaluationTest) => {
    setDraggedTest(test);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetTopic: string) => {
    if (!draggedTest) return;

    // Si targetTopic es string vacío, significa "Sin asignar"
    const finalTopic = targetTopic === '' ? '' : targetTopic;
    const currentTopic = draggedTest.topic || '';

    if (currentTopic === finalTopic) {
      setDraggedTest(null);
      return;
    }

    await updateTestTopic(draggedTest.id, finalTopic);
    setDraggedTest(null);
  };

  const showTestSelector = async (test: EvaluationTest) => {
    const topics = getTopicsByCategory(selectedCategory);
    const currentTopic = test.topic || 'Sin asignar';

    // Crear un selector visual
    const options = ['Sin asignar', ...topics].map(t =>
      t === currentTopic ? `${t} (actual)` : t
    ).join('\n');

    const newTopic = prompt(
      `Selecciona la sección para "${test.title}":\n\n${options}\n\nEscribe el nombre de la sección:`,
      currentTopic === 'Sin asignar' ? '' : currentTopic
    );

    if (newTopic !== null) {
      const finalTopic = newTopic.trim() === '' || newTopic.trim() === 'Sin asignar' ? '' : newTopic.trim();
      if (finalTopic !== test.topic) {
        await updateTestTopic(test.id, finalTopic);
      }
    }
  };

  const deleteTopic = async (topic: string) => {
    const testsInTopic = getTestsByTopic(selectedCategory, topic);
    // Buscar el placeholder de esta sección
    const placeholderTest = allTests.find(t =>
      t.category === selectedCategory &&
      t.topic === topic &&
      t.code.startsWith('SECTION_PLACEHOLDER_')
    );

    if (testsInTopic.length > 0) {
      if (!confirm(`¿Estás seguro? Esta acción moverá ${testsInTopic.length} test(s) a "Sin asignar" y eliminará la sección.`)) {
        return;
      }
      // Mover todos los tests de este topic a sin asignar
      try {
        setLoading(true);
        for (const test of testsInTopic) {
          // Intentar actualizar como evaluation test primero, si falla como test normal
          try {
            await adminService.updateEvaluationTest(test.id, { topic: '' });
          } catch (e) {
            await adminService.updateTest(test.id, { topic: '' });
          }
        }
        // Eliminar el placeholder si existe
        if (placeholderTest) {
          try {
            await adminService.deleteEvaluationTest(placeholderTest.id);
          } catch (e) {
            await adminService.deleteTest(placeholderTest.id);
          }
        }
        await loadAllTests();
        toast.success(`Sección "${topic}" eliminada. Los tests fueron movidos a "Sin asignar".`);
      } catch (error: any) {
        toast.error('Error al eliminar sección: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    } else {
      // Si no hay tests, solo eliminar el placeholder
      if (confirm(`¿Estás seguro de eliminar la sección "${topic}"?`)) {
        try {
          setLoading(true);
          if (placeholderTest) {
            try {
              await adminService.deleteEvaluationTest(placeholderTest.id);
            } catch (e) {
              await adminService.deleteTest(placeholderTest.id);
            }
          }
          await loadAllTests();
          toast.success(`Sección "${topic}" eliminada.`);
        } catch (error: any) {
          toast.error('Error al eliminar sección: ' + (error.response?.data?.message || error.message));
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const topics = getTopicsByCategory(selectedCategory);
  const unassignedTests = getUnassignedTests(selectedCategory);

  if (loading && allTests.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto p-10">
        <LoadingSpinner text="Cargando secciones..." />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-10">
      <div className="bg-white rounded-xl shadow-card p-10 border border-slate-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[28px] font-bold text-slate-800 font-heading">
            Gestión de Secciones
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedCategory('EVALUATION')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                selectedCategory === 'EVALUATION'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-400'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Evaluaciones
            </button>
            <button
              onClick={() => setSelectedCategory('DISCOVERY')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                selectedCategory === 'DISCOVERY'
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white border-indigo-500'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Descubrimiento
            </button>
          </div>
        </div>

        {/* Botón para crear nueva sección */}
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-700 font-heading">
            Secciones de {selectedCategory === 'EVALUATION' ? 'Evaluaciones' : 'Descubrimiento'}
          </h3>
          {!showNewTopicForm ? (
            <button
              onClick={() => setShowNewTopicForm(true)}
              className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl cursor-pointer font-semibold text-sm transition-all hover:-translate-y-0.5"
            >
              + Nueva Sección
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Nombre de la nueva sección"
                className="px-4 py-2.5 rounded-lg border-2 border-slate-200 text-sm min-w-[200px] focus:border-gantly-blue-500 outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createNewTopic();
                  }
                }}
                autoFocus
              />
              <button
                onClick={createNewTopic}
                className="px-5 py-2.5 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm"
              >
                Crear
              </button>
              <button
                onClick={() => {
                  setShowNewTopicForm(false);
                  setNewTopicName('');
                }}
                className="px-5 py-2.5 bg-slate-50 text-slate-600 border-2 border-slate-200 rounded-lg cursor-pointer font-semibold text-sm hover:bg-slate-100"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Secciones (Topics) */}
        {topics.length === 0 && unassignedTests.length === 0 ? (
          <div className="text-center py-16 px-5 text-slate-500">
            <p className="text-base mb-2">No hay secciones creadas aún</p>
            <p className="text-sm">Crea tu primera sección usando el botón "Nueva Sección"</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Otras secciones (Topics) */}
            {topics.map(topic => {
              const testsInTopic = getTestsByTopic(selectedCategory, topic);
              return (
                <div key={topic}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 font-heading">
                      {topic} ({testsInTopic.length})
                    </h3>
                    <button
                      onClick={() => deleteTopic(topic)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 border-none rounded-lg cursor-pointer text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      Eliminar sección
                    </button>
                  </div>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(topic)}
                    className={`grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-5 rounded-2xl border-2 min-h-[100px] ${
                      selectedCategory === 'EVALUATION'
                        ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200/50'
                        : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200/50'
                    }`}
                  >
                    {testsInTopic.length === 0 ? (
                      <div className={`col-span-full text-center py-10 text-sm italic ${
                        selectedCategory === 'EVALUATION' ? 'text-amber-600' : 'text-indigo-500'
                      }`}>
                        Arrastra tests aquí o haz clic en un test sin asignar para agregarlo
                      </div>
                    ) : (
                      testsInTopic.map(test => (
                        <div
                          key={test.id}
                          draggable
                          onDragStart={() => handleDragStart(test)}
                          onClick={() => showTestSelector(test)}
                          className={`p-5 bg-white rounded-xl border-2 cursor-grab transition-all hover:-translate-y-1 hover:shadow-elevated ${
                            selectedCategory === 'EVALUATION'
                              ? 'border-amber-200/60 hover:border-amber-300'
                              : 'border-indigo-200/60 hover:border-indigo-300'
                          }`}
                        >
                          <div className={`text-xs mb-2 font-semibold uppercase ${
                            selectedCategory === 'EVALUATION' ? 'text-amber-600' : 'text-indigo-500'
                          }`}>
                            {test.topic}
                          </div>
                          <h4 className="text-lg font-bold text-slate-800 mb-2 font-heading">
                            {test.title}
                          </h4>
                          {test.description && (
                            <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
                              {test.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-3">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                              test.active
                                ? 'bg-gantly-emerald-100 text-gantly-emerald-800'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {test.active ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {test.code}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Sección "Sin asignar" - siempre al final */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 font-heading">
                  Sin asignar ({unassignedTests.length})
                </h3>
              </div>
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('')}
                className={`grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-5 rounded-2xl border-2 min-h-[100px] ${
                  selectedCategory === 'EVALUATION'
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200/50'
                    : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200/50'
                }`}
              >
                {unassignedTests.length === 0 ? (
                  <div className={`col-span-full text-center py-10 text-sm italic ${
                    selectedCategory === 'EVALUATION' ? 'text-amber-600' : 'text-indigo-500'
                  }`}>
                    Todos los tests están asignados a secciones. Arrastra tests aquí para moverlos a "Sin asignar".
                  </div>
                ) : (
                  unassignedTests.map(test => (
                    <div
                      key={test.id}
                      draggable
                      onDragStart={() => handleDragStart(test)}
                      onClick={() => showTestSelector(test)}
                      className={`p-5 bg-white rounded-xl border-2 cursor-grab transition-all hover:-translate-y-1 hover:shadow-elevated ${
                        selectedCategory === 'EVALUATION'
                          ? 'border-amber-200/60 hover:border-amber-300'
                          : 'border-indigo-200/60 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`text-xs mb-2 font-semibold uppercase ${
                        selectedCategory === 'EVALUATION' ? 'text-amber-600' : 'text-indigo-500'
                      }`}>
                        Sin asignar
                      </div>
                      <h4 className="text-lg font-bold text-slate-800 mb-2 font-heading">
                        {test.title}
                      </h4>
                      {test.description && (
                        <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
                          {test.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                          test.active
                            ? 'bg-gantly-emerald-100 text-gantly-emerald-800'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {test.active ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {test.code}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
