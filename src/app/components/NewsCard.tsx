'use client';
import React, { useState } from "react";
import Image from "next/image";

// Helper for date formatting
function formatDate(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return "przed chwilą";
  if (diffMin < 60) return `${diffMin} min temu`;
  if (diffHr < 24) return `${diffHr} godz. temu`;

  // Polish month names
  const months = [
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Helper for progress bar color
function getCredibilityColor(score: number): string {
  // 0-40: red, 41-70: yellow, 71-100: green, smooth gradient
  // We'll interpolate between #e53935 (red), #fbc02d (yellow), #43a047 (green)
  if (score <= 40) {
    // Red to yellow
    const t = score / 40;
    return `rgb(${229 + (251-229)*t}, ${57 + (188-57)*t}, ${53 + (45-53)*t})`;
  } else if (score <= 70) {
    // Yellow to green
    const t = (score-40)/30;
    return `rgb(${251 + (67-251)*t}, ${188 + (160-188)*t}, ${45 + (71-45)*t})`;
  } else {
    // Green
    return "#43a047";
  }
}

type Article = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  credibility_score: number;
  created_at: Date | string;
};

const NewsCard = ({ article }: { article: Article }) => {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Log the article to confirm image_url is received
  console.log('NewsCard article:', article);

  const toggleExpanded = () => setExpanded(!expanded);
  const descriptionPreview = article.description.slice(0, 200);
  const shouldShowToggle = article.description.length > 200;
  const credibilityColor = getCredibilityColor(article.credibility_score);
  const formattedDate = formatDate(article.created_at);

  // Fallback image logic with validation
  const validImage = article.image_url && (article.image_url.startsWith('http') || article.image_url.startsWith('/'))
    ? article.image_url
    : '/news-placeholder.png';
  const imageSrc = imageError ? '/news-placeholder.png' : validImage;

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        margin: "16px 0",
        borderRadius: "28px", // more rounded
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#ffffff",
        maxWidth: "100%",
        transition: "all 0.3s cubic-bezier(.4,2,.6,1)",
        overflow: "hidden",
      }}
    >
      {/* Image at the top */}
      <div style={{ width: "100%", height: "200px", position: "relative" }}>
        <Image
          src={imageSrc}
          alt=""
          fill
          style={{ objectFit: "cover", borderTopLeftRadius: "28px", borderTopRightRadius: "28px" }}
          onError={() => setImageError(true)}
          sizes="(max-width: 600px) 100vw, 600px"
          priority
        />
      </div>

      {/* Content section */}
      <div style={{ padding: "20px" }}>
        {/* Title and date row */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "12px",
            gap: 0,
          }}
        >
          <div
            style={{
              color: "#888",
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              alignSelf: "flex-end",
              marginBottom: "4px",
            }}
            aria-label="Data publikacji"
          >
            {formattedDate}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#333",
                lineHeight: "1.3",
                flex: 1,
                minWidth: 0,
              }}
            >
              {article.title}
            </h2>
          </div>
        </div>

        {/* Credibility progress bar */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor={`credibility-bar-${article.id}`}
            style={{
              fontSize: "0.85rem",
              color: "#6c757d",
              marginBottom: "4px",
              display: "block",
            }}
          >
            Wiarygodność
          </label>
          <div
            id={`credibility-bar-${article.id}`}
            role="progressbar"
            aria-valuenow={article.credibility_score}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: "16px",
              background: "#e9ecef",
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${article.credibility_score}%`,
                height: "100%",
                background: credibilityColor,
                transition: "width 0.4s cubic-bezier(.4,2,.6,1)",
                display: "flex",
                alignItems: "center",
                justifyContent: article.credibility_score > 15 ? "flex-end" : "flex-start",
                paddingRight: article.credibility_score > 15 ? "6px" : "0",
                paddingLeft: article.credibility_score <= 15 ? "6px" : "0",
                color: article.credibility_score > 50 ? "#fff" : "#222",
                fontWeight: 600,
                fontSize: "0.85rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {article.credibility_score}%
            </div>
          </div>
        </div>

        {/* Description with expand/collapse */}
        <div style={{ position: "relative", marginBottom: "0.5rem" }}>
          <div
            onClick={shouldShowToggle ? toggleExpanded : undefined}
            onKeyDown={shouldShowToggle ? (e) => {
              if (e.key === "Enter" || e.key === " ") toggleExpanded();
            } : undefined}
            tabIndex={shouldShowToggle ? 0 : -1}
            role={shouldShowToggle ? "button" : undefined}
            aria-expanded={expanded}
            aria-controls={`desc-${article.id}`}
            style={{
              cursor: shouldShowToggle ? "pointer" : "default",
              outline: "none",
              transition: "max-height 0.5s cubic-bezier(.4,0,.2,1)",
              maxHeight: expanded ? "2000px" : "12em", // large maxHeight for smooth expansion
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <span
              id={`desc-${article.id}`}
              style={{
                display: "block",
                lineHeight: "1.5",
                color: "#555",
                fontSize: "0.95rem",
                textAlign: "justify",
                background: "#fff",
                position: "relative",
                zIndex: 1,
                margin: 0,
                transition: "color 0.2s",
                pointerEvents: "none",
                userSelect: "text",
                whiteSpace: "pre-line",
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              {expanded ? (
                article.description
              ) : (
                <>
                  {/* Show preview up to a safe length, then fade only the last few words */}
                  <span style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 8,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    verticalAlign: "bottom",
                  }}>
                    {(() => {
                      // Show all but last ~20 chars, then fade last ~20 chars, then append button (unfaded)
                      const previewLen = Math.max(0, descriptionPreview.length - 20);
                      const visible = descriptionPreview.slice(0, previewLen);
                      const faded = descriptionPreview.slice(previewLen);
                      return <>
                        {visible}
                        <span style={{
                          display: "inline",
                          background: "linear-gradient(to right, #555 60%, rgba(255,255,255,0) 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          marginLeft: "1px",
                          pointerEvents: "auto",
                          userSelect: "none",
                        }}
                        aria-hidden="true"
                        >
                          {faded}
                        </span>
                        <span
                          onClick={e => { e.stopPropagation(); toggleExpanded(); }}
                          style={{
                            color: "#111",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                            textDecoration: "underline",
                            marginLeft: "2px",
                            background: "none",
                            WebkitBackgroundClip: "initial",
                            WebkitTextFillColor: "initial",
                            userSelect: "none",
                            pointerEvents: "auto",
                            display: "inline",
                          }}
                          aria-hidden="true"
                        >
                          Czytaj więcej
                        </span>
                      </>;
                    })()}
                  </span>
                </>
              )}
            </span>
            {/* Expanded state toggle below, as before */}
            {expanded && shouldShowToggle && (
              <div style={{ marginTop: "10px", textAlign: "right" }}>
                <span
                  onClick={toggleExpanded}
                  style={{
                    color: "#111",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    textDecoration: "underline",
                    background: "rgba(255,255,255,0.85)",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    userSelect: "none",
                    display: "inline-block",
                  }}
                  aria-hidden="true"
                >
                  Czytaj mniej
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
