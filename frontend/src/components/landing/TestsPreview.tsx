import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

const radarData = [
  { label: 'A', value: 8 },
  { label: 'E', value: 7 },
  { label: 'F', value: 5 },
  { label: 'G', value: 7 },
  { label: 'H', value: 8 },
  { label: 'I', value: 4 },
  { label: 'L', value: 6 },
  { label: 'M', value: 8 },
];

function RadarChart() {
  const cx = 150, cy = 150, r = 110;
  const n = radarData.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const dist = (value / 10) * r;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  };

  const dataPoints = radarData.map((d, i) => getPoint(i, d.value));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
      {/* Grid circles */}
      {[2, 4, 6, 8, 10].map((v) => (
        <circle key={v} cx={cx} cy={cy} r={(v / 10) * r} fill="none" stroke="#2E93CC" strokeOpacity={0.1} strokeWidth={1} />
      ))}
      {/* Axis lines */}
      {radarData.map((_, i) => {
        const p = getPoint(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#2E93CC" strokeOpacity={0.15} strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <motion.path
        d={pathD}
        fill="#2E93CC"
        fillOpacity={0.15}
        stroke="#2E93CC"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#2E93CC"
          stroke="white"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 + i * 0.05 }}
        />
      ))}
      {/* Labels */}
      {radarData.map((d, i) => {
        const p = getPoint(i, 12);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-gantly-muted text-xs font-heading font-bold">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

function BipolarBar({ label, value, maxLabel }: { label: string; value: number; maxLabel: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 text-right text-gantly-muted font-body truncate">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gantly-blue rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 10}%` }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="w-24 text-gantly-muted font-body truncate">{maxLabel}</span>
    </div>
  );
}

export default function TestsPreview() {
  const { t } = useTranslation();
  const badges = [t('landing.tests.badge1'), t('landing.tests.badge2'), t('landing.tests.badge3')];

  return (
    <SectionWrapper id="tests" className="bg-gradient-to-b from-gantly-cloud to-gantly-ice">
      <div className="text-center mb-16">
        <ScrollReveal>
          <h2 className="font-heading text-3xl lg:text-5xl font-bold text-gantly-text mb-4">
            {t('landing.tests.title')}
          </h2>
          <p className="font-body text-lg text-gantly-muted">{t('landing.tests.subtitle')}</p>
        </ScrollReveal>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
        <ScrollReveal>
          <RadarChart />
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="space-y-4">
            <BipolarBar label="Reservado" value={8} maxLabel="Abierto" />
            <BipolarBar label="Sumiso" value={7} maxLabel="Dominante" />
            <BipolarBar label="Serio" value={5} maxLabel="Animado" />
            <BipolarBar label="Práctico" value={8} maxLabel="Imaginativo" />
            <BipolarBar label="Sereno" value={4} maxLabel="Aprensivo" />
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            {badges.map((badge) => (
              <span key={badge} className="bg-gantly-blue/10 text-gantly-blue font-heading text-xs font-semibold px-4 py-2 rounded-full">
                {badge}
              </span>
            ))}
          </div>

          <p className="font-body text-gantly-muted mt-6">{t('landing.tests.description')}</p>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}
