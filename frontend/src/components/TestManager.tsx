import { useState, useEffect } from 'react';
import { adminService } from '../services/api';

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
  value: number;
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
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<{ answer: Answer; questionId: number } | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [showUserAnswers, setShowUserAnswers] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Array<{ text: string; value: number }>>([]);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('SINGLE');

  useEffect(() => {
    loadQuestions();
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

  const createQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      const position = questions.length > 0 
        ? Math.max(...questions.map(q => q.position)) + 1 
        : 1;
      
      const questionType = formData.get('type') as string;
      let answersToCreate: Array<{ text: string; value: number; position: number }> | undefined = undefined;
      
      // Si es SINGLE o MULTI y hay respuestas definidas, incluirlas
      if ((questionType === 'SINGLE' || questionType === 'MULTI') && questionAnswers.length > 0) {
        answersToCreate = questionAnswers.map((ans, idx) => ({
          text: ans.text,
          value: ans.value,
          position: idx + 1
        }));
      }
      
      await adminService.createQuestion(
        testId,
        formData.get('text') as string,
        questionType,
        position,
        answersToCreate
      );
      await loadQuestions();
      setShowQuestionForm(false);
      setQuestionAnswers([]);
      setSelectedQuestionType('SINGLE');
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert('Error al crear pregunta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const addQuestionAnswer = () => {
    setQuestionAnswers([...questionAnswers, { text: '', value: 0 }]);
  };
  
  const removeQuestionAnswer = (index: number) => {
    setQuestionAnswers(questionAnswers.filter((_, i) => i !== index));
  };
  
  const updateQuestionAnswer = (index: number, field: 'text' | 'value', value: string | number) => {
    const updated = [...questionAnswers];
    updated[index] = { ...updated[index], [field]: value };
    setQuestionAnswers(updated);
  };

  const updateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuestion) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      setLoading(true);
      await adminService.updateQuestion(editingQuestion.id, {
        text: formData.get('text') as string,
        type: formData.get('type') as string,
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

  const deleteAnswer = async (answerId: number, questionId: number) => {
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
                setQuestionAnswers([]);
                setSelectedQuestionType('SINGLE');
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
              <label>Tipo de pregunta *</label>
              <select 
                name="type" 
                required 
                value={selectedQuestionType}
                onChange={(e) => {
                  setSelectedQuestionType(e.target.value);
                  // Limpiar respuestas si cambia a SCALE
                  if (e.target.value === 'SCALE') {
                    setQuestionAnswers([]);
                  }
                }}
                style={{ width: '100%', padding: '14px', fontSize: '17px', borderRadius: '12px', border: '1px solid var(--border)' }}
              >
                <option value="SINGLE">Una sola opción (Radio)</option>
                <option value="MULTI">Múltiples opciones (Checkbox)</option>
                <option value="SCALE">Escala numérica</option>
              </select>
            </div>

            {/* Opciones de respuesta para SINGLE y MULTI */}
            {(selectedQuestionType === 'SINGLE' || selectedQuestionType === 'MULTI') && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label>Opciones de respuesta</label>
                  <button 
                    type="button"
                    className="btn-secondary" 
                    onClick={addQuestionAnswer}
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
                  >
                    + Añadir Opción
                  </button>
                </div>
                <small style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>
                  Añade las opciones que los usuarios podrán seleccionar. Puedes añadirlas ahora o después de crear la pregunta.
                </small>
                
                {questionAnswers.length === 0 ? (
                  <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>No hay opciones añadidas aún. Haz clic en "+ Añadir Opción" para empezar.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {questionAnswers.map((answer, index) => (
                      <div key={index} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div className="form-group" style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '13px' }}>Texto de la opción {index + 1} *</label>
                              <input
                                type="text"
                                value={answer.text}
                                onChange={(e) => updateQuestionAnswer(index, 'text', e.target.value)}
                                placeholder="Ej: Muy bien"
                                required={questionAnswers.length > 0}
                                style={{ width: '100%', padding: '10px', fontSize: '15px' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '13px' }}>Valor (puntuación)</label>
                              <input
                                type="number"
                                value={answer.value}
                                onChange={(e) => updateQuestionAnswer(index, 'value', parseInt(e.target.value) || 0)}
                                placeholder="0"
                                style={{ width: '100%', padding: '10px', fontSize: '15px' }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestionAnswer(index)}
                            className="btn-danger"
                            style={{ padding: '8px 12px', fontSize: '14px', minWidth: 'auto' }}
                            title="Eliminar opción"
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
              <label>Tipo de pregunta *</label>
              <select name="type" required defaultValue={editingQuestion.type} style={{ width: '100%', padding: '14px', fontSize: '17px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <option value="SINGLE">Una sola opción (Radio)</option>
                <option value="MULTI">Múltiples opciones (Checkbox)</option>
                <option value="SCALE">Escala numérica</option>
              </select>
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
              <input name="value" type="number" required defaultValue={editingAnswer.answer.value} />
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
                      </div>
                    </div>
                    <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="question-content">
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
                                  onClick={() => deleteAnswer(answer.id, question.id)}
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
