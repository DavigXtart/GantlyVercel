import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronDown } from 'lucide-react';
import LogoIcon from '../../assets/logo-gantly-icon.svg';
import Hero3DScene from './Hero3DScene';

interface HeroSectionProps {
  onPatient: () => void;
  onProfessional: () => void;
}

/** Animated wavy underline that draws itself */
function WavyUnderline() {
  return (
    <svg
      viewBox="0 0 286 12"
      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[110%] h-3"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d="M2 7C32 3,62 10,92 5.5C122 1,152 9,182 4.5C212 0,248 8,284 4"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function HeroSection({ onPatient }: HeroSectionProps) {
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
      {/* Content grid */}
      <div className="relative z-10 flex-1 flex items-center px-6 lg:px-16 xl:px-24 pt-28 lg:pt-32 pb-20">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Text */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Small label */}
            <motion.span
              variants={fadeUp}
              className="inline-block font-handwritten text-lg sm:text-xl text-white/60 mb-4"
              style={{ transform: 'rotate(-1.5deg)' }}
            >
              {t('landing.hero.handwritten')}
            </motion.span>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6"
            >
              {t('landing.hero.title_pre')}{' '}
              <span className="relative inline-block">
                {t('landing.hero.title_highlight')}
                <WavyUnderline />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="font-body text-lg sm:text-xl text-white/75 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-10"
            >
              <button
                onClick={onPatient}
                className="group font-heading font-semibold text-base text-gantly-navy bg-white hover:bg-white/95 transition-all px-8 py-3.5 rounded-full cursor-pointer shadow-lg shadow-black/10 flex items-center gap-2"
              >
                {t('landing.hero.cta_start')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={scrollToFlow}
                className="font-heading font-semibold text-base text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all px-8 py-3.5 rounded-full cursor-pointer"
              >
                {t('landing.hero.cta_how')}
              </button>
            </motion.div>

            {/* Stats — clean, factual */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-1 text-sm font-body text-white/55"
            >
              <span>
                <strong className="text-white/90 font-semibold">2,000+</strong> {t('landing.hero.social_patients')}
              </span>
              <span className="text-white/25">·</span>
              <span>
                <strong className="text-white/90 font-semibold">500+</strong> {t('landing.hero.social_psychologists')}
              </span>
              <span className="text-white/25">·</span>
              <span className="text-white/55">{t('landing.hero.trust_badge')}</span>
            </motion.div>
          </motion.div>

          {/* Right — Product mockup (desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
            className="hidden lg:flex justify-center lg:justify-end"
          >
            <Hero3DScene />
          </motion.div>
        </div>
      </div>

      {/* Logo watermark bottom-right */}
      <motion.img
        src={LogoIcon}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 right-8 lg:bottom-12 lg:right-16 w-20 h-20 lg:w-32 lg:h-32 select-none pointer-events-none"
        style={{ filter: 'brightness(0) invert(1)' }}
      />

      {/* Scroll indicator */}
      <motion.div
        className="relative z-10 flex justify-center pb-6"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown size={22} className="text-white/35" />
      </motion.div>
    </section>
  );
}
