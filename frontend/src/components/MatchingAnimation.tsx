import { useState, useEffect } from 'react';

interface MatchingAnimationProps {
  onComplete: () => void;
}

interface MatchingStep {
  title: string;
  description: string;
  weight: string;
  icon: string;
  color: string;
}

const matchingSteps: MatchingStep[] = [
  {
    title: 'Experiencia Clínica',
    description: 'Analizando años de experiencia del psicólogo según tu nivel de afectación',
    weight: '15%',
    icon: '🎓',
    color: '#5a9270'
  },
  {
    title: 'Áreas de Trabajo',
    description: 'Comparando tus necesidades con las especialidades del psicólogo',
    weight: '20%',
    icon: '🎯',
    color: '#667eea'
  },
  {
    title: 'Complejidad Clínica',
    description: 'Evaluando si el psicólogo maneja casos de tu nivel de complejidad',
    weight: '10%',
    icon: '📊',
    color: '#f59e0b'
  },
  {
    title: 'Estilo Terapéutico',
    description: 'Matching entre tu preferencia y el estilo del profesional',
    weight: '12%',
    icon: '💬',
    color: '#ec4899'
  },
  {
    title: 'Población Objetivo',
    description: 'Verificando que el psicólogo trabaje con tu rango de edad',
    weight: '8%',
    icon: '👥',
    color: '#10b981'
  },
  {
    title: 'Crisis Vitales',
    description: 'Evaluando experiencia en situaciones de crisis si aplica',
    weight: '10%',
    icon: '⚡',
    color: '#f97316'
  },
  {
    title: 'Medicación Psiquiátrica',
    description: 'Comprobando experiencia con medicación si la necesitas',
    weight: '10%',
    icon: '💊',
    color: '#8b5cf6'
  },
  {
    title: 'Preferencia de Género',
    description: 'Respetando tu preferencia si la has indicado',
    weight: '5%',
    icon: '⚖️',
    color: '#6366f1'
  }
];

export default function MatchingAnimation({ onComplete }: MatchingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showFormula, setShowFormula] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Animar los pasos uno por uno
    if (currentStep < matchingSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setProgress(((currentStep + 1) / matchingSteps.length) * 100);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (!showFormula) {
      // Mostrar fórmula después de todos los pasos
      setTimeout(() => {
        setShowFormula(true);
      }, 500);
    } else if (!showResults) {
      // Mostrar resumen y luego completar
      setTimeout(() => {
        setShowResults(true);
      }, 2000);
    } else {
      // Completar animación después de mostrar resultados
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  }, [currentStep, showFormula, showResults, onComplete]);

  const currentStepData = currentStep < matchingSteps.length ? matchingSteps[currentStep] : null;
  const completedSteps = matchingSteps.slice(0, currentStep);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        background: '#fff',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Barra de progreso */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: '#e5e7eb',
          borderRadius: '24px 24px 0 0'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #5a9270 0%, #667eea 100%)',
            width: `${progress}%`,
            transition: 'width 0.5s ease',
            borderRadius: '24px 24px 0 0'
          }} />
        </div>

        {!showFormula && !showResults && (
          <>
            {/* Título */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#1a2e22',
                marginBottom: '12px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Calculando tu Match Perfecto
              </h1>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                fontFamily: "'Inter', sans-serif"
              }}>
                Analizando tus respuestas y comparándolas con nuestros psicólogos
              </p>
            </div>

            {/* Paso actual */}
            {currentStepData && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
                borderRadius: '20px',
                marginBottom: '32px',
                border: `2px solid ${currentStepData.color}40`,
                animation: 'fadeInScale 0.5s ease',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: `radial-gradient(circle, ${currentStepData.color}10 0%, transparent 70%)`,
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
                <div style={{ fontSize: '64px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                  {currentStepData.icon}
                </div>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: currentStepData.color,
                  marginBottom: '12px',
                  fontFamily: "'Inter', sans-serif",
                  position: 'relative',
                  zIndex: 1
                }}>
                  {currentStepData.title}
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#3a5a4a',
                  lineHeight: 1.6,
                  fontFamily: "'Inter', sans-serif",
                  position: 'relative',
                  zIndex: 1
                }}>
                  {currentStepData.description}
                </p>
                <div style={{
                  marginTop: '20px',
                  padding: '8px 16px',
                  background: `${currentStepData.color}20`,
                  borderRadius: '20px',
                  display: 'inline-block',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: currentStepData.color,
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Peso: {currentStepData.weight}
                  </span>
                </div>
              </div>
            )}

            {/* Pasos completados */}
            {completedSteps.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '32px'
              }}>
                {completedSteps.map((step, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '20px',
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      border: `2px solid ${step.color}40`,
                      textAlign: 'center',
                      opacity: 0.7,
                      transition: 'opacity 0.3s ease',
                      animation: 'fadeIn 0.5s ease'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {step.icon}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: step.color,
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {step.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '4px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {step.weight}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showFormula && !showResults && (
          <div style={{
            textAlign: 'center',
            animation: 'fadeInScale 0.5s ease'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🧮</div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1a2e22',
              marginBottom: '24px',
              fontFamily: "'Inter', sans-serif"
            }}>
              Fórmula de Matching
            </h2>
            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f5f3 100%)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '24px',
              border: '2px solid rgba(90, 146, 112, 0.2)'
            }}>
              <div style={{
                fontSize: '18px',
                color: '#3a5a4a',
                lineHeight: 1.8,
                fontFamily: "'Inter', sans-serif",
                textAlign: 'left',
                display: 'inline-block'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Score de Afinidad =</strong>
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  (Experiencia × 15%) +
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  (Áreas × 20%) +
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  (Complejidad × 10%) +
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  (Estilo × 12%) +
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  (Población × 8%) +
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  (Crisis × 10%) +
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  (Medicación × 10%) +
                </div>
                <div style={{ marginLeft: '20px', marginBottom: '12px' }}>
                  (Género × 5%)
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(90, 146, 112, 0.2)' }}>
                  <strong>% Match = Score × 100</strong>
                </div>
              </div>
            </div>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              fontFamily: "'Inter', sans-serif"
            }}>
              Normalizando y calculando porcentajes finales...
            </p>
          </div>
        )}

        {showResults && (
          <div style={{
            textAlign: 'center',
            animation: 'fadeInScale 0.5s ease'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>✨</div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1a2e22',
              marginBottom: '16px',
              fontFamily: "'Inter', sans-serif"
            }}>
              ¡Matching Completado!
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#6b7280',
              marginBottom: '32px',
              fontFamily: "'Inter', sans-serif"
            }}>
              Hemos encontrado psicólogos que se adaptan perfectamente a tu perfil
            </p>
            <div style={{
              display: 'inline-block',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #5a9270 0%, #667eea 100%)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              Mostrando resultados...
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.6;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

