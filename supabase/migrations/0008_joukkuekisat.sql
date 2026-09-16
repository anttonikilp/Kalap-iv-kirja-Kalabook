-- Kalapaivakirja: joukkuekisat olemassa olevan kisaominaisuuden paalle (migraatio 8)
-- Aja tama Supabasen SQL Editorissa KOKONAISUUDESSAAN yhdella kertaa.
-- Vaatii etta migraatiot 0002-0007 on jo ajettu (kayttaa tauluja kisat,
-- kisa_osallistujat, profiilit, kaverit, saaliit, kisa_saaliit seka
-- apufunktioita onko_kisan_luoja/onko_kisan_osallistuja).
-- Koko tiedosto on turvallista ajaa uudelleen. Nykyiset yksilokisat
-- toimivat tasman ennallaan - tama vain lisaa uuden "joukkue"-kisatyypin.

-- 1) Kisat-tauluun kisatyyppi ja joukkueiden laskentatapa.
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

-- 2) Joukkueet-taulu: joukkue kuuluu tiettyyn kisaan
create table if not exists public.kisa_joukkueet (
  id uuid primary key default gen_random_uuid(),
  kisa_id uuid not null references public.kisat (id) on delete cascade,
  nimi text not null,
  created_at timestamptz not null default now(),
  unique (kisa_id, nimi)
);

create index if not exists kisa_joukkueet_kisa_idx on public.kisa_joukkueet (kisa_id);

-- 3) Osallistuja kuuluu (joukkuekisassa) tasmalleen yhteen joukkueeseen.
-- Nollattavissa (yksilokisoissa aina null, joukkuekisassa null kunnes
-- luoja jakaa osallistujan joukkueeseen).
alter table public.kisa_osallistujat
  add column if not exists joukkue_id uuid references public.kisa_joukkueet (id) on delete set null;

create index if not exists kisa_osallistujat_joukkue_idx on public.kisa_osallistujat (joukkue_id);

-- 4) Joukkuejaon muokkausoikeudet: vain kisan luoja saa muuttaa kenenkaan
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

-- 5) Row Level Security: kisa_joukkueet nakyy kisan luojalle ja
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

-- 6) Laajenna kisa_osallistujat-liittamiskaytantoa: kutsuttaessa saa
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

-- 7) Uusi kaytanto: kisan luoja voi paivittaa kenen tahansa osallistujan
-- joukkue_id:n omassa kisassaan (itse joukkuejaon tekeminen). Trigger
-- (kohta 4) varmistaa ettei tama kaytanto mahdollista tila-kentan
-- muuttamista jonkun toisen puolesta.
drop policy if exists "Luoja hallinnoi joukkuejakoa" on public.kisa_osallistujat;
create policy "Luoja hallinnoi joukkuejakoa"
  on public.kisa_osallistujat for update
  using (public.onko_kisan_luoja(kisa_id))
  with check (public.onko_kisan_luoja(kisa_id));

-- 8) Joukkuekisan tulostaulukko: turvallinen funktio joka laskee
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
