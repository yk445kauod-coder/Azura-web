---
name: Azura App Architecture
description: Key architectural decisions and constraints for the Azura Cafe web app.
---

## Architecture

- **Type**: Pure frontend SPA (no backend server)
- **Database**: Firebase Realtime Database (`azura-cafe-55897`)
- **Auth**: Firebase anonymous auth (login = name + table number stored in localStorage)
- **Port**: 5000 hardcoded in vite.config.ts (required for Replit webview)
- **Build**: React 19 + Vite 7 + Tailwind CSS v4 (uses `@tailwindcss/vite` plugin, NOT postcss)
- **Workflow**: `npm run dev` → port 5000

**Why port 5000 hardcoded**: Replit webview requires port 5000 with outputType "webview"; previously was dynamic `process.env.PORT || 5173` which broke the preview.

## Key Paths
- Admin PIN: `azura2024` (hardcoded in Admin.tsx)
- Admin route: `/admin`
- Menu data seeded from `src/lib/fullMenu.ts` if Firebase empty

## How to apply
Whenever working on this project: keep port 5000, no backend server, Firebase is the only data source.
