'use client';

import { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import NewsCardList from "./components/NewsCardList";
import { Article } from "./lib/articleTypes";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "articles"),
      orderBy("created_at", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Article[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        data.push({
          id: doc.id,
          ...d,
        } as Article);
      });
      setArticles(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <NewsCardList cards={articles} />
    </div>
  );
}
