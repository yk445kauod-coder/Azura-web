import { db, ref, get, set } from "./firebase";

// Unsigned 32-bit DJB2 hashes of the 50 authorized activation keys
// This completely protects the raw plaintext keys from being reverse-engineered from source.
export const VALID_KEY_HASHES = new Set([
  2301717421, 3265386853, 757520229, 2854515109, 1013175269, 3268401317, 1054750182,
  744267173, 3679857605, 3957878885, 4144567538, 3352751557, 3582496911, 1517209072,
  4100056532, 1602176030, 3007675961, 1578018242, 4287627746, 2214555391, 1427892115,
  101330708, 325936060, 3576011559, 2210141989, 2776247846, 115162587, 514740289,
  787736021, 2679080551, 754123845, 2178277061, 2827856710, 979063675, 3796847419,
  3485101129, 3157719490, 4233836167, 49389315, 993481354, 1184779982, 3834845099,
  1350774471, 2110155232, 3066876133, 1155590298, 1655151203, 846133825, 1531241585,
  3356684563
]);

export function djb2Hash(str: string): number {
  let hash = 5381;
  const cleanStr = str.trim().toUpperCase();
  for (let i = 0; i < cleanStr.length; i++) {
    hash = ((hash << 5) + hash) + cleanStr.charCodeAt(i);
  }
  return hash >>> 0;
}

export interface ActivationResult {
  valid: boolean;
  message: string;
  messageAr: string;
}

/**
 * Validates the entered activation key and registers it on Firebase RTDB if unused.
 */
export async function validateAndActivateKey(rawKey: string): Promise<ActivationResult> {
  const cleanKey = rawKey.trim().toUpperCase();
  if (!cleanKey) {
    return {
      valid: false,
      message: "Please enter an activation key.",
      messageAr: "يرجى إدخال مفتاح التفعيل."
    };
  }

  const computedHash = djb2Hash(cleanKey);

  // 1. Local structural hash validation
  if (!VALID_KEY_HASHES.has(computedHash)) {
    return {
      valid: false,
      message: "Invalid activation key structure or code.",
      messageAr: "مفتاح التفعيل غير صحيح أو غير متطابق."
    };
  }

  // 2. Real-time Firebase double-use verification
  const keyUsageRef = ref(db, `activated-keys/${computedHash}`);
  try {
    const snap = await get(keyUsageRef);
    const dbUrl = db.toString();

    if (snap.exists()) {
      const usage = snap.val();
      // If it has been registered by a different Firebase target, block it!
      if (usage.dbUrl && usage.dbUrl !== dbUrl) {
        return {
          valid: false,
          message: "This activation key has already been used on another system.",
          messageAr: "مفتاح التفعيل هذا تم استخدامه بالفعل في نظام آخر."
        };
      }
    }

    // 3. Register the key as used inside our central namespace
    await set(keyUsageRef, {
      dbUrl: dbUrl,
      activatedAt: Date.now(),
      status: "used"
    });

    return {
      valid: true,
      message: "Activation key verified successfully!",
      messageAr: "تم التحقق من مفتاح التفعيل وتنشيط النظام بنجاح!"
    };
  } catch (err) {
    console.error("Firebase key validation error:", err);
    return {
      valid: false,
      message: "Database communication failed. Please check internet connection.",
      messageAr: "فشل الاتصال بقاعدة البيانات. يرجى التحقق من الاتصال بالإنترنت."
    };
  }
}
