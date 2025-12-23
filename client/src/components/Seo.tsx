import { useEffect } from "react";

type OpenGraph = {
  title?: string;
  description?: string;
  url?: string;
  type?: string; // website, article
  image?: string;
  siteName?: string;
};

type Twitter = {
  cardType?: "summary" | "summary_large_image";
  title?: string;
  description?: string;
  image?: string;
};

interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph?: OpenGraph;
  twitter?: Twitter;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
  noindex?: boolean;
}

// Lightweight head tag manager without external deps
export default function Seo({ title, description, canonical, openGraph, twitter, jsonLd, noindex }: SeoProps) {
  useEffect(() => {
    // Title
    if (title) {
      document.title = title;
    }

    const upsertMeta = (attr: "name" | "property", key: string, content?: string) => {
      if (!content) return;
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}='${key}']`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Basic description
    if (description) upsertMeta("name", "description", description);

    // Robots
    if (noindex) upsertMeta("name", "robots", "noindex, nofollow");
    else upsertMeta("name", "robots", "index, follow");

    // Canonical
    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    // Open Graph
    if (openGraph) {
      const og = openGraph;
      upsertMeta("property", "og:title", og.title || title);
      upsertMeta("property", "og:description", og.description || description);
      if (og.url) upsertMeta("property", "og:url", og.url);
      upsertMeta("property", "og:type", og.type || "website");
      if (og.image) upsertMeta("property", "og:image", og.image);
      if (og.siteName) upsertMeta("property", "og:site_name", og.siteName);
    }

    // Twitter
    if (twitter) {
      const tw = twitter;
      upsertMeta("name", "twitter:card", tw.cardType || "summary");
      upsertMeta("name", "twitter:title", tw.title || title);
      upsertMeta("name", "twitter:description", tw.description || description);
      if (tw.image) upsertMeta("name", "twitter:image", tw.image);
    }

    // JSON-LD structured data
    const existing = document.head.querySelector<HTMLScriptElement>("script[data-seo-jsonld='true']");
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      script.text = JSON.stringify(payload);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, openGraph, twitter, jsonLd, noindex]);

  return null;
}
