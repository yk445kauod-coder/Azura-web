import { db, ref, push, update, get } from "./firebase";

export interface UserActivity {
  id?: string;
  actionType: string; // e.g. "click_category", "view_reel", "comment", "search", "ai_chat", "ai_fallback_triggered", "error"
  details: any;
  createdAt: number;
}

export interface UserIssue {
  id?: string;
  type: string; // e.g. "ai_fallback_triggered", "low_rating_given", "error_thrown"
  details: string;
  createdAt: number;
}

/**
 * Log a user action, update their CRM activity score, and maintain category-interest (Meta-style affinity)
 *
 * @param uid User ID
 * @param actionType Type of action performed
 * @param details Metadata details for the action
 * @param scoreIncrement Number of points to add to the activityScore (CRM)
 */
export async function logUserActivity(
  uid: string,
  actionType: string,
  details: any = {},
  scoreIncrement: number = 5
) {
  if (!uid || uid === "admin") return;

  try {
    const now = Date.now();
    const userRef = ref(db, `users/${uid}`);

    // 1. Log to chronological activity feed
    const activityItem: UserActivity = {
      actionType,
      details,
      createdAt: now
    };
    await push(ref(db, `users/${uid}/activities`), activityItem);

    // 2. Fetch current profile to increment score
    const snap = await get(userRef);
    if (snap.exists()) {
      const profile = snap.val();
      const currentScore = profile.activityScore || 0;
      const newScore = Math.max(0, currentScore + scoreIncrement);

      const updates: Record<string, any> = {
        activityScore: newScore,
        lastSeenAt: now
      };

      // 3. Keep track of issues/errors faced directly in user profile summaries for quick CRM alerts
      if (actionType === "error" || actionType.includes("fallback") || actionType.includes("reported")) {
        const issuesCount = (profile.issuesCount || 0) + 1;
        updates["issuesCount"] = issuesCount;
        updates["hasIssues"] = true;

        // Push to detailed issues table
        const issueItem: UserIssue = {
          type: actionType,
          details: typeof details === "object" ? JSON.stringify(details) : String(details),
          createdAt: now
        };
        await push(ref(db, `users/${uid}/issues`), issueItem);
      }

      await update(userRef, updates);
    }
  } catch (error) {
    console.error("Activity tracking failed:", error);
  }
}

/**
 * Update the user's category affinity score directly (Meta Algorithm)
 *
 * @param uid User ID
 * @param category Menu category (e.g., mojitos, desserts, coffee)
 * @param increment Value to increment the category affinity by
 */
export async function updateUserCategoryAffinity(
  uid: string,
  category: string,
  increment: number = 10
) {
  if (!uid || !category || uid === "admin") return;

  try {
    const affinityRef = ref(db, `users/${uid}/preferences/affinities/${category}`);
    const snap = await get(affinityRef);
    const currentVal = snap.exists() ? Number(snap.val()) : 0;
    const newVal = Math.max(0, Math.min(100, currentVal + increment)); // cap at 100 max

    await update(ref(db, `users/${uid}/preferences/affinities`), {
      [category]: newVal
    });
  } catch (error) {
    console.error("Updating category affinity failed:", error);
  }
}
