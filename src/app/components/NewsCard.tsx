"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import PulseLogo from "/public/icons/icon-512.png";
import { Article } from "../lib/articleTypes";
import { useLanguage } from "../contexts/LanguageContext";
import { Translations } from "../lib/translations";

const FADE_WIDTH = 48; // px, for the fade effect on last 2-3 words

interface NewsCardProps {
  article: Article;
}

// Funkcja pomocnicza do formatowania daty
const formatDate = (dateInput: string | undefined, language: string, t: (key: keyof Translations) => string) => {
  try {
    if (!dateInput || dateInput === "brak danych" || dateInput === "") {
      return t('noDate');
    }
    const date = new Date(String(dateInput));
    if (isNaN(date.getTime())) {
      return t('noDate');
    }
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: language === 'pl' ? pl : enUS 
    });
  } catch {
    return t('noDate');
  }
};

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  const [expanded, setExpanded] = useState(false);
  const descRef = useRef<HTMLDivElement | null>(null);
  const { t, language } = useLanguage();

  // Get language-specific content
  const getTitle = () => {
    if (language === 'en' && 'title_en' in article) {
      return (article as any).title_en;
    }
    if (language === 'pl' && 'title_pl' in article) {
      return (article as any).title_pl;
    }
    return article.title; // fallback to default title
  };

  const getDescription = () => {
    if (language === 'en' && 'description_en' in article) {
      return (article as any).description_en;
    }
    if (language === 'pl' && 'description_pl' in article) {
      return (article as any).description_pl;
    }
    return article.description; // fallback to default description
  };

  const title = getTitle();
  const description = getDescription();

  console.log('🎴 NewsCard: Rendering article ID:', article.id, {
    currentLanguage: language,
    titleUsed: title?.substring(0, 30) + '...',
    descriptionUsed: description?.substring(0, 30) + '...',
    hasTitleEn: 'title_en' in article,
    hasTitlePl: 'title_pl' in article,
    hasDescEn: 'description_en' in article,
    hasDescPl: 'description_pl' in article,
    titleSource: language === 'en' && 'title_en' in article ? 'title_en' : 
                language === 'pl' && 'title_pl' in article ? 'title_pl' : 'title (fallback)',
    descSource: language === 'en' && 'description_en' in article ? 'description_en' : 
               language === 'pl' && 'description_pl' in article ? 'description_pl' : 'description (fallback)'
  });

  return (
    <article
      className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8 max-w-2xl mx-4 min-h-[340px] px-0 sm:mx-auto mt-0"
      // Marginesy po bokach na mobile przez px-4, na większych px-0 i wyśrodkowanie przez mx-auto
      // max-w-[420px] zabezpiecza szerokość newscarda i obrazka
    >
      {/* Obrazek */}
      <div className="w-full h-56 bg-gray-100 relative rounded-t-3xl overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)]">
        <Image
          src={article.image_url || "/news-placeholder.png"}
          alt={t('articleImage')}
          className="object-cover w-full h-full"
          fill
          unoptimized
          priority
        />
        <div className="absolute top-3 right-3 z-10">
          <time className="bg-white/90 backdrop-blur-sm px-3 py-1 text-xs text-gray-600 rounded-full shadow">
            {formatDate(article.created_at, language, t)}
          </time>
        </div>
      </div>
      {/* Treść */}
      <div className="px-4 pt-4 pb-8">
        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">{title}</h2>
        {/* Wiarygodność */}
        <span className="text-sm font-medium text-gray-700 mb-1 block">{t('credibility')}</span>
        <div className="w-full h-5 rounded-full overflow-hidden bg-gray-200 mb-2">
          <div
            className="h-5 flex items-center justify-end pr-3 text-sm font-semibold text-white"
            style={{
              width: `${article.credibility_score}%`,
              background:
                article.credibility_score < 60
                  ? "#ef4444"
                  : article.credibility_score < 80
                  ? "#facc15"
                  : "#22c55e",
              transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {article.credibility_score}%
          </div>
        </div>
        {/* Opis z expand/collapse */}
        <div className="w-full mt-2">
          <div
            className="relative group overflow-hidden transition-all duration-500 ease-in-out cursor-pointer pb-4 min-h-[5.5em]"
            style={{
              maxHeight: expanded ? "1000px" : "calc(5.5em + 1.25rem)",
              opacity: 1,
            }}
            onClick={() => setExpanded((v) => !v)}
            tabIndex={0}
            role="button"
            aria-expanded={expanded}
            ref={descRef}
          >
            {/* Zwijany stan */}
            {!expanded ? (
              <span
                className="block text-sm text-gray-700 leading-snug w-full select-none line-clamp-4 break-words"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  wordBreak: "break-word",
                  whiteSpace: "pre-line",
                }}
              >
                {description}
              </span>
            ) : (
              // Pełny stan
              <span className="block text-sm text-gray-700 leading-snug w-full select-none">
                {description}
              </span>
            )}
            {/* Przycisk */}
            <button
              className="text-sm font-semibold text-black cursor-pointer mt-1"
              style={{
                background: "none",
                border: "none",
                boxShadow: "none",
                textDecoration: "none",
                padding: 0,
                margin: 0,
              }}
              tabIndex={-1}
              type="button"
            >
              {expanded ? t('readLess') : t('readMore')}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
