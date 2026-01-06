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
  const [_editingTopic, _setEditingTopic] = useState<string | null>(null);
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
      t === currentTopic ? `✓ ${t}` : t
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
      <div className="container" style={{ maxWidth: '1200px', padding: '40px' }}>
        <LoadingSpinner text="Cargando secciones..." />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', padding: '40px' }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
        padding: '40px',
        border: '1px solid rgba(90, 146, 112, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#1a2e22', 
            fontFamily: "'Inter', sans-serif"
          }}>
            Gestión de Secciones
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setSelectedCategory('EVALUATION')}
              style={{
                padding: '10px 24px',
                background: selectedCategory === 'EVALUATION'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                  : '#f8f9fa',
                color: selectedCategory === 'EVALUATION' ? '#fff' : '#3a5a4a',
                border: selectedCategory === 'EVALUATION'
                  ? '2px solid #f59e0b'
                  : '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              📊 Evaluaciones
            </button>
            <button
              onClick={() => setSelectedCategory('DISCOVERY')}
              style={{
                padding: '10px 24px',
                background: selectedCategory === 'DISCOVERY'
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : '#f8f9fa',
                color: selectedCategory === 'DISCOVERY' ? '#fff' : '#3a5a4a',
                border: selectedCategory === 'DISCOVERY'
                  ? '2px solid #6366f1'
                  : '2px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.3s ease'
            }}
            >
              🔍 Descubrimiento
            </button>
          </div>
        </div>

        {/* Botón para crear nueva sección */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#3a5a4a', 
            fontFamily: "'Inter', sans-serif"
          }}>
            Secciones de {selectedCategory === 'EVALUATION' ? 'Evaluaciones' : 'Descubrimiento'}
          </h3>
          {!showNewTopicForm ? (
            <button
              onClick={() => setShowNewTopicForm(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              + Nueva Sección
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Nombre de la nueva sección"
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createNewTopic();
                  }
                }}
                autoFocus
              />
              <button
                onClick={createNewTopic}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #5a9270 0%, #5b8fa8 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Crear
              </button>
              <button
                onClick={() => {
                  setShowNewTopicForm(false);
                  setNewTopicName('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f8f9fa',
                  color: '#3a5a4a',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Secciones (Topics) */}
        {topics.length === 0 && unassignedTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No hay secciones creadas aún</p>
            <p style={{ fontSize: '14px' }}>Crea tu primera sección usando el botón "Nueva Sección"</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Otras secciones (Topics) */}
            {topics.map(topic => {
              const testsInTopic = getTestsByTopic(selectedCategory, topic);
              return (
                <div key={topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: 700, 
                      color: '#1a2e22',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {topic} ({testsInTopic.length})
                    </h3>
                    <button
                      onClick={() => deleteTopic(topic)}
                      style={{
                        padding: '6px 12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      🗑️ Eliminar sección
                    </button>
                  </div>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(topic)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '16px',
                      padding: '20px',
                      background: selectedCategory === 'EVALUATION'
                        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                        : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                      borderRadius: '16px',
                      border: `2px solid ${selectedCategory === 'EVALUATION' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                      minHeight: '100px'
                    }}
                  >
                    {testsInTopic.length === 0 ? (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px',
                        color: selectedCategory === 'EVALUATION' ? '#d97706' : '#6366f1',
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        Arrastra tests aquí o haz clic en un test sin asignar para agregarlo
                      </div>
                    ) : (
                      testsInTopic.map(test => (
                        <div
                          key={test.id}
                          draggable
                          onDragStart={() => handleDragStart(test)}
                          onClick={() => showTestSelector(test)}
                          style={{
                            padding: '20px',
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: `2px solid ${selectedCategory === 'EVALUATION' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                            cursor: 'grab',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = `0 8px 24px ${selectedCategory === 'EVALUATION' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ 
                            fontSize: '12px', 
                            color: selectedCategory === 'EVALUATION' ? '#d97706' : '#6366f1', 
                            marginBottom: '8px', 
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}>
                            {test.topic}
                          </div>
                          <h4 style={{ 
                            fontSize: '18px', 
                            fontWeight: 700, 
                            color: '#1a2e22', 
                            marginBottom: '8px',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {test.title}
                          </h4>
                          {test.description && (
                            <p style={{ 
                              fontSize: '13px', 
                              color: '#3a5a4a', 
                              marginBottom: '12px',
                              lineHeight: '1.5'
                            }}>
                              {test.description}
                            </p>
                          )}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '12px'
                          }}>
                            <span style={{
                              padding: '4px 10px',
                              background: test.active ? '#d1fae5' : '#fee2e2',
                              color: test.active ? '#065f46' : '#991b1b',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              {test.active ? '✓ Activo' : '✕ Inactivo'}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: '#6b7280'
                            }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 700, 
                  color: '#1a2e22',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  Sin asignar ({unassignedTests.length})
                </h3>
              </div>
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('')}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                  padding: '20px',
                  background: selectedCategory === 'EVALUATION'
                    ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                    : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                  borderRadius: '16px',
                  border: `2px solid ${selectedCategory === 'EVALUATION' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                  minHeight: '100px'
                }}
              >
                {unassignedTests.length === 0 ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '40px',
                    color: selectedCategory === 'EVALUATION' ? '#d97706' : '#6366f1',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    Todos los tests están asignados a secciones. Arrastra tests aquí para moverlos a "Sin asignar".
                  </div>
                ) : (
                  unassignedTests.map(test => (
                    <div
                      key={test.id}
                      draggable
                      onDragStart={() => handleDragStart(test)}
                      onClick={() => showTestSelector(test)}
                      style={{
                        padding: '20px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: `2px solid ${selectedCategory === 'EVALUATION' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                        cursor: 'grab',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 8px 24px ${selectedCategory === 'EVALUATION' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ 
                        fontSize: '12px', 
                        color: selectedCategory === 'EVALUATION' ? '#d97706' : '#6366f1', 
                        marginBottom: '8px', 
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        Sin asignar
                      </div>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: 700, 
                        color: '#1a2e22', 
                        marginBottom: '8px',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        {test.title}
                      </h4>
                      {test.description && (
                        <p style={{ 
                          fontSize: '13px', 
                          color: '#3a5a4a', 
                          marginBottom: '12px',
                          lineHeight: '1.5'
                        }}>
                          {test.description}
                        </p>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '12px'
                      }}>
                        <span style={{
                          padding: '4px 10px',
                          background: test.active ? '#d1fae5' : '#fee2e2',
                          color: test.active ? '#065f46' : '#991b1b',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          {test.active ? '✓ Activo' : '✕ Inactivo'}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: '#6b7280'
                        }}>
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

