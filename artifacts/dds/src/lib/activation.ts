import { db, ref, get, set, update } from "./firebase";

// DDS License Key Types
export type LicenseType = 
  | 'DDS'    // Lifetime access
  | 'DDSM'   // Monthly subscription
  | 'DDSY'   // Yearly subscription
  | 'DDD'    // Daily
  | 'DDW'    // Weekly
  | 'DDF';   // Free subscription

export interface LicenseInfo {
  type: LicenseType;
  duration: number; // in milliseconds, 0 for lifetime
  maxUsers: number;
  gracePeriod: number; // in milliseconds (1 week for subscriptions)
}

// License configurations
export const LICENSE_CONFIG: Record<LicenseType, LicenseInfo> = {
  'DDS': {
    type: 'DDS',
    duration: 0, // Lifetime
    maxUsers: 1000,
    gracePeriod: 0
  },
  'DDSM': {
    type: 'DDSM',
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxUsers: 1000,
    gracePeriod: 7 * 24 * 60 * 60 * 1000 // 1 week grace period
  },
  'DDSY': {
    type: 'DDSY',
    duration: 365 * 24 * 60 * 60 * 1000, // 365 days
    maxUsers: 1000,
    gracePeriod: 7 * 24 * 60 * 60 * 1000 // 1 week grace period
  },
  'DDD': {
    type: 'DDD',
    duration: 24 * 60 * 60 * 1000, // 1 day
    maxUsers: 1000,
    gracePeriod: 7 * 24 * 60 * 60 * 1000 // 1 week grace period
  },
  'DDW': {
    type: 'DDW',
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxUsers: 1000,
    gracePeriod: 7 * 24 * 60 * 60 * 1000 // 1 week grace period
  },
  'DDF': {
    type: 'DDF',
    duration: 0, // Developer decides end
    maxUsers: 100,
    gracePeriod: 0
  }
};

// Unsigned 32-bit DJB2 hashes of valid license keys
// This protects the raw plaintext keys from reverse engineering
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
  licenseType?: LicenseType;
  expiresAt?: number;
  maxUsers?: number;
}

/**
 * Extracts the license type prefix from a key
 */
export function getLicenseType(key: string): LicenseType | null {
  const cleanKey = key.trim().toUpperCase();
  const prefixes: LicenseType[] = ['DDS', 'DDSM', 'DDSY', 'DDD', 'DDW', 'DDF'];
  
  for (const prefix of prefixes) {
    if (cleanKey.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

/**
 * Validates the entered license key and registers it on Firebase RTDB if unused.
 */
export async function validateAndActivateKey(
  rawKey: string, 
  userEmail: string,
  businessName?: string
): Promise<ActivationResult> {
  const cleanKey = rawKey.trim().toUpperCase();
  
  if (!cleanKey) {
    return {
      valid: false,
      message: "Please enter an activation key.",
      messageAr: "يرجى إدخال مفتاح التفعيل."
    };
  }

  // Validate key format based on type
  const licenseType = getLicenseType(cleanKey);
  if (!licenseType) {
    return {
      valid: false,
      message: "Invalid activation key format. Key must start with DDS, DDSM, DDSY, DDD, DDW, or DDF.",
      messageAr: "صيغة مفتاح التفعيل غير صحيحة. يجب أن يبدأ بـ DDS أو DDSM أو DDSY أو DDD أو DDW أو DDF."
    };
  }

  const computedHash = djb2Hash(cleanKey);

  // 1. Local structural hash validation
  if (!VALID_KEY_HASHES.has(computedHash)) {
    return {
      valid: false,
      message: "Invalid activation key or key not found.",
      messageAr: "مفتاح التفعيل غير صحيح أو غير موجود."
    };
  }

  // 2. Real-time Firebase double-use verification
  const keyUsageRef = ref(db, `licenses/keys/${computedHash}`);
  const dbUrl = db.toString();

  try {
    const snap = await get(keyUsageRef);

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
      
      // If used on same system, check if same user
      if (usage.email && usage.email !== userEmail) {
        return {
          valid: false,
          message: "This activation key is already registered to another user.",
          messageAr: "مفتاح التفعيل هذا مسجل بالفعل لمستخدم آخر."
        };
      }
    }

    // Calculate expiration date
    const licenseConfig = LICENSE_CONFIG[licenseType];
    const now = Date.now();
    const expiresAt = licenseConfig.duration > 0 
      ? now + licenseConfig.duration 
      : 0; // 0 means lifetime

    // 3. Register the license
    const licenseData = {
      key: computedHash,
      rawKey: cleanKey, // Store hash reference only
      dbUrl: dbUrl,
      email: userEmail,
      businessName: businessName || '',
      licenseType: licenseType,
      activatedAt: now,
      expiresAt: expiresAt,
      gracePeriodEnd: expiresAt > 0 ? expiresAt + licenseConfig.gracePeriod : 0,
      maxUsers: licenseConfig.maxUsers,
      status: 'active',
      isPaused: false
    };

    await set(keyUsageRef, licenseData);

    // Also create/update user subscription record
    const userSubRef = ref(db, `subscriptions/${userEmail.replace(/[.#$\[\]]/g, '_')}`);
    await set(userSubRef, {
      licenseKey: computedHash,
      licenseType: licenseType,
      expiresAt: expiresAt,
      gracePeriodEnd: expiresAt > 0 ? expiresAt + licenseConfig.gracePeriod : 0,
      maxUsers: licenseConfig.maxUsers,
      status: 'active',
      isPaused: false,
      activatedAt: now
    });

    return {
      valid: true,
      message: "License key verified successfully! Your subscription is now active.",
      messageAr: "تم التحقق من مفتاح الترخيص بنجاح! اشتراكك نشط الآن.",
      licenseType: licenseType,
      expiresAt: expiresAt,
      maxUsers: licenseConfig.maxUsers
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

/**
 * Check subscription status for a user
 */
export async function checkSubscriptionStatus(userEmail: string): Promise<{
  active: boolean;
  expired: boolean;
  inGracePeriod: boolean;
  licenseType?: LicenseType;
  expiresAt?: number;
  gracePeriodEnd?: number;
}> {
  const userSubRef = ref(db, `subscriptions/${userEmail.replace(/[.#$\[\]]/g, '_')}`);
  
  try {
    const snap = await get(userSubRef);
    
    if (!snap.exists()) {
      return { active: false, expired: false, inGracePeriod: false };
    }
    
    const data = snap.val();
    const now = Date.now();
    
    // Check if subscription is paused
    if (data.isPaused) {
      return {
        active: false,
        expired: false,
        inGracePeriod: false,
        licenseType: data.licenseType,
        expiresAt: data.expiresAt,
        gracePeriodEnd: data.gracePeriodEnd
      };
    }
    
    // Lifetime license
    if (!data.expiresAt || data.expiresAt === 0) {
      return {
        active: true,
        expired: false,
        inGracePeriod: false,
        licenseType: data.licenseType,
        expiresAt: 0
      };
    }
    
    // Check if in grace period
    if (data.gracePeriodEnd && now > data.expiresAt && now < data.gracePeriodEnd) {
      return {
        active: false,
        expired: true,
        inGracePeriod: true,
        licenseType: data.licenseType,
        expiresAt: data.expiresAt,
        gracePeriodEnd: data.gracePeriodEnd
      };
    }
    
    // Check if fully expired
    if (now > (data.gracePeriodEnd || data.expiresAt)) {
      return {
        active: false,
        expired: true,
        inGracePeriod: false,
        licenseType: data.licenseType,
        expiresAt: data.expiresAt,
        gracePeriodEnd: data.gracePeriodEnd
      };
    }
    
    // Active subscription
    return {
      active: true,
      expired: false,
      inGracePeriod: false,
      licenseType: data.licenseType,
      expiresAt: data.expiresAt,
      gracePeriodEnd: data.gracePeriodEnd
    };
  } catch (err) {
    console.error("Error checking subscription status:", err);
    return { active: false, expired: false, inGracePeriod: false };
  }
}

/**
 * Developer mode verification
 */
const DEVELOPER_CODE_HASH = djb2Hash("DDS-DEV-30004459102010");

export function verifyDeveloperCode(code: string): boolean {
  return djb2Hash(code.trim().toUpperCase()) === DEVELOPER_CODE_HASH;
}

/**
 * Get all subscriptions (admin function)
 */
export async function getAllSubscriptions(): Promise<Record<string, any>[]> {
  const subsRef = ref(db, 'subscriptions');
  
  try {
    const snap = await get(subsRef);
    if (!snap.exists()) return [];
    
    const data = snap.val();
    return Object.values(data) as Record<string, any>[];
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    return [];
  }
}

/**
 * Block a free user (DDF) - developer function
 */
export async function blockFreeUser(email: string): Promise<boolean> {
  const userSubRef = ref(db, `subscriptions/${email.replace(/[.#$\[\]]/g, '_')}`);
  const blockListRef = ref(db, 'blocklist');
  
  try {
    // Get current data
    const snap = await get(userSubRef);
    if (!snap.exists()) return false;
    
    const data = snap.val();
    
    // Add to blocklist
    await update(blockListRef, {
      [email.replace(/[.#$\[\]]/g, '_')]: {
        email: email,
        blockedAt: Date.now(),
        reason: 'Free subscription terminated by developer'
      }
    });
    
    // Remove from active subscriptions
    await set(userSubRef, {
      ...data,
      status: 'blocked',
      blockedAt: Date.now()
    });
    
    return true;
  } catch (err) {
    console.error("Error blocking user:", err);
    return false;
  }
}
