-- ============================================================
-- Ikigai — Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  gdpr_consent_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Ikigai Sessions ─────────────────────────────────────────
create table if not exists public.ikigai_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  subtitle          text,
  synthesis         jsonb not null,
  conversation_data jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists ikigai_sessions_user_id_idx
  on public.ikigai_sessions (user_id, created_at desc);

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.ikigai_sessions enable row level security;

-- Profiles: users can only read/write their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Sessions: users can only read/write their own rows
create policy "sessions_select_own" on public.ikigai_sessions
  for select using (auth.uid() = user_id);

create policy "sessions_insert_own" on public.ikigai_sessions
  for insert with check (auth.uid() = user_id);

create policy "sessions_update_own" on public.ikigai_sessions
  for update using (auth.uid() = user_id);

create policy "sessions_delete_own" on public.ikigai_sessions
  for delete using (auth.uid() = user_id);

-- ── Auto-create profile on sign-up ──────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, gdpr_consent_at)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    -- Record consent timestamp supplied at signup, or now() as fallback
    coalesce(
      (new.raw_user_meta_data->>'gdpr_consent_at')::timestamptz,
      now()
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop and recreate trigger so re-running is safe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── updated_at helper ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_sessions_updated_at on public.ikigai_sessions;
create trigger set_sessions_updated_at
  before update on public.ikigai_sessions
  for each row execute procedure public.set_updated_at();
