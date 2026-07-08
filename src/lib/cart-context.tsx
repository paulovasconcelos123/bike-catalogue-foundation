import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image: string | null;
  quantity: number;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCents: number;
  totalItems: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "paulo-bicicletas-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const clamp = (qty: number, stock: number) =>
      Math.max(1, Math.min(qty, Math.max(stock, 1)));

    return {
      items,
      addItem: (item, quantity = 1) => {
        setItems((prev) => {
          const existing = prev.find((i) => i.id === item.id);
          if (existing) {
            return prev.map((i) =>
              i.id === item.id
                ? { ...i, quantity: clamp(i.quantity + quantity, item.stock) }
                : i,
            );
          }
          return [...prev, { ...item, quantity: clamp(quantity, item.stock) }];
        });
      },
      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      updateQuantity: (id, quantity) =>
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, quantity: clamp(quantity, i.stock) } : i,
          ),
        ),
      clearCart: () => setItems([]),
      totalCents: items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0),
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
