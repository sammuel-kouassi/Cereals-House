import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { syncCartSnapshotFn } from "@/lib/orders/abandoned-cart.functions";
import { listProductsFn } from "@/lib/products/products.functions";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  unit?: string;
  prices?: { country_code: string; price: number; compare_at_price?: number | null }[];
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
  prices?: { country_code: string; price: number; compare_at_price?: number | null }[];
};

type Ctx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  addToCart: (item: AddToCartInput, qty?: number) => void;
  remove: (productId: string) => void;
  /** Réinsère une ligne retirée à sa position d'origine (annulation) */
  restore: (item: CartItem, index: number) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  clearCart: () => void;
  /** Recharge les prix du jour (promotions comprises) depuis le serveur */
  refreshPrices: () => Promise<void>;
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
    let saved: CartItem[] = [];
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) saved = JSON.parse(raw);
      setItems(saved);
    } catch {
      // Panier localStorage corrompu ou inaccessible : on repart d'un panier vide.
    }
    // Prix du jour : une promotion terminée (ou nouvelle) se reflète dans le panier
    if (saved.length > 0) void refreshPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshPrices() {
    try {
      const products = await listProductsFn();
      const bySlug = new Map(products.map((p) => [p.slug, p]));
      setItems((prev) =>
        prev.map((it) => {
          const fresh = bySlug.get(it.slug);
          if (!fresh || fresh.product_prices.length === 0) return it;
          return {
            ...it,
            prices: fresh.product_prices,
            unitPrice:
              fresh.product_prices.find((p) => p.country_code === "CI")?.price ?? fresh.product_prices[0].price,
          };
        }),
      );
    } catch {
      // Hors ligne : on garde les prix enregistrés, le serveur recalculera à la commande
    }
  }

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

  const restore = (item: CartItem, index: number) =>
    setItems((prev) => {
      if (prev.some((i) => i.slug === item.slug)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, item);
      return next;
    });

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
        restore,
        removeFromCart,
        setQty,
        updateQuantity,
        clear,
        clearCart,
        refreshPrices,
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
