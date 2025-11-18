import { useState } from 'react';
import { adminService } from '../services/api';

interface AddQuestionsProps {
  testId: number;
  onBack: () => void;
}

export default function EnhancedAddQuestions({ testId, onBack }: AddQuestionsProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [answersForQuestion, setAnswersForQuestion] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const question = await adminService.createQuestion(
        testId,
        formData.get('text') as string,
        formData.get('type') as string,
        questions.length + 1
      );
      setQuestions([...questions, question]);
      setShowAddQuestion(false);
      e.currentTarget.reset();
    } catch (err: any) {
      alert('Error al crear pregunta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const addAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedQuestionId) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await adminService.createAnswer(
        selectedQuestionId,
        formData.get('text') as string,
        parseInt(formData.get('value') as string),
        answersForQuestion.length + 1
      );
      // Opción de respuesta añadida (sin pop-up)
      e.currentTarget.reset();
      loadAnswers();
    } catch (err: any) {
      alert('Error al crear opción: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async () => {
    if (!selectedQuestionId) return;
    try {
      const answers = await adminService.getAnswers(selectedQuestionId);
      setAnswersForQuestion(answers || []);
    } catch (err) {
      console.error('Error cargando respuestas:', err);
      setAnswersForQuestion([]);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Gestionar preguntas - Test #{testId}</h2>
          <button className="btn-secondary" onClick={onBack} style={{ width: 'auto' }}>
            ← Volver
          </button>
        </div>

        {/* Lista de preguntas */}
        {questions.length > 0 && !showAddQuestion && (
          <div style={{ marginTop: '32px' }}>
            <h3>Preguntas creadas ({questions.length})</h3>
            <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="test-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Pregunta {idx + 1}</h4>
                    <p style={{ marginBottom: '8px' }}>{q.text}</p>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 12px', background: 'var(--bg-primary)', borderRadius: '20px' }}>
                      {q.type}
                    </span>
                  </div>
                  <button 
                    className="btn" 
                    onClick={() => {
                      setSelectedQuestionId(q.id);
                      setShowAddQuestion(false);
                    }}
                    style={{ width: 'auto', marginLeft: '16px', padding: '10px 20px' }}
                  >
                    Añadir respuestas
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario para añadir pregunta */}
        {showAddQuestion && (
          <div className="card" style={{ marginTop: '24px', background: 'var(--bg-primary)' }}>
            <h3>Nueva pregunta</h3>
            <form onSubmit={addQuestion}>
              <div className="form-group">
                <label>Texto de la pregunta</label>
                <input name="text" required placeholder="Ej: ¿Cómo te sientes generalmente?" />
              </div>
              <div className="form-group">
                <label>Tipo de pregunta</label>
                <select name="type" required style={{ width: '100%', padding: '14px', fontSize: '17px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <option value="SINGLE">Una sola opción (radio)</option>
                  <option value="MULTI">Múltiples opciones (checkbox)</option>
                  <option value="SCALE">Escala numérica</option>
                </select>
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar pregunta'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddQuestion(false)} style={{ marginTop: '12px' }}>
                Cancelar
              </button>
            </form>
          </div>
        )}

        {/* Formulario para añadir respuestas */}
        {selectedQuestionId && !showAddQuestion && (
          <div className="card" style={{ marginTop: '24px', background: 'var(--bg-primary)' }}>
            <h3>Añadir opciones de respuesta</h3>
            <p style={{ marginBottom: '24px' }}>
              Selecciona la pregunta y añade sus posibles respuestas
            </p>
            
            <div className="form-group">
              <label>Pregunta</label>
              <select 
                value={selectedQuestionId} 
                onChange={(e) => setSelectedQuestionId(parseInt(e.target.value))}
                style={{ width: '100%', padding: '14px', fontSize: '17px', borderRadius: '12px', border: '1px solid var(--border)' }}
              >
                {questions.map(q => (
                  <option key={q.id} value={q.id}>{q.text}</option>
                ))}
              </select>
            </div>

            <form onSubmit={addAnswer}>
              <div className="form-group">
                <label>Texto de la opción</label>
                <input name="text" required placeholder="Ej: Muy bien" />
              </div>
              <div className="form-group">
                <label>Valor (puntuación)</label>
                <input name="value" type="number" required placeholder="0" />
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Añadir opción'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setSelectedQuestionId(null)} style={{ marginTop: '12px' }}>
                Cerrar
              </button>
            </form>
          </div>
        )}

        {/* Botones principales */}
        {!showAddQuestion && !selectedQuestionId && (
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <button className="btn" onClick={() => setShowAddQuestion(true)}>
              + Añadir pregunta
            </button>
            {questions.length > 0 && (
              <button className="btn-secondary" onClick={onBack}>
                Finalizar test
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

