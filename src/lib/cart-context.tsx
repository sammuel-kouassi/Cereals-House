import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { syncCartSnapshotFn } from "@/lib/orders/abandoned-cart.functions";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  unit?: string;
  prices?: { country_code: string; price: number }[];
};

export type AddToCartInput = {
  productId?: string;
  slug: string;
  name: string;
  image?: string;
  imageUrl?: string;
  unitPrice?: number;
  quantity?: number;
  unit?: string;
  prices?: { country_code: string; price: number }[];
};

type Ctx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  addToCart: (item: AddToCartInput, qty?: number) => void;
  remove: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  clearCart: () => void;
  count: number;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "ch_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Panier localStorage corrompu ou inaccessible : on repart d'un panier vide.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  // Copie serveur du panier — uniquement pour les utilisateurs connectés
  useEffect(() => {
    if (!user) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncCartSnapshotFn({ data: { items } }).catch((err) => {
        console.error("Échec de la synchronisation du panier", err);
      });
    }, 2000);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items, user]);

  const add = (item: Omit<CartItem, "quantity">, qty = 1) => {
    const pId = item.productId || item.slug;
    setItems((prev) => {
      const existing = prev.find((i) => (i.productId === pId || i.slug === item.slug));
      if (existing) {
        return prev.map((i) =>
          (i.productId === pId || i.slug === item.slug)
            ? { ...i, quantity: i.quantity + qty, unitPrice: item.unitPrice || i.unitPrice }
            : i,
        );
      }
      return [...prev, { ...item, productId: pId, quantity: qty }];
    });
  };

  const addToCart = (input: AddToCartInput, qty = 1) => {
    const itemQty = input.quantity ?? qty ?? 1;
    const pId = input.productId || input.slug;
    const img = input.imageUrl || input.image || "";
    const basePrice = input.unitPrice ?? input.prices?.[0]?.price ?? 0;

    add(
      {
        productId: pId,
        slug: input.slug,
        name: input.name,
        image: img,
        imageUrl: img,
        unitPrice: basePrice,
        unit: input.unit || "kg",
        prices: input.prices || [],
      },
      itemQty
    );
  };

  const remove = (productIdOrSlug: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productIdOrSlug && i.slug !== productIdOrSlug));

  const removeFromCart = remove;

  const setQty = (productIdOrSlug: string, qty: number) => {
    if (qty <= 0) return remove(productIdOrSlug);
    setItems((prev) =>
      prev.map((i) =>
        (i.productId === productIdOrSlug || i.slug === productIdOrSlug)
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const updateQuantity = setQty;

  const clear = () => setItems([]);
  const clearCart = clear;

  const count = items.length;
  const totalItems = items.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
  const subtotal = items.reduce((s, i) => s + Number(i.quantity || 1) * Number(i.unitPrice || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        addToCart,
        remove,
        removeFromCart,
        setQty,
        updateQuantity,
        clear,
        clearCart,
        count,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
