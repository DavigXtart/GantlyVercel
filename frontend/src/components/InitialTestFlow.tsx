import { useState, useEffect } from 'react';
import { initialTestService } from '../services/api';

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

interface InitialTestFlowProps {
  onComplete: (sessionId: string) => void;
  onBack: () => void;
}

export default function InitialTestFlow({ onComplete, onBack }: InitialTestFlowProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerId?: number; numericValue?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeTest();
  }, []);

  const initializeTest = async () => {
    try {
      setLoading(true);
      // Crear sesión temporal
      const newSessionId = await initialTestService.createSession();
      setSessionId(newSessionId);
      
      // Obtener el test inicial
      const testData = await initialTestService.getTest(newSessionId);
      if (testData.questions) {
        testData.questions.sort((a: Question, b: Question) => a.position - b.position);
        testData.questions.forEach((q: any) => {
          if (q.answers) {
            q.answers.sort((a: Answer, b: Answer) => a.position - b.position);
          } else {
            q.answers = [];
          }
        });
      }
      setTest(testData);
    } catch (err: any) {
      console.error('Error inicializando test:', err);
      alert('Error al cargar el test inicial: ' + (err.response?.data?.message || err.message));
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
    
    // Avanzar automáticamente solo si autoAdvance es true
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
    if (!test || !sessionId) return;
    
    try {
      setSubmitting(true);
      const submitData = test.questions.map(q => ({
        questionId: q.id,
        answerId: answersToSubmit[q.id]?.answerId,
        numericValue: answersToSubmit[q.id]?.numericValue
      }));
      
      await initialTestService.submitAnswers(sessionId, submitData);
      alert('¡Test inicial completado! Ahora puedes crear tu cuenta.');
      onComplete(sessionId);
    } catch (err: any) {
      console.error('Error enviando respuestas:', err);
      alert('Error al enviar las respuestas: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!test || !sessionId) return;
    
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
        <div className="loading">Cargando test inicial...</div>
      </div>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <h2>Test inicial no disponible</h2>
          <p>El test inicial no está configurado aún.</p>
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
          <h1>{test.title}</h1>
          {test.description && <p style={{ color: '#6b7280', marginTop: '8px' }}>{test.description}</p>}
        </div>

        {/* Barra de progreso */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
            <span>Pregunta {currentQuestionIndex + 1} de {test.questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / test.questions.length) * 100)}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%`,
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Pregunta actual */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px', lineHeight: '1.4' }}>
            {currentQuestion.text}
          </h2>

          {/* Respuestas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQuestion.answers.map((answer) => (
              <button
                key={answer.id}
                onClick={() => handleAnswer(currentQuestion.id, answer.id, answer.value || undefined)}
                style={{
                  padding: '16px',
                  border: '2px solid',
                  borderColor: currentAnswer?.answerId === answer.id ? '#667eea' : '#e5e7eb',
                  borderRadius: '8px',
                  background: currentAnswer?.answerId === answer.id ? '#f3f4f6' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (currentAnswer?.answerId !== answer.id) {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentAnswer?.answerId !== answer.id) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {currentAnswer?.answerId === answer.id && (
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>✓</span>
                )}
                <span style={{ marginLeft: currentAnswer?.answerId === answer.id ? '24px' : '0' }}>{answer.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botones de navegación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            style={{ opacity: currentQuestionIndex === 0 ? 0.5 : 1 }}
          >
            Anterior
          </button>

          {isLastQuestion && allAnswered && (
            <button
              className="btn"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Enviando...' : 'Completar Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

