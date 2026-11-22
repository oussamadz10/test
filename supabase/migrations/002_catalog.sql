-- ChronoDevis – bibliothèque de prix de l'artisan (à exécuter une fois dans Supabase > SQL Editor)
create table if not exists public.catalog (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null default 'material',        -- material | labor | other
  label       text not null,
  unit        text not null default 'u',
  unit_price  numeric not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists catalog_user_idx on public.catalog(user_id, label);
alter table public.catalog enable row level security;
drop policy if exists "prix: tout" on public.catalog;
create policy "prix: tout" on public.catalog for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
