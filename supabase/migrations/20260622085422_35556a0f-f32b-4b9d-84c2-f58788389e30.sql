DROP POLICY IF EXISTS countries_admin_all ON public.countries;
DROP POLICY IF EXISTS prices_admin_all ON public.product_prices;
DROP POLICY IF EXISTS products_admin_all ON public.products;
DROP POLICY IF EXISTS orders_update_admin ON public.orders;
DROP POLICY IF EXISTS history_insert_admin ON public.order_status_history;
DROP POLICY IF EXISTS items_view_own ON public.order_items;
DROP POLICY IF EXISTS history_view_own ON public.order_status_history;
DROP POLICY IF EXISTS orders_view_own ON public.orders;

CREATE POLICY items_view_own
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.user_id = auth.uid()
  )
);

CREATE POLICY history_view_own
ON public.order_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_status_history.order_id
      AND o.user_id = auth.uid()
  )
);

CREATE POLICY orders_view_own
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;