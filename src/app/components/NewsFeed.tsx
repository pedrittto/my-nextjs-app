"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import NewsCardList from "./NewsCardList";
import { Article } from "../lib/articleTypes";

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    console.log('📡 NewsFeed: Starting Firestore subscription to "articles" collection');
    const unsubscribe = onSnapshot(
      collection(db, "articles"),
      (snapshot) => {
        const news = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];
        
        console.log('📊 NewsFeed: Received', news.length, 'articles from Firestore');
        
        // Log detailed structure of each article
        news.forEach((article, index) => {
          console.log(`📋 NewsFeed: Article ${index + 1} (ID: ${article.id}) structure:`, {
            hasTitleEn: 'title_en' in article,
            hasTitlePl: 'title_pl' in article,
            hasDescEn: 'description_en' in article,
            hasDescPl: 'description_pl' in article,
            title: article.title,
            title_en: (article as any).title_en || 'NOT_FOUND',
            title_pl: (article as any).title_pl || 'NOT_FOUND',
            description: article.description?.substring(0, 50) + '...',
            description_en: (article as any).description_en?.substring(0, 50) + '...' || 'NOT_FOUND',
            description_pl: (article as any).description_pl?.substring(0, 50) + '...' || 'NOT_FOUND',
            allKeys: Object.keys(article)
          });
        });
        
        setArticles(news);
      },
      (error) => {
        console.error('❌ NewsFeed: Firestore subscription error:', error);
      }
    );
    return () => {
      console.log('🔌 NewsFeed: Unsubscribing from Firestore');
      unsubscribe();
    };
  }, []);

  console.log('🎯 NewsFeed: Current articles state -', articles.length, 'articles ready for rendering');

  return <NewsCardList cards={articles} />;
}
