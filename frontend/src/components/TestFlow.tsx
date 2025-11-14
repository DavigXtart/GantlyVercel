import { useState, useEffect } from 'react';
import { testService } from '../services/api';
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

interface TestFlowProps {
  testId: number;
  onBack: () => void;
  onComplete: () => void;
}

type Mood = 'serenity' | 'focus' | 'energy';

const moodPalette: Record<
  Mood,
  { bg: string; accent: string; accentSoft: string; border: string; glow: string }
> = {
  serenity: {
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0f172a 100%)',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(148, 163, 184, 0.35)',
    glow: '0 0 22px rgba(56, 189, 248, 0.35)'
  },
  focus: {
    bg: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
    accent: '#818cf8',
    accentSoft: 'rgba(129, 140, 248, 0.12)',
    border: 'rgba(129, 140, 248, 0.35)',
    glow: '0 0 22px rgba(129, 140, 248, 0.35)'
  },
  energy: {
    bg: 'linear-gradient(135deg, #0f172a 0%, #164e63 45%, #0f172a 100%)',
    accent: '#34d399',
    accentSoft: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.35)',
    glow: '0 0 22px rgba(52, 211, 153, 0.35)'
  }
};

export default function TestFlow({ testId, onBack, onComplete }: TestFlowProps) {
  const [test, setTest] = useState<TestDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { answerId?: number; numericValue?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionTransition, setQuestionTransition] = useState(false);
  const [mood, setMood] = useState<Mood>('serenity');

  const palette = moodPalette[mood];

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    setQuestionTransition(true);
    const timer = setTimeout(() => setQuestionTransition(false), 300);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  useEffect(() => {
    const moods: Mood[] = ['serenity', 'focus', 'energy'];
    const interval = setInterval(() => {
      setMood((prev) => {
        const idx = moods.indexOf(prev);
        return moods[(idx + 1) % moods.length];
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const loadTest = async () => {
    try {
      setLoading(true);
      const data = await testService.get(testId);
      if (data.questions) {
        data.questions.sort((a: Question, b: Question) => a.position - b.position);
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
    
    if (autoAdvance) {
      setTimeout(() => {
        if (!test) return;
        
        const currentIndex = test.questions.findIndex(q => q.id === questionId);
        if (currentIndex !== -1 && currentIndex < test.questions.length - 1) {
          setCurrentQuestionIndex(currentIndex + 1);
        } else if (currentIndex === test.questions.length - 1) {
          const allAnswered = test.questions.every(q => newAnswers[q.id]);
          if (allAnswered) {
            if (confirm('¿Has completado todas las preguntas. ¿Deseas enviar el test?')) {
              handleSubmitWithAnswers(newAnswers);
            }
          }
        }
      }, 400);
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p style={{ fontSize: '18px', color: '#64748b', fontWeight: 500 }}>Cargando test...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: palette.bg,
        transition: 'background 1.2s ease',
        padding: '48px 20px 64px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes floating {
          0%, 100% { transform: translateY(0); opacity: 0.45; }
          50% { transform: translateY(-12px); opacity: 0.7; }
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Ambient gradient layers */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.22), transparent 55%),
                       radial-gradient(circle at 80% 10%, rgba(56, 189, 248, 0.18), transparent 60%),
                       radial-gradient(circle at 50% 90%, rgba(16, 185, 129, 0.18), transparent 55%)`,
          transition: 'opacity 1s ease',
          opacity: mood === 'serenity' ? 1 : 0.9,
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 20% 25%, rgba(129, 140, 248, 0.18), transparent 60%),
                       radial-gradient(circle at 70% 80%, rgba(78, 205, 196, 0.16), transparent 55%)`,
          transition: 'opacity 1s ease',
          opacity: mood === 'focus' ? 1 : 0,
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.2), transparent 60%),
                       radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.2), transparent 55%)`,
          transition: 'opacity 1s ease',
          opacity: mood === 'energy' ? 1 : 0,
          pointerEvents: 'none'
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            width: `${18 + idx * 6}px`,
            height: `${18 + idx * 6}px`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            top: `${10 + idx * 12}%`,
            left: `${15 + idx * 10}%`,
            filter: 'blur(0.8px)',
            animation: `floating ${12 + idx * 2}s ease-in-out ${idx}s infinite`
          }}
        />
      ))}

      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '28px'
        }}
      >
        {/* Top navigation */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.45)',
            border: `1px solid ${palette.border}`,
            borderRadius: '20px',
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: palette.glow
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <PSYmatchLogo size="small" />
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', letterSpacing: '0.12em', color: 'rgba(226, 232, 240, 0.7)', textTransform: 'uppercase' }}>
                Programa de evaluación
              </h4>
              <h2 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 600, color: 'rgba(248, 250, 252, 0.95)' }}>
                {test.title || test.code || `Test #${test.id}`}
              </h2>
            </div>
          </div>
          <button
            onClick={onBack}
            style={{
              padding: '12px 20px',
              borderRadius: '999px',
              border: `1px solid ${palette.border}`,
              background: 'transparent',
              color: 'rgba(226, 232, 240, 0.85)',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Salir
          </button>
        </div>

        {/* Progress */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.45)',
            border: `1px solid ${palette.border}`,
            borderRadius: '20px',
            padding: '28px 32px',
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 420px) minmax(0, 1fr)',
            gap: '24px',
            alignItems: 'center',
            boxShadow: palette.glow
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', letterSpacing: '0.12em', color: 'rgba(226, 232, 240, 0.65)', textTransform: 'uppercase' }}>Estado</h3>
            <p style={{ margin: '10px 0 0', fontSize: '22px', fontWeight: 600, color: 'rgba(248, 250, 252, 0.95)' }}>
              Pregunta {currentQuestionIndex + 1} de {test.questions.length}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(226, 232, 240, 0.6)' }}>{test.description}</p>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'rgba(226, 232, 240, 0.65)', fontSize: '13px' }}>
              <span>{Math.round(progress)}% completado</span>
              <span>{test.questions.length - (currentQuestionIndex + 1)} en espera</span>
            </div>
            <div style={{ position: 'relative', height: '12px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(148, 163, 184, 0.2)' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${palette.accent} 0%, rgba(34, 197, 94, 0.85) 100%)`,
                  transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.4), rgba(255,255,255,0))',
                  mixBlendMode: 'overlay',
                  animation: 'shimmer 1.6s infinite'
                }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: `1px solid ${palette.border}`,
            borderRadius: '24px',
            padding: '48px',
            boxShadow: palette.glow,
            animation: questionTransition ? 'slideIn 0.35s ease-out' : 'none',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: palette.accentSoft,
                  border: `1px solid ${palette.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: palette.accent,
                  fontSize: '20px',
                  fontWeight: 700
                }}
              >
                {currentQuestionIndex + 1}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 'clamp(24px, 2.6vw, 32px)', fontWeight: 600, color: 'rgba(248, 250, 252, 0.96)' }}>
                  {currentQuestion.text}
                </h2>
                <p style={{ margin: '6px 0 0', color: 'rgba(226, 232, 240, 0.7)', fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Tu respuesta es confidencial
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '18px' }}>
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: `1px solid ${palette.border}`,
                  background: 'transparent',
                  color: 'rgba(226, 232, 240, 0.75)',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentQuestionIndex === 0 ? 0.4 : 1
                }}
              >
                ← Anterior
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === test.questions.length - 1}
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: 'none',
                  background: palette.accentSoft,
                  color: palette.accent,
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  cursor: currentQuestionIndex === test.questions.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentQuestionIndex === test.questions.length - 1 ? 0.35 : 1
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>

          {/* Respuestas */}
          {currentQuestion.type === 'SINGLE' && currentQuestion.answers && currentQuestion.answers.length > 0 && (
            <div style={{ display: 'grid', gap: '14px' }}>
              {currentQuestion.answers.map((answer, index) => {
                const isSelected = currentAnswer?.answerId === answer.id;
                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(currentQuestion.id, answer.id)}
                    style={{
                      padding: '20px 26px',
                      borderRadius: '18px',
                      border: `1px solid ${isSelected ? palette.border : 'rgba(148, 163, 184, 0.25)'}`,
                      background: isSelected
                        ? `radial-gradient(circle at 0% 0%, rgba(59,130,246,0.32), transparent 65%), rgba(15,23,42,0.68)`
                        : 'rgba(15, 23, 42, 0.65)',
                      color: 'rgba(248, 250, 252, 0.92)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: isSelected ? palette.glow : 'none',
                      backdropFilter: 'blur(6px)',
                      transform: isSelected ? 'translateX(6px)' : 'translateX(0)',
                      animation: `slideIn 0.35s ease ${index * 0.04}s both`
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = palette.border;
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.72)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)';
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.65)';
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
                        border: `2px solid ${isSelected ? palette.accent : 'rgba(148, 163, 184, 0.4)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.25s ease',
                        background: isSelected ? palette.accent : 'transparent',
                        color: isSelected ? '#0f172a' : 'transparent'
                      }}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'MULTI' && currentQuestion.answers && currentQuestion.answers.length > 0 && (
            <div style={{ display: 'grid', gap: '14px' }}>
              {currentQuestion.answers.map((answer, index) => {
                const isSelected = currentAnswer?.answerId === answer.id;
                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(currentQuestion.id, isSelected ? undefined : answer.id)}
                    style={{
                      padding: '20px 26px',
                      borderRadius: '18px',
                      border: `1px solid ${isSelected ? palette.border : 'rgba(148, 163, 184, 0.25)'}`,
                      background: isSelected
                        ? `radial-gradient(circle at 0% 0%, rgba(34,197,94,0.32), transparent 65%), rgba(15,23,42,0.68)`
                        : 'rgba(15, 23, 42, 0.65)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      boxShadow: isSelected ? palette.glow : 'none',
                      backdropFilter: 'blur(6px)',
                      transform: isSelected ? 'translateX(6px)' : 'translateX(0)',
                      animation: `slideIn 0.35s ease ${index * 0.04}s both`
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = palette.border;
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.72)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)';
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.65)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '18px', fontWeight: 500, textAlign: 'left' }}>{answer.text}</span>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: `2px solid ${isSelected ? palette.accent : 'rgba(148, 163, 184, 0.4)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.25s ease',
                        background: isSelected ? palette.accent : 'transparent',
                        color: isSelected ? '#0f172a' : 'transparent'
                      }}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'SCALE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(54px, 1fr))', gap: '12px' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                  const isSelected = currentAnswer?.numericValue === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleAnswer(currentQuestion.id, undefined, value, false)}
                      style={{
                        padding: '14px 0',
                        borderRadius: '16px',
                        border: `1px solid ${isSelected ? palette.border : 'rgba(148,163,184,0.25)'}`,
                        background: isSelected ? palette.accentSoft : 'rgba(15, 23, 42, 0.65)',
                        color: 'rgba(248, 250, 252, 0.92)',
                        fontSize: '18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? palette.glow : 'none',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = palette.border;
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  border: `1px solid ${palette.border}`,
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: 'rgba(226, 232, 240, 0.75)',
                  fontSize: '15px'
                }}
              >
                <span>Puntaje actual</span>
                <strong style={{ fontSize: '18px', color: palette.accent }}>
                  {currentAnswer?.numericValue !== undefined ? currentAnswer.numericValue : '—'}
                </strong>
              </div>
            </div>
          )}

          {currentQuestion.type !== 'SINGLE' && currentQuestion.type !== 'MULTI' && currentQuestion.type !== 'SCALE' && (
            <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
              Tipo de pregunta no soportado: {currentQuestion.type}
            </p>
          )}
        </div>

        {/* Bottom actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '18px',
            background: 'rgba(15, 23, 42, 0.45)',
            border: `1px solid ${palette.border}`,
            borderRadius: '20px',
            padding: '22px 32px',
            boxShadow: palette.glow
          }}
        >
          <div style={{ color: 'rgba(226, 232, 240, 0.65)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {isLastQuestion ? 'Listo para enviar' : 'Responde con sinceridad'}
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <button
              onClick={onBack}
              style={{
                padding: '12px 22px',
                borderRadius: '999px',
                border: `1px solid ${palette.border}`,
                background: 'transparent',
                color: 'rgba(226, 232, 240, 0.75)',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Guardar y salir
            </button>
            {isLastQuestion && allAnswered ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '12px 28px',
                  borderRadius: '999px',
                  border: 'none',
                  background: submitting
                    ? 'rgba(148, 163, 184, 0.4)'
                    : `linear-gradient(135deg, ${palette.accent}, rgba(34, 197, 94, 0.9))`,
                  color: '#0f172a',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : palette.glow,
                  transition: 'all 0.25s ease'
                }}
              >
                {submitting ? 'Enviando…' : 'Enviar evaluación'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === test.questions.length - 1}
                style={{
                  padding: '12px 28px',
                  borderRadius: '999px',
                  border: 'none',
                  background: palette.accentSoft,
                  color: palette.accent,
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: currentQuestionIndex === test.questions.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentQuestionIndex === test.questions.length - 1 ? 0.35 : 1,
                  transition: 'all 0.25s ease'
                }}
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

