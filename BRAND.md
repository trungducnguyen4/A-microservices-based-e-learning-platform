# Brand Configuration Guide

## Current Branding

The platform now uses a personalized brand identity instead of the generic "EduPlatform".

### Selected Name: **AcademiHub**

**Tagline:** "Your Learning, Your Pace"

**Why AcademiHub?**
- **Professionalism**: "Academi" conveys education and formality
- **Community Feel**: "Hub" suggests a central gathering place
- **Modern & Friendly**: Combined, it feels both professional and approachable
- **Memorable**: Easier to recall than generic "EduPlatform"

---

## Alternative Names (Suggested)

If you'd prefer a different brand, here are alternatives:

### Option 1: **LearnVerse**
- **Tagline:** "Explore Your Learning Universe"
- **Vibe:** Adventurous, expansive, tech-forward
- **Best for:** Platforms emphasizing exploration and discovery

### Option 2: **EduSync**
- **Tagline:** "Learn in Sync"
- **Vibe:** Modern, connected, collaborative
- **Best for:** Microservices-based platforms that emphasize synchronization

### Option 3: **ClassHub**
- **Tagline:** "Where Learning Happens"
- **Vibe:** Simple, direct, community-focused
- **Best for:** Classroom-centric platforms

### Option 4: **MindMeld**
- **Tagline:** "Minds Learn Together"
- **Vibe:** Collaborative, inclusive, forward-thinking
- **Best for:** Community-driven learning

### Option 5: **AcademiHub** (Current Choice)
- **Tagline:** "Your Learning, Your Pace"
- **Vibe:** Professional, organized, personal
- **Best for:** Comprehensive e-learning platforms with multiple roles

---

## Customization Guide

### 1. Change the App Name

Edit `.env`:
```env
VITE_APP_NAME=YourChosenName
VITE_APP_TAGLINE=Your tagline here
VITE_COMPANY_NAME=YourCompanyName
```

### 2. Update Logo/Icon

Replace `/public/logo.svg` with your custom SVG:
- **Size:** 256×256 px (recommended)
- **Format:** SVG for scalability
- **Colors:** Use brand colors (currently cyan gradient: #0891b2 → #06b6d4)

You can also update the image URL in `.env`:
```env
VITE_APP_LOGO_URL=/your-custom-logo.svg
VITE_APP_FAVICON=/your-custom-favicon.svg
```

### 3. Change Brand Colors

Edit `/client/src/lib/brand.ts`:
```typescript
export const PRIMARY_COLOR = "#your-color";
export const ACCENT_COLOR = "#your-accent";
```

Then update Tailwind config if needed.

### 4. Update Metadata

Favicon links and descriptions are in `/client/index.html`:
```html
<title>YourAppName - Your Tagline</title>
<meta name="description" content="Your app description" />
<link rel="icon" type="image/svg+xml" href="/your-logo.svg" />
```

### 5. Email & Support Contact

Update in `/client/src/lib/brand.ts`:
```typescript
export const SUPPORT_EMAIL = "your-email@domain.com";
```

---

## Brand Assets Files

- **Logo SVG:** `/client/public/logo.svg`
- **Brand Config:** `/client/src/lib/brand.ts`
- **HTML Metadata:** `/client/index.html`
- **Environment Variables:** `/client/.env`

## Files Using Brand Config

The following files automatically reference the brand configuration:

- `/client/src/components/Navigation.tsx` — Logo and app name in navbar
- `/client/src/pages/AdminSettings.tsx` — Platform name, email, and support contact
- `/client/index.html` — Page title, favicon, meta tags
- `/client/src/pages/StudentPortal.tsx` — Welcome messages
- `/client/src/pages/TeacherDashboard.tsx` — UI elements
- `/client/src/pages/AdminLogin.tsx` — Login page title

No hardcoding needed—update `.env` or `/client/src/lib/brand.ts` once, and the entire platform reflects the changes.

---

## Icon Instructions

The custom SVG logo now appears:
- ✅ Browser tab (favicon)
- ✅ Navbar/header
- ✅ Admin panel
- ✅ iOS home screen (apple-touch-icon)

No more Lovable heart icon—this is fully branded!

---

## Next Steps

1. ✅ Logo created (`/public/logo.svg`)
2. ✅ Brand config centralized (`/lib/brand.ts`)
3. ✅ HTML metadata updated
4. ✅ Hard references replaced with env vars
5. 🔄 **Optional:** Choose a different name from the alternatives and update `.env`

Enjoy your personalized AcademiHub! 🎓
