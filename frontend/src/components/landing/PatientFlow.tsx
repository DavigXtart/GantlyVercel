import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ClipboardList, Brain, Video, HeartPulse } from 'lucide-react';
import ScrollReveal from './shared/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

const icons = [ClipboardList, Brain, Video, HeartPulse];
const colors = ['#2E93CC', '#22D3EE', '#F0C930', '#059669'];

export default function PatientFlow() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isDesktop || !containerRef.current || !panelsRef.current) return;
    const panels = panelsRef.current;
    const totalWidth = panels.scrollWidth - window.innerWidth;

    const tween = gsap.to(panels, {
      x: -totalWidth,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        end: () => `+=${totalWidth}`,
        onUpdate: (self) => setProgress(self.progress),
      },
    });

    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [isDesktop]);

  const steps = [
    { key: 'step1', icon: icons[0], color: colors[0] },
    { key: 'step2', icon: icons[1], color: colors[1] },
    { key: 'step3', icon: icons[2], color: colors[2] },
    { key: 'step4', icon: icons[3], color: colors[3] },
  ];

  if (!isDesktop) {
    return (
      <section id="flow" className="py-28 bg-white px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-gantly-text mb-12 text-center">
            {t('landing.flow.title')}
          </h2>
          <div className="space-y-10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.key} delay={i * 0.1}>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: step.color + '1A' }}>
                      <Icon size={24} style={{ color: step.color }} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-gantly-text">
                        {t(`landing.flow.${step.key}_title`)}
                      </h3>
                      <p className="font-body text-gantly-muted mt-1">
                        {t(`landing.flow.${step.key}_desc`)}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="flow" ref={containerRef} className="relative h-screen bg-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-20">
        <div className="h-full bg-gantly-blue transition-none" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="absolute top-8 left-8 z-20">
        <h2 className="font-heading text-2xl font-bold text-gantly-text">{t('landing.flow.title')}</h2>
      </div>
      <div ref={panelsRef} className="flex h-full items-center">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex-shrink-0 w-screen h-full flex items-center justify-center px-20">
              <div className="max-w-lg">
                <div className="text-8xl font-heading font-bold mb-6" style={{ color: step.color + '20' }}>
                  0{i + 1}
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: step.color + '1A' }}>
                  <Icon size={32} style={{ color: step.color }} />
                </div>
                <h3 className="font-heading text-3xl font-bold text-gantly-text mb-4">
                  {t(`landing.flow.${step.key}_title`)}
                </h3>
                <p className="font-body text-lg text-gantly-muted leading-relaxed">
                  {t(`landing.flow.${step.key}_desc`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
