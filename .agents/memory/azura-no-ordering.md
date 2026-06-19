---
name: Azura No-Ordering Rule
description: The app must never have cart, ordering, or checkout functionality.
---

## Rule
NO ordering, cart, or checkout functionality in this app — ever.

## Context
- `CartContext` was never created in `src/contexts/` 
- `MenuDeluxe.tsx`, `MenuJoyful.tsx`, `MenuLight.tsx`, `MenuTikTok.tsx` — all deleted (they imported CartContext and crashed)
- Only menu page: `MenuLightweight.tsx` (display-only, info modal, AI chat)
- `TipOverlay.tsx` was updated to remove "order your favorites" text

**Why:** Owner explicitly requires zero ordering functionality. The app is a digital menu + customer engagement platform only.

## How to apply
If any future code introduces cart state, add-to-cart buttons, order placement, or checkout flows — remove them immediately.
