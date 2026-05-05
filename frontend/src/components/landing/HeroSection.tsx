import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronDown } from 'lucide-react';
import LogoIcon from '../../assets/logo-gantly-icon.svg';

interface HeroSectionProps {
  onPatient: () => void;
  onProfessional: () => void;
}

export default function HeroSection({ onPatient, onProfessional }: HeroSectionProps) {
  const { t } = useTranslation();

  const scrollToFlow = () => {
    const el = document.getElementById('flow');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 20%, #48C6D4 42%, #78D4B0 60%, #B8CC68 80%, #D8C850 100%)',
      }}
    >
      {/* Top taglines — handwritten, rotated, playful */}
      <div className="relative z-10 flex justify-between items-start px-6 lg:px-16 pt-28 lg:pt-32">
        <motion.span
          initial={{ opacity: 0, rotate: -5 }}
          animate={{ opacity: 1, rotate: -3 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-handwritten text-2xl lg:text-3xl text-white/80 inline-block"
        >
          {t('landing.hero.tagline_left')}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, rotate: 5 }}
          animate={{ opacity: 1, rotate: 2 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="font-handwritten text-2xl lg:text-3xl text-white/80 hidden sm:inline-block"
        >
          {t('landing.hero.tagline_right')}
        </motion.span>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 lg:px-12">
        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
          className="font-heading text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.1] max-w-5xl mb-8"
        >
          {t('landing.hero.title_pre')}{' '}
          <em className="italic font-extrabold">{t('landing.hero.title_highlight')}</em>{' '}
          {t('landing.hero.title_post')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="font-body text-lg sm:text-xl text-white/80 text-center max-w-xl mb-10"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={onPatient}
            className="font-heading font-semibold text-base text-gantly-text bg-white hover:bg-white/90 transition-colors px-8 py-3.5 rounded-xl cursor-pointer shadow-lg shadow-black/10 min-w-[200px]"
          >
            {t('landing.hero.cta_start')}
          </button>
          <button
            onClick={scrollToFlow}
            className="font-heading font-semibold text-base text-white border-2 border-white/40 hover:border-white/80 hover:bg-white/10 transition-all px-8 py-3.5 rounded-xl cursor-pointer flex items-center gap-2 min-w-[200px] justify-center"
          >
            {t('landing.hero.cta_how')}
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>

      {/* Logo watermark bottom-right */}
      <motion.img
        src={LogoIcon}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 right-8 lg:bottom-12 lg:right-16 w-24 h-24 lg:w-40 lg:h-40 select-none pointer-events-none"
        style={{ filter: 'brightness(0) invert(1)' }}
      />

      {/* Scroll indicator */}
      <motion.div
        className="relative z-10 flex justify-center pb-8"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown size={24} className="text-white/50" />
      </motion.div>
    </section>
  );
}
