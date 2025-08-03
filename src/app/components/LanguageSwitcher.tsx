'use client';

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  console.log('🌐 LanguageSwitcher: Current language state:', language);

  const handleLanguageChange = (newLang: 'pl' | 'en') => {
    console.log('🔘 LanguageSwitcher: Button clicked - switching from', language, 'to', newLang);
    setLanguage(newLang);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleLanguageChange('pl')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'pl'
            ? 'bg-white text-black'
            : 'text-white hover:bg-white hover:text-black'
        }`}
      >
        PL
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-white text-black'
            : 'text-white hover:bg-white hover:text-black'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher; 