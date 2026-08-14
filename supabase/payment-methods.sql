-- ============================================================================
--  PAYMENT METHODS — add international options beyond UPI
--  Run once in Supabase → SQL Editor. Safe to re-run.
--  Adds columns to the existing single-row `settings` table so Rakshit can
--  offer UPI (India) + PayPal + a payment link (Stripe/Razorpay/Wise/etc.)
--  + bank/wire details + free-text instructions. He confirms payment manually.
-- ============================================================================

alter table public.settings add column if not exists paypal_email     text not null default '';
alter table public.settings add column if not exists paypal_me_link   text not null default '';
alter table public.settings add column if not exists payment_link      text not null default '';   -- Stripe/Razorpay/Wise payment link
alter table public.settings add column if not exists payment_link_label text not null default 'Pay online';
alter table public.settings add column if not exists bank_details      text not null default '';   -- international wire / bank transfer
alter table public.settings add column if not exists pay_instructions  text not null default '';   -- any extra notes for students
alter table public.settings add column if not exists currency_note     text not null default '';   -- e.g. "INR for UPI, USD for PayPal"

-- Which methods are switched on (so students only see enabled ones).
alter table public.settings add column if not exists upi_enabled       boolean not null default true;
alter table public.settings add column if not exists paypal_enabled    boolean not null default false;
alter table public.settings add column if not exists link_enabled      boolean not null default false;
alter table public.settings add column if not exists bank_enabled      boolean not null default false;
