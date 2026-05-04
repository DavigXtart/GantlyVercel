import { useTranslation } from 'react-i18next';
import ScrollReveal from './shared/ScrollReveal';

interface FinalCTAProps {
  onPatient: () => void;
  onProfessional: () => void;
}

export default function FinalCTA({ onPatient, onProfessional }: FinalCTAProps) {
  const { t } = useTranslation();

  return (
    <section className="relative py-32 bg-gantly-navy overflow-hidden">
      {/* CSS particle-like dots */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gantly-cyan/20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gantly-blue/5 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <ScrollReveal>
          <h2 className="font-heading text-4xl lg:text-6xl font-bold text-white mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="font-body text-lg text-white/50 mb-10">{t('landing.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onPatient}
              className="px-8 py-4 rounded-xl bg-gantly-gold text-gantly-navy font-heading font-semibold text-lg hover:bg-gantly-gold/90 transition-all duration-200 cursor-pointer min-w-[220px]"
            >
              {t('landing.cta.cta_patient')}
            </button>
            <button
              onClick={onProfessional}
              className="px-8 py-4 rounded-xl border-2 border-gantly-cyan/50 text-gantly-cyan font-heading font-semibold text-lg hover:bg-gantly-cyan/10 transition-all duration-200 cursor-pointer min-w-[220px]"
            >
              {t('landing.cta.cta_professional')}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
