GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_prices TO anon, authenticated;
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT ALL ON public.products, public.product_prices, public.countries TO service_role;