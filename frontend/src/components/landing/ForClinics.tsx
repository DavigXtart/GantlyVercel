import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, Send, X } from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

function DashboardPreview() {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
      {/* Fake top bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gantly-navy border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-white/50 font-body ml-2">clinic.gantly.com</span>
      </div>
      {/* Fake dashboard content */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-heading text-sm font-semibold text-gantly-text">Panel de clínica</span>
          <span className="text-xs bg-gantly-emerald/10 text-gantly-emerald px-2 py-1 rounded-md font-medium">Activa</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Psicólogos', value: '12' },
            { label: 'Pacientes', value: '184' },
            { label: 'Sesiones/mes', value: '340' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gantly-cloud rounded-lg p-3 text-center">
              <div className="font-heading text-xl font-bold text-gantly-blue">{stat.value}</div>
              <div className="text-xs text-gantly-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
        {/* Fake chart bars */}
        <div className="flex items-end gap-2 h-20 pt-4">
          {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
              className="flex-1 rounded-t bg-gantly-blue/70"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ForClinics() {
  const { t } = useTranslation();
  const features = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5'];
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoName, setDemoName] = useState('');
  const [demoSent, setDemoSent] = useState(false);

  return (
    <SectionWrapper id="clinics" className="!pb-16 lg:!pb-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <ScrollReveal>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text mb-4">
              {t('landing.clinics.title')}
            </h2>
            <p className="font-body text-lg text-gantly-muted mb-8">{t('landing.clinics.subtitle')}</p>
          </ScrollReveal>

          <div className="space-y-4">
            {features.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-gantly-emerald/10 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-gantly-emerald" />
                </div>
                <span className="font-body text-gantly-text">{t(`landing.clinics.${key}`)}</span>
              </motion.div>
            ))}
          </div>

          <ScrollReveal>
            <button
              onClick={() => setShowDemoForm(true)}
              className="mt-8 px-8 py-3.5 rounded-xl border-2 border-gantly-blue text-gantly-blue font-heading font-semibold hover:bg-gantly-blue/5 transition-all duration-200 cursor-pointer"
            >
              {t('landing.clinics.cta')}
            </button>
          </ScrollReveal>

          {/* Demo request form */}
          {showDemoForm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-lg max-w-md"
            >
              {demoSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-gantly-emerald/10 flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="text-gantly-emerald" />
                  </div>
                  <p className="font-heading font-semibold text-gantly-text">¡Solicitud enviada!</p>
                  <p className="font-body text-sm text-slate-500 mt-1">Nos pondremos en contacto contigo pronto.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-heading font-semibold text-gantly-text">{t('landing.clinics.cta')}</h4>
                    <button onClick={() => setShowDemoForm(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nombre de la clínica"
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-slate-200 font-body text-sm focus:outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                    />
                    <input
                      type="email"
                      placeholder="Email de contacto"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-slate-200 font-body text-sm focus:outline-none focus:border-gantly-blue focus:ring-1 focus:ring-gantly-blue/20"
                    />
                    <button
                      onClick={() => {
                        if (demoEmail) {
                          window.open(`mailto:info@gantly.es?subject=Solicitud demo clínica&body=Clínica: ${demoName}%0AEmail: ${demoEmail}`, '_self');
                          setDemoSent(true);
                        }
                      }}
                      disabled={!demoEmail}
                      className="w-full h-9 bg-gantly-blue text-white font-heading font-semibold text-sm rounded-md hover:bg-sky-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      Enviar solicitud
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>

        <ScrollReveal direction="right">
          <DashboardPreview />
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}
