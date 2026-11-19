-- ChronoDevis – schéma Supabase
-- À exécuter une seule fois : Supabase > SQL Editor > New query > coller > Run.

-- ============ Profils artisans (1 par compte) ============
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  company_name        text default '',
  legal_form          text default 'micro',          -- micro, ei, eurl, sarl, sasu, sas, sa, scop, autre
  trades              text[] default '{}',           -- plombier, electricien, macon, ...
  siret               text default '',
  rcs_rm              text default '',               -- RCS / Répertoire des Métiers
  vat_regime          text default 'franchise',      -- franchise | assujetti
  vat_number          text default '',
  default_vat_rate    numeric default 20,            -- 20 | 10 | 5.5
  address             text default '',
  postal_code         text default '',
  city                text default '',
  phone               text default '',
  contact_email       text default '',
  website             text default '',
  insurance           text default '',               -- assurance décennale / RC pro
  mediator            text default '',
  hourly_rate         numeric,                       -- vide = l'IA décide
  travel_fee          numeric,                       -- vide = l'IA décide
  service_radius_km   int default 50,
  quote_validity_days int default 30,
  payment_terms       text default 'Acompte de 30 % à la commande, solde à la fin des travaux.',
  accent_color        text default '#f97316',
  logo_url            text default '',
  slug                text unique,
  lang                text default 'fr',
  public_page_enabled boolean default true,
  -- abonnement (modifié uniquement par le serveur)
  trial_ends_at       timestamptz default (now() + interval '7 days'),
  plan                text default 'trial',          -- trial | essentiel | pro
  billing_interval    text default '',               -- month | year
  sub_status          text default 'trialing',       -- trialing | active | past_due | canceled
  current_period_end  timestamptz,
  stripe_customer_id  text,
  stripe_subscription_id text,
  ai_month            text default to_char(now(), 'YYYY-MM'),
  ai_used             int default 0,
  quote_counter       int default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============ Devis ============
create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  number        text,
  status        text default 'draft',                -- draft | sent | accepted | refused
  client_name   text default '',
  client_email  text default '',
  client_phone  text default '',
  client_address text default '',
  title         text default '',
  data          jsonb default '{}'::jsonb,           -- lignes, étapes, hypothèses, TVA...
  total_ht      numeric default 0,
  total_ttc     numeric default 0,
  request_id    uuid,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists quotes_user_idx on public.quotes(user_id, created_at desc);

-- ============ Demandes reçues via la page client ============
create table if not exists public.requests (
  id            uuid primary key default gen_random_uuid(),
  artisan_id    uuid not null references public.profiles(id) on delete cascade,
  status        text default 'new',                  -- new | contacted | quoted | won | lost
  client_name   text default '',
  client_email  text default '',
  client_phone  text default '',
  client_city   text default '',
  description   text default '',
  estimate      jsonb default '{}'::jsonb,
  photos_count  int default 0,
  created_at    timestamptz default now()
);
create index if not exists requests_artisan_idx on public.requests(artisan_id, created_at desc);

-- ============ Sécurité (RLS) ============
alter table public.profiles enable row level security;
alter table public.quotes   enable row level security;
alter table public.requests enable row level security;

drop policy if exists "profil: lecture" on public.profiles;
create policy "profil: lecture" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profil: modification" on public.profiles;
create policy "profil: modification" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "devis: tout" on public.quotes;
create policy "devis: tout" on public.quotes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "demandes: lecture" on public.requests;
create policy "demandes: lecture" on public.requests for select using (auth.uid() = artisan_id);
drop policy if exists "demandes: modification" on public.requests;
create policy "demandes: modification" on public.requests for update using (auth.uid() = artisan_id);
drop policy if exists "demandes: suppression" on public.requests;
create policy "demandes: suppression" on public.requests for delete using (auth.uid() = artisan_id);

-- L'artisan ne peut pas modifier lui-même son abonnement, son essai ou son quota
create or replace function public.protect_billing_fields() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then          -- requêtes venant du navigateur
    new.trial_ends_at := old.trial_ends_at;  new.plan := old.plan;  new.sub_status := old.sub_status;
    new.billing_interval := old.billing_interval;  new.current_period_end := old.current_period_end;
    new.stripe_customer_id := old.stripe_customer_id;  new.stripe_subscription_id := old.stripe_subscription_id;
    new.ai_month := old.ai_month;  new.ai_used := old.ai_used;  new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_billing_fields();

-- Numérotation des devis : D-2026-0001 (atomique)
create or replace function public.next_quote_number() returns text language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.profiles set quote_counter = quote_counter + 1 where id = auth.uid() returning quote_counter into n;
  return 'D-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
end $$;
grant execute on function public.next_quote_number() to authenticated;

-- Création automatique du profil (essai 7 jours) à l'inscription
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, contact_email, slug, lang)
  values (new.id, new.email, new.email,
          'artisan-' || substr(replace(new.id::text, '-', ''), 1, 8),
          coalesce(new.raw_user_meta_data->>'lang', 'fr'))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
