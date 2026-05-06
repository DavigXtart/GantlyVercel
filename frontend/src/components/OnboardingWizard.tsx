import { useState } from 'react';

interface OnboardingWizardProps {
  userName: string;
  onComplete: () => void;
  onGoToProfile: () => void;
  onGoToMatching: () => void;
}

const steps = [
  {
    icon: 'waving_hand',
    title: 'Bienvenido a Gantly',
    description: 'Gantly te conecta con psicólogos verificados. Desde aquí gestionas citas, tareas terapéuticas y tu seguimiento.',
  },
  {
    icon: 'person',
    title: 'Completa tu perfil',
    description: 'Anade tu foto, fecha de nacimiento y otros datos para personalizar tu experiencia. Un perfil completo ayuda a tu psicologo a conocerte mejor.',
    action: 'profile',
  },
  {
    icon: 'psychology',
    title: 'Realiza el test de matching',
    description: 'Responde un breve cuestionario para que podamos conectarte con el profesional mas adecuado para ti. Solo lleva unos minutos.',
    action: 'matching',
  },
  {
    icon: 'explore',
    title: 'Explora tu panel',
    description: 'Tu panel incluye agenda, tareas, diario de estado de ánimo y chat directo con tu profesional.',
  },
];

export default function OnboardingWizard({ userName, onComplete, onGoToProfile, onGoToMatching }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('onboarding-completed', 'true');
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true');
    onComplete();
  };

  const handleAction = () => {
    localStorage.setItem('onboarding-completed', 'true');
    if (current.action === 'profile') {
      onGoToProfile();
    } else if (current.action === 'matching') {
      onGoToMatching();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-elevated overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-gantly-blue' : i < step ? 'w-4 bg-gantly-blue/40' : 'w-4 bg-gantly-blue/20'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-10 py-8 text-center">
          <span className="material-symbols-outlined text-[56px] text-gantly-blue/50 mb-4 block">
            {current.icon}
          </span>
          {step === 0 ? (
            <h2 className="text-2xl font-heading font-light text-gantly-navy mb-2">
              {current.title}, <span className="font-medium">{userName}</span>
            </h2>
          ) : (
            <h2 className="text-2xl font-heading font-light text-gantly-navy mb-2">
              {current.title}
            </h2>
          )}
          <p className="text-gantly-muted text-[15px] leading-relaxed mb-8 font-body">
            {current.description}
          </p>

          <div className="flex flex-col gap-3">
            {current.action && (
              <button
                onClick={handleAction}
                className="w-full px-6 py-3 bg-gantly-blue/10 text-gantly-navy rounded-xl text-sm font-medium font-body hover:bg-gantly-blue/20 transition-colors"
              >
                {current.action === 'profile' ? 'Ir a mi perfil' : 'Realizar test de matching'}
              </button>
            )}
            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-gantly-blue text-white rounded-xl text-sm font-medium font-body hover:bg-gantly-blue-600 transition-colors"
            >
              {isLast ? 'Empezar' : 'Siguiente'}
            </button>
            <button
              onClick={handleSkip}
              className="text-gantly-muted/70 text-sm font-body hover:text-gantly-muted transition-colors"
            >
              Saltar introduccion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
