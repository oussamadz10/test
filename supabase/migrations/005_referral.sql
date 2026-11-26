-- ============ Parrainage : 1 mois offert au parrain et au filleul ============
-- Chaque artisan a un code (lien chronodevisia.fr/?ref=CODE). Le filleul est rattaché à l'inscription.
-- La récompense est versée par le serveur (crédit Stripe) quand le filleul a payé et vérifié son SIRET.
alter table public.profiles add column if not exists ref_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists ref_rewarded_at timestamptz;
alter table public.profiles add column if not exists ref_earned_months int not null default 0;

update public.profiles set ref_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)) where ref_code is null;
alter table public.profiles alter column ref_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
create unique index if not exists profiles_ref_code_key on public.profiles (ref_code);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- Champs de parrainage non modifiables depuis le navigateur
create or replace function public.protect_billing_fields() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.trial_ends_at := old.trial_ends_at;  new.plan := old.plan;  new.sub_status := old.sub_status;
    new.billing_interval := old.billing_interval;  new.current_period_end := old.current_period_end;
    new.stripe_customer_id := old.stripe_customer_id;  new.stripe_subscription_id := old.stripe_subscription_id;
    new.ai_month := old.ai_month;  new.ai_used := old.ai_used;  new.email := old.email;
    new.siret_verified := old.siret_verified;  new.siret_name := old.siret_name;  new.siret_checked_at := old.siret_checked_at;
    if old.siret_verified then new.siret := old.siret; end if;
    new.ref_code := old.ref_code;  new.referred_by := old.referred_by;
    new.ref_rewarded_at := old.ref_rewarded_at;  new.ref_earned_months := old.ref_earned_months;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- Inscription : rattachement au parrain si un code valide est transmis (métadonnée « ref »)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, contact_email, slug, lang, referred_by)
  values (new.id, new.email, new.email,
          'artisan-' || substr(replace(new.id::text, '-', ''), 1, 8),
          coalesce(new.raw_user_meta_data->>'lang', 'fr'),
          (select p.id from public.profiles p
            where p.ref_code = upper(left(coalesce(new.raw_user_meta_data->>'ref', ''), 12)) and p.ref_code <> '' limit 1))
  on conflict (id) do nothing;
  return new;
end $$;

notify pgrst, 'reload schema';
