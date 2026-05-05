import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Brain, Clock, Star, ShieldCheck } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

const stats = [
  {
    icon: Brain,
    value: '16',
    label: 'Factores de personalidad',
    desc: 'Test 16PF clínicamente validado',
  },
  {
    icon: ShieldCheck,
    value: '100%',
    label: 'Profesionales verificados',
    desc: 'Colegiación y experiencia comprobadas',
  },
  {
    icon: Star,
    value: '98%',
    label: 'Satisfacción',
    desc: 'De pacientes con su psicólogo asignado',
  },
  {
    icon: Clock,
    value: '<24h',
    label: 'Tiempo de matching',
    desc: 'Desde que completas el test',
  },
];

export default function SmartMatching() {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="matching" dark className="bg-gradient-to-br from-gantly-navy via-gantly-navy to-[#0F2847]">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-white mb-4">{t('landing.matching.title')}</h2>
          <p className="font-body text-lg text-white/50">{t('landing.matching.subtitle')}</p>
        </ScrollReveal>
      </div>

      {/* Matching visualization — all in one SVG for perfect alignment */}
      <ScrollReveal>
        <div className="max-w-2xl mx-auto px-4">
          <svg viewBox="0 0 600 200" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Connection arcs */}
            {[
              { d: 'M 110 90 Q 300 30 490 90', opacity: 0.3, delay: 0.5 },
              { d: 'M 110 90 Q 300 70 490 90', opacity: 0.2, delay: 0.7 },
              { d: 'M 110 90 Q 300 120 490 90', opacity: 0.15, delay: 0.9 },
            ].map((arc, i) => (
              <motion.path
                key={i}
                d={arc.d}
                stroke="#22D3EE"
                strokeWidth="1.5"
                strokeOpacity={arc.opacity}
                strokeDasharray="6 4"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ delay: arc.delay, duration: 1.5, ease: 'easeInOut' }}
              />
            ))}

            {/* Animated traveling dot */}
            <motion.circle
              r="4"
              fill="#22D3EE"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: [0, 1, 1, 0] }}
              viewport={{ once: true }}
              transition={{ delay: 2, duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
            >
              <animateMotion dur="2s" repeatCount="indefinite" begin="2s" path="M 110 90 Q 300 70 490 90" />
            </motion.circle>

            {/* Patient node */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{ transformOrigin: '70px 90px' }}
            >
              {/* Outer glow */}
              <circle cx="70" cy="90" r="52" fill="#2E93CC" fillOpacity="0.06" />
              {/* Main circle */}
              <circle cx="70" cy="90" r="42" fill="#2E93CC" fillOpacity="0.15" stroke="#2E93CC" strokeWidth="2" />
              {/* Person icon */}
              <circle cx="70" cy="78" r="10" stroke="#2E93CC" strokeWidth="2" fill="none" />
              <path d="M 50 108 Q 50 94 70 94 Q 90 94 90 108" stroke="#2E93CC" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Label */}
              <text x="70" y="155" textAnchor="middle" fill="white" fillOpacity="0.7" fontSize="13" fontFamily="Outfit, sans-serif" fontWeight="600">Paciente</text>
            </motion.g>

            {/* Psychologist node */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              style={{ transformOrigin: '530px 90px' }}
            >
              {/* Outer glow */}
              <circle cx="530" cy="90" r="52" fill="#F0C930" fillOpacity="0.06" />
              {/* Main circle */}
              <circle cx="530" cy="90" r="42" fill="#F0C930" fillOpacity="0.15" stroke="#F0C930" strokeWidth="2" />
              {/* Stethoscope icon (simplified) */}
              <path d="M 518 78 L 518 92 Q 518 100 526 100 L 534 100 Q 542 100 542 92 L 542 78" stroke="#F0C930" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="518" cy="75" r="3" stroke="#F0C930" strokeWidth="2" fill="none" />
              <circle cx="542" cy="75" r="3" stroke="#F0C930" strokeWidth="2" fill="none" />
              <circle cx="534" cy="104" r="4" stroke="#F0C930" strokeWidth="2" fill="none" />
              {/* Label */}
              <text x="530" y="155" textAnchor="middle" fill="white" fillOpacity="0.7" fontSize="13" fontFamily="Outfit, sans-serif" fontWeight="600">Psicólogo</text>
            </motion.g>

            {/* Center match badge — below the arcs */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.4, type: 'spring', stiffness: 200 }}
              style={{ transformOrigin: '300px 145px' }}
            >
              <rect x="252" y="128" width="96" height="36" rx="18" fill="#22D3EE" fillOpacity="0.15" stroke="#22D3EE" strokeOpacity="0.4" strokeWidth="1" />
              <text x="300" y="151" textAnchor="middle" fill="#22D3EE" fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="700">94% match</text>
            </motion.g>
          </svg>
        </div>
      </ScrollReveal>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
              className="text-center py-5 px-4 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gantly-cyan/10 flex items-center justify-center mx-auto mb-3">
                <Icon size={20} className="text-gantly-cyan" />
              </div>
              <div className="font-heading text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="font-heading text-sm font-semibold text-white/80 mb-1">{stat.label}</div>
              <div className="font-body text-xs text-white/40">{stat.desc}</div>
            </motion.div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
