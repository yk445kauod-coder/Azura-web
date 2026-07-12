# Azura Cafe & Restaurant - AI-Ready Infrastructure

Azura is an advanced, high-performance, mobile-first web application for modern cafés and restaurants. It features a modern premium UI/UX, an optimized Reels hub, a Meta-style recommendation engine, and an enterprise-grade CRM activity tracker with an intuitive admin reporting dashboard.

## 🚀 Key Features

### 1. Modern Premium UI/UX Design
- **High-Contrast Typography**: Uses *IBM Plex Sans Arabic* globally for clean, accessible English and Arabic text.
- **Premium Styling**: Replaced all retro pixelated styling with an elegant, modern aesthetic, high-contrast elements, and luxurious brown-and-cream colors.
- **Mobile-First Bottom Sheets**: High-quality drawers and sheets with smooth sliding transitions optimized for touch devices.

### 2. High-Performance Video Reels Hub
- **Touch Swipe & Wheel Scroll**: Supports seamless TikTok-like vertical swipe gestures, mouse drags, scroll wheel navigation, and keyboard Up/Down arrow actions.
- **Buffered Rendering & Recycling**: Custom memory-saving system that mounts only the active, previous, and next videos. Faraway elements are recycled to support hundreds of high-definition video reels simultaneously without lag.
- **Nested Comments & Quality Control**:
  - Implements a visually nested replies hierarchy under parent comments.
  - Features comment & reply liking (bubbling up popular feedback).
  - High-quality automatic comment filtering with a robust English & Arabic offensive words list.
  - One-click **Report & Hide** flags that immediately censor low-quality comments from view and alert CRM administrators.

### 3. CRM Activity Tracking & User Diagnostics
- **Real-Time Heartbeat Logger**: Periodically tracks total active time spent by clients and records guest login/visit frequencies.
- **Audit Trails**: Chronicles user actions including menu searches, category filtering, detail views, reel engagements, and AI Barista chats.
- **Technical Issue Diagnosis**: Logs technical errors, fallback occurrences, and low-rating feedbacks directly under the customer's profile, providing waiters or administrators with proactive intervention alerts.

### 4. Meta-Style Recommendation Engine
- Calculates customer interest levels across café categories (e.g. specialty coffee, desserts, mojitos) based on clicks, likes, and searches.
- Persistently saves these affinity profiles under `users/${uid}/preferences/affinities`.
- Customizes AI Barista recommendations and sorts "Top Picks" dynamically to match calculated tastes.

---

## 📁 Project Structure
- `/artifacts/azura`: Main React & Vite application source code.
- `DESIGN.md`: Architecture and premium design philosophy.
- `SKILLS.md`: Core assistant capabilities and features.
- `PROMPT.md`: Instructions for AI Agents working on this repo.
- `FIREBASE_CONFIGS.md`: Database structure and security rules.

---

## 🛠 Tech Stack & Build Settings
- **Frontend**: React (Vite) + Tailwind CSS
- **Database**: Firebase Realtime Database
- **AI Engine**: Groq (Llama 3.3 70B) with automatic resilient Pollinations.ai fallback

### **Cloudflare Pages Deployment**
- **Framework preset**: `None`
- **Build command**: `pnpm build`
- **Build output directory**: `dist`
- **Root directory**: `artifacts/azura`
- **Node Version**: `22` (or latest LTS)

```bash
# To run locally:
cd artifacts/azura
pnpm install
pnpm run build
```

*Azura Cafe - Where Quality is a Habit.*
