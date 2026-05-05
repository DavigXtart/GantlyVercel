import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from './shared/ScrollReveal';
import LogoIcon from '../../assets/logo-gantly-icon.svg';

interface FinalCTAProps {
  onPatient: () => void;
  onProfessional: () => void;
}

export default function FinalCTA({ onPatient, onProfessional }: FinalCTAProps) {
  const { t } = useTranslation();

  return (
    <section
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 25%, #48C6D4 50%, #78D4B0 75%, #B8CC68 100%)',
      }}
    >
      {/* Logo watermark */}
      <img
        src={LogoIcon}
        alt=""
        aria-hidden="true"
        className="absolute bottom-6 right-8 lg:bottom-10 lg:right-16 w-20 h-20 lg:w-32 lg:h-32 opacity-10 select-none pointer-events-none"
        style={{ filter: 'brightness(0) invert(1)' }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <ScrollReveal>
          <h2 className="font-heading text-4xl lg:text-6xl font-bold text-white mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="font-body text-lg text-white/70 mb-10">{t('landing.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onPatient}
              className="px-8 py-4 rounded-xl bg-white text-gantly-text font-heading font-semibold text-lg hover:bg-white/90 transition-all duration-200 cursor-pointer min-w-[220px] shadow-lg shadow-black/10"
            >
              {t('landing.cta.cta_patient')}
            </button>
            <button
              onClick={onProfessional}
              className="px-8 py-4 rounded-xl border-2 border-white/40 text-white font-heading font-semibold text-lg hover:border-white/80 hover:bg-white/10 transition-all duration-200 cursor-pointer min-w-[220px] flex items-center justify-center gap-2"
            >
              {t('landing.cta.cta_professional')}
              <ArrowRight size={20} />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
