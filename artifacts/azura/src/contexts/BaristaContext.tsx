import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ref, onValue } from "@/lib/firebase";

export type BaristaPersona = "female" | "male";

interface BaristaContextType {
  persona: BaristaPersona;
  setPersona: (p: BaristaPersona) => void;
  baristaName: string;
  baristaAvatar: string;
}

const BaristaContext = createContext<BaristaContextType | null>(null);

export function BaristaProvider({ children }: { children: ReactNode }) {
  const [persona] = useState<BaristaPersona>("female");
  const [baristaName, setBaristaName] = useState("Zura");
  const [baristaAvatar, setBaristaAvatar] = useState("https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zura&backgroundColor=b6e3f4&clothColor=5d3e6e&mouthColor=ec4899&hairColor=7c3aed");

  useEffect(() => {
    // Load barista config from Firebase
    const unsub = onValue(ref("ai-config"), (snap) => {
      if (snap.exists()) {
        const cfg = snap.val() as any;
        if (cfg.baristaName) setBaristaName(cfg.baristaName);
        if (cfg.baristaAvatar) setBaristaAvatar(cfg.baristaAvatar);
      }
    });
    return () => unsub();
  }, []);

  const setPersona = (_p: BaristaPersona) => {
    // Locked to female
  };

  return (
    <BaristaContext.Provider value={{ persona, setPersona, baristaName, baristaAvatar }}>
      {children}
    </BaristaContext.Provider>
  );
}

export function useBarista() {
  const ctx = useContext(BaristaContext);
  if (!ctx) throw new Error("useBarista must be inside BaristaProvider");
  return ctx;
}
