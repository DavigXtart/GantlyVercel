import { useTranslation } from 'react-i18next';
import { Calendar, ClipboardCheck, Receipt, Users } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';
import GlowCard from './shared/GlowCard';
import TiltCard from './shared/TiltCard';

const cards = [
  { key: 'card1', icon: Calendar, color: '#2E93CC' },
  { key: 'card2', icon: ClipboardCheck, color: '#22D3EE' },
  { key: 'card3', icon: Receipt, color: '#F0C930' },
  { key: 'card4', icon: Users, color: '#059669' },
];

interface ForProfessionalsProps {
  onJoin: () => void;
}

export default function ForProfessionals({ onJoin }: ForProfessionalsProps) {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="professionals" dark className="bg-[#0F172A]">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative">
        <div className="text-center mb-16">
          <ScrollReveal>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-white mb-4">
              {t('landing.professionals.title')}
            </h2>
            <p className="font-body text-lg text-white/50">{t('landing.professionals.subtitle')}</p>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <ScrollReveal key={card.key} delay={i * 0.1}>
                <TiltCard>
                  <GlowCard glowColor={card.color}>
                    <Icon size={28} style={{ color: card.color }} className="mb-4" />
                    <h3 className="font-heading text-lg font-semibold text-white mb-2">
                      {t(`landing.professionals.${card.key}_title`)}
                    </h3>
                    <p className="font-body text-sm text-white/60 leading-relaxed">
                      {t(`landing.professionals.${card.key}_desc`)}
                    </p>
                  </GlowCard>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal>
          <div className="text-center mt-12">
            <button
              onClick={onJoin}
              className="px-8 py-3.5 rounded-xl bg-gantly-gold text-gantly-navy font-heading font-semibold text-base hover:bg-gantly-gold/90 transition-all duration-200 cursor-pointer"
            >
              {t('landing.professionals.cta')}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}
