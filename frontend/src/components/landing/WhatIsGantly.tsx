import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SectionWrapper from './shared/SectionWrapper';
import ScrollReveal from './shared/ScrollReveal';

function AnimatedCounter({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-heading text-4xl lg:text-5xl font-bold text-gantly-blue">
        {count.toLocaleString()}+
      </div>
      <div className="font-body text-gantly-muted mt-1 text-sm">{label}</div>
    </div>
  );
}

export default function WhatIsGantly() {
  const { t } = useTranslation();
  const words = t('landing.what.description').split(' ');

  return (
    <SectionWrapper id="what" className="relative">
      {/* Gradient blobs */}
      <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-gantly-cyan/5 blur-3xl" />
      <div className="absolute bottom-20 -right-40 w-96 h-96 rounded-full bg-gantly-gold/5 blur-3xl" />

      <div className="relative max-w-4xl mx-auto">
        <p className="font-heading text-2xl lg:text-4xl font-semibold leading-relaxed text-gantly-text mb-16">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.15 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ delay: i * 0.03, duration: 0.4 }}
              className="inline-block mr-[0.3em]"
            >
              {word}
            </motion.span>
          ))}
        </p>

        <ScrollReveal>
          <div className="grid grid-cols-3 gap-8">
            <AnimatedCounter target={2000} label={t('landing.what.stat_patients')} />
            <AnimatedCounter target={500} label={t('landing.what.stat_psychologists')} />
            <AnimatedCounter target={15000} label={t('landing.what.stat_sessions')} />
          </div>
        </ScrollReveal>
      </div>
    </SectionWrapper>
  );
}
