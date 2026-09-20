-- Lingua Amoris — shared quotes table
-- Run this once in your Supabase project's SQL editor:
-- https://supabase.com/dashboard/project/_/sql/new

create table if not exists public.quotes (
  id uuid primary key,
  text text not null,
  author text not null default '',
  language text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security, then open policies: this is a shared, no-login board —
-- anyone with the anon key (i.e. anyone who has the site's URL) can read,
-- add, and delete quotes. That matches the app's current single-collection
-- UX (every card already has its own delete button, no ownership concept).
-- Tighten these later if you ever want per-user accounts or moderation.
alter table public.quotes enable row level security;

create policy "Public can read quotes"
  on public.quotes for select
  using (true);

create policy "Public can add quotes"
  on public.quotes for insert
  with check (true);

create policy "Public can update quotes"
  on public.quotes for update
  using (true)
  with check (true);

create policy "Public can delete quotes"
  on public.quotes for delete
  using (true);

-- Realtime: lets every open tab see adds/deletes from everyone else live.
alter publication supabase_realtime add table public.quotes;
