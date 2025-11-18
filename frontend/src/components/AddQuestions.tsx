import { useState } from 'react';
import { adminService } from '../services/api';

interface AddQuestionsProps {
  testId: number;
  onBack: () => void;
}

export default function AddQuestions({ testId, onBack }: AddQuestionsProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
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
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const questionId = parseInt(formData.get('questionId') as string);
    try {
      await adminService.createAnswer(
        questionId,
        formData.get('text') as string,
        parseInt(formData.get('value') as string),
        parseInt(formData.get('position') as string)
      );
      // Opción de respuesta añadida (sin pop-up)
      e.currentTarget.reset();
    } catch (err: any) {
      alert('Error al crear opción: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Test #{testId} - Añadir preguntas</h2>
          <button className="btn-secondary" onClick={onBack} style={{ width: 'auto' }}>
            Volver a tests
          </button>
        </div>

        {questions.length === 0 && !showAddQuestion && (
          <div>
            <p>No hay preguntas aún. Añade la primera pregunta.</p>
            <button className="btn" onClick={() => setShowAddQuestion(true)} style={{ marginTop: '16px' }}>
              + Añadir pregunta
            </button>
          </div>
        )}

        {showAddQuestion && (
          <div className="card" style={{ marginTop: '24px' }}>
            <h3>Nueva pregunta</h3>
            <form onSubmit={addQuestion}>
              <div className="form-group">
                <label>Texto de la pregunta</label>
                <input name="text" required placeholder="Ej: ¿Cómo te sientes hoy?" />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select name="type" required style={{ width: '100%', padding: '14px', fontSize: '17px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <option value="SINGLE">Una sola opción</option>
                  <option value="MULTI">Múltiples opciones</option>
                  <option value="SCALE">Escala</option>
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

        {questions.length > 0 && !showAddQuestion && (
          <>
            <div className="tests-grid" style={{ marginTop: '24px' }}>
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="test-card">
                  <h4>Pregunta {idx + 1}</h4>
                  <p>{q.text}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tipo: {q.type}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px' }}>
              <button className="btn" onClick={() => setShowAddQuestion(true)}>
                + Añadir otra pregunta
              </button>
            </div>

            {questions.length > 0 && (
              <div className="card" style={{ marginTop: '24px', backgroundColor: 'var(--bg-primary)' }}>
                <h3>Añadir opciones de respuesta</h3>
                <form onSubmit={addAnswer}>
                  <div className="form-group">
                    <label>Pregunta</label>
                    <select name="questionId" required style={{ width: '100%', padding: '14px', fontSize: '17px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      {questions.map(q => (
                        <option key={q.id} value={q.id}>{q.text}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Texto de la opción</label>
                    <input name="text" required placeholder="Ej: Muy bien" />
                  </div>
                  <div className="form-group">
                    <label>Valor</label>
                    <input name="value" type="number" required placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Posición</label>
                    <input name="position" type="number" required placeholder="1" />
                  </div>
                  <button type="submit" className="btn-secondary" disabled={loading}>
                    {loading ? 'Guardando...' : 'Añadir opción'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

