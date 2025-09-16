# Video Playlist App (Next.js + Supabase)

The boilerplate for a video/link "roll" app.

## Quick Start

```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local
# Fill in Supabase env values
pnpm dev
```

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Auth + Postgres + RLS)
- TailwindCSS
- DOMPurify for safe embed rendering

## Folders

```
app/            # routes & pages
components/     # UI components
lib/            # supabase clients
utils/          # helpers
sql/            # schema & policies
```

## SQL

See `sql/schema.sql` for tables and RLS policies.
