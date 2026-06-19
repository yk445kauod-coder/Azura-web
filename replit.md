# Azura Café & Restaurant — Web App

## Overview
A production-ready Progressive Web App for **Azura Café & Restaurant** (Tivoli Dome, Alexandria, Egypt). Built with React 19 + Vite + Tailwind CSS v4 + Firebase Realtime Database.

**NO ordering, cart, or checkout functionality** — this is a display-only menu app with customer engagement features.

## Tech Stack
- **Frontend**: React 19, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite`)
- **Database**: Firebase Realtime Database (project: `azura-cafe-55897`)
- **AI**: Pollinations AI (free, no key) + Groq (optional, encrypted key in Firebase)
- **Routing**: Wouter
- **State**: React Query + Firebase real-time listeners

## Running the App
```bash
npm run dev        # Dev server on port 5000
npm run build      # Production build
npm run typecheck  # TypeScript check
```

Workflow: `npm run dev` → port 5000 (webview)

## App Structure
- `/` → SplashScreen (login with name + table number)
- `/menu` → MenuLightweight (display-only menu + AI barista chat)
- `/reels` → Reels (video content)
- `/support` → SupportChat (live chat with admin)
- `/suggest` → Suggest (ideas + feedback form)
- `/profile` → Profile (user settings)
- `/admin` → Admin CRM panel (PIN: `azura2024`)

## Key Files
- `src/pages/Admin.tsx` — Full CRM: menu mgmt, chat, reviews, users, broadcast, AI config, API settings
- `src/components/AIAdminAssistant.tsx` — Sovereign AI powered by Pollinations AI
- `src/pages/MenuLightweight.tsx` — Display menu + AI barista chat (Zura)
- `src/pages/SplashScreen.tsx` — Beautiful animated login screen
- `src/lib/aiService.ts` — AI service with Groq + Pollinations fallback + rate limiting
- `src/lib/firebase.ts` — Firebase config and helpers
- `src/contexts/AuthContext.tsx` — Anonymous Firebase auth + user session
- `src/contexts/LanguageContext.tsx` — EN/AR bilingual support

## Admin Panel
- **PIN**: `azura2024`  
- **URL**: `/admin`
- **Tabs**: Overview · Menu · Chat · Reviews · Ideas · Users · Broadcast · AI Config · API

## AI System
- Primary: Groq API (key stored encrypted in Firebase `api-settings/groqKey`)
- Fallback: Pollinations AI (free, no key required, always available)
- Admin AI: Sovereign business intelligence agent (reviews, visitors, menu insights)
- Customer AI: "Zura" the AI barista (menu recommendations, Q&A)

## User Preferences
- No ordering/cart functionality whatsoever
- Bilingual (Arabic/English) throughout
- Production-ready — zero console errors
- Port 5000 hardcoded for Replit webview compatibility
