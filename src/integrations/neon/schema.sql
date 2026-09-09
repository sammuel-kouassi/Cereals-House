-- =========================================================
-- Cereals House — Schéma PostgreSQL complet pour Neon
-- =========================================================

-- Extension pour la génération de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Types ENUM
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'customer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'preparing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('orange_money', 'wave', 'mtn_money', 'moov_money', 'visa', 'cash_on_delivery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Table Utilisateurs (Auth autonome Neon)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT,
  phone TEXT,
  country_code TEXT,
  role app_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table Sessions d'authentification
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table Pays supportés & devises
CREATE TABLE IF NOT EXISTS countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  base_shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  flag_emoji TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table Produits
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  category TEXT,
  image_url TEXT,
  unit TEXT NOT NULL DEFAULT 'kg',
  stock INT NOT NULL DEFAULT 0,
  weight_g INT,
  target_audience TEXT,
  audiences TEXT[] DEFAULT '{}',
  composition TEXT,
  benefits TEXT,
  preparation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table Prix des produits par pays
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL,
  shipping_fee NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, country_code)
);

-- 5b. Table Tarifs de livraison personnalisés par ville
CREATE TABLE IF NOT EXISTS city_shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  city_name TEXT NOT NULL,
  shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_city_shipping_rates_country_city UNIQUE (country_code, city_name)
);

-- 6. Table Commandes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT ('CH-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  country_code TEXT NOT NULL REFERENCES countries(code),
  currency_code TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  shipping_fee NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending_payment',
  payment_method payment_method,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  shipping_full_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Table Articles de Commande
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INT NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);

-- 8. Table Historique des Statuts de Commande
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 9. Table Avis & Notations Produits
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Fonction pour décrémenter le stock
CREATE OR REPLACE FUNCTION decrement_product_stock(_product_id UUID, _quantity INT)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
  current_stock INT;
  updated_stock INT;
BEGIN
  SELECT stock INTO current_stock FROM products WHERE id = _product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable';
  END IF;
  
  updated_stock := current_stock - _quantity;
  IF updated_stock < 0 THEN
    updated_stock := 0;
  END IF;

  UPDATE products SET stock = updated_stock, updated_at = now() WHERE id = _product_id;
  RETURN updated_stock;
END;
$$;

-- 11. Fonction automatique updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_city_shipping_rates_updated_at ON city_shipping_rates;
CREATE TRIGGER trg_city_shipping_rates_updated_at BEFORE UPDATE ON city_shipping_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Données initiales (Seeds)
-- =========================================================

-- Pays par défaut
INSERT INTO countries (code, name, currency_code, currency_symbol, base_shipping_fee, flag_emoji, is_active, sort_order)
VALUES
  ('CI', 'Côte d''Ivoire', 'XOF', 'FCFA', 1500, '🇨🇮', true, 1),
  ('SN', 'Sénégal', 'XOF', 'FCFA', 2000, '🇸🇳', true, 2),
  ('ML', 'Mali', 'XOF', 'FCFA', 2500, '🇲🇱', true, 3),
  ('BF', 'Burkina Faso', 'XOF', 'FCFA', 2500, '🇧🇫', true, 4),
  ('FR', 'France', 'EUR', '€', 12, '🇫🇷', true, 5),
  ('US', 'États-Unis', 'USD', '$', 18, '🇺🇸', true, 6)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  currency_code = EXCLUDED.currency_code,
  currency_symbol = EXCLUDED.currency_symbol,
  base_shipping_fee = EXCLUDED.base_shipping_fee,
  flag_emoji = EXCLUDED.flag_emoji,
  is_active = EXCLUDED.is_active;
