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
    <section className="relative min-h-screen bg-gantly-navy overflow-hidden">
      {/* Subtle background elements */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="absolute top-0 right-0 w-[60%] h-full opacity-[0.06]"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 70% 40%, #2E93CC 0%, transparent 70%)',
        }}
      />

      {/* Content: text left, mockup right */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full py-32 lg:py-0">
          {/* Left: text + CTAs */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-1.5 mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gantly-emerald animate-pulse" />
              <span className="text-xs font-body text-white/50">Plataforma de salud mental</span>
            </motion.div>

            <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-[3.8rem] lg:leading-[1.08] text-white mb-6">
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                  className="inline-block mr-[0.3em] last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9, ease: 'easeOut' }}
              className="font-body text-lg text-white/45 mb-10 max-w-md leading-relaxed"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={onPatient}
                className="font-heading font-semibold text-base text-gantly-navy bg-gantly-gold hover:bg-yellow-300 transition-colors px-8 py-3.5 rounded-xl cursor-pointer"
              >
                {t('landing.hero.cta_patient')}
              </button>
              <button
                onClick={onProfessional}
                className="font-heading font-semibold text-base text-gantly-cyan border-2 border-gantly-cyan/40 hover:border-gantly-cyan hover:bg-gantly-cyan/10 transition-all px-8 py-3.5 rounded-xl cursor-pointer"
              >
                {t('landing.hero.cta_professional')}
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.5 }}
              className="flex items-center gap-6 mt-12 pt-8 border-t border-white/5"
            >
              {[
                { value: '2,000+', label: 'Pacientes' },
                { value: '500+', label: 'Psicólogos' },
                { value: '98%', label: 'Satisfacción' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-heading font-bold text-lg text-white">{stat.value}</div>
                  <div className="text-[11px] text-white/30 font-body">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: product mockup (desktop only) */}
          <Hero3DScene />

          {/* Mobile: simplified visual */}
          <div className="lg:hidden flex justify-center">
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {[
                { value: '2,000+', label: 'Pacientes activos', color: '#2E93CC' },
                { value: '98%', label: 'Satisfacción', color: '#059669' },
                { value: '500+', label: 'Psicólogos', color: '#22D3EE' },
                { value: '15k+', label: 'Sesiones', color: '#F0C930' },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.04] border border-white/5 rounded-xl p-4 text-center">
                  <div className="font-heading font-bold text-xl" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-white/35 font-body mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
}
