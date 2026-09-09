-- Ajout des colonnes nécessaires pour le suivi des transactions CinetPay
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cinetpay_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_token TEXT,
ADD COLUMN IF NOT EXISTS payment_notify_token TEXT;
