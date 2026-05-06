import React, { useState, useEffect, type ReactNode } from 'react';
import { GraduationCap, Target, BarChart3, MessageCircle, Users, Zap, Pill, Scale, Calculator, Sparkles } from 'lucide-react';

interface MatchingAnimationProps {
  onComplete: () => void;
}

interface MatchingStep {
  title: string;
  description: string;
  weight: string;
  icon: ReactNode;
  color: string;
}

const matchingSteps: MatchingStep[] = [
  {
    title: 'Experiencia Clinica',
    description: 'Analizando anos de experiencia del psicologo segun tu nivel de afectacion',
    weight: '15%',
    icon: <GraduationCap size={48} />,
    color: '#2E93CC'
  },
  {
    title: 'Areas de Trabajo',
    description: 'Comparando tus necesidades con las especialidades del psicologo',
    weight: '20%',
    icon: <Target size={48} />,
    color: '#059669'
  },
  {
    title: 'Complejidad Clinica',
    description: 'Evaluando si el psicologo maneja casos de tu nivel de complejidad',
    weight: '10%',
    icon: <BarChart3 size={48} />,
    color: '#F0C930'
  },
  {
    title: 'Estilo Terapeutico',
    description: 'Matching entre tu preferencia y el estilo del profesional',
    weight: '12%',
    icon: <MessageCircle size={48} />,
    color: '#22D3EE'
  },
  {
    title: 'Poblacion Objetivo',
    description: 'Verificando que el psicologo trabaje con tu rango de edad',
    weight: '8%',
    icon: <Users size={48} />,
    color: '#10b981'
  },
  {
    title: 'Crisis Vitales',
    description: 'Evaluando experiencia en situaciones de crisis si aplica',
    weight: '10%',
    icon: <Zap size={48} />,
    color: '#f97316'
  },
  {
    title: 'Medicacion Psiquiatrica',
    description: 'Comprobando experiencia con medicacion si la necesitas',
    weight: '10%',
    icon: <Pill size={48} />,
    color: '#8b5cf6'
  },
  {
    title: 'Preferencia de Genero',
    description: 'Respetando tu preferencia si la has indicado',
    weight: '5%',
    icon: <Scale size={48} />,
    color: '#0A1628'
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
      // Mostrar formula despues de todos los pasos
      setTimeout(() => {
        setShowFormula(true);
      }, 500);
    } else if (!showResults) {
      // Mostrar resumen y luego completar
      setTimeout(() => {
        setShowResults(true);
      }, 2000);
    } else {
      // Completar animacion despues de mostrar resultados
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  }, [currentStep, showFormula, showResults, onComplete]);

  const currentStepData = currentStep < matchingSteps.length ? matchingSteps[currentStep] : null;
  const completedSteps = matchingSteps.slice(0, currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gantly-cloud to-gantly-blue-50 p-5 md:p-10 flex items-center justify-center">
      <div className="max-w-[900px] w-full bg-white rounded-3xl p-8 md:p-12 shadow-elevated relative overflow-hidden">
        {/* Barra de progreso */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-3xl">
          <div
            className="h-full bg-gradient-to-r from-gantly-blue to-gantly-cyan rounded-t-3xl transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {!showFormula && !showResults && (
          <>
            {/* Titulo */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-heading font-bold text-gantly-navy mb-3">
                Calculando tu Match Perfecto
              </h1>
              <p className="text-lg text-gantly-muted font-body">
                Analizando tus respuestas y comparandolas con nuestros psicologos
              </p>
            </div>

            {/* Paso actual */}
            {currentStepData && (
              <div
                className="text-center p-10 bg-gradient-to-br from-gray-50 to-gantly-cloud rounded-2xl mb-8 relative overflow-hidden animate-fade-in-up"
                style={{ border: `2px solid ${currentStepData.color}30` }}
              >
                <div
                  className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-pulse"
                  style={{ background: `radial-gradient(circle, ${currentStepData.color}10 0%, transparent 70%)` }}
                />
                <div className="mb-5 relative z-10 flex justify-center" style={{ color: currentStepData.color }}>
                  {currentStepData.icon}
                </div>
                <h2
                  className="text-[28px] font-heading font-bold mb-3 relative z-10"
                  style={{ color: currentStepData.color }}
                >
                  {currentStepData.title}
                </h2>
                <p className="text-base text-gantly-muted leading-relaxed font-body relative z-10">
                  {currentStepData.description}
                </p>
                <div
                  className="mt-5 px-4 py-2 rounded-full inline-block relative z-10"
                  style={{ background: `${currentStepData.color}20` }}
                >
                  <span
                    className="text-sm font-semibold font-body"
                    style={{ color: currentStepData.color }}
                  >
                    Peso: {currentStepData.weight}
                  </span>
                </div>
              </div>
            )}

            {/* Pasos completados */}
            {completedSteps.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-8">
                {completedSteps.map((step, index) => (
                  <div
                    key={index}
                    className="p-5 bg-gray-50 rounded-xl text-center opacity-70 animate-fade-in"
                    style={{ border: `2px solid ${step.color}30` }}
                  >
                    <div className="mb-2 flex justify-center" style={{ color: step.color }}>
                      {React.cloneElement(step.icon as React.ReactElement, { size: 24 })}
                    </div>
                    <div
                      className="text-sm font-semibold font-body"
                      style={{ color: step.color }}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gantly-muted mt-1 font-body">
                      {step.weight}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showFormula && !showResults && (
          <div className="text-center animate-fade-in-up">
            <div className="mb-6 flex justify-center text-gantly-navy"><Calculator size={48} /></div>
            <h2 className="text-[32px] font-heading font-bold text-gantly-navy mb-6">
              Formula de Matching
            </h2>
            <div className="bg-gradient-to-br from-gray-50 to-gantly-cloud rounded-2xl p-8 mb-6 border-2 border-gantly-blue/15">
              <div className="text-lg text-gantly-muted leading-[1.8] font-body text-left inline-block">
                <div className="mb-3">
                  <strong className="text-gantly-navy">Score de Afinidad =</strong>
                </div>
                <div className="ml-5 mb-2">
                  (Experiencia x 15%) +
                </div>
                <div className="ml-5 mb-2">
                  (Areas x 20%) +
                </div>
                <div className="ml-5 mb-2">
                  (Complejidad x 10%) +
                </div>
                <div className="ml-5 mb-2">
                  (Estilo x 12%) +
                </div>
                <div className="ml-5 mb-2">
                  (Poblacion x 8%) +
                </div>
                <div className="ml-5 mb-2">
                  (Crisis x 10%) +
                </div>
                <div className="ml-5 mb-2">
                  (Medicacion x 10%) +
                </div>
                <div className="ml-5 mb-3">
                  (Genero x 5%)
                </div>
                <div className="mt-4 pt-4 border-t border-gantly-blue/15">
                  <strong className="text-gantly-navy">% Match = Score x 100</strong>
                </div>
              </div>
            </div>
            <p className="text-base text-gantly-muted font-body">
              Normalizando y calculando porcentajes finales...
            </p>
          </div>
        )}

        {showResults && (
          <div className="text-center animate-fade-in-up">
            <div className="mb-6 flex justify-center text-gantly-blue"><Sparkles size={48} /></div>
            <h2 className="text-[32px] font-heading font-bold text-gantly-navy mb-4">
              Matching Completado!
            </h2>
            <p className="text-lg text-gantly-muted mb-8 font-body">
              Hemos encontrado psicologos que se adaptan perfectamente a tu perfil
            </p>
            <div className="inline-block px-8 py-4 bg-gradient-to-r from-gantly-blue to-gantly-cyan rounded-2xl text-white text-lg font-semibold font-body animate-pulse">
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
        `}</style>
      </div>
    </div>
  );
}
