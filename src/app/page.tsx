// src/app/page.tsx

import { db } from "./lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import NewsCardList from "./components/NewsCardList";
import Image from "next/image";

type Article = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  credibility_score: number;
  created_at: Date | string;
};

export default async function Home() {
  const articles: Article[] = [];

  const q = query(collection(db, "articles"), orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((doc) => {
    articles.push({
      id: doc.id,
      ...doc.data(),
    } as Article);
  });

  return (
    <div style={{ marginTop: "60px" }}>
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
      <NewsCardList articles={articles} />
    </div>
  );
}
