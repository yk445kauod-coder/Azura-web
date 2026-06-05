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
      ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80";

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
