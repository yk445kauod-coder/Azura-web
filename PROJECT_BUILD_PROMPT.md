# Azura Café - Complete Build Specification

## Project Overview

Build **Azura Café** - A full-featured restaurant/cafe web application with AI-powered barista assistant, menu browsing, social reels, and admin management dashboard.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend Framework** | React 18 + TypeScript + Vite |
| **Routing** | Wouter (lightweight React Router alternative) |
| **Styling** | Tailwind CSS 3.4 + shadcn/ui components |
| **State Management** | React Context API + Firebase Realtime Database |
| **Authentication** | Firebase Auth (Anonymous authentication) |
| **Database** | Firebase Realtime Database (RTDB) |
| **AI Integration** | Groq API + Pollinations AI (fallback) |
| **Animations** | Framer Motion + Lucide React icons |
| **Hosting** | Cloudflare Pages |

---

## Application Pages

### 1. SplashScreen (Login Page)
- **Route**: `/` (root)
- **Features**:
  - Animated splash screen with logo
  - Simple login: Name + Table Number (1-99)
  - Persistent login via localStorage (saves `azura-name`, `azura-table`)
  - Loading state during authentication
  - Firebase Anonymous Auth integration
  - Redirects to `/menu` if already logged in

### 2. Menu Page
- **Route**: `/menu`
- **Features**:
  - Tabbed menu categories (30+ categories)
  - Real-time sync from Firebase RTDB `menu` node
  - Toggle availability on/off for each item
  - Search and filter functionality
  - Category-based filtering
  - Responsive card layout
  - Bilingual support (EN/AR) via LanguageContext

### 3. AI Barista (Chat)
- **Route**: `/barista`
- **Features**:
  - AI-powered conversational assistant
  - Menu-aware responses using Firebase RTDB
  - Supports 4 fallback AI chains:
    1. Groq API (if `api-settings.groqKey` exists)
    2. Pollinations AI text generation
    3. Menu-based smart responses
    4. Fallback greeting messages
  - Rate limiting: 10 requests/minute
  - Conversation history
  - RTL support for Arabic

### 4. Reels Page
- **Route**: `/reels`
- **Features**:
  - Swipeable reels like Instagram/TikTok
  - Support for images and videos
  - **Video URL Parsing** from:
    - Facebook Reels (`facebook.com/reel/...`)
    - Instagram Reels (`instagram.com/reel/...`)
    - TikTok (`tiktok.com/@.../video/...`)
    - YouTube Shorts (`youtube.com/shorts/...`)
    - Direct video URLs (mp4, webm)
  - Like system with Firebase RTDB
  - Comment system with replies
  - Rating modal
  - Pinned reels at top
  - Graceful 404 image fallback

### 5. Support Chat
- **Route**: `/support`
- **Features**:
  - Customer support messaging
  - Real-time sync via Firebase
  - Admin receives notifications

### 6. Profile Page
- **Route**: `/profile`
- **Features**:
  - Display user name and table number
  - Edit profile
  - Language toggle (EN/AR)
  - Logout functionality

### 7. Admin Dashboard
- **Route**: `/admin`
- **PIN**: `azura2024`
- **Features**:

#### Tabs:
1. **Overview** - Dashboard stats
2. **Menu** - Full CRUD for menu items
   - Add new items (name, nameAr, price, category, image)
   - **Inline editing** (click edit icon)
   - Toggle availability
   - Delete items
   - Search and filter
3. **Chat** - Support chat management
4. **Reviews** - View and mark feedback as read
5. **Ideas** - Suggestion management
6. **Users** - Visitor tracking from `userLogs`
7. **Broadcast** - Send announcements
8. **Reels** - Manage social content
   - Upload image reels
   - Paste video URLs (FB, IG, TikTok, YouTube)
   - Pin/unpin reels
   - Delete reels
9. **AI Config** - Configure AI barista
   - System prompts (EN/AR)
   - Barista names (Zura/Zure)
   - Temperature and max tokens
10. **API** - API key management
    - Groq API key (encrypted storage)
    - Toggle AI on/off

---

## Firebase Realtime Database Structure

```
/
├── menu/                          # Menu items by category
│   ├── "Category Name"/
│   │   ├── itemId: {
│   │   │   name: string
│   │   │   nameAr: string
│   │   │   price: number
│   │   │   category: string
│   │   │   available: boolean
│   │   │   image: string (base64 or URL)
│   │   │   description?: string
│   │   │   }
│   └── ...
│
├── reels/                         # Social reels
│   ├── reelId: {
│   │   image: string
│   │   caption: string
│   │   captionAr: string
│   │   likes: number
│   │   likedBy: { [uid]: true }
│   │   pinned: boolean
│   │   mediaType: "image" | "video"
│   │   videoUrl?: string
│   │   videoProvider?: "facebook" | "instagram" | "tiktok" | "youtube" | "direct"
│   │   videoEmbedUrl?: string
│   │   createdAt: number
│   │   authorName: string
│   │   comments: {
│   │   │   commentId: {
│   │   │       text: string
│   │   │       userName: string
│   │   │       userId: string
│   │   │       createdAt: number
│   │   │       likes: number
│   │   │       likedBy: { [uid]: true }
│   │   │       replies: {
│   │   │           replyId: { ... }
│   │   │       }
│   │   │   }
│   │   }
│   └── ...
│
├── ratings/                       # Overall app ratings
│   └── ratingId: {
│       userId: string
│       userName: string
│       rating: number (1-5)
│       comment: string
│       createdAt: number
│   }
│
├── api-settings/                  # AI configuration
│   ├── groqKey: string (encrypted)
│   ├── aiEnabled: boolean
│   └── updatedAt: number
│
├── ai-config/                    # AI personality
│   ├── systemPrompt: string
│   ├── systemPromptAr: string
│   ├── baristaFemale: string
│   ├── baristaMale: string
│   ├── temperature: number
│   └── maxTokens: number
│
├── broadcast/                     # Announcements
│   └── broadcastId: {
│       title: string
│       titleAr: string
│       message: string
│       messageAr: string
│       type: "info" | "promo" | "alert"
│       emoji: string
│       createdAt: number
│   }
│
├── feedback/                     # Reviews
│   └── feedbackId: {
│       userName: string
│       rating: number
│       comment: string
│       createdAt: number
│       read: boolean
│   }
│
├── support-chat/                # Customer support
│   └── uid/
│       ├── meta: {
│       │   userName: string
│       │   lastMessage: string
│       │   lastAt: number
│       │   unreadAdmin: number
│       │   }
│       └── messages/
│           └── messageId: {
│               text: string
│               sender: "user" | "admin"
│               createdAt: number
│           }
│
└── userLogs/                     # Analytics
    └── logId: {
        uid: string
        name: string
        tableNumber: string
        timestamp: number
        deviceInfo: {
            userAgent: string
            platform: string
            language: string
        }
    }
```

---

## Menu Categories (30 Total)

1. New Items
2. Breakfast
3. Toast
4. Croissant
5. Soup
6. Appetizers
7. Salad
8. Pasta
9. Tortilla Sandwiches
10. Vina Sandwiches
11. Main Dishes - Chicken
12. Main Dishes - Meat
13. Beef Burger
14. Smash Burger
15. Fried Chicken Sandwich
16. Extra Kitchen
17. Hot Drinks
18. Iced Drinks
19. Fresh Juice
20. Cocktails
21. Smoothie
22. Milkshake
23. Waffle
24. Desserts
25. Crepe
26. Mini Pancakes
27. Pancakes
28. Extra Drinks
29. Soft Drink
30. Hookah

---

## Core Components

### 1. AuthContext
- Firebase Anonymous Auth
- User session management
- Profile data (name, tableNumber, uid)

### 2. LanguageContext
- `lang`: "en" | "ar"
- `isRTL`: boolean
- `tr(en, ar)`: translation helper

### 3. ErrorBoundary
- React error boundary for crash resilience
- Fallback UI on errors

### 4. AI Service
- Chain: Groq → Pollinations → Menu-based → Fallback
- Rate limiting
- Caching for responses

### 5. Video Parser Utility
```typescript
parseVideoUrl(input: string): {
  provider: "facebook" | "instagram" | "tiktok" | "youtube" | "direct" | null
  videoId: string
  embedUrl: string
  thumbnail: string
}
```

### 6. Safe Image Handler
```typescript
getSafeImageUrl(url: string | undefined, fallback?: string): string
```

---

## Design System

### Colors
- Primary: Warm orange/amber (hsl(38, 85%, 55%))
- Primary Foreground: White
- Background: Off-white with subtle gradients
- Card: Elevated surfaces
- Accent: Amber/gold tones

### Typography
- Font: System fonts with Playfair Display for headings
- Direction: Full RTL support for Arabic

### Animations
- Page transitions: Fade + slide
- Button interactions: Scale on press
- Loading states: Spinners
- Toast notifications

---

## Cloudflare Pages Configuration

### Build Settings

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

### Environment Variables (Optional)
```
# Not required - Firebase uses client-side config
```

### Worker Settings
- **Type**: Static site
- **Routes**: All pages client-side rendered

### Direct Deploy
Since this is a purely client-side SPA (no SSR), upload the `dist/` folder contents directly.

---

## Security Considerations

1. **Admin PIN**: Simple session check (`sessionStorage.getItem("azura-admin")`)
2. **API Keys**: Encrypted in Firebase RTDB using client-side encryption
3. **Rate Limiting**: Client-side rate limiting for AI requests
4. **Input Validation**: Validate all user inputs before saving

---

## Features to Implement

### Must Have
- [x] Simple login (name + table)
- [x] Menu browsing with categories
- [x] AI Barista chat
- [x] Reels with video support
- [x] Admin dashboard
- [x] Firebase RTDB sync
- [x] RTL/Arabic support

### Nice to Have
- [ ] Push notifications
- [ ] Order tracking (removed)
- [ ] Payment integration (removed)
- [ ] Offline support with Service Worker

---

## Build & Deploy Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run serve

# Type check
npm run typecheck
```

---

## Troubleshooting

### 404 on page refresh
Cloudflare Pages serves `index.html` for all routes - ensure SPA routing works.

### Firebase connection issues
Check Firebase config in `src/lib/firebase.ts`

### AI not working
1. Check `api-settings` in Firebase RTDB
2. Verify `aiEnabled: true`
3. If no Groq key, fallback to Pollinations (free)

### Images not loading
- Check base64 image size limits
- Verify Firebase storage rules allow read

---

*This document was generated from the Azura Café project. For questions, refer to the Firebase documentation or contact the development team.*
