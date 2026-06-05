import {
  createContext, useContext, useReducer, type ReactNode,
} from "react";

export interface CartItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  category: string;
  image: string;
}

interface CartState {
  items: CartItem[];
  notes: string;
}

type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE"; id: string }
  | { type: "SET_QTY"; id: string; qty: number }
  | { type: "SET_NOTES"; notes: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "SET_QTY":
      if (action.qty <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.qty } : i
        ),
      };
    case "SET_NOTES":
      return { ...state, notes: action.notes };
    case "CLEAR":
      return { items: [], notes: "" };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  notes: string;
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getQty: (id: string) => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], notes: "" });

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        notes: state.notes,
        totalItems,
        totalPrice,
        addItem: (item) => dispatch({ type: "ADD", item }),
        removeItem: (id) => dispatch({ type: "REMOVE", id }),
        setQty: (id, qty) => dispatch({ type: "SET_QTY", id, qty }),
        setNotes: (notes) => dispatch({ type: "SET_NOTES", notes }),
        clearCart: () => dispatch({ type: "CLEAR" }),
        isInCart: (id) => state.items.some((i) => i.id === id),
        getQty: (id) => state.items.find((i) => i.id === id)?.quantity || 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
