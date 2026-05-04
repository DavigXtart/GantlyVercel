import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, HeartPulse, BadgeCheck, CreditCard, Video } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

const badges = [
  { key: 'badge1', icon: Shield, color: '#059669' },
  { key: 'badge2', icon: Lock, color: '#2E93CC' },
  { key: 'badge3', icon: HeartPulse, color: '#22D3EE' },
  { key: 'badge4', icon: BadgeCheck, color: '#F0C930' },
  { key: 'badge5', icon: CreditCard, color: '#2E93CC' },
  { key: 'badge6', icon: Video, color: '#059669' },
];

export default function TrustSecurity() {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="trust" className="bg-white">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text">
            {t('landing.trust.title')}
          </h2>
        </ScrollReveal>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-gantly-cloud border border-gray-100 hover:border-gray-200 transition-colors duration-200"
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: badge.color + '15' }}
              >
                <Icon size={20} style={{ color: badge.color }} />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-gantly-text mb-1">
                  {t(`landing.trust.${badge.key}_title`)}
                </h3>
                <p className="font-body text-xs text-gantly-muted leading-relaxed">
                  {t(`landing.trust.${badge.key}_desc`)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
