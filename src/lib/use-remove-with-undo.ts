import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";

/**
 * Retire une ligne du panier sans confirmation, avec un toast « Annuler »
 * qui la remet exactement à sa place.
 */
export function useRemoveWithUndo() {
  const { items, removeFromCart, restore } = useCart();
  const { t } = useTranslation();

  return (slug: string) => {
    const index = items.findIndex((i) => i.slug === slug);
    if (index === -1) return;
    const item = items[index];
    removeFromCart(slug);
    toast(t("cart.removed", "{{name}} retiré du panier", { name: item.name }), {
      action: { label: t("cart.undo", "Annuler"), onClick: () => restore(item, index) },
    });
  };
}
