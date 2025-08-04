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

// Function to get credibility color based on score (20 distinct colors)
const getCredibilityColor = (score: number): string => {
  // Ensure score is between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Create 20 distinct color stops (every 5%)
  const colorStops = [
    '#ef4444', // 0-5%: Red
    '#f97316', // 5-10%: Orange-red
    '#ea580c', // 10-15%: Dark orange
    '#dc2626', // 15-20%: Dark red
    '#f59e0b', // 20-25%: Amber
    '#d97706', // 25-30%: Dark amber
    '#facc15', // 30-35%: Yellow
    '#eab308', // 35-40%: Dark yellow
    '#fbbf24', // 40-45%: Light yellow
    '#f59e0b', // 45-50%: Amber
    '#fbbf24', // 50-55%: Light yellow
    '#facc15', // 55-60%: Yellow
    '#fbbf24', // 60-65%: Light yellow
    '#facc15', // 65-70%: Yellow
    '#fbbf24', // 70-75%: Light yellow
    '#22c55e', // 75-80%: Green
    '#16a34a', // 80-85%: Dark green
    '#15803d', // 85-90%: Darker green
    '#166534', // 90-95%: Darkest green
    '#15803d'  // 95-100%: Dark green
  ];
  
  // Calculate which color stop to use
  const colorIndex = Math.floor(clampedScore / 5);
  return colorStops[Math.min(colorIndex, colorStops.length - 1)];
};

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
      className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-2xl mx-auto min-h-[340px] px-0"
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
          onError={(e) => {
            console.warn('❌ Image failed to load:', {
              image_url: article.image_url,
              article_id: article.id,
              error: e
            });
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully:', {
              image_url: article.image_url,
              article_id: article.id
            });
          }}
        />
        <div className="absolute top-3 right-3 z-10">
          <time className="bg-white/90 backdrop-blur-sm px-3 py-1 text-xs text-gray-600 rounded-full shadow">
            {formatDate(article.created_at, language, t)}
          </time>
        </div>
      </div>
      {/* Treść */}
      <div className="px-6 pt-6 pb-8">
        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-4">{title}</h2>
        {/* Wiarygodność */}
        <span className="text-sm font-medium text-gray-700 mb-2 block">{t('credibility')}</span>
        <div className="w-full h-5 rounded-full overflow-hidden bg-gray-200 mb-4 relative">
          <div
            className="h-5 flex items-center justify-end pr-3 text-sm font-semibold text-white relative overflow-hidden"
            style={{
              width: `${article.credibility_score}%`,
              background: getCredibilityColor(article.credibility_score),
              transition: "width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.3s ease",
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            {article.credibility_score}%
          </div>
        </div>
        {/* Opis z expand/collapse */}
        <div className="w-full">
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
              className="text-sm font-semibold text-black cursor-pointer mt-2"
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
