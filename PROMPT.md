# Instructions for AI Agents

When working with the Azura codebase, follow these rules to maintain consistency:

## 🖋 Typography
- **NEVER** use: Tajawal, Amiri, or Cairo.
- **ALWAYS** use: `IBM Plex Sans Arabic`.

## 🤖 AI Integration
- Always use the helper functions in `src/lib/crypto.ts` for AI calls.
- Ensure `chatHistory` is updated in Firebase after every message.
- The `geminiKey` stored in the database is used as the bearer token for Groq calls (unified gateway).

## 👤 Authentication
- The user's identity is defined by `{name}-{table}-{deviceId}`.
- Do not attempt to add Email/Google auth; keep it simple as requested.

## 📱 UI Components
- Use `framer-motion` for all transitions.
- Item modals must remain as "Bottom Sheets" on mobile.
- Maintain the "Parchment" and "Dark Brown" color palette.

## 📈 Tracking
- If adding new pages, ensure the Heartbeat mechanism (in `AuthContext`) remains active to track user time accurately.
