'use client';

import React from 'react';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const { t } = useLanguage();

  return (
    <header className="bg-black flex items-center justify-between h-16 px-4">
      <div className="flex items-center space-x-3">
        <Image
          src="/Untitled design (12).png"
          width={40}
          height={40}
          alt={t('pulseLogo')}
          className="rounded-lg"
        />
        <span className="text-white text-lg font-semibold">{t('pulse')}</span>
      </div>
      <LanguageSwitcher />
    </header>
  );
};

export default Header;
