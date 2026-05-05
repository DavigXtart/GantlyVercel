import { useTranslation } from 'react-i18next';
import { ClipboardList, Brain, Video, HeartPulse } from 'lucide-react';
import LogoSvg from '../../assets/logo-gantly.svg';

const journeySteps = [
  { icon: ClipboardList, label: 'Test', color: '#2E93CC' },
  { icon: Brain, label: 'Matching', color: '#7C3AED' },
  { icon: Video, label: 'Sesión', color: '#0891B2' },
  { icon: HeartPulse, label: 'Bienestar', color: '#059669' },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#070E1A] text-white/60 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        {/* Journey mini-map */}
        <div className="relative flex items-center justify-center max-w-md mx-auto mb-14">
          {/* Connecting line behind icons */}
          <div className="absolute top-[18px] left-[36px] right-[36px] h-px bg-white/10" />

          <div className="relative z-10 flex items-center justify-between w-full">
            {journeySteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: step.color + '20' }}
                  >
                    <Icon size={16} style={{ color: step.color }} />
                  </div>
                  <span className="text-[10px] font-body text-white/40">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid: logo + links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <img src={LogoSvg} alt="Gantly" className="h-6 brightness-0 invert mb-4" />
            <p className="font-body text-sm leading-relaxed">{t('landing.footer.tagline')}</p>
          </div>

          <div>
            <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('landing.footer.platform')}
            </h4>
            <ul className="space-y-2 font-body text-sm">
              <li><a href="/about" className="hover:text-white transition-colors duration-200">{t('landing.footer.about')}</a></li>
              <li><a href="/pricing" className="hover:text-white transition-colors duration-200">{t('landing.footer.pricing')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.blog')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.contact')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('landing.footer.legal')}
            </h4>
            <ul className="space-y-2 font-body text-sm">
              <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.privacy')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.terms')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">{t('landing.footer.cookies')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('landing.footer.contact')}
            </h4>
            <p className="font-body text-sm">info@gantly.com</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 border-t border-white/10 text-center">
        <p className="font-body text-xs">{t('landing.footer.copyright')}</p>
      </div>
    </footer>
  );
}
