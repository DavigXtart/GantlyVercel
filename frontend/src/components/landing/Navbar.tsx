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

  const bgOpacity = scrolled ? 'rgba(10, 22, 40, 0.92)' : 'rgba(10, 22, 40, 0.7)';

  return (
    <nav
      className="fixed top-4 left-4 right-4 z-50 rounded-2xl"
      style={{
        background: bgOpacity,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(34, 211, 238, 0.1)',
        transition: 'background 0.3s ease',
      }}
    >
      <div className="flex items-center justify-between px-5 py-3">
        {/* Logo */}
        <div className="flex-shrink-0">
          <img
            src={LogoSvg}
            alt="Gantly"
            className="h-7 brightness-0 invert cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        </div>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(({ key, href }) => (
            <li key={key}>
              <button
                onClick={() => handleNavLink(href)}
                className="text-sm font-body text-white/70 hover:text-white transition-colors"
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
            className="text-xs font-body text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded-md border border-white/10 hover:border-white/20"
          >
            {t('landing.nav.language')}
          </button>
          <button
            onClick={onLogin}
            className="text-sm font-body text-white/80 hover:text-white transition-colors px-4 py-1.5 rounded-xl border border-white/15 hover:border-white/30"
          >
            {t('landing.nav.login')}
          </button>
          <button
            onClick={onStart}
            className="text-sm font-heading font-semibold text-gantly-navy bg-gantly-gold hover:bg-yellow-300 transition-colors px-5 py-1.5 rounded-xl"
          >
            {t('landing.nav.start')}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white/80 hover:text-white transition-colors p-1"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="lg:hidden border-t px-5 py-4 flex flex-col gap-4"
          style={{ borderColor: 'rgba(34, 211, 238, 0.1)' }}
        >
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map(({ key, href }) => (
              <li key={key}>
                <button
                  onClick={() => handleNavLink(href)}
                  className="text-sm font-body text-white/70 hover:text-white transition-colors w-full text-left"
                >
                  {t(`landing.nav.${key}`)}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'rgba(34, 211, 238, 0.1)' }}>
            <button
              onClick={toggleLanguage}
              className="text-xs font-body text-white/50 hover:text-white/80 transition-colors text-left"
            >
              {t('landing.nav.language')}
            </button>
            <button
              onClick={() => { onLogin(); setMobileOpen(false); }}
              className="text-sm font-body text-white/80 hover:text-white transition-colors text-left py-2 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              {t('landing.nav.login')}
            </button>
            <button
              onClick={() => { onStart(); setMobileOpen(false); }}
              className="text-sm font-heading font-semibold text-gantly-navy bg-gantly-gold hover:bg-yellow-300 transition-colors px-5 py-2 rounded-xl text-center mt-1"
            >
              {t('landing.nav.start')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
