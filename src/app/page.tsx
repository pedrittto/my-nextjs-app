"use client";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useTranslations } from "./hooks/useTranslations";

export default function Home() {
  const t = useTranslations();
  return (
    <main>
      <LanguageSwitcher />
      <h1>{t.topNews}</h1>
    </main>
  );
}