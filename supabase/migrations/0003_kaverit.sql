-- Kalapaivakirja: kaverit-ominaisuus (migraatio 3)
-- Aja tama Supabasen SQL Editorissa kokonaisuudessaan (osiot 1-4 tassa jarjestyksessa).
-- Koko tiedosto on turvallista ajaa uudelleen.

-- 1) Profiilit-taulu: kayttajanimi + nayttonimi. EI koskaan sahkopostia.
create table if not exists public.profiilit (
  id uuid primary key references auth.users (id) on delete cascade,
  kayttajanimi text unique,
  nayttonimi text,
  created_at timestamptz not null default now(),
  constraint profiilit_kayttajanimi_muoto check (
    kayttajanimi is null or kayttajanimi ~ '^[a-z0-9_]{3,20}$'
  )
);

-- Kayttajanimi on uniikki myos isot/pienet kirjaimet huomioiden
create unique index if not exists profiilit_kayttajanimi_uniikki_idx
  on public.profiilit (lower(kayttajanimi));

alter table public.profiilit enable row level security;

drop policy if exists "Kirjautuneet nakevat profiilit" on public.profiilit;
create policy "Kirjautuneet nakevat profiilit"
  on public.profiilit for select
  using (auth.uid() is not null);

drop policy if exists "Kayttaja muokkaa omaa profiiliaan" on public.profiilit;
create policy "Kayttaja muokkaa omaa profiiliaan"
  on public.profiilit for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2) Luo profiilirivi automaattisesti uudelle kayttajalle + backfill vanhoille
create or replace function public.kasittele_uusi_kayttaja()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiilit (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.kasittele_uusi_kayttaja();

insert into public.profiilit (id)
select u.id
from auth.users u
left join public.profiilit p on p.id = u.id
where p.id is null;

-- 3) Kaverit-taulu: kaveripyynnot ja hyvaksytyt kaverisuhteet
create table if not exists public.kaverit (
  id uuid primary key default gen_random_uuid(),
  pyytaja_id uuid not null references public.profiilit (id) on delete cascade,
  vastaanottaja_id uuid not null references public.profiilit (id) on delete cascade,
  tila text not null default 'pending' check (tila in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  paivitetty_at timestamptz not null default now(),
  constraint kaverit_ei_itsensa_kanssa check (pyytaja_id <> vastaanottaja_id)
);

create index if not exists kaverit_pyytaja_idx on public.kaverit (pyytaja_id);
create index if not exists kaverit_vastaanottaja_idx on public.kaverit (vastaanottaja_id);

-- Estaa kaksoispyynnot: sama pari voi esiintya vain kerran, suunnasta riippumatta
create unique index if not exists kaverit_pari_uniikki_idx
  on public.kaverit (least(pyytaja_id, vastaanottaja_id), greatest(pyytaja_id, vastaanottaja_id));

-- Estaa pyytajan/vastaanottajan vaihtamisen jalkikateen (esim. hyvaksynnan yhteydessa)
create or replace function public.estaisyys_muutos_kaverit()
returns trigger
language plpgsql
as $$
begin
  if new.pyytaja_id <> old.pyytaja_id or new.vastaanottaja_id <> old.vastaanottaja_id then
    raise exception 'pyytaja_id ja vastaanottaja_id eivat ole muokattavissa';
  end if;
  return new;
end;
$$;

drop trigger if exists kaverit_estaisyys_muutos on public.kaverit;
create trigger kaverit_estaisyys_muutos
  before update on public.kaverit
  for each row execute procedure public.estaisyys_muutos_kaverit();

-- 4) Row Level Security kaverit-taululle
alter table public.kaverit enable row level security;

drop policy if exists "Kayttaja nakee omat kaverisuhteet" on public.kaverit;
create policy "Kayttaja nakee omat kaverisuhteet"
  on public.kaverit for select
  using (auth.uid() = pyytaja_id or auth.uid() = vastaanottaja_id);

drop policy if exists "Kayttaja lahettaa pyynnon omissa nimissaan" on public.kaverit;
create policy "Kayttaja lahettaa pyynnon omissa nimissaan"
  on public.kaverit for insert
  with check (
    auth.uid() = pyytaja_id
    and tila = 'pending'
    and pyytaja_id <> vastaanottaja_id
  );

drop policy if exists "Vastaanottaja hyvaksyy pyynnon" on public.kaverit;
create policy "Vastaanottaja hyvaksyy pyynnon"
  on public.kaverit for update
  using (auth.uid() = vastaanottaja_id and tila = 'pending')
  with check (auth.uid() = vastaanottaja_id and tila = 'accepted');

drop policy if exists "Kayttaja poistaa oman rivinsa" on public.kaverit;
create policy "Kayttaja poistaa oman rivinsa"
  on public.kaverit for delete
  using (auth.uid() = pyytaja_id or auth.uid() = vastaanottaja_id);
