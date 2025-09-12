-- Run this in Supabase SQL editor
create extension if not exists pgcrypto;

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

alter table public.links enable row level security;
create policy if not exists "links are private" on public.links
  for all using (auth.uid() = user_id);

alter table public.rolls enable row level security;
create policy if not exists "rolls are private" on public.rolls
  for all using (auth.uid() = user_id);

-- Random helper: pick a random link excluding a set
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
