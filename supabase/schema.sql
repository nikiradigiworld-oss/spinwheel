-- ============================================================
-- Spin & SIP Money – Supabase Schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- User tokens (one row per user)
create table if not exists public.user_tokens (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  total_earned     int  not null default 0,
  total_withdrawn  int  not null default 0,
  balance          int  not null default 0,
  last_spin_date   date
);

-- All transactions: spin wins, buys, withdrawals
create table if not exists public.transactions (
  id              uuid    primary key default gen_random_uuid(),
  user_id         uuid    not null references auth.users(id) on delete cascade,
  type            text    not null check (type in ('spin_win', 'buy', 'withdraw')),
  amount          int,
  status          text    not null default 'pending'
                          check (status in ('pending', 'completed', 'rejected', 'processing')),
  wallet_type     text    check (wallet_type in ('TRC20', 'BEP20')),
  wallet_address  text,
  proof_url       text,
  created_at      timestamptz not null default now()
);

-- Indexes
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_status_idx  on public.transactions(status);
create index if not exists transactions_type_idx    on public.transactions(type);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.user_tokens  enable row level security;
alter table public.transactions enable row level security;

-- Users can read/write only their own token row
create policy "users_own_tokens" on public.user_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Users can read/insert their own transactions
create policy "users_read_own_txns" on public.transactions
  for select using (auth.uid() = user_id);

create policy "users_insert_own_txns" on public.transactions
  for insert with check (auth.uid() = user_id);

-- Admin can read/update all (set VITE_ADMIN_EMAIL in your env)
-- For a real admin role, use Supabase service_role key server-side.
-- This policy grants update to the admin user identified by their sub claim.
-- Replace 'ADMIN_USER_ID' with the actual UUID from auth.users after first login.
-- create policy "admin_all_txns" on public.transactions
--   for all using (auth.uid() = 'ADMIN_USER_ID');

-- ============================================================
-- Storage bucket for payment proof screenshots
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('proofs', 'proofs', true)
  on conflict (id) do nothing;

-- Anyone authenticated can upload
create policy "auth_upload_proofs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proofs');

-- Public read (for admin to view images)
create policy "public_read_proofs" on storage.objects
  for select using (bucket_id = 'proofs');
