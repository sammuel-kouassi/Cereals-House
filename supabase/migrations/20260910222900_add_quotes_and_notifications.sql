-- Migration: Add quote_requests and admin_notifications
-- Date: 2026-09-10

-- =========================
-- QUOTE REQUESTS
-- =========================
CREATE TYPE public.quote_type AS ENUM ('wholesale', 'distributor', 'both');
CREATE TYPE public.quote_status AS ENUM ('pending', 'processed', 'cancelled');

CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type quote_type NOT NULL DEFAULT 'wholesale',
  contact_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  volume_estimated TEXT,
  products_requested TEXT,
  message TEXT,
  status quote_status NOT NULL DEFAULT 'pending',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Les administrateurs peuvent tout voir/modifier
CREATE POLICY "quotes_admin_all" ON public.quote_requests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Pour un formulaire public, on ajoute une politique INSERT anon
GRANT INSERT ON public.quote_requests TO anon;
CREATE POLICY "quotes_anon_insert" ON public.quote_requests
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "quotes_auth_insert" ON public.quote_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE TRIGGER quote_requests_updated_at BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- ADMIN NOTIFICATIONS
-- =========================
CREATE TYPE public.admin_notification_type AS ENUM ('quote_request', 'new_order', 'payment_failed');

CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type admin_notification_type NOT NULL,
  reference_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_notifications_all" ON public.admin_notifications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
