'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import NewsCardList from '@/app/components/NewsCardList';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function NewsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    console.log('🚀 useEffect running on client, window exists:', typeof window !== 'undefined');

    try {
      const q = query(
        collection(db, 'articles'),
        orderBy('published_at', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          console.log('📬 onSnapshot callback:', snapshot);

          const arr = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('raw image_url:', data.image_url);
            
            let createdDateStr = '';
            let publishedDateStr = '';
            // Handle Firestore Timestamp conversion for created_at
            if (data.created_at instanceof Timestamp) {
              createdDateStr = data.created_at.toDate().toISOString();
            } else if (data.created_at?.seconds != null) {
              const ms = data.created_at.seconds * 1000 + data.created_at.nanoseconds / 1e6;
              createdDateStr = new Date(ms).toISOString();
            } else if (data.created_at) {
              // If it's already a string, validate it
              const testDate = new Date(data.created_at);
              createdDateStr = isNaN(testDate.getTime()) ? '' : data.created_at;
            } else {
              createdDateStr = new Date().toISOString();
            }
            // Handle Firestore Timestamp conversion for published_at
            if (data.published_at instanceof Timestamp) {
              publishedDateStr = data.published_at.toDate().toISOString();
            } else if (data.published_at?.seconds != null) {
              const ms = data.published_at.seconds * 1000 + data.published_at.nanoseconds / 1e6;
              publishedDateStr = new Date(ms).toISOString();
            } else if (data.published_at) {
              const testDate = new Date(data.published_at);
              publishedDateStr = isNaN(testDate.getTime()) ? '' : data.published_at;
            } else {
              publishedDateStr = '';
            }
            return {
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              image_url: data.image_url || '/news-placeholder.png',
              credibility_score: data.credibility_score || 0,
              created_at: createdDateStr,
              trend: data.trend || '',
              source: data.source || '',
              published_at: publishedDateStr
            };
          });

          console.log('mapped image_url:', arr.map(a => a.image_url));
          console.log('📝 Mapped documents:', arr);
          setCards(arr);
          setLoading(false);
        },
        error => {
          console.error('❌ onSnapshot error:', error);
          setError(error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('❌ useEffect error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <main className="px-4 py-8 bg-slate-50 min-h-screen">
        <p className="text-red-500">{t('error')}: {error}</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {loading ? (
        <p className="text-gray-600">{t('loading')}</p>
      ) : cards.length === 0 ? (
        <p className="text-gray-600">{t('noArticlesFound')}</p>
      ) : (
        <NewsCardList cards={cards} />
      )}
    </div>
  );
}
