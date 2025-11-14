import { useState, useEffect } from 'react';
import { adminService, testService } from '../services/api';

interface TestManagerProps {
  testId: number;
  onBack: () => void;
}

interface Question {
  id: number;
  text: string;
  type: string;
  position: number;
}

interface Answer {
  id: number;
  text: string;
  value?: number | null;
  position: number;
}

interface UserAnswer {
  userId: number;
  userName: string;
  userEmail: string;
  answers: Array<{
    questionId: number;
    questionText: string;
    answerId?: number;
    answerText?: string;
    answerValue?: number;
    numericValue?: number;
    createdAt: string;
  }>;
}

export default function TestManager({ testId, onBack }: TestManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<number, Answer[]>>({});
  const [subfactorByQuestion, setSubfactorByQuestion] = useState<Record<number, { code?: string; name?: string; factor?: { code?: string; name?: string } }>>({});
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<{ answer: Answer; questionId: number } | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [showUserAnswers, setShowUserAnswers] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  // Respuestas Likert predefinidas
  const LIKERT_ANSWERS = [
    { text: 'Siempre', value: 5 },
    { text: 'Casi siempre', value: 4 },
    { text: 'A veces', value: 3 },
    { text: 'Alguna vez', value: 2 },
    { text: 'Nunca', value: 1 }
  ];
  const [structure, setStructure] = useState<{ factors: Array<{ id: number; code: string; name: string; subfactors: Array<{ id: number; code: string; name: string }> }> } | null>(null);
  const [selectedSubfactorId, setSelectedSubfactorId] = useState<number | ''>('');
  const [editingSubfactorId, setEditingSubfactorId] = useState<number | ''>('');
  const [showStructureSection, setShowStructureSection] = useState(false);
  const [showFactorForm, setShowFactorForm] = useState(false);
  const [showSubfactorForm, setShowSubfactorForm] = useState(false);
  const [selectedFactorForSubfactor, setSelectedFactorForSubfactor] = useState<number | ''>('');

  useEffect(() => {
    loadQuestions();
    loadQuestionSubfactors();
    loadStructure();
  }, [testId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await adminService.getQuestions(testId);
      console.log('Preguntas cargadas:', questionsData);
      setQuestions(questionsData || []);
      
      // Cargar respuestas para cada pregunta
      const answersMap: Record<number, Answer[]> = {};
      for (const question of questionsData || []) {
        try {
          const answers = await adminService.getAnswers(question.id);
          console.log(`Respuestas para pregunta ${question.id}:`, answers);
          answersMap[question.id] = answers;
        } catch (err) {
          console.error(`Error cargando respuestas para pregunta ${question.id}:`, err);
          answersMap[question.id] = [];
        }
      }
      setAnswersByQuestion(answersMap);
    } catch (err: any) {
      console.error('Error cargando preguntas:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
      alert(`Error al cargar las preguntas: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStructure = async () => {
    try {
      const data = await adminService.getTestStructure(testId);
      console.log('Estructura cargada:', data);
      if (data && data.factors && data.factors.length > 0) {
        setStructure(data);
      } else {
        console.warn('El test no tiene factores/subfactores configurados aún');
        setStructure({ factors: [] });
      }
    } catch (e: any) {
      console.error('Error cargando estructura del test:', e);
      console.error('Detalles:', e.response?.data || e.message);
      setStructure({ factors: [] });
    }
  };

  const createFactor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      const existingFactors = structure?.factors || [];
      const position = existingFactors.length + 1;
      
      await adminService.createFactor(
        testId,
        formData.get('code') as string,
        formData.get('name') as string,
        formData.get('description') as string || undefined,
        position
      );
      await loadStructure();
      setShowFactorForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al crear factor: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const createSubfactor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      // Contar todos los subfactores existentes para calcular la posición
      let totalSubfactors = 0;
      structure?.factors?.forEach(f => {
        if (f.subfactors && f.subfactors.length > 0) {
          totalSubfactors += f.subfactors.length;
        }
      });
      const position = totalSubfactors + 1;
      
      const factorId = formData.get('factorId') ? Number(formData.get('factorId')) : undefined;
      
      await adminService.createSubfactor(
        testId,
        formData.get('code') as string,
        formData.get('name') as string,
        formData.get('description') as string || undefined,
        factorId,
        position
      );
      await loadStructure();
      setShowSubfactorForm(false);
      setSelectedFactorForSubfactor('');
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al crear subfactor: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionSubfactors = async () => {
    try {
      const data = await testService.get(testId);
      const map: Record<number, { code?: string; name?: string; factor?: { code?: string; name?: string } }> = {};
      for (const q of (data?.questions || [])) {
        if (q.subfactor) {
          map[q.id] = {
            code: q.subfactor.code,
            name: q.subfactor.name,
            factor: q.subfactor.factor ? { code: q.subfactor.factor.code, name: q.subfactor.factor.name } : undefined,
          };
        }
      }
      setSubfactorByQuestion(map);
    } catch (e) {
      // opcional: ignorar si endpoint público no disponible
      console.warn('No se pudieron cargar subfactores del test', e);
    }
  };

  const createQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      const position = questions.length > 0 
        ? Math.max(...questions.map(q => q.position)) + 1 
        : 1;
      
      // Siempre usar tipo SINGLE y crear automáticamente las respuestas Likert
      const answersToCreate = LIKERT_ANSWERS.map((ans, idx) => ({
        text: ans.text,
        value: ans.value,
        position: idx + 1
      }));
      
      await adminService.createQuestion(
        testId,
        formData.get('text') as string,
        'SINGLE', // Siempre tipo SINGLE
        position,
        answersToCreate,
        selectedSubfactorId === '' ? undefined : Number(selectedSubfactorId)
      );
      await loadQuestions();
      setShowQuestionForm(false);
      setSelectedSubfactorId('');
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al crear pregunta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const updateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuestion) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      await adminService.updateQuestion(editingQuestion.id, {
        text: formData.get('text') as string,
        type: 'SINGLE', // Siempre SINGLE
        position: parseInt(formData.get('position') as string)
      });
      await loadQuestions();
      setEditingQuestion(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al actualizar pregunta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta? También se eliminarán todas sus respuestas.')) {
      return;
    }
    try {
      setLoading(true);
      await adminService.deleteQuestion(id);
      await loadQuestions();
    } catch (err: any) {
      alert('Error al eliminar pregunta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const createAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showAnswerForm) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      const questionAnswers = answersByQuestion[showAnswerForm] || [];
      const position = questionAnswers.length > 0 
        ? Math.max(...questionAnswers.map(a => a.position)) + 1 
        : 1;
      await adminService.createAnswer(
        showAnswerForm,
        formData.get('text') as string,
        parseInt(formData.get('value') as string),
        position
      );
      await loadQuestions();
      setShowAnswerForm(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al crear respuesta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAnswer) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      await adminService.updateAnswer(editingAnswer.answer.id, {
        text: formData.get('text') as string,
        value: parseInt(formData.get('value') as string),
        position: parseInt(formData.get('position') as string)
      });
      await loadQuestions();
      setEditingAnswer(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al actualizar respuesta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteAnswer = async (answerId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta respuesta?')) {
      return;
    }
    try {
      setLoading(true);
      await adminService.deleteAnswer(answerId);
      await loadQuestions();
    } catch (err: any) {
      alert('Error al eliminar respuesta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionExpanded = (questionId: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const loadTestUserAnswers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTestUserAnswers(testId);
      setUserAnswers(data);
      setShowUserAnswers(true);
    } catch (err) {
      console.error('Error cargando respuestas de usuarios:', err);
      alert('Error al cargar las respuestas de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  if (showUserAnswers) {
    return (
      <div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Respuestas de Usuarios - Test #{testId}</h2>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setShowUserAnswers(false);
                setUserAnswers([]);
              }}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              ← Volver a Preguntas
            </button>
          </div>

          {userAnswers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <p>Ningún usuario ha completado este test aún.</p>
            </div>
          ) : (
            <div>
              {userAnswers.map((userAnswer) => (
                <div key={userAnswer.userId} className="card" style={{ marginBottom: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3>{userAnswer.userName}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {userAnswer.userEmail}
                    </p>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>
                      Respuestas ({userAnswer.answers.length})
                    </h4>
                    <div className="answers-list">
                      {userAnswer.answers.map((answer, idx) => (
                        <div key={answer.questionId} className="answer-card-admin" style={{ marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span className="question-number" style={{ fontSize: '12px', width: '24px', height: '24px' }}>
                                {idx + 1}
                              </span>
                              <strong style={{ fontSize: '15px' }}>{answer.questionText}</strong>
                            </div>
                            <div style={{ paddingLeft: '32px' }}>
                              {answer.answerText ? (
                                <div>
                                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                    <strong>Respuesta:</strong> {answer.answerText}
                                    {answer.answerValue !== undefined && answer.answerValue !== null && (
                                      <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                        (Valor: {answer.answerValue})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              ) : answer.numericValue !== undefined && answer.numericValue !== null ? (
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                  <strong>Valor numérico:</strong> {answer.numericValue}
                                </p>
                              ) : (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Sin respuesta registrada
                                </p>
                              )}
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {formatDate(answer.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Gestión de Test #{testId}</h1>
          <p>Administra las preguntas y respuestas de este test</p>
        </div>
        <button className="btn-secondary" onClick={onBack} style={{ width: 'auto', padding: '12px 24px' }}>
          ← Volver a Tests
        </button>
      </div>

      {showQuestionForm && (
        <div className="card admin-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Nueva Pregunta</h2>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setShowQuestionForm(false);
                setSelectedSubfactorId('');
              }} 
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              ✕ Cancelar
            </button>
          </div>
          <form onSubmit={createQuestion}>
            <div className="form-group">
              <label>Texto de la pregunta *</label>
              <input name="text" required placeholder="Ej: ¿Cómo te sientes generalmente?" />
            </div>

          <div className="form-group">
            <label>Subfactor (opcional)</label>
            <select
              value={selectedSubfactorId}
              onChange={(e) => setSelectedSubfactorId(e.target.value ? Number(e.target.value) : '')}
              style={{ width: '100%', padding: '14px', fontSize: '17px', borderRadius: '12px', border: '1px solid var(--border)' }}
              disabled={!structure || !structure.factors || structure.factors.length === 0}
            >
              <option value="">— Sin subfactor —</option>
              {structure && structure.factors && structure.factors.length > 0 ? (
                structure.factors.map(f => (
                  <optgroup key={f.id} label={`${f.code} · ${f.name}`}>
                    {f.subfactors && f.subfactors.length > 0 ? (
                      f.subfactors.map(sf => (
                        <option key={sf.id} value={sf.id}>{sf.code} · {sf.name}</option>
                      ))
                    ) : null}
                  </optgroup>
                ))
              ) : (
                <option value="" disabled>No hay subfactores configurados en este test</option>
              )}
            </select>
            <small style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
              {structure && structure.factors && structure.factors.length > 0 ? (
                'Asigna el subfactor al que pertenece esta pregunta. El factor se infiere del subfactor.'
              ) : (
                'Este test no tiene factores/subfactores configurados aún. Las preguntas se pueden crear sin subfactor y asignarlo después.'
              )}
            </small>
          </div>

            {/* Información sobre respuestas Likert automáticas */}
            <div className="form-group">
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
                  Respuestas automáticas (Escala Likert)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {LIKERT_ANSWERS.map((ans, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '14px' }}>{ans.text}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Valor: {ans.value}</span>
                    </div>
                  ))}
                </div>
                <small style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '12px' }}>
                  Estas respuestas se crearán automáticamente cuando guardes la pregunta.
                </small>
              </div>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Pregunta'}
            </button>
          </form>
        </div>
      )}

      {editingQuestion && (
        <div className="card admin-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Editar Pregunta</h2>
            <button className="btn-secondary" onClick={() => setEditingQuestion(null)} style={{ width: 'auto', padding: '8px 16px' }}>
              ✕ Cerrar
            </button>
          </div>
          <form onSubmit={updateQuestion}>
            <div className="form-group">
              <label>Texto de la pregunta *</label>
              <input name="text" required defaultValue={editingQuestion.text} />
            </div>
            <div className="form-group">
              <label>Posición *</label>
              <input name="position" type="number" required defaultValue={editingQuestion.position} min="1" />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditingQuestion(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {showAnswerForm && (
        <div className="card admin-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Nueva Respuesta</h2>
            <button className="btn-secondary" onClick={() => setShowAnswerForm(null)} style={{ width: 'auto', padding: '8px 16px' }}>
              ✕ Cancelar
            </button>
          </div>
          <form onSubmit={createAnswer}>
            <div className="form-group">
              <label>Texto de la respuesta *</label>
              <input name="text" required placeholder="Ej: Muy bien" />
            </div>
            <div className="form-group">
              <label>Valor (puntuación) *</label>
              <input name="value" type="number" required placeholder="0" />
              <small style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Valor numérico que se asignará cuando se seleccione esta respuesta
              </small>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Respuesta'}
            </button>
          </form>
        </div>
      )}

      {editingAnswer && (
        <div className="card admin-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Editar Respuesta</h2>
            <button className="btn-secondary" onClick={() => setEditingAnswer(null)} style={{ width: 'auto', padding: '8px 16px' }}>
              ✕ Cerrar
            </button>
          </div>
          <form onSubmit={updateAnswer}>
            <div className="form-group">
              <label>Texto de la respuesta *</label>
              <input name="text" required defaultValue={editingAnswer.answer.text} />
            </div>
            <div className="form-group">
              <label>Valor (puntuación) *</label>
              <input name="value" type="number" required defaultValue={editingAnswer.answer.value ?? 0} />
            </div>
            <div className="form-group">
              <label>Posición *</label>
              <input name="position" type="number" required defaultValue={editingAnswer.answer.position} min="1" />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditingAnswer(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sección de Factores y Subfactores */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Factores y Subfactores</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setShowStructureSection(!showStructureSection)}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              {showStructureSection ? '▼ Ocultar' : '▶ Mostrar'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setShowFactorForm(true)}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              + Factor
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setShowSubfactorForm(true)}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              + Subfactor
            </button>
          </div>
        </div>

        {showStructureSection && (
          <div>
            {structure && structure.factors && structure.factors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {structure.factors.map((factor) => (
                  <div key={factor.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{factor.code}</span> - {factor.name}
                        </h3>
                      </div>
                    </div>
                    {factor.subfactors && factor.subfactors.length > 0 ? (
                      <div style={{ marginTop: '12px', paddingLeft: '16px' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Subfactores:</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {factor.subfactors.map((subfactor) => (
                            <span 
                              key={subfactor.id}
                              style={{ 
                                padding: '6px 12px', 
                                backgroundColor: 'var(--bg-secondary)', 
                                borderRadius: '6px',
                                fontSize: '13px',
                                border: '1px solid var(--border)'
                              }}
                            >
                              <strong>{subfactor.code}</strong> - {subfactor.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '16px' }}>
                        Sin subfactores
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>No hay factores configurados aún. Crea factores y subfactores para organizar las preguntas del test.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulario para crear Factor */}
      {showFactorForm && (
        <div className="card admin-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Nuevo Factor</h2>
            <button 
              className="btn-secondary" 
              onClick={() => setShowFactorForm(false)}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              ✕ Cancelar
            </button>
          </div>
          <form onSubmit={createFactor}>
            <div className="form-group">
              <label>Código del Factor *</label>
              <input name="code" required placeholder="Ej: EXTRAVERSION, ANXIETY" style={{ textTransform: 'uppercase' }} />
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Código único para identificar el factor (ej: EXTRAVERSION, ANXIETY)
              </small>
            </div>
            <div className="form-group">
              <label>Nombre del Factor *</label>
              <input name="name" required placeholder="Ej: Extraversión" />
            </div>
            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea name="description" rows={3} placeholder="Ej: Tendencia a buscar estimulación y disfrutar del contacto social" />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Factor'}
            </button>
          </form>
        </div>
      )}

      {/* Formulario para crear Subfactor */}
      {showSubfactorForm && (
        <div className="card admin-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>Nuevo Subfactor</h2>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setShowSubfactorForm(false);
                setSelectedFactorForSubfactor('');
              }}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              ✕ Cancelar
            </button>
          </div>
          <form onSubmit={createSubfactor}>
            <div className="form-group">
              <label>Código del Subfactor *</label>
              <input name="code" required placeholder="Ej: A, C, Q4" maxLength={10} />
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Código único para identificar el subfactor (ej: A, C, Q4)
              </small>
            </div>
            <div className="form-group">
              <label>Nombre del Subfactor *</label>
              <input name="name" required placeholder="Ej: Afabilidad, Tensión" />
            </div>
            <div className="form-group">
              <label>Factor (opcional)</label>
              <select
                name="factorId"
                value={selectedFactorForSubfactor}
                onChange={(e) => setSelectedFactorForSubfactor(e.target.value ? Number(e.target.value) : '')}
                style={{ width: '100%', padding: '14px', fontSize: '17px', borderRadius: '12px', border: '1px solid var(--border)' }}
              >
                <option value="">— Sin factor —</option>
                {structure?.factors?.map(f => (
                  <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                ))}
              </select>
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                El factor al que pertenece este subfactor. Puedes asignarlo después si no hay factores creados aún.
              </small>
            </div>
            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea name="description" rows={3} placeholder="Ej: Facilidad para relacionarse con otros" />
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Subfactor'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Preguntas ({questions.length})</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={loadQuestions} disabled={loading} style={{ width: 'auto', padding: '8px 16px' }}>
              🔄 Actualizar
            </button>
            <button className="btn-secondary" onClick={loadTestUserAnswers} disabled={loading} style={{ width: 'auto', padding: '8px 16px' }}>
              👥 Ver Respuestas de Usuarios
            </button>
            <button className="btn" onClick={() => setShowQuestionForm(true)} style={{ width: 'auto', padding: '12px 24px' }}>
              + Nueva Pregunta
            </button>
          </div>
        </div>

        {loading && questions.length === 0 ? (
          <div className="loading">Cargando preguntas...</div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No hay preguntas aún.</p>
            <p>Crea tu primera pregunta usando el botón "Nueva Pregunta"</p>
          </div>
        ) : (
          <div className="questions-list">
            {sortedQuestions.map((question) => {
              const answers = answersByQuestion[question.id] || [];
              const sortedAnswers = [...answers].sort((a, b) => a.position - b.position);
              const isExpanded = expandedQuestions.has(question.id);

              return (
                <div key={question.id} className="question-card-admin">
                  <div 
                    className="question-header" 
                    onClick={() => toggleQuestionExpanded(question.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="question-number">{question.position}</span>
                        <h3 style={{ margin: 0, flex: 1 }}>{question.text}</h3>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                        <span className={`type-badge type-${question.type.toLowerCase()}`}>
                          {question.type === 'SINGLE' ? 'Radio' : question.type === 'MULTI' ? 'Checkbox' : 'Escala'}
                        </span>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {answers.length} respuesta{answers.length !== 1 ? 's' : ''}
                        </span>
                        {subfactorByQuestion[question.id]?.code && (
                          <span style={{ padding: '2px 8px', background: '#eef2ff', borderRadius: '999px' }}>
                            {subfactorByQuestion[question.id]?.code} · {subfactorByQuestion[question.id]?.name}
                          </span>
                        )}
                        {subfactorByQuestion[question.id]?.factor?.code && (
                          <span style={{ padding: '2px 8px', background: '#ecfeff', borderRadius: '999px' }}>
                            {subfactorByQuestion[question.id]?.factor?.code} · {subfactorByQuestion[question.id]?.factor?.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="question-content">
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => setEditingQuestion(question)}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          ✏️ Editar Pregunta
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => setShowAnswerForm(question.id)}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          + Añadir Respuesta
                        </button>
                        <button 
                          className="btn-danger" 
                          onClick={() => deleteQuestion(question.id)}
                          disabled={loading}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          🗑️ Eliminar Pregunta
                        </button>
                        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)' }}>Subfactor:</span>
                        <select
                          value={editingSubfactorId !== '' ? editingSubfactorId : (subfactorByQuestion[question.id]?.code ? (structure?.factors?.flatMap(f => f.subfactors).find(sf => sf.name === subfactorByQuestion[question.id]?.name)?.id || '') : '')}
                          onChange={async (e) => {
                            const v = e.target.value ? Number(e.target.value) : '';
                            setEditingSubfactorId(v);
                            try {
                              await adminService.setQuestionSubfactor(question.id, v === '' ? undefined : Number(v));
                              await loadQuestionSubfactors();
                            } catch (err) {
                              alert('Error al actualizar subfactor');
                            }
                          }}
                          style={{ padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                        >
                          <option value="">— Sin subfactor —</option>
                          {structure?.factors?.map(f => (
                            <optgroup key={f.id} label={`${f.code} · ${f.name}`}>
                              {f.subfactors.map(sf => (
                                <option key={sf.id} value={sf.id}>{sf.code} · {sf.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      {sortedAnswers.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                          No hay respuestas aún. Añade la primera respuesta.
                        </div>
                      ) : (
                        <div className="answers-list">
                          {sortedAnswers.map((answer) => (
                            <div key={answer.id} className="answer-card-admin">
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Posición {answer.position}</span>
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>•</span>
                                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Valor: {answer.value}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '15px' }}>{answer.text}</p>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="btn-secondary" 
                                  onClick={() => setEditingAnswer({ answer, questionId: question.id })}
                                  style={{ padding: '6px 12px', fontSize: '13px' }}
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="btn-danger" 
                                onClick={() => deleteAnswer(answer.id)}
                                  disabled={loading}
                                  style={{ padding: '6px 12px', fontSize: '13px' }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
