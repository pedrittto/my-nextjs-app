"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase"; // Popraw ścieżkę jeśli masz inną strukturę
import NewsCardList from "./NewsCardList";
import { Article } from "../lib/articleTypes";

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "articles"),
      (snapshot) => {
        const news = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];
        setArticles(news);
      }
    );
    return () => unsubscribe();
  }, []);

  return <NewsCardList cards={articles} />;
}
