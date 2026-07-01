import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react";
import {
  auth, db, googleProvider,
  signInAnonymously, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile,
  ref, set, get, onValue, off, update,
  type User,
} from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  tableNumber: string | null;
  deviceId: string;
  isGuest: boolean;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
  lastSeenAt: number;
  loginCount: number;
  totalUsageSeconds: number;
  orderCount: number;
  preferences: { lang: string; barista: "female" | "male" };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  tableNumber: string | null;
  setTableNumber: (t: string) => void;
  loginAnonymous: (name: string, tableNum: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumberState] = useState<string | null>(
    () => sessionStorage.getItem("azura-table")
  );

  const getDeviceId = () => {
    let id = localStorage.getItem("azura-device-id");
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem("azura-device-id", id);
    }
    return id;
  };

  const setTableNumber = (t: string) => {
    setTableNumberState(t);
    sessionStorage.setItem("azura-table", t);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileRef = ref(db, `users/${u.uid}`);
        const snap = await get(profileRef);
        const deviceId = getDeviceId();
        if (snap.exists()) {
          const existing = snap.val() as UserProfile;
          const updated = {
            ...existing,
            name: u.displayName || existing.name || "Guest",
            lastLoginAt: Date.now(),
            lastSeenAt: Date.now(),
            loginCount: (existing.loginCount || 0) + 1,
            deviceId: deviceId, // Update device ID in case they switched
          };
          await set(profileRef, updated);
          setProfile(updated);
        } else if (!u.isAnonymous) {
          const newProfile: UserProfile = {
            uid: u.uid,
            name: u.displayName || u.email?.split("@")[0] || "User",
            email: u.email,
            tableNumber: sessionStorage.getItem("azura-table"),
            deviceId: deviceId,
            isGuest: false,
            photoURL: u.photoURL,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            lastSeenAt: Date.now(),
            loginCount: 1,
            totalUsageSeconds: 0,
            orderCount: 0,
            preferences: { lang: "en", barista: "female" },
          };
          await set(profileRef, newProfile);
          setProfile(newProfile);
        }
        // Anonymous users: profile is created by loginAnonymous() — skip here to prevent race condition
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = ref(db, `users/${user.uid}`);
    onValue(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.val());
    });
    return () => off(profileRef);
  }, [user?.uid]);

  const loginAnonymous = async (name: string, tableNum: string) => {
    const cred = await signInAnonymously(auth);
    setTableNumber(tableNum);
    const deviceId = getDeviceId();
    const profileRef = ref(db, `users/${cred.user.uid}`);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name: name,
      email: null,
      tableNumber: tableNum,
      deviceId: deviceId,
      isGuest: true,
      photoURL: null,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      lastSeenAt: Date.now(),
      loginCount: 1,
      totalUsageSeconds: 0,
      orderCount: 0,
      preferences: { lang: "en", barista: "female" },
    };
    await set(profileRef, newProfile);
    setProfile(newProfile);

    // Explicitly update Auth display name to ensure Firebase user object also has it
    await updateProfile(cred.user, { displayName: name });
  };

  // Activity tracking / Heartbeat
  useEffect(() => {
    if (!user || !profile) return;

    const interval = setInterval(async () => {
      if (document.hidden) return;

      const now = Date.now();
      const lastSeen = profile.lastSeenAt || profile.lastLoginAt || now;
      const secondsPassed = Math.floor((now - lastSeen) / 1000);

      // Only update if at least 30s passed and it's reasonable (less than 10 mins since last seen)
      if (secondsPassed >= 30 && secondsPassed < 600) {
        const profileRef = ref(db, `users/${user.uid}`);
        await update(profileRef, {
          lastSeenAt: now,
          totalUsageSeconds: (profile.totalUsageSeconds || 0) + secondsPassed
        });
      } else if (secondsPassed >= 600 || !profile.lastSeenAt) {
        // Just update lastSeen if we've been away
        await update(ref(db, `users/${user.uid}`), { lastSeenAt: now });
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [user?.uid, profile?.lastSeenAt]);

  const logout = async () => {
    await signOut(auth);
    sessionStorage.removeItem("azura-table");
    setTableNumberState(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const profileRef = ref(db, `users/${user.uid}`);
    const snap = await get(profileRef);
    if (snap.exists()) {
      await set(profileRef, { ...snap.val(), ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user, profile, loading, tableNumber,
        setTableNumber, loginAnonymous, logout, updateUserProfile,
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
