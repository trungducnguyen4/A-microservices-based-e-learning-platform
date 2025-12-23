export const ensureAbsoluteUrl = (url?: string) => {
  if (!url) return url || '';
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) {
    // Prefer Vite-provided API base, otherwise default to gateway
    const base = (import.meta as any)?.env?.VITE_API_BASE ?? 'http://localhost:8888/api';
    return base.replace(/\/$/, '') + '/files' + trimmed;
  }
  // if no scheme and not a path, assume https
  return 'https://' + trimmed;
};

export const isImageUrl = (url?: string) => {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
};

export const isYouTubeUrl = (url?: string) => {
  if (!url) return false;
  return /youtube\.com|youtu\.be/.test(url);
};

export const youtubeEmbedUrl = (url?: string) => {
  if (!url) return '';
  try {
    const u = String(url).trim();
    // extract id from youtu.be/ID
    const byShort = u.match(/youtu\.be\/(.+?)(\?|$)/i);
    if (byShort && byShort[1]) return `https://www.youtube.com/embed/${byShort[1].replace(/\?.*$/, '')}`;

    // extract id from watch?v= or v/ or embed/
    const m1 = u.match(/[?&]v=([^&]+)/i);
    if (m1 && m1[1]) return `https://www.youtube.com/embed/${m1[1]}`;

    const m2 = u.match(/\/embed\/([^?&/]+)/i);
    if (m2 && m2[1]) return `https://www.youtube.com/embed/${m2[1]}`;

    const m3 = u.match(/\/v\/([^?&/]+)/i);
    if (m3 && m3[1]) return `https://www.youtube.com/embed/${m3[1]}`;

    // fallback: try to take last path segment if looks like id
    const parts = u.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^[A-Za-z0-9_-]{6,}$/.test(last)) return `https://www.youtube.com/embed/${last}`;

    // No video id found; return empty to indicate "can't embed"
    return '';
  } catch (e) {
    return '';
  }
};

// Return a user-friendly display string for a URL:
// - strips leading protocol (`http://` or `https://`)
// - if the URL ends with a path segment (like a filename), returns the decoded filename
// - falls back to the host + path without protocol
export const displayFriendlyUrl = (url?: string) => {
  if (!url) return '';
  try {
    const s = String(url).trim();
    // if it's a relative path like /file/uuid.pdf, use last segment
    const segments = s.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      // if looks like a filename with an extension, prefer that
      if (/\.[a-z0-9]{1,6}(\?|$)/i.test(last) || last.length <= 64) {
        try {
          return decodeURIComponent(last);
        } catch (e) {
          return last;
        }
      }
    }

    // strip protocol for display
    return s.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  } catch (e) {
    return String(url);
  }
};
