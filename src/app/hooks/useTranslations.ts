"use client";
import { useLang } from "../components/LanguageSwitcher";
import pl from "../../../locales/pl";
import en from "../../../locales/en";

interface Translations {
  pl: {
    topNews: string;
    languagePL: string;
    languageEN: string;
  };
  en: {
    topNews: string;
    languagePL: string;
    languageEN: string;
  };
}

const translations: Translations = { pl, en };

export function useTranslations() {
  const { lang } = useLang();
  return translations[lang as keyof typeof translations]}