-- ChronoDevis – protections anti-fraude (SIRET vérifié, code de vérification des devis, signalements)
alter table public.profiles add column if not exists siret_verified   boolean not null default false;
alter table public.profiles add column if not exists siret_name       text;
alter table public.profiles add column if not exists siret_checked_at timestamptz;
create unique index if not exists profiles_siret_verified_uq on public.profiles(siret) where siret_verified;

alter table public.quotes add column if not exists verify_code text;
update public.quotes set verify_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)) where verify_code is null;
alter table public.quotes alter column verify_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
create unique index if not exists quotes_verify_uq on public.quotes(verify_code);

-- Champs de vérification modifiables uniquement par le serveur ; SIRET figé une fois vérifié
create or replace function public.protect_billing_fields() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.trial_ends_at := old.trial_ends_at;  new.plan := old.plan;  new.sub_status := old.sub_status;
    new.billing_interval := old.billing_interval;  new.current_period_end := old.current_period_end;
    new.stripe_customer_id := old.stripe_customer_id;  new.stripe_subscription_id := old.stripe_subscription_id;
    new.ai_month := old.ai_month;  new.ai_used := old.ai_used;  new.email := old.email;
    new.siret_verified := old.siret_verified;  new.siret_name := old.siret_name;  new.siret_checked_at := old.siret_checked_at;
    if old.siret_verified then new.siret := old.siret; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- Le code de vérification d'un devis ne peut pas être choisi ni modifié depuis le navigateur
create or replace function public.protect_quote_code() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'UPDATE' then new.verify_code := old.verify_code;
    else new.verify_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)); end if;
  end if;
  return new;
end $$;
drop trigger if exists quotes_protect_code on public.quotes;
create trigger quotes_protect_code before insert or update on public.quotes for each row execute function public.protect_quote_code();

-- Signalements de documents suspects (lecture réservée au serveur)
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  verify_code text,
  message     text,
  contact     text,
  ip          text,
  created_at  timestamptz default now()
);
alter table public.reports enable row level security;
