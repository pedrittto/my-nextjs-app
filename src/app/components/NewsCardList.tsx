'use client';

import React from "react";
import NewsCard from "./NewsCard";

type Article = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  credibility_score: number;
  created_at: Date | string;
};

const NewsCardList = ({ articles }: { articles: Article[] }) => {
  return (
    <main style={{ padding: "16px", display: "grid", gap: "16px" }}>
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </main>
  );
};

export default NewsCardList; 