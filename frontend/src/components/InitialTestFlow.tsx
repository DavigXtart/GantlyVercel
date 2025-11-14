import { useState, useEffect } from 'react';
import { initialTestService } from '../services/api';
import PSYmatchLogo from './PSYmatchLogo';

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
            handleSubmitWithAnswers(newAnswers);
          }
        }
      }, 300); // Pequeño delay para mejor UX
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

    await handleSubmitWithAnswers(answers);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0f172a 100%)',
          color: '#e2e8f0'
        }}
      >
        Cargando evaluación inicial...
      </div>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0f172a 100%)',
          color: '#e2e8f0'
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '24px',
            padding: '32px 40px',
            maxWidth: '480px',
            textAlign: 'center'
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: '26px' }}>Test no disponible</h2>
          <p style={{ margin: '0 0 24px', color: 'rgba(226, 232, 240, 0.75)' }}>
            El test inicial aún no está configurado.
          </p>
          <button
            onClick={onBack}
            style={{
              padding: '12px 28px',
              borderRadius: '999px',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'transparent',
              color: '#e2e8f0',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
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
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #15243d 45%, #0f172a 100%)',
        padding: '60px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.22), transparent 55%), radial-gradient(circle at 80% 10%, rgba(56, 189, 248, 0.18), transparent 60%), radial-gradient(circle at 50% 90%, rgba(16, 185, 129, 0.18), transparent 55%)',
          pointerEvents: 'none'
        }}
      />

      {/* Top navigation */}
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          position: 'relative',
          zIndex: 2
        }}
      >
        <PSYmatchLogo size="small" />
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            borderRadius: '999px',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: 'transparent',
            color: 'rgba(226, 232, 240, 0.8)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Guardar y salir
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gap: '24px'
        }}
      >
        {/* Progress */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '22px',
            padding: '28px 32px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '26px', color: 'rgba(248, 250, 252, 0.96)' }}>{test.title}</h2>
              <p style={{ margin: '8px 0 0', color: 'rgba(226, 232, 240, 0.65)', fontSize: '14px', maxWidth: '560px' }}>
                {test.description}
              </p>
            </div>
            <span
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: 'rgba(248, 250, 252, 0.85)',
                fontSize: '13px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase'
              }}
            >
              Pregunta {currentQuestionIndex + 1} / {test.questions.length}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '12px',
              borderRadius: '999px',
              overflow: 'hidden',
              background: 'rgba(148, 163, 184, 0.24)'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 45%, #34d399 100%)',
                transition: 'width 0.45s ease'
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '24px',
            padding: '42px',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.35)',
            animation: 'fadeSlide 0.4s ease'
          }}
        >
          <h3
            style={{
              margin: '0 0 24px',
              fontSize: 'clamp(22px, 3vw, 32px)',
              color: 'rgba(248, 250, 252, 0.96)',
              lineHeight: 1.3
            }}
          >
            {currentQuestion.text}
          </h3>
          <div style={{ display: 'grid', gap: '14px' }}>
            {currentQuestion.answers.map((answer, idx) => {
              const isSelected = currentAnswer?.answerId === answer.id;
              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswer(currentQuestion.id, answer.id, answer.value || undefined)}
                  style={{
                    padding: '18px 24px',
                    borderRadius: '16px',
                    border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.6)' : 'rgba(148, 163, 184, 0.18)'}`,
                    background: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'rgba(15, 23, 42, 0.8)',
                    color: 'rgba(248, 250, 252, 0.92)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    transform: isSelected ? 'translateX(6px)' : 'translateX(0)',
                    boxShadow: isSelected ? '0 12px 28px rgba(59, 130, 246, 0.25)' : 'none',
                    animation: `fadeSlide 0.35s ease ${idx * 0.04}s both`
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.72)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.18)';
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 500, textAlign: 'left' }}>{answer.text}</span>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? '#38bdf8' : 'transparent',
                      color: isSelected ? '#0f172a' : 'transparent',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '20px',
            padding: '20px 32px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)'
          }}
        >
          {isLastQuestion && allAnswered && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '12px 28px',
                borderRadius: '999px',
                border: 'none',
                background: submitting ? 'rgba(148, 163, 184, 0.45)' : 'linear-gradient(135deg, #38bdf8, #34d399)',
                color: '#0f172a',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 12px 28px rgba(34, 197, 94, 0.3)'
              }}
            >
              {submitting ? 'Enviando…' : 'Enviar evaluación'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

