import { createContext, useContext, useState, type ReactNode } from "react";

export type BaristaPersona = "female" | "male";

interface BaristaContextType {
  persona: BaristaPersona;
  setPersona: (p: BaristaPersona) => void;
  baristaName: string;
  baristaAvatar: string;
}

const BaristaContext = createContext<BaristaContextType | null>(null);

export function BaristaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<BaristaPersona>(() => {
    return (localStorage.getItem("azura-barista") as BaristaPersona) || "female";
  });

  const setPersona = (p: BaristaPersona) => {
    setPersonaState(p);
    localStorage.setItem("azura-barista", p);
  };

  const baristaName = persona === "female" ? "Zura" : "Zure";
  const baristaAvatar =
    persona === "female"
      ? "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zura&backgroundColor=b6e3f4&clothColor=5d3e6e&mouthColor=ec4899&hairColor=7c3aed"
      : "https://api.dicebear.com/7.x/avataaars/svg?seed=Zure&backgroundColor=c0aede&clothesColor=3d5a80";

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
