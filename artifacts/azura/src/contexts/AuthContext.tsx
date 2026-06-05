import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react";
import {
  auth, db, googleProvider,
  signInAnonymously, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updateProfile,
  ref, set, get, onValue, off,
  type User,
} from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  tableNumber: string | null;
  isGuest: boolean;
  photoURL: string | null;
  createdAt: number;
  orderCount: number;
  preferences: { lang: string; barista: "female" | "male" };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  tableNumber: string | null;
  setTableNumber: (t: string) => void;
  loginAnonymous: (tableNum: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (email: string, password: string, name: string) => Promise<void>;
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
        if (snap.exists()) {
          setProfile(snap.val());
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            name: u.displayName || "Guest",
            email: u.email,
            tableNumber: sessionStorage.getItem("azura-table"),
            isGuest: u.isAnonymous,
            photoURL: u.photoURL,
            createdAt: Date.now(),
            orderCount: 0,
            preferences: { lang: "en", barista: "female" },
          };
          await set(profileRef, newProfile);
          setProfile(newProfile);
        }
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

  const loginAnonymous = async (tableNum: string) => {
    const cred = await signInAnonymously(auth);
    setTableNumber(tableNum);
    const profileRef = ref(db, `users/${cred.user.uid}`);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name: `Guest - Table ${tableNum}`,
      email: null,
      tableNumber: tableNum,
      isGuest: true,
      photoURL: null,
      createdAt: Date.now(),
      orderCount: 0,
      preferences: { lang: "en", barista: "female" },
    };
    await set(profileRef, newProfile);
    setProfile(newProfile);
  };

  const loginGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const u = cred.user;
    const profileRef = ref(db, `users/${u.uid}`);
    const snap = await get(profileRef);
    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: u.uid,
        name: u.displayName || "User",
        email: u.email,
        tableNumber: sessionStorage.getItem("azura-table"),
        isGuest: false,
        photoURL: u.photoURL,
        createdAt: Date.now(),
        orderCount: 0,
        preferences: { lang: "en", barista: "female" },
      };
      await set(profileRef, newProfile);
    }
  };

  const loginEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerEmail = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      name,
      email,
      tableNumber: sessionStorage.getItem("azura-table"),
      isGuest: false,
      photoURL: null,
      createdAt: Date.now(),
      orderCount: 0,
      preferences: { lang: "en", barista: "female" },
    };
    await set(ref(db, `users/${cred.user.uid}`), newProfile);
  };

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
        setTableNumber, loginAnonymous, loginGoogle,
        loginEmail, registerEmail, logout, updateUserProfile,
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
