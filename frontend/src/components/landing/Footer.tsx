import { useTranslation } from 'react-i18next';
import LogoSvg from '../../assets/logo-gantly.svg';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#070E1A] text-white/60 py-16 px-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo + tagline */}
        <div>
          <img src={LogoSvg} alt="Gantly" className="h-6 brightness-0 invert mb-4" />
          <p className="font-body text-sm leading-relaxed">{t('landing.footer.tagline')}</p>
        </div>

        {/* Platform links */}
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

        {/* Legal links */}
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

        {/* Contact placeholder */}
        <div>
          <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider mb-4">
            {t('landing.footer.contact')}
          </h4>
          <p className="font-body text-sm">info@gantly.com</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-12 pt-8 border-t border-white/10 text-center">
        <p className="font-body text-xs">{t('landing.footer.copyright')}</p>
      </div>
    </footer>
  );
}
