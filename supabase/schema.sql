-- Kalapaivakirja: tietokantarakenne ja tietoturva (koko nykytila)
-- Aja tama kokonaisuudessaan Supabasen SQL Editorissa uudessa Supabase-projektissa:
-- Supabase-projekti -> SQL Editor -> New query -> liita koko sisalto -> Run.
--
-- Jos sinulla on jo aiempi Kalapaivakirja-asennus (esim. taulu "saaliit" on
-- jo olemassa), voit ajaa taman koko tiedoston turvallisesti uudelleen - se
-- ei riko olemassa olevaa dataa. Vaihtoehtoisesti riittaa ajaa vain uusin
-- migraatiotiedosto kansiosta supabase/migrations/.

-- 1) Saaliit-taulu
create table if not exists public.saaliit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  laji text not null check (laji in ('kuha', 'ahven', 'hauki', 'taimen', 'muu')),
  paino_kg numeric(6, 2) check (paino_kg is null or paino_kg > 0),
  pituus_cm numeric(6, 1) check (pituus_cm is null or pituus_cm > 0),
  ajankohta timestamptz not null default now(),
  sijainti_teksti text,
  latitude double precision,
  longitude double precision,
  viehe text,
  kalastustapa text check (
    kalastustapa is null or kalastustapa in (
      'heitto', 'vetouistelu', 'jigaus', 'pilkinta', 'perhokalastus'
    )
  ),
  kuva_url text,
  muistiinpanot text,
  created_at timestamptz not null default now()
);

create index if not exists saaliit_user_id_idx on public.saaliit (user_id);
create index if not exists saaliit_ajankohta_idx on public.saaliit (ajankohta desc);

-- 2) Row Level Security saaliille: jokainen kayttaja nakee ja muokkaa vain omia saaliitaan
alter table public.saaliit enable row level security;

drop policy if exists "Kayttaja nakee omat saaliit" on public.saaliit;
create policy "Kayttaja nakee omat saaliit"
  on public.saaliit for select
  using (auth.uid() = user_id);

drop policy if exists "Kayttaja poistaa omia saaliita" on public.saaliit;
create policy "Kayttaja poistaa omia saaliita"
  on public.saaliit for delete
  using (auth.uid() = user_id);

-- 3) Kuvien tallennustila (storage bucket)
insert into storage.buckets (id, name, public)
values ('saalis-kuvat', 'saalis-kuvat', true)
on conflict (id) do nothing;

-- Kuvat tallennetaan polkuun {kayttajan_id}/tiedostonimi, joten RLS voi
-- tarkistaa polun ensimmaisesta osasta, etta kuva kuuluu kirjautuneelle kayttajalle.

drop policy if exists "Kuka tahansa voi katsoa saaliskuvia" on storage.objects;
create policy "Kuka tahansa voi katsoa saaliskuvia"
  on storage.objects for select
  using (bucket_id = 'saalis-kuvat');

drop policy if exists "Kayttaja lataa omia kuvia" on storage.objects;
create policy "Kayttaja lataa omia kuvia"
  on storage.objects for insert
  with check (
    bucket_id = 'saalis-kuvat'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Kayttaja muokkaa omia kuvia" on storage.objects;
create policy "Kayttaja muokkaa omia kuvia"
  on storage.objects for update
  using (
    bucket_id = 'saalis-kuvat'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Kayttaja poistaa omia kuvia" on storage.objects;
create policy "Kayttaja poistaa omia kuvia"
  on storage.objects for delete
  using (
    bucket_id = 'saalis-kuvat'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Reissut-taulu (yksi kalareissu voi niputtaa monta saalista)
create table if not exists public.reissut (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  paikka text,
  aloitusaika timestamptz not null default now(),
  lopetusaika timestamptz,
  muistiinpanot text,
  created_at timestamptz not null default now(),
  constraint reissut_lopetus_aloituksen_jalkeen check (
    lopetusaika is null or lopetusaika >= aloitusaika
  )
);

create index if not exists reissut_user_id_idx on public.reissut (user_id);
create index if not exists reissut_aloitusaika_idx on public.reissut (aloitusaika desc);

-- Vain yksi kaynnissa oleva reissu kayttajaa kohden kerrallaan
create unique index if not exists reissut_yksi_aktiivinen_idx
  on public.reissut (user_id)
  where (lopetusaika is null);

alter table public.reissut enable row level security;

drop policy if exists "Kayttaja nakee omat reissut" on public.reissut;
create policy "Kayttaja nakee omat reissut"
  on public.reissut for select
  using (auth.uid() = user_id);

drop policy if exists "Kayttaja lisaa omia reissuja" on public.reissut;
create policy "Kayttaja lisaa omia reissuja"
  on public.reissut for insert
  with check (auth.uid() = user_id);

drop policy if exists "Kayttaja muokkaa omia reissuja" on public.reissut;
create policy "Kayttaja muokkaa omia reissuja"
  on public.reissut for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Kayttaja poistaa omia reissuja" on public.reissut;
create policy "Kayttaja poistaa omia reissuja"
  on public.reissut for delete
  using (auth.uid() = user_id);

-- 5) Saaliit voidaan liittaa reissuun (valinnainen)
alter table public.saaliit
  add column if not exists reissu_id uuid references public.reissut (id) on delete set null;

create index if not exists saaliit_reissu_id_idx on public.saaliit (reissu_id);

-- Saaliiden lisays/muokkaus-kaytannot: saalis voidaan liittaa vain kayttajan
-- omaan reissuun (tai jattaa kokonaan liittamatta)
drop policy if exists "Kayttaja lisaa omia saaliita" on public.saaliit;
create policy "Kayttaja lisaa omia saaliita"
  on public.saaliit for insert
  with check (
    auth.uid() = user_id
    and (
      reissu_id is null
      or exists (
        select 1 from public.reissut r
        where r.id = reissu_id and r.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Kayttaja muokkaa omia saaliita" on public.saaliit;
create policy "Kayttaja muokkaa omia saaliita"
  on public.saaliit for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      reissu_id is null
      or exists (
        select 1 from public.reissut r
        where r.id = reissu_id and r.user_id = auth.uid()
      )
    )
  );

-- 6) Profiilit-taulu: kayttajanimi + nayttonimi. EI koskaan sahkopostia.
create table if not exists public.profiilit (
  id uuid primary key references auth.users (id) on delete cascade,
  kayttajanimi text unique,
  nayttonimi text,
  created_at timestamptz not null default now(),
  constraint profiilit_kayttajanimi_muoto check (
    kayttajanimi is null or kayttajanimi ~ '^[a-z0-9_]{3,20}$'
  )
);

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

-- 7) Luo profiilirivi automaattisesti uudelle kayttajalle + backfill vanhoille
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

-- 8) Kaverit-taulu: kaveripyynnot ja hyvaksytyt kaverisuhteet
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

create unique index if not exists kaverit_pari_uniikki_idx
  on public.kaverit (least(pyytaja_id, vastaanottaja_id), greatest(pyytaja_id, vastaanottaja_id));

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

-- 9) Row Level Security kaverit-taululle
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
