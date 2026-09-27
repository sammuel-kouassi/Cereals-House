-- Migration: Add cancellation_request support to orders and admin_notifications
-- Date: 2026-09-27

DO $$ BEGIN
  ALTER TYPE admin_notification_type ADD VALUE IF NOT EXISTS 'cancellation_request';
EXCEPTION
  WHEN undefined_object THEN null;
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_request_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_request_status TEXT;
