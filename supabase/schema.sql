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

-- 4) Reissut-taulu
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
set search_path = ''
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

-- 10) Kisat-taulu
create table if not exists public.kisat (
  id uuid primary key default gen_random_uuid(),
  luoja_id uuid not null references public.profiilit (id) on delete cascade,
  nimi text not null,
  laji text check (laji is null or laji in ('kuha', 'ahven', 'hauki', 'taimen', 'muu')),
  mittari text not null check (mittari in ('suurin_kala', 'maara')),
  laskentatapa text not null check (laskentatapa in ('automaattinen', 'ilmoitettava')),
  alkupaiva date not null,
  loppupaiva date not null,
  created_at timestamptz not null default now(),
  constraint kisat_loppu_alun_jalkeen check (loppupaiva >= alkupaiva)
);

create index if not exists kisat_luoja_idx on public.kisat (luoja_id);

-- 11) Osallistujat (kutsut + hyvaksynnat)
create table if not exists public.kisa_osallistujat (
  id uuid primary key default gen_random_uuid(),
  kisa_id uuid not null references public.kisat (id) on delete cascade,
  kayttaja_id uuid not null references public.profiilit (id) on delete cascade,
  tila text not null default 'pending' check (tila in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  paivitetty_at timestamptz not null default now(),
  unique (kisa_id, kayttaja_id)
);

create index if not exists kisa_osallistujat_kisa_idx on public.kisa_osallistujat (kisa_id);
create index if not exists kisa_osallistujat_kayttaja_idx on public.kisa_osallistujat (kayttaja_id);

-- 12) Ilmoitettavat saaliit (kaytetaan vain kun laskentatapa = 'ilmoitettava')
create table if not exists public.kisa_saaliit (
  id uuid primary key default gen_random_uuid(),
  kisa_id uuid not null references public.kisat (id) on delete cascade,
  saalis_id uuid not null references public.saaliit (id) on delete cascade,
  kayttaja_id uuid not null references public.profiilit (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kisa_id, saalis_id)
);

create index if not exists kisa_saaliit_kisa_idx on public.kisa_saaliit (kisa_id);
create index if not exists kisa_saaliit_kayttaja_idx on public.kisa_saaliit (kayttaja_id);

-- 13) Luoja liittyy automaattisesti hyvaksyttyna osallistujana omaan kisaansa,
-- ja kisa_osallistujat-rivin avainkentat eivat ole muokattavissa jalkikateen
create or replace function public.lisaa_luoja_osallistujaksi()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.kisa_osallistujat (kisa_id, kayttaja_id, tila)
  values (new.id, new.luoja_id, 'accepted')
  on conflict (kisa_id, kayttaja_id) do nothing;
  return new;
end;
$$;

drop trigger if exists kisat_lisaa_luoja on public.kisat;
create trigger kisat_lisaa_luoja
  after insert on public.kisat
  for each row execute procedure public.lisaa_luoja_osallistujaksi();

create or replace function public.estaisyys_muutos_kisa_osallistujat()
returns trigger
language plpgsql
as $$
begin
  if new.kisa_id <> old.kisa_id or new.kayttaja_id <> old.kayttaja_id then
    raise exception 'kisa_id ja kayttaja_id eivat ole muokattavissa';
  end if;
  return new;
end;
$$;

drop trigger if exists kisa_osallistujat_estaisyys_muutos on public.kisa_osallistujat;
create trigger kisa_osallistujat_estaisyys_muutos
  before update on public.kisa_osallistujat
  for each row execute procedure public.estaisyys_muutos_kisa_osallistujat();

-- 14) Kisojen RLS-apufunktiot (SECURITY DEFINER). Nailla vaeltetaan
-- "kisat" ja "kisa_osallistujat" -taulujen RLS-kaytantojen aareton
-- rekursio (kumpikin taulu tarkistaisi toisensa RLS:n loputtomiin, jos
-- tarkistus tehtaisiin suoraan taulujen valisella exists()-kyselylla
-- policyn sisalla). search_path on lukittu tyhjaksi jottei funktiota voi
-- kaapata luomalla public-skeemaan samannimisia haitallisia olioita, ja
-- kaikki viittaukset ovat taysin skeemattu (public.kisat, auth.uid()).
create or replace function public.onko_kisan_luoja(p_kisa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kisat
    where id = p_kisa_id and luoja_id = auth.uid()
  );
$$;

create or replace function public.onko_kisan_osallistuja(p_kisa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kisa_osallistujat
    where kisa_id = p_kisa_id
      and kayttaja_id = auth.uid()
      and tila in ('pending', 'accepted')
  );
$$;

create or replace function public.onko_hyvaksytty_kisaosallistuja(p_kisa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kisa_osallistujat
    where kisa_id = p_kisa_id
      and kayttaja_id = auth.uid()
      and tila = 'accepted'
  );
$$;

revoke all on function public.onko_kisan_luoja(uuid) from public;
revoke all on function public.onko_kisan_osallistuja(uuid) from public;
revoke all on function public.onko_hyvaksytty_kisaosallistuja(uuid) from public;
grant execute on function public.onko_kisan_luoja(uuid) to authenticated;
grant execute on function public.onko_kisan_osallistuja(uuid) to authenticated;
grant execute on function public.onko_hyvaksytty_kisaosallistuja(uuid) to authenticated;

-- 15) Row Level Security kisat-, kisa_osallistujat- ja kisa_saaliit-tauluille
-- (kayttaa yllaolevia apufunktioita rekursion valttamiseksi)
alter table public.kisat enable row level security;

drop policy if exists "Osallistujat nakevat kisan" on public.kisat;
create policy "Osallistujat nakevat kisan"
  on public.kisat for select
  using (
    auth.uid() = luoja_id
    or public.onko_kisan_osallistuja(id)
  );

drop policy if exists "Kayttaja luo kisan omissa nimissaan" on public.kisat;
create policy "Kayttaja luo kisan omissa nimissaan"
  on public.kisat for insert
  with check (auth.uid() = luoja_id);

drop policy if exists "Luoja muokkaa kisaansa" on public.kisat;
create policy "Luoja muokkaa kisaansa"
  on public.kisat for update
  using (auth.uid() = luoja_id)
  with check (auth.uid() = luoja_id);

drop policy if exists "Luoja poistaa kisansa" on public.kisat;
create policy "Luoja poistaa kisansa"
  on public.kisat for delete
  using (auth.uid() = luoja_id);

alter table public.kisa_osallistujat enable row level security;

drop policy if exists "Nakee oman rivin tai oman kisan osallistujat" on public.kisa_osallistujat;
create policy "Nakee oman rivin tai oman kisan osallistujat"
  on public.kisa_osallistujat for select
  using (
    auth.uid() = kayttaja_id
    or public.onko_kisan_luoja(kisa_id)
  );

drop policy if exists "Luoja kutsuu hyvaksytyn kaverin" on public.kisa_osallistujat;
create policy "Luoja kutsuu hyvaksytyn kaverin"
  on public.kisa_osallistujat for insert
  with check (
    tila = 'pending'
    and public.onko_kisan_luoja(kisa_id)
    and exists (
      select 1 from public.kaverit c
      where c.tila = 'accepted'
        and (
          (c.pyytaja_id = auth.uid() and c.vastaanottaja_id = kisa_osallistujat.kayttaja_id)
          or (c.vastaanottaja_id = auth.uid() and c.pyytaja_id = kisa_osallistujat.kayttaja_id)
        )
    )
  );

drop policy if exists "Kutsuttu vastaa kutsuun" on public.kisa_osallistujat;
create policy "Kutsuttu vastaa kutsuun"
  on public.kisa_osallistujat for update
  using (auth.uid() = kayttaja_id and tila = 'pending')
  with check (auth.uid() = kayttaja_id and tila in ('accepted', 'declined'));

drop policy if exists "Kayttaja poistaa oman osallistumisensa" on public.kisa_osallistujat;
create policy "Kayttaja poistaa oman osallistumisensa"
  on public.kisa_osallistujat for delete
  using (auth.uid() = kayttaja_id);

alter table public.kisa_saaliit enable row level security;

drop policy if exists "Kayttaja nakee omat kisaliitokset" on public.kisa_saaliit;
create policy "Kayttaja nakee omat kisaliitokset"
  on public.kisa_saaliit for select
  using (auth.uid() = kayttaja_id);

drop policy if exists "Osallistuja liittaa oman saaliin ilmoitettavaan kisaan" on public.kisa_saaliit;
create policy "Osallistuja liittaa oman saaliin ilmoitettavaan kisaan"
  on public.kisa_saaliit for insert
  with check (
    auth.uid() = kayttaja_id
    and exists (
      select 1 from public.saaliit s
      where s.id = kisa_saaliit.saalis_id and s.user_id = auth.uid()
    )
    and public.onko_hyvaksytty_kisaosallistuja(kisa_id)
    and exists (
      select 1 from public.kisat k
      where k.id = kisa_saaliit.kisa_id and k.laskentatapa = 'ilmoitettava'
    )
  );

drop policy if exists "Kayttaja irrottaa oman kisaliitoksensa" on public.kisa_saaliit;
create policy "Kayttaja irrottaa oman kisaliitoksensa"
  on public.kisa_saaliit for delete
  using (auth.uid() = kayttaja_id);

-- 16) Tulostaulukko: turvallinen funktio joka laskee tulokset kaikkien
-- hyvaksyttyjen osallistujien saaliista ja palauttaa vain kayttajanimen,
-- nayttonimen ja lasketun tuloksen - ei sijaintia, kuvia tai muita
-- saaliin yksityiskohtia.
create or replace function public.kisan_tulostaulukko(p_kisa_id uuid)
returns table (
  kayttaja_id uuid,
  kayttajanimi text,
  nayttonimi text,
  tulos numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kisa record;
begin
  if not exists (
    select 1 from public.kisa_osallistujat o
    where o.kisa_id = p_kisa_id and o.kayttaja_id = auth.uid() and o.tila = 'accepted'
  ) then
    raise exception 'Ei oikeutta tahan kisaan';
  end if;

  select * into v_kisa from public.kisat k where k.id = p_kisa_id;

  if v_kisa.id is null then
    raise exception 'Kisaa ei loytynyt';
  end if;

  if v_kisa.laskentatapa = 'automaattinen' then
    return query
      select
        o.kayttaja_id,
        p.kayttajanimi,
        p.nayttonimi,
        case when v_kisa.mittari = 'suurin_kala' then max(s.paino_kg) else count(s.id)::numeric end
      from public.kisa_osallistujat o
      join public.profiilit p on p.id = o.kayttaja_id
      left join public.saaliit s
        on s.user_id = o.kayttaja_id
        and s.ajankohta >= v_kisa.alkupaiva::timestamptz
        and s.ajankohta < (v_kisa.loppupaiva + 1)::timestamptz
        and (v_kisa.laji is null or s.laji = v_kisa.laji)
      where o.kisa_id = p_kisa_id and o.tila = 'accepted'
      group by o.kayttaja_id, p.kayttajanimi, p.nayttonimi
      order by 4 desc nulls last;
  else
    return query
      select
        o.kayttaja_id,
        p.kayttajanimi,
        p.nayttonimi,
        case when v_kisa.mittari = 'suurin_kala' then max(s.paino_kg) else count(s.id)::numeric end
      from public.kisa_osallistujat o
      join public.profiilit p on p.id = o.kayttaja_id
      left join public.kisa_saaliit ks on ks.kisa_id = p_kisa_id and ks.kayttaja_id = o.kayttaja_id
      left join public.saaliit s on s.id = ks.saalis_id
      where o.kisa_id = p_kisa_id and o.tila = 'accepted'
      group by o.kayttaja_id, p.kayttajanimi, p.nayttonimi
      order by 4 desc nulls last;
  end if;
end;
$$;

revoke all on function public.kisan_tulostaulukko(uuid) from public;
grant execute on function public.kisan_tulostaulukko(uuid) to authenticated;

-- 17) Ilmoitukset-taulu: sovelluksen sisaiset ilmoitukset (ei push-ilmoituksia)
create table if not exists public.ilmoitukset (
  id uuid primary key default gen_random_uuid(),
  vastaanottaja_id uuid not null references public.profiilit (id) on delete cascade,
  tyyppi text not null check (tyyppi in (
    'kaverin_saalis',
    'kaveripyynto_saapui',
    'kaveripyynto_hyvaksytty',
    'kisakutsu',
    'kisan_karkipaikka'
  )),
  teksti text not null,
  viittaus_tyyppi text check (viittaus_tyyppi is null or viittaus_tyyppi in ('saalis', 'kaveri', 'kisa')),
  viittaus_id uuid,
  luettu boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ilmoitukset_vastaanottaja_idx
  on public.ilmoitukset (vastaanottaja_id, created_at desc);

create index if not exists ilmoitukset_lukemattomat_idx
  on public.ilmoitukset (vastaanottaja_id)
  where not luettu;

create or replace function public.estaisyys_muutos_ilmoitukset()
returns trigger
language plpgsql
as $$
begin
  if new.vastaanottaja_id <> old.vastaanottaja_id
    or new.tyyppi <> old.tyyppi
    or new.teksti <> old.teksti
    or new.viittaus_tyyppi is distinct from old.viittaus_tyyppi
    or new.viittaus_id is distinct from old.viittaus_id
    or new.created_at <> old.created_at
  then
    raise exception 'Vain luettu-kenttaa voi muokata';
  end if;
  return new;
end;
$$;

drop trigger if exists ilmoitukset_estaisyys_muutos on public.ilmoitukset;
create trigger ilmoitukset_estaisyys_muutos
  before update on public.ilmoitukset
  for each row execute procedure public.estaisyys_muutos_ilmoitukset();

-- 18) Row Level Security ilmoituksille: kayttaja nakee ja muokkaa vain omia
-- ilmoituksiaan. Ei INSERT-kaytantoa lainkaan - vain alempana olevat
-- SECURITY DEFINER -triggerit voivat luoda rivin.
alter table public.ilmoitukset enable row level security;

drop policy if exists "Kayttaja nakee omat ilmoitukset" on public.ilmoitukset;
create policy "Kayttaja nakee omat ilmoitukset"
  on public.ilmoitukset for select
  using (auth.uid() = vastaanottaja_id);

drop policy if exists "Kayttaja merkitsee omat ilmoitukset luetuiksi" on public.ilmoitukset;
create policy "Kayttaja merkitsee omat ilmoitukset luetuiksi"
  on public.ilmoitukset for update
  using (auth.uid() = vastaanottaja_id)
  with check (auth.uid() = vastaanottaja_id);

drop policy if exists "Kayttaja poistaa omia ilmoituksiaan" on public.ilmoitukset;
create policy "Kayttaja poistaa omia ilmoituksiaan"
  on public.ilmoitukset for delete
  using (auth.uid() = vastaanottaja_id);

-- 19) Ilmoitus: kaveri kirjasi uuden saaliin (ei koskaan sijaintia mukana)
create or replace function public.ilmoita_kaverin_saalis()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nimi text;
begin
  select coalesce(p.nayttonimi, p.kayttajanimi, 'Kaverisi')
    into v_nimi
  from public.profiilit p
  where p.id = new.user_id;

  insert into public.ilmoitukset (vastaanottaja_id, tyyppi, teksti, viittaus_tyyppi, viittaus_id)
  select
    case when k.pyytaja_id = new.user_id then k.vastaanottaja_id else k.pyytaja_id end,
    'kaverin_saalis',
    v_nimi || ' kirjasi uuden saaliin (' || initcap(new.laji) || ')',
    'saalis',
    new.id
  from public.kaverit k
  where k.tila = 'accepted'
    and (k.pyytaja_id = new.user_id or k.vastaanottaja_id = new.user_id);

  return new;
end;
$$;

revoke all on function public.ilmoita_kaverin_saalis() from public;

drop trigger if exists saaliit_ilmoita_kaverin_saalis on public.saaliit;
create trigger saaliit_ilmoita_kaverin_saalis
  after insert on public.saaliit
  for each row execute procedure public.ilmoita_kaverin_saalis();

-- 20) Ilmoitus: saapui kaveripyynto
create or replace function public.ilmoita_kaveripyynto_saapui()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nimi text;
begin
  if new.tila <> 'pending' then
    return new;
  end if;

  select coalesce(p.nayttonimi, p.kayttajanimi, 'Joku')
    into v_nimi
  from public.profiilit p
  where p.id = new.pyytaja_id;

  insert into public.ilmoitukset (vastaanottaja_id, tyyppi, teksti, viittaus_tyyppi, viittaus_id)
  values (
    new.vastaanottaja_id,
    'kaveripyynto_saapui',
    v_nimi || ' lahetti sinulle kaveripyynnon',
    'kaveri',
    new.id
  );

  return new;
end;
$$;

revoke all on function public.ilmoita_kaveripyynto_saapui() from public;

drop trigger if exists kaverit_ilmoita_pyynto on public.kaverit;
create trigger kaverit_ilmoita_pyynto
  after insert on public.kaverit
  for each row execute procedure public.ilmoita_kaveripyynto_saapui();

-- 21) Ilmoitus: kaveripyynto hyvaksyttiin
create or replace function public.ilmoita_kaveripyynto_hyvaksytty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nimi text;
begin
  if not (old.tila = 'pending' and new.tila = 'accepted') then
    return new;
  end if;

  select coalesce(p.nayttonimi, p.kayttajanimi, 'Kaverisi')
    into v_nimi
  from public.profiilit p
  where p.id = new.vastaanottaja_id;

  insert into public.ilmoitukset (vastaanottaja_id, tyyppi, teksti, viittaus_tyyppi, viittaus_id)
  values (
    new.pyytaja_id,
    'kaveripyynto_hyvaksytty',
    v_nimi || ' hyvaksyi kaveripyyntosi',
    'kaveri',
    new.id
  );

  return new;
end;
$$;

revoke all on function public.ilmoita_kaveripyynto_hyvaksytty() from public;

drop trigger if exists kaverit_ilmoita_hyvaksytty on public.kaverit;
create trigger kaverit_ilmoita_hyvaksytty
  after update on public.kaverit
  for each row execute procedure public.ilmoita_kaveripyynto_hyvaksytty();

-- 22) Ilmoitus: sinut kutsuttiin kisaan
create or replace function public.ilmoita_kisakutsu()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nimi text;
  v_kisan_nimi text;
begin
  if new.tila <> 'pending' then
    return new;
  end if;

  select k.nimi, coalesce(pr.nayttonimi, pr.kayttajanimi, 'Joku')
    into v_kisan_nimi, v_nimi
  from public.kisat k
  join public.profiilit pr on pr.id = k.luoja_id
  where k.id = new.kisa_id;

  insert into public.ilmoitukset (vastaanottaja_id, tyyppi, teksti, viittaus_tyyppi, viittaus_id)
  values (
    new.kayttaja_id,
    'kisakutsu',
    v_nimi || ' kutsui sinut kisaan "' || v_kisan_nimi || '"',
    'kisa',
    new.kisa_id
  );

  return new;
end;
$$;

revoke all on function public.ilmoita_kisakutsu() from public;

drop trigger if exists kisa_osallistujat_ilmoita_kutsu on public.kisa_osallistujat;
create trigger kisa_osallistujat_ilmoita_kutsu
  after insert on public.kisa_osallistujat
  for each row execute procedure public.ilmoita_kisakutsu();

-- 23) Ilmoitus: sinut ohitettiin kisan karjessa (automaattinen-kisat)
create or replace function public.ilmoita_kisan_karkipaikka_automaattinen()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kisa record;
  v_vanha_johtaja uuid;
  v_vanha_tulos numeric;
  v_uusi_johtaja uuid;
  v_uusi_tulos numeric;
  v_nimi text;
begin
  for v_kisa in
    select k.*
    from public.kisat k
    join public.kisa_osallistujat o
      on o.kisa_id = k.id and o.kayttaja_id = new.user_id and o.tila = 'accepted'
    where k.laskentatapa = 'automaattinen'
      and current_date between k.alkupaiva and k.loppupaiva
      and (k.laji is null or k.laji = new.laji)
  loop
    select o.kayttaja_id,
           case when v_kisa.mittari = 'suurin_kala' then max(s.paino_kg) else count(s.id)::numeric end
      into v_vanha_johtaja, v_vanha_tulos
    from public.kisa_osallistujat o
    left join public.saaliit s
      on s.user_id = o.kayttaja_id
      and s.id <> new.id
      and s.ajankohta >= v_kisa.alkupaiva::timestamptz
      and s.ajankohta < (v_kisa.loppupaiva + 1)::timestamptz
      and (v_kisa.laji is null or s.laji = v_kisa.laji)
    where o.kisa_id = v_kisa.id and o.tila = 'accepted'
    group by o.kayttaja_id
    order by 2 desc nulls last, o.kayttaja_id
    limit 1;

    select o.kayttaja_id,
           case when v_kisa.mittari = 'suurin_kala' then max(s.paino_kg) else count(s.id)::numeric end
      into v_uusi_johtaja, v_uusi_tulos
    from public.kisa_osallistujat o
    left join public.saaliit s
      on s.user_id = o.kayttaja_id
      and s.ajankohta >= v_kisa.alkupaiva::timestamptz
      and s.ajankohta < (v_kisa.loppupaiva + 1)::timestamptz
      and (v_kisa.laji is null or s.laji = v_kisa.laji)
    where o.kisa_id = v_kisa.id and o.tila = 'accepted'
    group by o.kayttaja_id
    order by 2 desc nulls last, o.kayttaja_id
    limit 1;

    if coalesce(v_vanha_tulos, 0) > 0
      and v_vanha_johtaja is distinct from v_uusi_johtaja
      and v_uusi_johtaja = new.user_id
    then
      select coalesce(p.nayttonimi, p.kayttajanimi, 'Kaveri')
        into v_nimi
      from public.profiilit p
      where p.id = new.user_id;

      insert into public.ilmoitukset (vastaanottaja_id, tyyppi, teksti, viittaus_tyyppi, viittaus_id)
      values (
        v_vanha_johtaja,
        'kisan_karkipaikka',
        v_nimi || ' ohitti sinut karjessa kisassa "' || v_kisa.nimi || '"',
        'kisa',
        v_kisa.id
      );
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function public.ilmoita_kisan_karkipaikka_automaattinen() from public;

drop trigger if exists saaliit_ilmoita_karkipaikka on public.saaliit;
create trigger saaliit_ilmoita_karkipaikka
  after insert on public.saaliit
  for each row execute procedure public.ilmoita_kisan_karkipaikka_automaattinen();

-- 24) Sama karkipaikka-ilmoitus "ilmoitettava"-kisoille (laukeaa kun saalis
-- liitetaan kisaan, koska vasta silloin se alkaa laskea mukaan)
create or replace function public.ilmoita_kisan_karkipaikka_ilmoitettava()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kisa record;
  v_vanha_johtaja uuid;
  v_vanha_tulos numeric;
  v_uusi_johtaja uuid;
  v_uusi_tulos numeric;
  v_nimi text;
begin
  select * into v_kisa from public.kisat where id = new.kisa_id;

  if v_kisa.id is null
    or v_kisa.laskentatapa <> 'ilmoitettava'
    or current_date < v_kisa.alkupaiva
    or current_date > v_kisa.loppupaiva
  then
    return new;
  end if;

  select o.kayttaja_id,
         case when v_kisa.mittari = 'suurin_kala' then max(s.paino_kg) else count(s.id)::numeric end
    into v_vanha_johtaja, v_vanha_tulos
  from public.kisa_osallistujat o
  left join public.kisa_saaliit ks
    on ks.kisa_id = v_kisa.id and ks.kayttaja_id = o.kayttaja_id and ks.id <> new.id
  left join public.saaliit s on s.id = ks.saalis_id
  where o.kisa_id = v_kisa.id and o.tila = 'accepted'
  group by o.kayttaja_id
  order by 2 desc nulls last, o.kayttaja_id
  limit 1;

  select o.kayttaja_id,
         case when v_kisa.mittari = 'suurin_kala' then max(s.paino_kg) else count(s.id)::numeric end
    into v_uusi_johtaja, v_uusi_tulos
  from public.kisa_osallistujat o
  left join public.kisa_saaliit ks
    on ks.kisa_id = v_kisa.id and ks.kayttaja_id = o.kayttaja_id
  left join public.saaliit s on s.id = ks.saalis_id
  where o.kisa_id = v_kisa.id and o.tila = 'accepted'
  group by o.kayttaja_id
  order by 2 desc nulls last, o.kayttaja_id
  limit 1;

  if coalesce(v_vanha_tulos, 0) > 0
    and v_vanha_johtaja is distinct from v_uusi_johtaja
    and v_uusi_johtaja = new.kayttaja_id
  then
    select coalesce(p.nayttonimi, p.kayttajanimi, 'Kaveri')
      into v_nimi
    from public.profiilit p
    where p.id = new.kayttaja_id;

    insert into public.ilmoitukset (vastaanottaja_id, tyyppi, teksti, viittaus_tyyppi, viittaus_id)
    values (
      v_vanha_johtaja,
      'kisan_karkipaikka',
      v_nimi || ' ohitti sinut karjessa kisassa "' || v_kisa.nimi || '"',
      'kisa',
      v_kisa.id
    );
  end if;

  return new;
end;
$$;

revoke all on function public.ilmoita_kisan_karkipaikka_ilmoitettava() from public;

drop trigger if exists kisa_saaliit_ilmoita_karkipaikka on public.kisa_saaliit;
create trigger kisa_saaliit_ilmoita_karkipaikka
  after insert on public.kisa_saaliit
  for each row execute procedure public.ilmoita_kisan_karkipaikka_ilmoitettava();

-- 25) Joukkuekisat: kisat-tauluun kisatyyppi ja joukkueiden laskentatapa.
-- Oletusarvo 'yksilo' pitaa kaikki olemassa olevat kisat toimivina.
alter table public.kisat
  add column if not exists tyyppi text not null default 'yksilo'
    check (tyyppi in ('yksilo', 'joukkue'));

alter table public.kisat
  add column if not exists joukkuelaskentatapa text
    check (joukkuelaskentatapa is null or joukkuelaskentatapa in ('yhteistulos', 'suurin_kala'));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'kisat_joukkuelaskentatapa_vaatimus'
  ) then
    alter table public.kisat
      add constraint kisat_joukkuelaskentatapa_vaatimus
      check (
        (tyyppi = 'joukkue' and joukkuelaskentatapa is not null)
        or (tyyppi = 'yksilo' and joukkuelaskentatapa is null)
      );
  end if;
end $$;

-- 26) Joukkueet-taulu: joukkue kuuluu tiettyyn kisaan
create table if not exists public.kisa_joukkueet (
  id uuid primary key default gen_random_uuid(),
  kisa_id uuid not null references public.kisat (id) on delete cascade,
  nimi text not null,
  created_at timestamptz not null default now(),
  unique (kisa_id, nimi)
);

create index if not exists kisa_joukkueet_kisa_idx on public.kisa_joukkueet (kisa_id);

-- 27) Osallistuja kuuluu (joukkuekisassa) tasmalleen yhteen joukkueeseen.
-- Nollattavissa (yksilokisoissa aina null, joukkuekisassa null kunnes
-- luoja jakaa osallistujan joukkueeseen).
alter table public.kisa_osallistujat
  add column if not exists joukkue_id uuid references public.kisa_joukkueet (id) on delete set null;

create index if not exists kisa_osallistujat_joukkue_idx on public.kisa_osallistujat (joukkue_id);

-- 28) Joukkuejaon muokkausoikeudet: vain kisan luoja saa muuttaa kenenkaan
-- joukkue_id-kenttaa, ja tila-kenttaa saa muuttaa vain osallistuja itse
-- (nain kisan luoja ei voi vahingossa/tahallaan hyvaksya tai hylata
-- kutsua toisen puolesta pelkan joukkuejaon yhteydessa).
create or replace function public.estaisyys_joukkue_paivitys()
returns trigger
language plpgsql
as $$
begin
  if new.joukkue_id is distinct from old.joukkue_id
     and not public.onko_kisan_luoja(new.kisa_id) then
    raise exception 'Vain kisan luoja voi muuttaa joukkuejakoa';
  end if;

  if new.tila is distinct from old.tila and auth.uid() <> new.kayttaja_id then
    raise exception 'Vain osallistuja itse voi muuttaa oman kutsunsa tilaa';
  end if;

  return new;
end;
$$;

drop trigger if exists kisa_osallistujat_estaisyys_joukkue on public.kisa_osallistujat;
create trigger kisa_osallistujat_estaisyys_joukkue
  before update on public.kisa_osallistujat
  for each row execute procedure public.estaisyys_joukkue_paivitys();

-- 29) Row Level Security: kisa_joukkueet nakyy kisan luojalle ja
-- osallistujille (myos kutsutuille, jotta kutsuttu nakee mihin
-- joukkueeseen hanet on kutsuttu), vain luoja luo/muokkaa/poistaa.
alter table public.kisa_joukkueet enable row level security;

drop policy if exists "Osallistujat nakevat joukkueet" on public.kisa_joukkueet;
create policy "Osallistujat nakevat joukkueet"
  on public.kisa_joukkueet for select
  using (
    public.onko_kisan_luoja(kisa_id)
    or public.onko_kisan_osallistuja(kisa_id)
  );

drop policy if exists "Luoja luo joukkueita" on public.kisa_joukkueet;
create policy "Luoja luo joukkueita"
  on public.kisa_joukkueet for insert
  with check (public.onko_kisan_luoja(kisa_id));

drop policy if exists "Luoja muokkaa joukkueita" on public.kisa_joukkueet;
create policy "Luoja muokkaa joukkueita"
  on public.kisa_joukkueet for update
  using (public.onko_kisan_luoja(kisa_id))
  with check (public.onko_kisan_luoja(kisa_id));

drop policy if exists "Luoja poistaa joukkueita" on public.kisa_joukkueet;
create policy "Luoja poistaa joukkueita"
  on public.kisa_joukkueet for delete
  using (public.onko_kisan_luoja(kisa_id));

-- 30) Laajenna kisa_osallistujat-liittamiskaytantoa: kutsuttaessa saa
-- asettaa joukkue_id:n, mutta vain jos joukkue kuuluu samaan kisaan.
drop policy if exists "Luoja kutsuu hyvaksytyn kaverin" on public.kisa_osallistujat;
create policy "Luoja kutsuu hyvaksytyn kaverin"
  on public.kisa_osallistujat for insert
  with check (
    tila = 'pending'
    and public.onko_kisan_luoja(kisa_id)
    and exists (
      select 1 from public.kaverit c
      where c.tila = 'accepted'
        and (
          (c.pyytaja_id = auth.uid() and c.vastaanottaja_id = kisa_osallistujat.kayttaja_id)
          or (c.vastaanottaja_id = auth.uid() and c.pyytaja_id = kisa_osallistujat.kayttaja_id)
        )
    )
    and (
      joukkue_id is null
      or exists (
        select 1 from public.kisa_joukkueet j
        where j.id = kisa_osallistujat.joukkue_id and j.kisa_id = kisa_osallistujat.kisa_id
      )
    )
  );

-- 31) Uusi kaytanto: kisan luoja voi paivittaa kenen tahansa osallistujan
-- joukkue_id:n omassa kisassaan (itse joukkuejaon tekeminen). Trigger
-- (kohta 28) varmistaa ettei tama kaytanto mahdollista tila-kentan
-- muuttamista jonkun toisen puolesta.
drop policy if exists "Luoja hallinnoi joukkuejakoa" on public.kisa_osallistujat;
create policy "Luoja hallinnoi joukkuejakoa"
  on public.kisa_osallistujat for update
  using (public.onko_kisan_luoja(kisa_id))
  with check (public.onko_kisan_luoja(kisa_id));

-- 32) Joukkuekisan tulostaulukko: turvallinen funktio joka laskee
-- joukkueiden tulokset ja palauttaa myos jasenten osuudet. Palauttaa vain
-- kayttajanimen, nayttonimen ja lasketut tulokset - ei sijaintia, kuvia
-- tai muita saaliin yksityiskohtia. Rivit on jarjestetty joukkueen
-- sijoituksen mukaan, jasenet sen sisalla oman osuutensa mukaan.
create or replace function public.kisan_joukkuetulokset(p_kisa_id uuid)
returns table (
  joukkue_id uuid,
  joukkue_nimi text,
  joukkue_tulos numeric,
  kayttaja_id uuid,
  kayttajanimi text,
  nayttonimi text,
  jasen_tulos numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kisa record;
begin
  if not exists (
    select 1 from public.kisa_osallistujat o
    where o.kisa_id = p_kisa_id and o.kayttaja_id = auth.uid() and o.tila = 'accepted'
  ) then
    raise exception 'Ei oikeutta tahan kisaan';
  end if;

  select * into v_kisa from public.kisat k where k.id = p_kisa_id;

  if v_kisa.id is null then
    raise exception 'Kisaa ei loytynyt';
  end if;

  if v_kisa.tyyppi <> 'joukkue' then
    raise exception 'Kisa ei ole joukkuekisa';
  end if;

  if v_kisa.laskentatapa = 'automaattinen' then
    return query
      with jasentulokset as (
        select
          o.joukkue_id as jt_joukkue_id,
          j.nimi as jt_joukkue_nimi,
          o.kayttaja_id as jt_kayttaja_id,
          p.kayttajanimi as jt_kayttajanimi,
          p.nayttonimi as jt_nayttonimi,
          case
            when v_kisa.joukkuelaskentatapa = 'yhteistulos'
              then sum(case when v_kisa.mittari = 'suurin_kala' then s.paino_kg else 1 end)
            else max(case when v_kisa.mittari = 'suurin_kala' then s.paino_kg else 1 end)
          end as jt_jasen_tulos
        from public.kisa_osallistujat o
        join public.profiilit p on p.id = o.kayttaja_id
        join public.kisa_joukkueet j on j.id = o.joukkue_id
        left join public.saaliit s
          on s.user_id = o.kayttaja_id
          and s.ajankohta >= v_kisa.alkupaiva::timestamptz
          and s.ajankohta < (v_kisa.loppupaiva + 1)::timestamptz
          and (v_kisa.laji is null or s.laji = v_kisa.laji)
        where o.kisa_id = p_kisa_id and o.tila = 'accepted' and o.joukkue_id is not null
        group by o.joukkue_id, j.nimi, o.kayttaja_id, p.kayttajanimi, p.nayttonimi
      )
      select
        jt_joukkue_id,
        jt_joukkue_nimi,
        case
          when v_kisa.joukkuelaskentatapa = 'yhteistulos'
            then sum(jt_jasen_tulos) over (partition by jt_joukkue_id)
          else max(jt_jasen_tulos) over (partition by jt_joukkue_id)
        end as joukkue_tulos,
        jt_kayttaja_id,
        jt_kayttajanimi,
        jt_nayttonimi,
        jt_jasen_tulos
      from jasentulokset
      order by 3 desc nulls last, jt_jasen_tulos desc nulls last;
  else
    return query
      with jasentulokset as (
        select
          o.joukkue_id as jt_joukkue_id,
          j.nimi as jt_joukkue_nimi,
          o.kayttaja_id as jt_kayttaja_id,
          p.kayttajanimi as jt_kayttajanimi,
          p.nayttonimi as jt_nayttonimi,
          case
            when v_kisa.joukkuelaskentatapa = 'yhteistulos'
              then sum(case when v_kisa.mittari = 'suurin_kala' then s.paino_kg else 1 end)
            else max(case when v_kisa.mittari = 'suurin_kala' then s.paino_kg else 1 end)
          end as jt_jasen_tulos
        from public.kisa_osallistujat o
        join public.profiilit p on p.id = o.kayttaja_id
        join public.kisa_joukkueet j on j.id = o.joukkue_id
        left join public.kisa_saaliit ks on ks.kisa_id = p_kisa_id and ks.kayttaja_id = o.kayttaja_id
        left join public.saaliit s on s.id = ks.saalis_id
        where o.kisa_id = p_kisa_id and o.tila = 'accepted' and o.joukkue_id is not null
        group by o.joukkue_id, j.nimi, o.kayttaja_id, p.kayttajanimi, p.nayttonimi
      )
      select
        jt_joukkue_id,
        jt_joukkue_nimi,
        case
          when v_kisa.joukkuelaskentatapa = 'yhteistulos'
            then sum(jt_jasen_tulos) over (partition by jt_joukkue_id)
          else max(jt_jasen_tulos) over (partition by jt_joukkue_id)
        end as joukkue_tulos,
        jt_kayttaja_id,
        jt_kayttajanimi,
        jt_nayttonimi,
        jt_jasen_tulos
      from jasentulokset
      order by 3 desc nulls last, jt_jasen_tulos desc nulls last;
  end if;
end;
$$;

revoke all on function public.kisan_joukkuetulokset(uuid) from public;
grant execute on function public.kisan_joukkuetulokset(uuid) to authenticated;
