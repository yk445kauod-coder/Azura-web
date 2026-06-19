import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from "react";
import { auth, signInAnonymously, db, ref, push, set, onValue, off, type User } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  deviceId: string;
  firebaseUid: string | null;
  name: string;
  tableNumber: string | null;
  createdAt: number;
  lastLogin: number;
  loginCount: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  preferences: { lang: string; barista: "female" | "male" };
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  tableNumber: string | null;
  setTableNumber: (t: string) => void;
  login: (name: string, tableNum: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "azura-user";
const NAME_KEY = "azura-name";
const TABLE_KEY = "azura-table";
const DEVICE_ID_KEY = "azura-device-id";

// Rate limiting for login attempts
const loginAttempts: { timestamp: number }[] = [];
const LOGIN_RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60000;

function isRateLimited(): boolean {
  const now = Date.now();
  while (loginAttempts.length > 0 && now - loginAttempts[0].timestamp > RATE_LIMIT_WINDOW) {
    loginAttempts.shift();
  }
  return loginAttempts.length >= LOGIN_RATE_LIMIT;
}

function recordLoginAttempt(): void {
  loginAttempts.push({ timestamp: Date.now() });
}

// Get or create unique device ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${navigator.userAgent.substring(0, 20).replace(/[^a-z0-9]/gi, '')}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// Get device info
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent.substring(0, 100),
    platform: navigator.platform || "unknown",
    language: navigator.language || "unknown",
  };
}

// Record login event to Firebase
async function recordLoginEvent(profile: UserProfile) {
  try {
    const logRef = push(ref(db, "userLogs"));
    await set(logRef, {
      deviceId: profile.deviceId,
      uid: profile.uid,
      name: profile.name,
      tableNumber: profile.tableNumber,
      loginCount: profile.loginCount,
      timestamp: Date.now(),
      createdAt: profile.createdAt,
      eventType: profile.loginCount === 1 ? "first_login" : "return_login",
      deviceInfo: profile.deviceInfo,
    });
  } catch (err) {
    console.warn("Failed to record login event:", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const savedName = localStorage.getItem(NAME_KEY);
  const savedTable = localStorage.getItem(TABLE_KEY);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
          if (!mounted) return;

          if (fbUser) {
            setFirebaseUser(fbUser);
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
              } catch {
                const deviceId = getDeviceId();
                const newProfile: UserProfile = {
                  uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  deviceId,
                  firebaseUid: fbUser.uid,
                  name: localStorage.getItem(NAME_KEY) || "Guest",
                  tableNumber: localStorage.getItem(TABLE_KEY),
                  createdAt: Date.now(),
                  lastLogin: Date.now(),
                  loginCount: 1,
                  deviceInfo: getDeviceInfo(),
                  preferences: { lang: "en", barista: "female" },
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
                setUser(newProfile);
              }
            }
          } else {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
              } catch {
                localStorage.removeItem(STORAGE_KEY);
                setUser(null);
              }
            }
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.warn("Firebase auth init failed:", err);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        setLoading(false);
      }
    };

    initAuth();
    return () => { mounted = false; };
  }, []);

  const setTableNumber = useCallback((t: string) => {
    localStorage.setItem(TABLE_KEY, t);
    if (user) {
      const updated = { ...user, tableNumber: t };
      setUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [user]);

  const login = useCallback(async (name: string, tableNum: string) => {
    if (isRateLimited()) {
      throw new Error("Too many login attempts. Please wait a moment.");
    }
    recordLoginAttempt();

    const trimmedName = name.trim();
    const trimmedTable = tableNum.trim();

    localStorage.setItem(NAME_KEY, trimmedName);
    localStorage.setItem(TABLE_KEY, trimmedTable);

    const deviceId = getDeviceId();
    
    // Check if this device has logged in before
    let existingProfile: UserProfile | null = null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.deviceId === deviceId && parsed.name === trimmedName) {
          existingProfile = parsed;
        }
      } catch {}
    }

    const newProfile: UserProfile = {
      uid: existingProfile?.uid || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      firebaseUid: null,
      name: trimmedName,
      tableNumber: trimmedTable,
      createdAt: existingProfile?.createdAt || Date.now(),
      lastLogin: Date.now(),
      loginCount: (existingProfile?.loginCount || 0) + 1,
      deviceInfo: getDeviceInfo(),
      preferences: existingProfile?.preferences || { lang: "en", barista: "female" },
    };

    try {
      const cred = await signInAnonymously(auth);
      newProfile.firebaseUid = cred.user.uid;
      setFirebaseUser(cred.user);
    } catch (err) {
      console.warn("Firebase anonymous auth failed:", err);
    }

    setUser(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    
    // Record login event to Firebase
    await recordLoginEvent(newProfile);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateUserProfile = useCallback((data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        tableNumber: user?.tableNumber || savedTable || null,
        setTableNumber,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
