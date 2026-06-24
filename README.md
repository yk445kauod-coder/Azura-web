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

## ⚠️ Deployment Note
Always use **pnpm** for installing dependencies and building the project. The Cloudflare Pages deployment environment is configured to use the `pnpm-lock.yaml` for consistency.

```bash
cd artifacts/azura
pnpm install
pnpm run build
```
