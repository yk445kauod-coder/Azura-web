# Bolt's Journal ⚡

## 2025-06-24 - AI Model Upgrade & Multilingual Efficiency
**Learning:** Llama 3.3 70B (Groq) provides significantly better multilingual depth (Arabic/English) than previous versions within the same latency budget. Prompting with explicit "Fluent Egyptian Arabic" rather than just "Arabic" reduces the likelihood of formal Arabic responses which feel robotic in a cafe context.
**Action:** Always prefer `llama-3.3-70b-versatile` for high-end conversational tasks in the MEA region.

## 2025-06-24 - Menu Rendering Bottleneck
**Learning:** Calculating category counts in a `useCallback` that filters the entire item list for *each* category button results in O(N*M) complexity (Items * Categories). This causes noticeable lag in the UI when the menu grows large.
**Action:** Use a single-pass `useMemo` to generate a count map (O(N)) and look up values by ID in constant time during render.

## 2025-06-24 - React Component Stability
**Learning:** Individual card animations and heavy data props cause frequent re-renders of the entire grid during scroll/filter.
**Action:** Implement `React.memo` on list items (MenuItemCard) to isolate re-renders and use CSS-based transitions for smoother visual entry.
