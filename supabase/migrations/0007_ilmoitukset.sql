-- Kalapaivakirja: sovelluksen sisaiset ilmoitukset (migraatio 7)
-- Aja tama Supabasen SQL Editorissa KOKONAISUUDESSAAN yhdella kertaa.
-- Vaatii etta migraatiot 0002-0006 on jo ajettu (kayttaa tauluja
-- profiilit, kaverit, kisat, kisa_osallistujat, kisa_saaliit, saaliit).
-- Koko tiedosto on turvallista ajaa uudelleen.
--
-- HUOM: Tama on VAIN sovelluksen sisainen ilmoitus (nakyy kellokuvakkeen
-- alla sovelluksessa) - ei puhelimen lukitusnaytolle menevaa push-
-- ilmoitusta.

-- 1) Ilmoitukset-taulu
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

-- 2) Vain "luettu"-kenttaa saa muuttaa jalkikateen (ei tekstia, kohdetta tms.)
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

-- 3) Row Level Security: kayttaja nakee ja muokkaa vain omia ilmoituksiaan.
-- HUOM: taalla ei ole INSERT-kaytantoa lainkaan - ilmoituksia ei voi
-- koskaan luoda suoraan asiakassovelluksesta, vain alempana olevat
-- SECURITY DEFINER -triggerit voivat lisata rivin (ne ajetaan taulun
-- omistajan oikeuksilla, joten RLS ei koske niita).
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

-- 4) Ilmoitus: kaveri kirjasi uuden saaliin (ei koskaan sijaintia mukana)
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

-- 5) Ilmoitus: saapui kaveripyynto
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

-- 6) Ilmoitus: kaveripyynto hyvaksyttiin
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

-- 7) Ilmoitus: sinut kutsuttiin kisaan
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

-- 8) Ilmoitus: sinut ohitettiin kisan karjessa (automaattinen-kisat)
-- Vertaa kisan johtajaa juuri ennen ja juuri jalkeen taman saaliin, ja
-- ilmoittaa vain jos aiempi johtaja (jolla oli oikeasti tulosta > 0)
-- vaihtui nimenomaan taman saaliin kirjaajaksi. Yksinkertaistus: jos
-- karjessa on tasapeli, "johtaja" valitaan tulos+kayttaja_id-jarjestyksella
-- - satunnaisissa tasapeleissa ilmoitus ei siis aina osu tarkalleen
-- oikeaan henkiloon, mutta karjen todellinen vaihtuminen havaitaan aina.
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

-- 9) Sama karkipaikka-ilmoitus "ilmoitettava"-kisoille (laukeaa kun saalis
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
