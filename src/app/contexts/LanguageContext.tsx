'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('pl');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'pl' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
      console.log('🔍 LanguageContext: Initial language loaded from localStorage:', savedLanguage);
    } else {
      console.log('🔍 LanguageContext: No saved language found, using default:', 'pl');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    console.log('🔄 LanguageContext: Language state changing from', language, 'to', lang);
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    console.log('💾 LanguageContext: Language saved to localStorage:', lang);
  };

  const t = (key: keyof Translations): string => {
    const translation = translations[language][key];
    console.log('📝 LanguageContext: Translation called - key:', key, 'language:', language, 'result:', translation);
    return translation;
  };

  console.log('🎯 LanguageContext: Current language state:', language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 