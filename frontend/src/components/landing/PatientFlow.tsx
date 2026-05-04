import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Brain, Video, HeartPulse } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

const steps = [
  { key: 'step1', icon: ClipboardList, color: '#2E93CC', accent: 'bg-[#2E93CC]' },
  { key: 'step2', icon: Brain, color: '#22D3EE', accent: 'bg-[#22D3EE]' },
  { key: 'step3', icon: Video, color: '#F0C930', accent: 'bg-[#F0C930]' },
  { key: 'step4', icon: HeartPulse, color: '#059669', accent: 'bg-[#059669]' },
];

export default function PatientFlow() {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="flow" className="bg-gradient-to-b from-gantly-navy to-[#0D1F35]" dark>
      <div className="text-center mb-16">
        <ScrollReveal>
          <span className="inline-block text-xs font-heading font-semibold text-gantly-cyan/70 uppercase tracking-widest mb-3">
            Paso a paso
          </span>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-white mb-4">
            {t('landing.flow.title')}
          </h2>
          <p className="font-body text-white/40 max-w-lg mx-auto">
            Desde el primer test hasta el seguimiento continuo, en cuatro pasos simples.
          </p>
        </ScrollReveal>
      </div>

      {/* Timeline connector (desktop) */}
      <div className="hidden lg:block relative max-w-5xl mx-auto mb-0">
        <div className="absolute top-[52px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px bg-white/10" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <ScrollReveal key={step.key} delay={i * 0.12}>
              <div className="relative group">
                {/* Card */}
                <div className="relative bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300">
                  {/* Step number */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: step.color + '15' }}
                    >
                      <Icon size={22} style={{ color: step.color }} />
                    </div>
                    <span
                      className="text-4xl font-heading font-bold opacity-[0.08]"
                      style={{ color: step.color }}
                    >
                      0{i + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-heading text-base font-semibold text-white mb-2">
                    {t(`landing.flow.${step.key}_title`)}
                  </h3>
                  <p className="font-body text-sm text-white/40 leading-relaxed">
                    {t(`landing.flow.${step.key}_desc`)}
                  </p>

                  {/* Bottom accent line */}
                  <motion.div
                    className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full ${step.accent} opacity-0 group-hover:opacity-40`}
                    style={{ transition: 'opacity 0.3s ease' }}
                  />
                </div>

                {/* Arrow connector (desktop, not on last) */}
                {i < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-[52px] text-white/15">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6H10M10 6L6 2M10 6L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
