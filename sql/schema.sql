-- required for gen_random_uuid()
create extension if not exists pgcrypto;

-- TABLES
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  source text generated always as (
    case
      when url ilike '%youtube.com%' or url ilike '%youtu.be%' then 'youtube'
      when url ilike '%vimeo.com%' then 'vimeo'
      else 'generic'
    end
  ) stored,
  title text,
  thumbnail_url text,
  embed_html text,
  created_at timestamptz not null default now()
);

create table if not exists public.rolls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  link_id uuid not null references public.links(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS ON
alter table public.links enable row level security;
alter table public.rolls enable row level security;

-- POLICIES (drop-then-create to avoid “already exists” errors)

-- LINKS
drop policy if exists "links select own" on public.links;
drop policy if exists "links insert own" on public.links;
drop policy if exists "links update own" on public.links;
drop policy if exists "links delete own" on public.links;

create policy "links select own"
  on public.links
  for select
  using (auth.uid() = user_id);

create policy "links insert own"
  on public.links
  for insert
  with check (auth.uid() = user_id);

create policy "links update own"
  on public.links
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "links delete own"
  on public.links
  for delete
  using (auth.uid() = user_id);

-- ROLLS
drop policy if exists "rolls select own" on public.rolls;
drop policy if exists "rolls insert own" on public.rolls;
drop policy if exists "rolls delete own" on public.rolls;

create policy "rolls select own"
  on public.rolls
  for select
  using (auth.uid() = user_id);

create policy "rolls insert own"
  on public.rolls
  for insert
  with check (auth.uid() = user_id);

create policy "rolls delete own"
  on public.rolls
  for delete
  using (auth.uid() = user_id);

-- OPTIONAL: RPC helper for random link
create or replace function public.random_link_excluding(exclude_ids uuid[])
returns table (id uuid, url text, title text, thumbnail_url text, embed_html text)
language sql stable as $$
  select id, url, title, thumbnail_url, embed_html
  from public.links
  where user_id = auth.uid()
    and (exclude_ids is null or not (id = any(exclude_ids)))
  order by random()
  limit 1
$$;

-- Sometimes PostgREST needs a schema cache refresh
select pg_notify('pgrst', 'reload schema');
