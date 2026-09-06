-- SERIEA 9000 SIM — Supabase foundation
create extension if not exists pgcrypto;
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now());
create table if not exists public.careers (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, career_name text not null, manager_name text not null, club_id text not null, season_year integer not null default 1998, matchday integer not null default 0, save_version integer not null default 1, game_version text not null default '0.6.0', database_version text not null default '0.6-placeholder', save_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.career_backups (id uuid primary key default gen_random_uuid(), career_id uuid not null references public.careers(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, backup_slot integer not null, save_data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.global_honours (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(), unique(user_id));
alter table public.profiles enable row level security;alter table public.careers enable row level security;alter table public.career_backups enable row level security;alter table public.global_honours enable row level security;
create policy "profiles own" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "careers own" on public.careers for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "backups own" on public.career_backups for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "honours own" on public.global_honours for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create index if not exists careers_user_updated_idx on public.careers(user_id,updated_at desc);
create index if not exists career_backups_career_idx on public.career_backups(career_id,created_at desc);
