import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { User, Stethoscope } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

export default function SmartMatching() {
  const { t } = useTranslation();
  const stats = [
    t('landing.matching.stat1'), t('landing.matching.stat2'),
    t('landing.matching.stat3'), t('landing.matching.stat4'),
  ];

  return (
    <SectionWrapper id="matching" dark className="bg-gradient-to-br from-gantly-navy via-gantly-navy to-[#0F2847]">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-white mb-4">{t('landing.matching.title')}</h2>
          <p className="font-body text-lg text-white/50">{t('landing.matching.subtitle')}</p>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div className="relative max-w-3xl mx-auto h-48 flex items-center justify-between px-8">
          <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gantly-blue/20 border-2 border-gantly-blue flex items-center justify-center z-10">
            <User size={32} className="text-gantly-blue" />
          </motion.div>

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            {[0, 1, 2].map((i) => (
              <motion.path key={i} d={`M 80 100 Q 300 ${60 + i * 40} 520 100`} fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeOpacity={0.3 - i * 0.08}
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.2, duration: 1.5, ease: 'easeInOut' }} />
            ))}
            <motion.circle r="4" fill="#22D3EE" initial={{ opacity: 0 }} whileInView={{ opacity: [0, 1, 1, 0] }} viewport={{ once: true }} transition={{ delay: 1.5, duration: 2, repeat: Infinity, repeatDelay: 1 }}>
              <animateMotion dur="2s" repeatCount="indefinite" begin="1.5s" path="M 80 100 Q 300 100 520 100" />
            </motion.circle>
          </svg>

          <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gantly-gold/20 border-2 border-gantly-gold flex items-center justify-center z-10">
            <Stethoscope size={32} className="text-gantly-gold" />
          </motion.div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
            className="text-center py-4 px-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-body text-sm text-gantly-cyan">{stat}</span>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}
