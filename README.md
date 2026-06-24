# Azura Cafe & Restaurant - AI-Ready Infrastructure

Azura is a modern, mobile-first web application for restaurants, featuring a TikTok-style menu, AI-powered assistants, and advanced user activity tracking.

## 🚀 Quick Start
- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Firebase Realtime Database
- **AI**: Groq (Llama 3.3) + Pollinations.ai fallback
- **Auth**: Name & Table Number system (Device-persistent)

## 📁 Project Structure
- `/artifacts/azura`: Main application source code.
- `DESIGN.md`: Architecture and UI/UX philosophy.
- `SKILLS.md`: Core functionalities and capabilities.
- `PROMPT.md`: Instructions for AI Agents working on this repo.
- `FIREBASE_CONFIGS.md`: Database structure and security rules.

## 🛠 Tech Stack & Recent Changes
- **Typography**: IBM Plex Sans Arabic (Modern & Professional).
- **UI Components**: Framer Motion, Radix UI, Lucide Icons.
- **Modals**: Redesigned as mobile-first bottom sheets for better UX.
- **Tracking**: 30s Heartbeat system for usage analytics and persistent user identification.
- **AI Assistants**: Integrated 'Zura' AI (Groq + Pollinations) with persistent chat history.
- **Database Fallback**: Robust Admin panel with Cloudflare R2 fallback layer.
- **Video Reels**: Enhanced embedding support for Facebook and Instagram Reels.

## ☁️ Cloudflare Pages Deployment Settings
To ensure a successful build and avoid deployment errors (like "Cannot read properties of null"), use the following settings in the Cloudflare Pages dashboard:

### **Build Settings**
- **Framework preset**: `None`
- **Build command**: `pnpm build`
- **Build output directory**: `dist`
- **Root directory**: `artifacts/azura`

### **Environment Variables**
- **NODE_VERSION**: `22` (or latest LTS)
- **PNPM_VERSION**: `10` (or latest)

### **Important Notes**
1. **DO NOT** use `npm install` or `npm run build` as the build command. Cloudflare's `pnpm` support is more stable for this project's dependency tree.
2. The `_redirects` file is already included in the `public` folder to handle Single Page Application (SPA) routing.

```bash
# Manual Build Process
cd artifacts/azura
pnpm install
pnpm run build
```
