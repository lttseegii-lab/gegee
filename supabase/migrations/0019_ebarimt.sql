-- ============================================================
-- Gegeen — QPay Ebarimt 3.0 e-receipt
-- ============================================================
-- Cache the e-receipt returned by /v2/ebarimt_v3/create on the order:
-- { id, lottery, qr_data, receipt_id, status, created_at }.
-- Created best-effort after a payment is confirmed (requires QPay to enable
-- e-receipt for the merchant), so this column may stay null until activated.

alter table public.orders
  add column if not exists qpay_ebarimt jsonb;
