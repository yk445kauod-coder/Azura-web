---
name: Azura guest login race condition
description: Why anonymous users must not get profiles created in onAuthStateChanged
---

**Rule:** In `AuthContext.tsx` `onAuthStateChanged`, the `else` branch (no profile exists) must check `!u.isAnonymous` before creating a new profile. Anonymous users are handled exclusively by `loginAnonymous()`.

**Why:** `onAuthStateChanged` fires immediately after `signInAnonymously()` completes, but before `loginAnonymous()` writes the user's name to RTDB. If `onAuthStateChanged` writes first, it uses `u.displayName || "Guest"` — but `displayName` is null at that moment because `updateProfile()` hasn't run yet. This overwrites the user's real name with "Guest".

**How to apply:** The fixed code in `onAuthStateChanged` uses `} else if (!u.isAnonymous) {` so only Google/email users get auto-created profiles there. The `loginAnonymous()` function writes the full profile with the real name, then calls `updateProfile()` to sync displayName.

**Also:** `loginAnonymous()` must include `lastSeenAt: Date.now()` and `totalUsageSeconds: 0` in its `newProfile` object to satisfy the `UserProfile` interface.
