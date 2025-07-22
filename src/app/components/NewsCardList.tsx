import React from "react";
import NewsCard from "./NewsCard";
import { Article } from "../lib/articleTypes";

// DODAJ TEN INTERFEJS!
interface NewsCardListProps {
  cards: Article[];
}

const NewsCardList: React.FC<NewsCardListProps> = ({ cards }) => {
  // Safety check for undefined/null cards
  if (!cards || !Array.isArray(cards)) {
    return <p className="text-gray-600">No articles available</p>;
  }

  return (
    <div className="grid gap-4">
      {cards.map((card) => (
        <NewsCard key={card.id} article={card} />
      ))}
    </div>
  );
};

export default NewsCardList;
