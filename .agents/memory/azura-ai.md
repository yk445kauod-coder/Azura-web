---
name: Azura AI Setup
description: How AI works in the Azura app — dual provider with fallback.
---

## AI Architecture

### Customer-facing AI (Zura the Barista)
- Entry point: `chatWithAI()` in `src/lib/aiService.ts`
- Primary: Groq API (key stored encrypted in Firebase `api-settings/groqKey`, uses `encryptKey()`)
- Fallback: Pollinations AI (free, `https://text.pollinations.ai/...?model=openai`, no key needed)
- Rate limit: 10 requests/minute with in-memory log
- Cache: 5-minute TTL for menu-based responses
- Used in: `MenuLightweight.tsx` chat panel

### Admin AI (Sovereign Business Intelligence)
- Entry point: `generateAdminResponse()` in `src/components/AIAdminAssistant.tsx`
- Always uses Pollinations AI (no key needed, sovereign)
- Loads live data from Firebase: menu, feedback, users, suggestions, broadcasts
- Provides: review analysis, visitor insights, menu analytics, improvement tips

### AI Config
- Stored in Firebase `ai-config/`: systemPrompt, systemPromptAr, baristaFemale, baristaMale, temperature, maxTokens
- Editable from Admin → AI Config tab

**Why Pollinations as fallback**: Free, no API key, reliable, supports OpenAI-compatible models.

## How to apply
When modifying AI: always maintain the Pollinations fallback; never require a key for AI to work.
