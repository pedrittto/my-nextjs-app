// src/app/page.tsx

import { db } from "./lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import NewsCardList from "./components/NewsCardList";
import Image from "next/image";
import { Article } from "./lib/articleTypes";

export default async function Home() {
  const articles: Article[] = [];

  const q = query(collection(db, "articles"), orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Helper to extract plain string from Firestore REST/structured API
    function extractString(val: any) {
      if (val && typeof val === 'object') {
        if ('stringValue' in val) return val.stringValue;
        if ('timestampValue' in val) return val.timestampValue;
      }
      return val;
    }

    const created_at = extractString(data.created_at);
    const publishedAt = extractString(data.publishedAt);

    articles.push({
      id: doc.id,
      ...data,
      created_at,
      publishedAt,
    } as Article);
  });

  return (
    <div style={{ marginTop: "0px" }}>
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "60px",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}>
        {/* <img src="/Untitled%20design%20(12).png" alt="Logo" style={{ height: '36px' }} /> */}
        <Image src="/Untitled%20design%20(12).png" alt="Logo" width={120} height={36} style={{ height: '36px', width: 'auto' }} />
      </div>
      <NewsCardList cards={articles} />
    </div>
  );
}
