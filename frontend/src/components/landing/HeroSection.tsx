import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import Hero3DScene from './Hero3DScene';

interface HeroSectionProps {
  onPatient: () => void;
  onProfessional: () => void;
}

export default function HeroSection({ onPatient, onProfessional }: HeroSectionProps) {
  const { t } = useTranslation();

  const title: string = t('landing.hero.title');
  const words = title.split(' ');

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gantly-navy overflow-hidden">
      {/* Animated background scene */}
      <Hero3DScene />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
        {/* Kinetic headline */}
        <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-[4.5rem] lg:leading-[1.1] text-white leading-tight mb-6">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
              className="inline-block mr-[0.3em] last:mr-0"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2, ease: 'easeOut' }}
          className="font-body text-lg sm:text-xl text-white/50 mb-10 max-w-xl"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <button
            onClick={onPatient}
            className="font-heading font-semibold text-base text-gantly-navy bg-gantly-gold hover:bg-yellow-300 transition-colors px-8 py-3.5 rounded-2xl shadow-lg shadow-yellow-500/20 cursor-pointer"
          >
            {t('landing.hero.cta_patient')}
          </button>
          <button
            onClick={onProfessional}
            className="font-heading font-semibold text-base text-gantly-cyan border-2 border-gantly-cyan/50 hover:border-gantly-cyan hover:bg-gantly-cyan/10 transition-all px-8 py-3.5 rounded-2xl cursor-pointer"
          >
            {t('landing.hero.cta_professional')}
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown size={28} />
      </motion.div>
    </section>
  );
}
