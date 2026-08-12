import React from "react";

// Route error boundary card. Bilingual copy table (renders outside the i18n
// provider tree in production).
const COPY = {
  en: {
    eyebrow: "Something went wrong",
    retry: "Retry",
    titles: { view: "This view couldn’t load", explore: "Explore couldn’t load", page: "This page couldn’t load" },
    bodies: {
      service: "The data service may be unavailable. Confirm the API is running on port 8530, then try again.",
      generic: "An unexpected error occurred. Please try again.",
    },
  },
  fr: {
    eyebrow: "Une erreur s’est produite",
    retry: "Réessayer",
    titles: { view: "Cette vue n’a pas pu se charger", explore: "Explorer n’a pas pu se charger", page: "Cette page n’a pas pu se charger" },
    bodies: {
      service: "Le service de données est peut-être indisponible. Vérifiez que l’API tourne sur le port 8530, puis réessayez.",
      generic: "Une erreur inattendue s’est produite. Veuillez réessayer.",
    },
  },
};

export function ErrorCard({ reset, title = "view", body = "service", locale = "en" }) {
  const c = COPY[locale] || COPY.en;
  return (
    <div className="container-x" style={{ paddingBlock: 96 }}>
      <div className="card card-pad" style={{ marginInline: "auto", maxWidth: "36rem", textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{c.eyebrow}</div>
        <h1 className="h-section" style={{ margin: "0 0 12px" }}>{c.titles[title]}</h1>
        <p style={{ margin: "0 0 20px", color: "var(--ink-soft)" }}>{c.bodies[body]}</p>
        <button type="button" onClick={reset} className="control t-meta"
          style={{ border: "1px solid var(--card-border)", background: "var(--surface)", padding: "8px 16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--navy)", fontFamily: "inherit", cursor: "pointer", transition: "color .15s var(--ease), border-color .15s var(--ease)" }}>
          {c.retry}
        </button>
      </div>
    </div>
  );
}
