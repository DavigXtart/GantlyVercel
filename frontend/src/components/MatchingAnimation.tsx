import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Target, BarChart3, MessageCircle, Users, Zap, Pill, UserCheck, Sparkles } from 'lucide-react';

interface MatchingAnimationProps {
  onComplete: () => void;
}

interface MatchingStep {
  title: string;
  shortTitle: string;
  weight: number;
  icon: React.ReactNode;
  color: string;
}

const STEPS: MatchingStep[] = [
  { title: 'Experiencia Clínica', shortTitle: 'Experiencia', weight: 15, icon: <GraduationCap size={20} />, color: '#2E93CC' },
  { title: 'Áreas de Trabajo', shortTitle: 'Áreas', weight: 20, icon: <Target size={20} />, color: '#059669' },
  { title: 'Complejidad Clínica', shortTitle: 'Complejidad', weight: 10, icon: <BarChart3 size={20} />, color: '#F0C930' },
  { title: 'Estilo Terapéutico', shortTitle: 'Estilo', weight: 12, icon: <MessageCircle size={20} />, color: '#22D3EE' },
  { title: 'Población Objetivo', shortTitle: 'Población', weight: 8, icon: <Users size={20} />, color: '#10b981' },
  { title: 'Crisis Vitales', shortTitle: 'Crisis', weight: 10, icon: <Zap size={20} />, color: '#f97316' },
  { title: 'Medicación', shortTitle: 'Medicación', weight: 10, icon: <Pill size={20} />, color: '#8b5cf6' },
  { title: 'Preferencia de Género', shortTitle: 'Género', weight: 5, icon: <UserCheck size={20} />, color: '#ec4899' },
];

/* ── Floating particles background ─────────────────────────── */

function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.1,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.5, p.opacity * 1.2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

/* ── Orbital ring with nodes ───────────────────────────────── */

function OrbitalRing({
  activeStep,
  totalSteps,
  phase,
}: {
  activeStep: number;
  totalSteps: number;
  phase: 'scanning' | 'converging' | 'done';
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const orbitalR = 110;
  const nodeR = 18;

  const nodes = STEPS.map((step, i) => {
    const angle = (i / totalSteps) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + orbitalR * Math.cos(angle),
      y: cy + orbitalR * Math.sin(angle),
      step,
      index: i,
      active: i < activeStep,
      current: i === activeStep,
    };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Orbital track */}
        <circle
          cx={cx}
          cy={cy}
          r={orbitalR}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* Inner rings */}
        {[70, 45, 20].map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={0.5}
          />
        ))}

        {/* Connection lines from active nodes to center */}
        {nodes.filter(n => n.active).map((n) => (
          <motion.line
            key={`line-${n.index}`}
            x1={n.x}
            y1={n.y}
            x2={cx}
            y2={cy}
            stroke={n.step.color}
            strokeWidth={1}
            strokeOpacity={0.2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </svg>

      {/* Rotating scanner beam */}
      {phase === 'scanning' && (
        <motion.div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="absolute w-1/2 h-[2px] top-1/2 left-1/2 origin-left"
            style={{
              background: 'linear-gradient(90deg, rgba(46,147,204,0.6) 0%, transparent 100%)',
            }}
          />
        </motion.div>
      )}

      {/* Center core */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative"
          animate={phase === 'done'
            ? { scale: [1, 1.3, 1] }
            : { scale: [1, 1.08, 1] }
          }
          transition={phase === 'done'
            ? { duration: 0.6 }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {/* Outer glow */}
          <div className="absolute -inset-4 rounded-full bg-gantly-blue/20 blur-xl" />
          {/* Core circle */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gantly-blue to-cyan-500 flex items-center justify-center shadow-lg shadow-gantly-blue/30">
            {phase === 'done' ? (
              <Sparkles size={28} className="text-white" />
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-7 h-7 rounded-full border-2 border-white/80 border-t-transparent" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Orbital nodes */}
      {nodes.map((n) => (
        <motion.div
          key={n.index}
          className="absolute"
          style={{
            left: n.x - nodeR,
            top: n.y - nodeR,
            width: nodeR * 2,
            height: nodeR * 2,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            phase === 'converging'
              ? { x: cx - n.x, y: cy - n.y, scale: 0, opacity: 0 }
              : { scale: 1, opacity: 1 }
          }
          transition={
            phase === 'converging'
              ? { duration: 0.8, delay: n.index * 0.05, ease: 'easeIn' }
              : { duration: 0.4, delay: n.index * 0.08 }
          }
        >
          {/* Node glow */}
          {(n.active || n.current) && (
            <motion.div
              className="absolute inset-0 rounded-full blur-md"
              style={{ background: n.step.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          {/* Node circle */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center border-2 transition-all duration-300"
            style={{
              background: n.active || n.current
                ? n.step.color
                : 'rgba(255,255,255,0.05)',
              borderColor: n.active || n.current
                ? n.step.color
                : 'rgba(255,255,255,0.15)',
              color: n.active || n.current ? 'white' : 'rgba(255,255,255,0.3)',
            }}
          >
            {n.active ? (
              <motion.svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.svg>
            ) : (
              <span className="text-[10px] font-bold">{n.step.weight}%</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Step info card ────────────────────────────────────────── */

function StepInfo({ step, index }: { step: MatchingStep; index: number }) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${step.color}25`, color: step.color }}
      >
        {step.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-heading font-semibold text-sm">{step.title}</p>
        <p className="text-white/50 text-xs font-body">Peso: {step.weight}%</p>
      </div>
      <motion.div
        className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* ── Progress pills ────────────────────────────────────────── */

function ProgressPills({ activeStep, total }: { activeStep: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="h-1.5 rounded-full"
          style={{
            background: i < activeStep
              ? STEPS[i].color
              : i === activeStep
                ? 'rgba(255,255,255,0.5)'
                : 'rgba(255,255,255,0.1)',
          }}
          animate={{
            width: i === activeStep ? 24 : i < activeStep ? 16 : 8,
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

/* ── Completion burst ──────────────────────────────────────── */

function CompletionBurst() {
  const rays = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      angle: (i / 16) * 360,
      length: 60 + Math.random() * 80,
      color: STEPS[i % STEPS.length].color,
    })), []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rays.map((ray) => (
        <motion.div
          key={ray.id}
          className="absolute w-[2px] origin-bottom rounded-full"
          style={{
            height: 0,
            background: `linear-gradient(to top, transparent, ${ray.color})`,
            rotate: `${ray.angle}deg`,
            bottom: '50%',
          }}
          animate={{
            height: [0, ray.length, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 1,
            delay: ray.id * 0.03,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export default function MatchingAnimation({ onComplete }: MatchingAnimationProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [phase, setPhase] = useState<'scanning' | 'converging' | 'done'>('scanning');

  const advanceStep = useCallback(() => {
    setActiveStep((prev) => {
      if (prev < STEPS.length) return prev + 1;
      return prev;
    });
  }, []);

  // Step advancement
  useEffect(() => {
    if (phase !== 'scanning') return;
    if (activeStep >= STEPS.length) {
      const t = setTimeout(() => setPhase('converging'), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(advanceStep, 1200);
    return () => clearTimeout(t);
  }, [activeStep, phase, advanceStep]);

  // Converging → done
  useEffect(() => {
    if (phase !== 'converging') return;
    const t = setTimeout(() => setPhase('done'), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  // Done → callback
  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(onComplete, 2500);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  const currentStep = activeStep < STEPS.length ? STEPS[activeStep] : null;
  const progress = Math.min((activeStep / STEPS.length) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#070E1B]">
        {/* Animated gradient blobs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(circle, #2E93CC 0%, transparent 70%)' }}
          animate={{
            x: [-100, 100, -50, 80, -100],
            y: [-50, 80, -100, 50, -50],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
          animate={{
            x: [50, -80, 30, -60, 50],
            y: [30, -60, 80, -40, 30],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <FloatingParticles />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 flex flex-col items-center">

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {phase === 'scanning' && (
              <motion.h1
                key="scanning"
                className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Analizando tu perfil
              </motion.h1>
            )}
            {phase === 'converging' && (
              <motion.h1
                key="converging"
                className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Calculando afinidad
              </motion.h1>
            )}
            {phase === 'done' && (
              <motion.h1
                key="done"
                className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                Match encontrado
              </motion.h1>
            )}
          </AnimatePresence>
          <p className="text-white/40 text-sm font-body">
            {phase === 'scanning' && 'Comparando con nuestros profesionales'}
            {phase === 'converging' && 'Procesando resultados...'}
            {phase === 'done' && 'Hemos encontrado tu psicólogo ideal'}
          </p>
        </motion.div>

        {/* Orbital visualization */}
        <div className="relative mb-8">
          <OrbitalRing
            activeStep={activeStep}
            totalSteps={STEPS.length}
            phase={phase}
          />
          {phase === 'done' && <CompletionBurst />}
        </div>

        {/* Progress pills */}
        {phase === 'scanning' && (
          <motion.div
            className="mb-6 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ProgressPills activeStep={activeStep} total={STEPS.length} />
          </motion.div>
        )}

        {/* Current step info */}
        <div className="w-full min-h-[72px]">
          <AnimatePresence mode="wait">
            {phase === 'scanning' && currentStep && (
              <StepInfo key={activeStep} step={currentStep} index={activeStep} />
            )}
            {phase === 'converging' && (
              <motion.div
                key="converging-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.p
                  className="text-5xl font-heading font-bold text-white tabular-nums"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {Math.round(progress)}%
                </motion.p>
              </motion.div>
            )}
            {phase === 'done' && (
              <motion.div
                key="done-info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <motion.button
                  onClick={onComplete}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gantly-blue to-cyan-500 text-white font-heading font-semibold text-sm cursor-pointer border-none shadow-lg shadow-gantly-blue/25 hover:shadow-gantly-blue/40 transition-shadow"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Ver mis resultados
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Completed criteria list */}
        {phase === 'scanning' && activeStep > 0 && (
          <motion.div
            className="mt-6 w-full flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {STEPS.slice(0, activeStep).map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-heading font-medium bg-white/[0.06] border border-white/10 text-white/60"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 flex-shrink-0" style={{ color: s.color }}>
                  <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {s.shortTitle}
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
