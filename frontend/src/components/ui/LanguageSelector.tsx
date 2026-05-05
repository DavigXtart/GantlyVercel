import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const langs = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div className="flex gap-1.5 items-center">
      {langs.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border',
            i18n.language === code
              ? 'bg-gantly-blue-500 text-white border-gantly-blue-500 font-semibold'
              : 'bg-white text-gantly-text border-slate-200 hover:border-gantly-blue-300 hover:text-gantly-blue-500'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
