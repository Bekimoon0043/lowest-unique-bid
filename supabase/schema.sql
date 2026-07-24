-- =====================================================================
-- UniqueWin (Lowest Unique Bid) — Supabase schema
-- Safe to re-run: everything below uses IF NOT EXISTS / OR REPLACE /
-- DROP POLICY IF EXISTS so you can paste this whole file into the
-- Supabase SQL Editor even if some of it already exists.
--
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles  (one row per auth user; used for display + admin flag)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. items  (auctions)
-- ---------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  bid_amount numeric(12,2) not null check (bid_amount > 0), -- entry fee, in ETB
  status text not null default 'active' check (status in ('active', 'ended')),
  winner_id uuid references auth.users(id),
  winning_number integer,
  end_time timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. bids
-- ---------------------------------------------------------------------
create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chosen_number integer not null check (chosen_number > 0),
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  unique (item_id, user_id)
);

-- ---------------------------------------------------------------------
-- 4. payment_methods  (bank / mobile money accounts shown to users)
-- ---------------------------------------------------------------------
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  method_name text not null,        -- e.g. "Telebirr", "CBE", "Awash Bank"
  account_holder text not null,
  account_number text not null,
  instructions text,                -- optional extra note shown to the user
  created_at timestamptz not null default now()
);

-- Add the instructions column if this table already existed without it
alter table public.payment_methods add column if not exists instructions text;

-- ---------------------------------------------------------------------
-- 5. payment_verifications  (screenshot OR typed message, admin approves)
-- ---------------------------------------------------------------------
create table if not exists public.payment_verifications (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null references public.bids(id) on delete cascade,
  payment_method_id uuid references public.payment_methods(id),
  screenshot_url text,               -- nullable: user may verify by message instead
  verification_message text,         -- nullable: user may verify by screenshot instead
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  rejection_reason text,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint has_proof check (screenshot_url is not null or verification_message is not null)
);

-- Add missing columns / relax constraints if this table already existed
alter table public.payment_verifications add column if not exists verification_message text;
alter table public.payment_verifications alter column screenshot_url drop not null;

-- ---------------------------------------------------------------------
-- 6. determine_winner(item_id) — lowest UNIQUE paid number wins
-- ---------------------------------------------------------------------
create or replace function public.determine_winner(p_item_id uuid)
returns table(winner_user_id uuid, winning_number integer)
language sql
stable
as $$
  select b.user_id, b.chosen_number
  from public.bids b
  where b.item_id = p_item_id
    and b.paid = true
    and b.chosen_number > 0
  group by b.user_id, b.chosen_number
  having count(*) over (partition by b.chosen_number) = 1
  order by b.chosen_number asc
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- 6b. is_admin() — matches admins two ways so RLS never locks you out:
--     (a) profiles.is_admin = true, or
--     (b) your email is in the hardcoded list (keep this in sync with
--         ADMIN_EMAILS in client/src/contexts/AuthContext.tsx)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
    or coalesce(auth.jwt() ->> 'email', '') = any (array[
      'bereketamare0043@gmail.com'
      -- add more admin emails here, comma-separated, matching AuthContext.tsx
    ]);
$$;

-- ---------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.bids enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payment_verifications enable row level security;

-- profiles: users see/update their own row; anyone signed in can read profiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- items: everyone (incl. anonymous) can read; only admins can write
drop policy if exists "items_select_all" on public.items;
create policy "items_select_all" on public.items for select using (true);

drop policy if exists "items_admin_write" on public.items;
create policy "items_admin_write" on public.items for all
  using (public.is_admin())
  with check (public.is_admin());

-- bids: a user can see + create + update their own bid; admins can see all
drop policy if exists "bids_select_own_or_admin" on public.bids;
create policy "bids_select_own_or_admin" on public.bids for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "bids_insert_own" on public.bids;
create policy "bids_insert_own" on public.bids for insert
  with check (auth.uid() = user_id);

drop policy if exists "bids_update_own_or_admin" on public.bids;
create policy "bids_update_own_or_admin" on public.bids for update
  using (auth.uid() = user_id or public.is_admin());

-- payment_methods: everyone can read (needed to show accounts to payers); only admins write
drop policy if exists "payment_methods_select_all" on public.payment_methods;
create policy "payment_methods_select_all" on public.payment_methods for select using (true);

drop policy if exists "payment_methods_admin_write" on public.payment_methods;
create policy "payment_methods_admin_write" on public.payment_methods for all
  using (public.is_admin())
  with check (public.is_admin());

-- payment_verifications: a user can insert/view their own; admins can view/update all
drop policy if exists "verifications_select_own_or_admin" on public.payment_verifications;
create policy "verifications_select_own_or_admin" on public.payment_verifications for select
  using (
    exists (select 1 from public.bids b where b.id = bid_id and b.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "verifications_insert_own" on public.payment_verifications;
create policy "verifications_insert_own" on public.payment_verifications for insert
  with check (
    exists (select 1 from public.bids b where b.id = bid_id and b.user_id = auth.uid())
  );

drop policy if exists "verifications_admin_update" on public.payment_verifications;
create policy "verifications_admin_update" on public.payment_verifications for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 8. Storage bucket for payment screenshots
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('payment-screenshots', 'payment-screenshots', true)
on conflict (id) do nothing;

drop policy if exists "payment_screenshots_public_read" on storage.objects;
create policy "payment_screenshots_public_read" on storage.objects for select
  using (bucket_id = 'payment-screenshots');

drop policy if exists "payment_screenshots_authenticated_upload" on storage.objects;
create policy "payment_screenshots_authenticated_upload" on storage.objects for insert
  with check (bucket_id = 'payment-screenshots' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- 9. Make yourself an admin
-- ---------------------------------------------------------------------
-- The is_admin() function above already treats
-- 'bereketamare0043@gmail.com' as an admin automatically — matching
-- ADMIN_EMAILS in client/src/contexts/AuthContext.tsx — so nothing
-- else is required for that address.
--
-- To add a DIFFERENT admin, either:
--  (a) add their email to the array inside public.is_admin() above
--      AND to ADMIN_EMAILS in AuthContext.tsx, then re-run this file, or
--  (b) run this once they've signed up:
--      update public.profiles set is_admin = true where email = 'someone@example.com';
