-- Kalapaivakirja: kisat-ominaisuus (migraatio 4)
-- Aja tama Supabasen SQL Editorissa KOKONAISUUDESSAAN yhdella kertaa
-- (osiot 1-6 tassa jarjestyksessa). Vaatii etta migraatiot 0002 ja 0003
-- on ajettu ensin (reissut ja profiilit/kaverit).
-- Koko tiedosto on turvallista ajaa uudelleen.

-- 1) Kisat-taulu
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

-- 2) Osallistujat (kutsut + hyvaksynnat)
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

-- 3) Ilmoitettavat saaliit (kaytetaan vain kun kisan laskentatapa = 'ilmoitettava')
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

-- 4) Luoja liittyy automaattisesti hyvaksyttyna osallistujana omaan kisaansa
create or replace function public.lisaa_luoja_osallistujaksi()
returns trigger
language plpgsql
security definer
set search_path = public
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

-- Estaa kisa_id/kayttaja_id-kenttien vaihtamisen jalkikateen (esim. hyvaksynnan yhteydessa)
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

-- 5) Row Level Security
alter table public.kisat enable row level security;

drop policy if exists "Osallistujat nakevat kisan" on public.kisat;
create policy "Osallistujat nakevat kisan"
  on public.kisat for select
  using (
    auth.uid() = luoja_id
    or exists (
      select 1 from public.kisa_osallistujat o
      where o.kisa_id = kisat.id and o.kayttaja_id = auth.uid()
    )
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
    or exists (
      select 1 from public.kisat k
      where k.id = kisa_osallistujat.kisa_id and k.luoja_id = auth.uid()
    )
  );

drop policy if exists "Luoja kutsuu hyvaksytyn kaverin" on public.kisa_osallistujat;
create policy "Luoja kutsuu hyvaksytyn kaverin"
  on public.kisa_osallistujat for insert
  with check (
    tila = 'pending'
    and exists (
      select 1 from public.kisat k
      where k.id = kisa_osallistujat.kisa_id and k.luoja_id = auth.uid()
    )
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
    and exists (
      select 1 from public.kisa_osallistujat o
      where o.kisa_id = kisa_saaliit.kisa_id and o.kayttaja_id = auth.uid() and o.tila = 'accepted'
    )
    and exists (
      select 1 from public.kisat k
      where k.id = kisa_saaliit.kisa_id and k.laskentatapa = 'ilmoitettava'
    )
  );

drop policy if exists "Kayttaja irrottaa oman kisaliitoksensa" on public.kisa_saaliit;
create policy "Kayttaja irrottaa oman kisaliitoksensa"
  on public.kisa_saaliit for delete
  using (auth.uid() = kayttaja_id);

-- 6) Tulostaulukko: turvallinen funktio, joka laskee tulokset kaikkien
-- hyvaksyttyjen osallistujien saaliista (ohittaa saaliit-taulun RLS:n vain
-- taman yhden, tarkasti rajatun kisan sisalla) ja palauttaa vain
-- kayttajanimen, nayttonimen ja lasketun tuloksen - ei sijaintia, kuvia
-- tai muita saaliin yksityiskohtia.
create or replace function public.kisan_tulostaulukko(p_kisa_id uuid)
returns table (
  kayttaja_id uuid,
  kayttajanimi text,
  nayttonimi text,
  tulos numeric
)
language plpgsql
security definer
set search_path = public
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
