/**
 * Brand Configuration
 * Central place to manage app name, colors, tagline, and metadata
 */

// App identity - can be overridden by env vars
export const APP_NAME = (import.meta as any)?.env?.VITE_APP_NAME || "AcademiHub";
export const APP_SHORT_NAME = (import.meta as any)?.env?.VITE_APP_SHORT_NAME || "AcademiHub";
export const APP_TAGLINE = (import.meta as any)?.env?.VITE_APP_TAGLINE || "Your Learning, Your Pace";
export const APP_DESCRIPTION = (import.meta as any)?.env?.VITE_APP_DESCRIPTION || 
  "A comprehensive microservices-based e-learning platform for seamless educational experiences";

// Logo and favicon
export const APP_LOGO_URL = (import.meta as any)?.env?.VITE_APP_LOGO_URL || "/logo.svg";
export const APP_FAVICON = (import.meta as any)?.env?.VITE_APP_FAVICON || "/logo.svg";

// Brand colors (Tailwind cyan theme)
export const PRIMARY_COLOR = "#0891b2";
export const ACCENT_COLOR = "#06b6d4";

// Metadata
export const COMPANY_NAME = (import.meta as any)?.env?.VITE_COMPANY_NAME || "AcademiHub";
export const SUPPORT_EMAIL = (import.meta as any)?.env?.VITE_SUPPORT_EMAIL || "support@academihub.com";

// Brand config object for convenience
export const brandConfig = {
  appName: APP_NAME,
  appShortName: APP_SHORT_NAME,
  appTagline: APP_TAGLINE,
  appDescription: APP_DESCRIPTION,
  logoUrl: APP_LOGO_URL,
  favicon: APP_FAVICON,
  primaryColor: PRIMARY_COLOR,
  accentColor: ACCENT_COLOR,
  companyName: COMPANY_NAME,
  supportEmail: SUPPORT_EMAIL,
};
