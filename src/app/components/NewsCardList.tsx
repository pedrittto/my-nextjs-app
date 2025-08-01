import React from "react";
import NewsCard from "./NewsCard";
import { Article } from "../lib/articleTypes";
import { useLanguage } from "../contexts/LanguageContext";

// DODAJ TEN INTERFEJS!
interface NewsCardListProps {
  cards: Article[];
}

const NewsCardList: React.FC<NewsCardListProps> = ({ cards }) => {
  const { t, language } = useLanguage();
  
  console.log('📋 NewsCardList: Received', cards.length, 'cards, current language:', language);
  
  if (!cards || !Array.isArray(cards)) {
    console.log('⚠️ NewsCardList: Invalid cards data received:', cards);
    return <p className="text-gray-600">{t('noArticlesAvailable')}</p>;
  }

  console.log('🎴 NewsCardList: Rendering', cards.length, 'NewsCard components');

  return (
    <div className="grid gap-4">
      {cards.map((card) => (
        <NewsCard key={card.id} article={card} />
      ))}
    </div>
  );
};

export default NewsCardList;
