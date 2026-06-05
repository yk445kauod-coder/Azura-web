# Azura Cafe - Smart Restaurant App

<div align="center">
  <img src="artifacts/azura/public/logo.jpg" alt="Azura Logo" width="120" />
  <h3>أزورا كافيه - Tivoli Dome, Alexandria</h3>
  <p>AI-powered smart restaurant ordering system</p>
</div>

## 🎯 Overview

Azura is a bilingual (Arabic/English) smart cafe app that transforms how customers interact with the restaurant. Features include:

- **AI Barista** - Voice/text chat with personalized drink recommendations
- **Smart Menu** - Real-time menu with images, categories, and search
- **Order Tracking** - Live order status from kitchen to delivery
- **Social Feed** - Instagram-style posts and announcements
- **Admin Dashboard** - Complete restaurant management system

## 🏗️ Architecture

```
Azura-web/
├── artifacts/
│   ├── azura/           # Main React app (Vite + TailwindCSS)
│   └── api-server/      # Express backend API
├── lib/
│   ├── api-client-react/ # Typed API client
│   ├── api-spec/        # OpenAPI specifications
│   ├── api-zod/         # Validation schemas
│   └── db/              # Database utilities
├── package.json          # pnpm workspace root
├── pnpm-workspace.yaml  # Package dependencies
└── README.md
```

## ✨ Features

### Customer App
| Feature | Description |
|---------|-------------|
| 🏠 Welcome | Language selection, guest/login, AI barista persona picker |
| 📋 Menu | Browse items, search, filter by category, add to cart |
| 🤖 AI Barista | Chat with AI for recommendations, voice input, TTS |
| 🛒 Cart | Review order, add notes, submit order |
| 📦 Orders | Track order status, rate orders after delivery |
| 👤 Profile | View account, order history |
| 🎬 Reels | Social feed, like, share, post |

### Admin Dashboard (`/admin`, PIN: `azura2024`)
| Tab | Features |
|-----|----------|
| 📊 Overview | Revenue, orders stats, ratings overview |
| 📋 Orders | Real-time order queue, status updates |
| 🍽️ Menu | Add/edit/delete items, toggle availability |
| 💬 Chat | Live customer chat support |
| ⭐ Reviews | View customer feedback, ratings |
| 💡 Ideas | Customer suggestions with voting |
| 📈 Reports | Revenue & orders analytics |
| 📢 Broadcast | Send announcements to all users |
| 🎬 Reels | Manage social posts |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS 4 |
| Routing | Wouter |
| State | React Context + TanStack Query |
| Backend | Express.js, Node.js |
| Database | Firebase Realtime Database |
| AI | Gemini API (AI Barista) |
| Speech | Web Speech API (STT/TTS) |
| Build | pnpm Workspaces |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Firebase project credentials

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Add Firebase config and API keys
```

### Development

```bash
# Start all packages
pnpm dev

# Or run individually
pnpm --filter azura dev
pnpm --filter api-server dev
```

### Build

```bash
pnpm build
```

## 🔑 Environment Variables

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# AI (Gemini)
GEMINI_API_KEY=
```

## 📱 Deployment

The app is optimized for:
- Web browsers (PWA-ready)
- Mobile responsive design
- Hosted on Vercel/Netlify/Railway

## 🌐 Localization

Full Arabic (RTL) and English support:
- UI strings
- Menu items (bilingual)
- AI responses (Egyptian dialect)

## 🔐 Security

- Admin PIN protection
- Firebase Authentication
- Input sanitization
- Image compression (client-side)

## 📄 License

MIT
