import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import LogoSvg from '../../assets/logo-gantly.svg';

interface NavbarProps {
  onLogin: () => void;
  onStart: () => void;
}

const NAV_LINKS = [
  { key: 'patients', href: 'flow' },
  { key: 'professionals', href: 'professionals' },
  { key: 'clinics', href: 'clinics' },
  { key: 'tests', href: 'tests' },
] as const;

export default function Navbar({ onLogin, onStart }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavLink = (href: string) => {
    const el = document.getElementById(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  };

  return (
    <nav
      className={`fixed top-4 left-4 right-4 z-50 rounded-2xl transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 shadow-lg shadow-slate-200/50 border border-slate-200/60'
          : 'bg-white/15 border border-white/20'
      }`}
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div className="flex items-center justify-between px-5 py-3">
        {/* Logo */}
        <div className="flex-shrink-0">
          <img
            src={LogoSvg}
            alt="Gantly"
            className={`h-7 cursor-pointer transition-all duration-300 ${scrolled ? '' : 'brightness-0 invert'}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        </div>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(({ key, href }) => (
            <li key={key}>
              <button
                onClick={() => handleNavLink(href)}
                className={`text-[15px] font-medium font-body transition-colors cursor-pointer ${
                  scrolled
                    ? 'text-slate-600 hover:text-gantly-blue'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {t(`landing.nav.${key}`)}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop right actions */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className={`text-sm font-semibold font-body transition-colors px-3 py-1.5 rounded-lg border cursor-pointer ${
              scrolled
                ? 'text-slate-500 hover:text-slate-700 border-slate-300 hover:border-slate-400 bg-slate-50'
                : 'text-white/90 hover:text-white border-white/40 hover:border-white/60 bg-white/10'
            }`}
          >
            {t('landing.nav.language')}
          </button>
          <button
            onClick={onLogin}
            className={`text-[15px] font-semibold font-body transition-colors px-5 py-2 rounded-xl border cursor-pointer ${
              scrolled
                ? 'text-slate-700 hover:text-slate-900 border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100'
                : 'text-white hover:text-white border-white/40 hover:border-white/60 bg-white/10 hover:bg-white/20'
            }`}
          >
            {t('landing.nav.login')}
          </button>
          <button
            onClick={onStart}
            className={`text-sm font-heading font-semibold transition-colors px-5 py-1.5 rounded-xl cursor-pointer ${
              scrolled
                ? 'text-white bg-gantly-blue hover:bg-sky-600 shadow-sm shadow-gantly-blue/20'
                : 'text-gantly-text bg-white hover:bg-white/90'
            }`}
          >
            {t('landing.nav.start')}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`lg:hidden transition-colors p-1 cursor-pointer ${
            scrolled ? 'text-slate-600 hover:text-slate-800' : 'text-white/80 hover:text-white'
          }`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className={`lg:hidden border-t px-5 py-4 flex flex-col gap-4 ${
            scrolled ? 'border-slate-200/60' : 'border-white/20'
          }`}
        >
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map(({ key, href }) => (
              <li key={key}>
                <button
                  onClick={() => handleNavLink(href)}
                  className={`text-sm font-body transition-colors w-full text-left cursor-pointer ${
                    scrolled ? 'text-slate-600 hover:text-gantly-blue' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {t(`landing.nav.${key}`)}
                </button>
              </li>
            ))}
          </ul>
          <div className={`flex flex-col gap-2 pt-2 border-t ${scrolled ? 'border-slate-200/60' : 'border-white/20'}`}>
            <button
              onClick={toggleLanguage}
              className={`text-xs font-body transition-colors text-left cursor-pointer ${
                scrolled ? 'text-slate-400 hover:text-slate-600' : 'text-white/60 hover:text-white'
              }`}
            >
              {t('landing.nav.language')}
            </button>
            <button
              onClick={() => { onLogin(); setMobileOpen(false); }}
              className={`text-sm font-body transition-colors text-left py-2 border-b cursor-pointer ${
                scrolled
                  ? 'text-slate-600 hover:text-slate-800 border-slate-200/60'
                  : 'text-white/80 hover:text-white border-white/10'
              }`}
            >
              {t('landing.nav.login')}
            </button>
            <button
              onClick={() => { onStart(); setMobileOpen(false); }}
              className={`text-sm font-heading font-semibold transition-colors px-5 py-2 rounded-xl text-center mt-1 cursor-pointer ${
                scrolled
                  ? 'text-white bg-gantly-blue hover:bg-sky-600'
                  : 'text-gantly-text bg-white hover:bg-white/90'
              }`}
            >
              {t('landing.nav.start')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
