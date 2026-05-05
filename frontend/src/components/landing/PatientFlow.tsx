import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList, Brain, Video, HeartPulse,
  CheckCircle2, Mic, Camera, PhoneOff,
  MessageCircle, TrendingUp, Calendar,
  Smile, Meh, Frown, Star,
} from 'lucide-react';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

/* ─── Step 1: Test Mockup ─── */
function TestMockup() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gantly-blue/10 flex items-center justify-center">
            <ClipboardList size={14} className="text-gantly-blue" />
          </div>
          <span className="font-heading text-sm font-semibold text-slate-700">Test de Personalidad 16PF</span>
        </div>
        <span className="text-xs font-body text-slate-400">Pregunta 12 de 45</span>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-gantly-blue to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: '27%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-5">
        <p className="font-body text-base text-slate-700 mb-5 leading-relaxed">
          Me resulta fácil hablar con personas que acabo de conocer en situaciones sociales.
        </p>

        {/* Answer options */}
        <div className="space-y-2.5">
          {[
            { label: 'Totalmente en desacuerdo', selected: false },
            { label: 'En desacuerdo', selected: false },
            { label: 'Neutral', selected: false },
            { label: 'De acuerdo', selected: true },
            { label: 'Totalmente de acuerdo', selected: false },
          ].map((opt, i) => (
            <motion.div
              key={opt.label}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                opt.selected
                  ? 'bg-gantly-blue/5 border-gantly-blue/30 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                opt.selected ? 'border-gantly-blue' : 'border-slate-300'
              }`}>
                {opt.selected && <div className="w-2 h-2 rounded-full bg-gantly-blue" />}
              </div>
              <span className={`text-sm font-body ${opt.selected ? 'text-gantly-blue font-medium' : 'text-slate-600'}`}>
                {opt.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <button className="text-sm font-body text-slate-400">Anterior</button>
        <button className="text-sm font-heading font-semibold text-white bg-gantly-blue px-6 py-2 rounded-lg">
          Siguiente
        </button>
      </div>
    </div>
  );
}

/* ─── Step 2: Matching Mockup ─── */
function MatchingMockup() {
  const psychologists = [
    { name: 'Dra. López', specialty: 'Ansiedad y estrés', match: 94, avatar: 'ML' },
    { name: 'Dr. García', specialty: 'Terapia cognitiva', match: 89, avatar: 'JG' },
    { name: 'Dra. Martín', specialty: 'Autoestima', match: 85, avatar: 'AM' },
  ];

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
          <Brain size={14} className="text-purple-600" />
        </div>
        <span className="font-heading text-sm font-semibold text-slate-700">Tu matching personalizado</span>
      </div>

      <div className="p-5">
        {/* Profile summary */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="w-10 h-10 rounded-full bg-gantly-blue/20 flex items-center justify-center">
            <span className="text-sm font-bold text-gantly-blue">Tú</span>
          </div>
          <div className="flex-1">
            <div className="text-xs font-heading font-semibold text-slate-700">Tu perfil analizado</div>
            <div className="text-[11px] text-slate-400 font-body">16 factores de personalidad evaluados</div>
          </div>
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>

        {/* Matching results */}
        <div className="space-y-3">
          {psychologists.map((psych, i) => (
            <motion.div
              key={psych.name}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.2, duration: 0.4 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                i === 0 ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                i === 0 ? 'bg-emerald-100' : 'bg-slate-100'
              }`}>
                <span className={`text-xs font-bold ${i === 0 ? 'text-emerald-700' : 'text-slate-500'}`}>{psych.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-heading font-semibold text-slate-700">{psych.name}</div>
                <div className="text-xs text-slate-400 font-body">{psych.specialty}</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-heading font-bold ${i === 0 ? 'text-emerald-600' : 'text-gantly-blue'}`}>
                  {psych.match}%
                </div>
                <div className="text-[10px] text-slate-400">match</div>
              </div>
              {i === 0 && (
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Factors preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="mt-4 p-3 bg-slate-50 rounded-xl"
        >
          <div className="text-[11px] font-heading font-semibold text-slate-500 mb-2">Factores de compatibilidad</div>
          <div className="grid grid-cols-3 gap-2">
            {['Personalidad', 'Especialización', 'Enfoque'].map((factor) => (
              <div key={factor} className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[10px] text-slate-500 font-body">{factor}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Step 3: Video Session Mockup ─── */
function SessionMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
      {/* Video area */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-gantly-blue/15 to-cyan-500/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gantly-blue/20 flex items-center justify-center">
            <span className="font-heading text-xl text-gantly-blue/80 font-bold">P</span>
          </div>
        </div>
        {/* Therapist PiP */}
        <div className="absolute bottom-6 right-6 w-28 h-20 rounded-lg bg-slate-700/80 border border-white/20 flex items-center justify-center shadow-lg">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="font-heading text-xs text-emerald-400 font-bold">Dr</span>
          </div>
        </div>
        {/* Session timer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="absolute top-6 left-6 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5"
        >
          <span className="text-xs text-white/80 font-body">45:23</span>
        </motion.div>
      </div>

      {/* Call controls */}
      <div className="flex items-center justify-center gap-4 py-3 bg-slate-900 border-t border-slate-700">
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Mic">
          <Mic size={18} className="text-white" />
        </button>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Camera">
          <Camera size={18} className="text-white" />
        </button>
        <button className="w-12 h-10 rounded-full bg-red-500 flex items-center justify-center" aria-label="End call">
          <PhoneOff size={18} className="text-white" />
        </button>
      </div>

      {/* Floating chat sidebar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute -right-4 top-1/4 bg-white border border-slate-200 rounded-xl p-3 shadow-lg w-52 hidden xl:block"
      >
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle size={14} className="text-gantly-blue" />
          <span className="text-[11px] font-heading font-semibold text-slate-600">Chat de sesión</span>
        </div>
        <div className="space-y-1.5">
          <div className="bg-slate-100 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] text-slate-500">¿Puedes compartir los ejercicios?</span>
          </div>
          <div className="bg-gantly-blue/10 rounded-lg px-2.5 py-1.5 ml-4">
            <span className="text-[10px] text-gantly-blue">Claro, los envío al chat seguro.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Step 4: Follow-up Dashboard Mockup ─── */
function FollowUpMockup() {
  const moodData = [
    { day: 'L', value: 60, emoji: Meh },
    { day: 'M', value: 75, emoji: Smile },
    { day: 'X', value: 45, emoji: Frown },
    { day: 'J', value: 80, emoji: Smile },
    { day: 'V', value: 70, emoji: Smile },
    { day: 'S', value: 85, emoji: Smile },
    { day: 'D', value: 90, emoji: Smile },
  ];

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
          <HeartPulse size={14} className="text-emerald-600" />
        </div>
        <span className="font-heading text-sm font-semibold text-slate-700">Mi progreso</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Mood chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold text-slate-600">Estado de ánimo semanal</span>
            <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp size={10} /> +15%
            </span>
          </div>
          <div className="flex items-end gap-2 h-20">
            {moodData.map((d, i) => (
              <motion.div
                key={d.day}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                style={{ transformOrigin: 'bottom' }}
              >
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-gantly-blue to-cyan-400"
                  style={{ height: `${d.value * 0.7}px` }}
                />
                <span className="text-[9px] text-slate-400 font-body">{d.day}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <span className="text-xs font-heading font-semibold text-slate-600 mb-2 block">Tareas terapéuticas</span>
          <div className="space-y-2">
            {[
              { task: 'Ejercicio de respiración 4-7-8', done: true },
              { task: 'Diario de gratitud', done: true },
              { task: 'Meditación guiada (10 min)', done: false },
            ].map((t, i) => (
              <motion.div
                key={t.task}
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1 + i * 0.15, duration: 0.3 }}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  t.done ? 'bg-emerald-100' : 'border-2 border-slate-200'
                }`}>
                  {t.done && <CheckCircle2 size={14} className="text-emerald-500" />}
                </div>
                <span className={`text-xs font-body flex-1 ${t.done ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                  {t.task}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next session */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100"
        >
          <Calendar size={16} className="text-gantly-blue" />
          <div>
            <div className="text-xs font-heading font-semibold text-slate-700">Próxima sesión</div>
            <div className="text-[11px] text-slate-400 font-body">Jueves 15, 17:00 — Dr. García</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Step config ─── */
const steps = [
  {
    key: 'step1',
    icon: ClipboardList,
    color: '#2E93CC',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-gantly-blue',
    Mockup: TestMockup,
  },
  {
    key: 'step2',
    icon: Brain,
    color: '#7C3AED',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    Mockup: MatchingMockup,
  },
  {
    key: 'step3',
    icon: Video,
    color: '#0891B2',
    bgColor: 'bg-cyan-50',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-700',
    Mockup: SessionMockup,
  },
  {
    key: 'step4',
    icon: HeartPulse,
    color: '#059669',
    bgColor: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    Mockup: FollowUpMockup,
  },
];

/* ─── Main Section ─── */
export default function PatientFlow() {
  const { t } = useTranslation();

  return (
    <SectionWrapper id="flow" className="bg-gradient-to-b from-white to-gantly-cloud">
      {/* Section header */}
      <div className="text-center mb-20">
        <ScrollReveal>
          <span className="inline-block text-xs font-heading font-semibold text-gantly-blue uppercase tracking-widest mb-3">
            Paso a paso
          </span>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text mb-4">
            {t('landing.flow.title')}
          </h2>
          <p className="font-body text-lg text-gantly-muted max-w-lg mx-auto">
            Desde el primer test hasta el seguimiento continuo, en cuatro pasos simples.
          </p>
        </ScrollReveal>
      </div>

      {/* Steps */}
      <div className="relative max-w-6xl mx-auto">
        {/* Vertical timeline (desktop) */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />

        <div className="space-y-24 lg:space-y-32">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isEven = i % 2 === 0;
            const { Mockup } = step;

            return (
              <div key={step.key} className="relative">
                {/* Timeline dot (desktop) */}
                <div className="hidden lg:flex absolute left-1/2 top-8 -translate-x-1/2 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className={`w-12 h-12 rounded-full ${step.iconBg} flex items-center justify-center border-4 border-white shadow-md`}
                  >
                    <Icon size={20} className={step.iconColor} />
                  </motion.div>
                </div>

                {/* Content grid */}
                <div className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                  isEven ? '' : 'lg:direction-rtl'
                }`}>
                  {/* Text side */}
                  <ScrollReveal
                    direction={isEven ? 'left' : 'right'}
                    delay={0.1}
                    className={isEven ? 'lg:text-right lg:pr-16' : 'lg:text-left lg:pl-16 lg:order-2'}
                  >
                    {/* Mobile step indicator */}
                    <div className="flex items-center gap-3 mb-4 lg:hidden">
                      <div className={`w-10 h-10 rounded-full ${step.iconBg} flex items-center justify-center`}>
                        <Icon size={18} className={step.iconColor} />
                      </div>
                      <span className="text-sm font-heading font-bold text-slate-300">
                        0{i + 1}
                      </span>
                    </div>

                    <div className="hidden lg:block mb-2">
                      <span className="text-6xl font-heading font-bold" style={{ color: step.color, opacity: 0.1 }}>
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="font-heading text-2xl lg:text-3xl font-bold text-gantly-text mb-3">
                      {t(`landing.flow.${step.key}_title`)}
                    </h3>
                    <p className="font-body text-base text-gantly-muted leading-relaxed max-w-md">
                      {t(`landing.flow.${step.key}_desc`)}
                    </p>
                  </ScrollReveal>

                  {/* Mockup side */}
                  <ScrollReveal
                    direction={isEven ? 'right' : 'left'}
                    delay={0.3}
                    className={`relative ${isEven ? 'lg:pl-16 lg:order-2' : 'lg:pr-16 lg:order-1'}`}
                  >
                    <Mockup />
                  </ScrollReveal>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
