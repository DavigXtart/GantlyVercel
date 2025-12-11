import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }}>
      <button
        onClick={() => changeLanguage('es')}
        style={{
          padding: '6px 12px',
          border: i18n.language === 'es' ? '2px solid #667eea' : '1px solid #e5e7eb',
          borderRadius: '6px',
          background: i18n.language === 'es' ? '#667eea' : 'white',
          color: i18n.language === 'es' ? 'white' : '#1f2937',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: i18n.language === 'es' ? 600 : 400,
          transition: 'all 0.2s'
        }}
      >
        ES
      </button>
      <button
        onClick={() => changeLanguage('en')}
        style={{
          padding: '6px 12px',
          border: i18n.language === 'en' ? '2px solid #667eea' : '1px solid #e5e7eb',
          borderRadius: '6px',
          background: i18n.language === 'en' ? '#667eea' : 'white',
          color: i18n.language === 'en' ? 'white' : '#1f2937',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: i18n.language === 'en' ? 600 : 400,
          transition: 'all 0.2s'
        }}
      >
        EN
      </button>
    </div>
  );
}

