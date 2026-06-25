---
name: Azura Firebase menu merge pattern
description: How ingredient/category data is pushed into the existing Firebase RTDB menu without overwriting unrelated fields
---

## Rule
`mergeMenuIngredients()` in `firebase.ts` reads existing menu first, then uses a single `update(ref(db), updates)` call with multi-path keys. New items (whole categories like soups/salads/pasta) get written in full; existing items only get `ingredients`, `ingredientsAr`, `description`, `descriptionAr` patched.

**Why:** Firebase already had old menu data (seeded without ingredients). `seedMenuIfEmpty()` is a no-op when menu exists, so a separate merge function is needed to backfill ingredient data on every cold start.

**How to apply:** Called in `App.tsx` as `.then(() => mergeMenuIngredients())` after `seedMenuIfEmpty()`. Safe to run on every startup — idempotent for existing fields.
