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
    description: 'Gantly es tu espacio seguro para cuidar tu salud mental. Aquí encontrarás herramientas, profesionales y apoyo personalizado.',
  },
  {
    icon: 'person',
    title: 'Completa tu perfil',
    description: 'Añade tu foto, fecha de nacimiento y otros datos para personalizar tu experiencia. Un perfil completo ayuda a tu psicólogo a conocerte mejor.',
    action: 'profile',
  },
  {
    icon: 'psychology',
    title: 'Realiza el test de matching',
    description: 'Responde un breve cuestionario para que podamos conectarte con el profesional más adecuado para ti. Solo lleva unos minutos.',
    action: 'matching',
  },
  {
    icon: 'explore',
    title: 'Explora tu panel',
    description: 'Desde tu panel podrás gestionar citas, completar tareas, llevar un diario de bienestar, chatear con tu psicólogo y mucho más.',
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
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-forest' : i < step ? 'w-4 bg-sage/40' : 'w-4 bg-sage/20'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-10 py-8 text-center">
          <span className="material-symbols-outlined text-[56px] text-sage/50 mb-4 block">
            {current.icon}
          </span>
          {step === 0 ? (
            <h2 className="text-2xl font-light text-forest mb-2">
              {current.title}, <span className="font-medium">{userName}</span>
            </h2>
          ) : (
            <h2 className="text-2xl font-light text-forest mb-2">
              {current.title}
            </h2>
          )}
          <p className="text-sage/70 text-[15px] leading-relaxed mb-8">
            {current.description}
          </p>

          <div className="flex flex-col gap-3">
            {current.action && (
              <button
                onClick={handleAction}
                className="w-full px-6 py-3 bg-sage/10 text-forest rounded-xl text-sm font-medium hover:bg-sage/20 transition-colors"
              >
                {current.action === 'profile' ? 'Ir a mi perfil' : 'Realizar test de matching'}
              </button>
            )}
            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-forest text-white rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors"
            >
              {isLast ? 'Empezar' : 'Siguiente'}
            </button>
            <button
              onClick={handleSkip}
              className="text-sage/50 text-sm hover:text-sage transition-colors"
            >
              Saltar introducción
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
