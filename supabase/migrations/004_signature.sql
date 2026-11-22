-- ChronoDevis – acceptation et signature électronique des devis en ligne
alter table public.quotes add column if not exists share_token    text;
alter table public.quotes add column if not exists signed_at      timestamptz;
alter table public.quotes add column if not exists signed_name    text;
alter table public.quotes add column if not exists signed_ip      text;
alter table public.quotes add column if not exists signature      text;
alter table public.quotes add column if not exists signed_hash    text;
alter table public.quotes add column if not exists declined_at    timestamptz;
alter table public.quotes add column if not exists decline_reason text;
update public.quotes set share_token = replace(gen_random_uuid()::text, '-', '') where share_token is null;
alter table public.quotes alter column share_token set default replace(gen_random_uuid()::text, '-', '');
create unique index if not exists quotes_share_uq on public.quotes(share_token);

-- Codes et signature gérés uniquement par le serveur ; un devis signé ne peut plus être modifié
create or replace function public.protect_quote_code() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.verify_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      new.share_token := replace(gen_random_uuid()::text, '-', '');
      new.signed_at := null; new.signed_name := null; new.signed_ip := null; new.signature := null; new.signed_hash := null;
      new.declined_at := null; new.decline_reason := null;
    else
      if old.signed_at is not null and (new.data, new.total_ht, new.total_ttc, new.title, new.number, new.client_name, new.client_address, new.client_email, new.client_phone)
         is distinct from (old.data, old.total_ht, old.total_ttc, old.title, old.number, old.client_name, old.client_address, old.client_email, old.client_phone) then
        raise exception 'DEVIS_SIGNE: un devis signé ne peut plus être modifié';
      end if;
      new.verify_code := old.verify_code; new.share_token := old.share_token;
      new.signed_at := old.signed_at; new.signed_name := old.signed_name; new.signed_ip := old.signed_ip; new.signature := old.signature; new.signed_hash := old.signed_hash;
      new.declined_at := old.declined_at; new.decline_reason := old.decline_reason;
      if old.signed_at is not null then new.status := 'accepted'; end if;
      new.updated_at := now();
    end if;
  end if;
  return new;
end $$;
create or replace trigger quotes_protect_code before insert or update on public.quotes for each row execute function public.protect_quote_code();

create or replace function public.protect_signed_delete() returns trigger language plpgsql as $$
begin
  if old.signed_at is not null and current_user in ('authenticated', 'anon') then
    raise exception 'DEVIS_SIGNE: un devis signé ne peut pas être supprimé';
  end if;
  return old;
end $$;
create or replace trigger quotes_protect_delete before delete on public.quotes for each row execute function public.protect_signed_delete();
