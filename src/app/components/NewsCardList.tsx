'use client';

import React, { useEffect, useState } from "react";
import NewsCard from "./NewsCard";
import { Article } from "../lib/articleTypes";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const NewsCardList: React.FC = () => {
  const [cards, setCards] = useState<Article[]>([]);

  useEffect(() => {
    // Query do kolekcji articles, posortowane po created_at DESC (najnowsze na górze)
    const q = query(collection(db, "articles"), orderBy("created_at", "desc"));

    // Subskrypcja realtime
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Article[];
      setCards(data);
    });

    // Cleanup subskrypcji przy odmontowaniu komponentu
    return () => unsub();
  }, []);

  if (!cards.length) {
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
