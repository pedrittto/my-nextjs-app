"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import PulseLogo from "/public/icons/icon-512.png";
import { Article } from "../lib/articleTypes";

const FADE_WIDTH = 48; // px, for the fade effect on last 2-3 words

interface NewsCardProps {
  article: Article;
}

// Funkcja pomocnicza do formatowania daty
const formatDate = (dateInput: string | undefined) => {
  try {
    if (!dateInput || dateInput === "brak danych" || dateInput === "") {
      return "Brak daty";
    }
    const date = new Date(String(dateInput));
    if (isNaN(date.getTime())) {
      return "Brak daty";
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: pl });
  } catch {
    return "Brak daty";
  }
};

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  const [expanded, setExpanded] = useState(false);
  const descRef = useRef<HTMLDivElement | null>(null);

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
          alt="Article image"
          className="object-cover w-full h-full"
          fill
          unoptimized
          priority
        />
        <div className="absolute top-3 right-3 z-10">
          <time className="bg-white/90 backdrop-blur-sm px-3 py-1 text-xs text-gray-600 rounded-full shadow">
            {formatDate(article.created_at)}
          </time>
        </div>
      </div>
      {/* Treść */}
      <div className="px-4 pt-4 pb-8">
        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">{article.title}</h2>
        {/* Wiarygodność */}
        <span className="text-sm font-medium text-gray-700 mb-1 block">Wiarygodność</span>
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
                {article.description}
              </span>
            ) : (
              // Pełny stan
              <span className="block text-sm text-gray-700 leading-snug w-full select-none">
                {article.description}
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
              {expanded ? "Czytaj mniej" : "Czytaj więcej"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
