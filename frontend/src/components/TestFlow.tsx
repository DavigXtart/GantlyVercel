import { useState, useEffect } from 'react';
import { testService } from '../services/api';

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

interface TestDetails {
  id: number;
  code: string;
  title: string;
  description: string;
  questions: Array<Question & { answers: Answer[] }>;
}

interface TestFlowProps {
  testId: number;
  onBack: () => void;
  onComplete: () => void;
}

export default function TestFlow({ testId, onBack, onComplete }: TestFlowProps) {
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerId?: number; numericValue?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const data = await testService.get(testId);
      // El backend ya devuelve las preguntas con respuestas ordenadas
      if (data.questions) {
        data.questions.sort((a: Question, b: Question) => a.position - b.position);
        // Asegurar que las respuestas estén ordenadas
        data.questions.forEach((q: any) => {
          if (q.answers) {
            q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
          } else {
            q.answers = [];
          }
        });
      }
      setTest(data);
    } catch (err: any) {
      console.error('Error cargando test:', err);
      alert('Error al cargar el test: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answerId?: number, numericValue?: number, autoAdvance: boolean = true) => {
    const newAnswers = {
      ...answers,
      [questionId]: { answerId, numericValue }
    };
    
    setAnswers(newAnswers);
    
    // Avanzar automáticamente solo si autoAdvance es true (para respuestas tipo SINGLE/MULTI)
    if (autoAdvance) {
      setTimeout(() => {
        if (!test) return;
        
        const currentIndex = test.questions.findIndex(q => q.id === questionId);
        if (currentIndex !== -1 && currentIndex < test.questions.length - 1) {
          // No es la última pregunta, avanzar
          setCurrentQuestionIndex(currentIndex + 1);
        } else if (currentIndex === test.questions.length - 1) {
          // Es la última pregunta, verificar si todas están respondidas
          const allAnswered = test.questions.every(q => newAnswers[q.id]);
          if (allAnswered) {
            // Todas respondidas, mostrar confirmación para enviar
            if (confirm('¿Has completado todas las preguntas. ¿Deseas enviar el test?')) {
              handleSubmitWithAnswers(newAnswers);
            }
          }
        }
      }, 300); // Pequeño delay para mejor UX
    }
  };

  const handleNext = () => {
    if (!test) return;
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitWithAnswers = async (answersToSubmit: Record<number, { answerId?: number; numericValue?: number }>) => {
    if (!test) return;
    
    try {
      setSubmitting(true);
      const submitData = test.questions.map(q => ({
        questionId: q.id,
        answerId: answersToSubmit[q.id]?.answerId,
        numericValue: answersToSubmit[q.id]?.numericValue
      }));
      
      await testService.submitAnswers(testId, submitData);
      alert('¡Test completado exitosamente!');
      onComplete();
    } catch (err: any) {
      console.error('Error enviando respuestas:', err);
      alert('Error al enviar las respuestas: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;
    
    // Verificar que todas las preguntas tengan respuesta
    const unanswered = test.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Por favor, responde todas las preguntas. Te faltan ${unanswered.length} pregunta(s).`);
      return;
    }

    if (!confirm('¿Estás seguro de que deseas enviar tus respuestas? No podrás modificarlas después.')) {
      return;
    }

    await handleSubmitWithAnswers(answers);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Cargando test...</div>
      </div>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <h2>Test no disponible</h2>
          <p>Este test no tiene preguntas aún.</p>
          <button className="btn-secondary" onClick={onBack} style={{ marginTop: '16px' }}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const allAnswered = test.questions.every(q => answers[q.id]);

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <h1>{test.title || test.code || `Test #${test.id}`}</h1>
          {test.description && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{test.description}</p>
          )}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  backgroundColor: 'var(--accent)',
                  width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%`,
                  transition: 'width 0.3s'
                }}
              />
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {currentQuestionIndex + 1} / {test.questions.length}
            </span>
          </div>
        </div>

        <div className="question">
          <h3 style={{ marginBottom: '24px', fontSize: '24px' }}>
            {currentQuestion.text}
          </h3>

          {currentQuestion.type === 'SINGLE' && currentQuestion.answers && currentQuestion.answers.length > 0 && (
            <div className="answers">
              {currentQuestion.answers.map(answer => (
                <div
                  key={answer.id}
                  className={`answer-option ${currentAnswer?.answerId === answer.id ? 'selected' : ''}`}
                  onClick={() => handleAnswer(currentQuestion.id, answer.id)}
                >
                  {answer.text}
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'MULTI' && currentQuestion.answers && currentQuestion.answers.length > 0 && (
            <div className="answers">
              {currentQuestion.answers.map(answer => {
                const isSelected = currentAnswer?.answerId === answer.id;
                return (
                  <div
                    key={answer.id}
                    className={`answer-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAnswer(currentQuestion.id, isSelected ? undefined : answer.id)}
                  >
                    <span style={{ marginRight: '8px' }}>{isSelected ? '✓' : '○'}</span>
                    {answer.text}
                  </div>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'SCALE' && (
            <div className="answers">
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={currentAnswer?.numericValue || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, undefined, parseFloat(e.target.value) || undefined, false)}
                  placeholder="Ingresa un valor (0-10)"
                  style={{
                    width: '200px',
                    padding: '14px',
                    fontSize: '18px',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: '12px'
                  }}
                />
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Escala de 0 a 10
                </p>
              </div>
            </div>
          )}

          {currentQuestion.type !== 'SINGLE' && currentQuestion.type !== 'MULTI' && currentQuestion.type !== 'SCALE' && (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Tipo de pregunta no soportado: {currentQuestion.type}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'space-between' }}>
          <button
            className="btn-secondary"
            onClick={onBack}
          >
            Cancelar
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            {currentQuestionIndex > 0 && (
              <button
                className="btn-secondary"
                onClick={handlePrevious}
              >
                ← Anterior
              </button>
            )}
            {!isLastQuestion && currentQuestion.type === 'SCALE' && currentAnswer && (
              <button
                className="btn"
                onClick={handleNext}
              >
                Siguiente →
              </button>
            )}
            {isLastQuestion && allAnswered && (
              <button
                className="btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Finalizar Test'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

