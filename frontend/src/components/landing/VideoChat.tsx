import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Mic, Camera, PhoneOff, Video, MessageCircle, FileText } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

function VideoMockup() {
  return (
    <div className="rounded-2xl bg-gantly-navy overflow-hidden border border-white/10 shadow-2xl">
      <div className="relative aspect-video bg-gradient-to-br from-gantly-navy to-gantly-blue/20 p-4">
        <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gantly-blue/20 flex items-center justify-center">
            <span className="font-heading text-xl text-gantly-blue font-bold">P</span>
          </div>
        </div>
        <div className="absolute bottom-6 right-6 w-28 h-20 rounded-lg bg-gantly-navy/80 border border-white/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gantly-gold/20 flex items-center justify-center">
            <span className="font-heading text-xs text-gantly-gold font-bold">Dr</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 py-3 bg-gantly-navy/90 border-t border-white/10">
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Mic"><Mic size={18} className="text-white" /></button>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Camera"><Camera size={18} className="text-white" /></button>
        <button className="w-12 h-10 rounded-full bg-red-500 flex items-center justify-center" aria-label="End call"><PhoneOff size={18} className="text-white" /></button>
      </div>
    </div>
  );
}

function ChatMockup() {
  const messages = [
    { from: 'psych', text: '¿Cómo te has sentido esta semana?', delay: 0.3 },
    { from: 'patient', text: 'Mejor que la anterior, he seguido los ejercicios.', delay: 0.8 },
    { from: 'psych', text: '¡Genial! Eso es un gran avance. Vamos a revisar tu diario de ánimo.', delay: 1.4 },
  ];

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
      <div className="px-4 py-3 bg-gantly-cloud border-b border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gantly-blue/20 flex items-center justify-center">
          <span className="text-xs font-bold text-gantly-blue">Dr</span>
        </div>
        <span className="font-heading text-sm font-semibold text-gantly-text">Dr. García</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-gantly-emerald" />
      </div>
      <div className="p-4 space-y-3 min-h-[240px]">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: msg.delay, duration: 0.4 }}
            className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.from === 'psych' ? 'bg-gantly-cloud text-gantly-text' : 'bg-gantly-blue text-white ml-auto'}`}>
            {msg.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function VideoChat() {
  const { t } = useTranslation();
  const chips = [
    { icon: Video, label: t('landing.videochat.chip1') },
    { icon: MessageCircle, label: t('landing.videochat.chip2') },
    { icon: FileText, label: t('landing.videochat.chip3') },
  ];

  return (
    <SectionWrapper id="videochat">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text mb-4">{t('landing.videochat.title')}</h2>
          <p className="font-body text-lg text-gantly-muted">{t('landing.videochat.subtitle')}</p>
        </ScrollReveal>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-center">
        <ScrollReveal direction="left" className="lg:col-span-3">
          <VideoMockup />
        </ScrollReveal>
        <ScrollReveal direction="right" className="lg:col-span-2">
          <ChatMockup />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.8, duration: 0.4 }}
            className="flex items-center gap-2 mt-4 bg-gantly-emerald/10 border border-gantly-emerald/20 rounded-xl px-4 py-2.5 w-fit">
            <Shield size={16} className="text-gantly-emerald" />
            <span className="font-body text-sm font-medium text-gantly-emerald">{t('landing.videochat.badge')}</span>
          </motion.div>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <div key={chip.label} className="flex items-center gap-2 bg-white rounded-full px-5 py-2.5 border border-gray-200 shadow-sm">
                <Icon size={16} className="text-gantly-blue" />
                <span className="font-body text-sm text-gantly-text">{chip.label}</span>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </SectionWrapper>
  );
}
