-- ============================================================
-- Gegeen — QPay integration support
-- ============================================================
-- 1) Shared access-token cache so serverless instances reuse one token
--    until it expires (QPay forbids requesting tokens repeatedly).
-- 2) Cache the created invoice payload on the order so reloading the
--    payment page reuses the same QR instead of minting a new invoice.

-- ───── QPay access-token cache (single row) ─────
-- Service-role only: RLS is enabled with NO policies, so the anon/auth
-- clients can never read the bearer token. Only the service-role key
-- (used by the QPay client on the server) bypasses RLS.
create table if not exists public.qpay_token (
  id            boolean primary key default true,
  access_token  text not null,
  expires_at    timestamptz not null,     -- absolute expiry (from QPay `expires_in` epoch)
  updated_at    timestamptz not null default now(),
  constraint qpay_token_singleton check (id)
);

alter table public.qpay_token enable row level security;
-- (intentionally no policies — service_role only)

-- ───── Cache invoice payload on the order ─────
alter table public.orders
  add column if not exists qpay_invoice jsonb;
