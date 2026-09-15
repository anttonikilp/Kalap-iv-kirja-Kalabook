-- Kalapaivakirja: SECURITY DEFINER -funktioiden kovennus (migraatio 6)
-- Aja tama Supabasen SQL Editorissa. Turvallista ajaa uudelleen.
--
-- MIKA MUUTTUU JA MIKSI:
-- Kaikki tietokannan SECURITY DEFINER -funktiot (funktiot jotka ajetaan
-- luojansa - ei kutsujan - oikeuksilla, jotta RLS-kaytannot voivat
-- turvallisesti tarkistaa toisen taulun tietoja ilman aareton silmukka
-- -ongelmaa) kayttivat asetusta "set search_path = public". Tama on
-- Postgresin ja Supabasen oman tietoturvalinterin ("Function Search Path
-- Mutable") mukaan edelleen kaapattavissa: jos joku pystyisi luomaan
-- public-skeemaan haitallisen, samannimisen olion, funktio saattaisi
-- kayttaa sita alkuperaisen sijaan.
--
-- Korjaus: search_path lukitaan tyhjaksi (''). Talloin funktion taytyy
-- viitata kaikkiin tauluihin taydella skeemanimella (esim. public.kisat,
-- auth.uid()) - mika naissa funktioissa jo tehtiinkin - eika mitaan voi
-- enaa "kaapata" search_pathin kautta. Funktioiden logiikka, palautusarvot
-- ja kayttooikeudet (grant/revoke) eivat muutu - vain tama yksi
-- tietoturva-asetus tiukkenee. Kaytannon toiminnallisuudessa (kuka nakee
-- minkakin kisan/reissun/saaliin) ei ole mitaan eroa ennen ja jalkeen.
--
-- 1) Kisojen RLS-korjauksen apufunktiot (migraatio 0005)

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

-- Oikeudet pidetaan mahdollisimman tiukkoina: ei PUBLIC- eika anon-roolille,
-- vain kirjautuneille (RLS-kaytannot suoritetaan aina "authenticated"-
-- roolin oikeuksilla, joten talla roolilla taytyy olla oikeus ajaa nama).
revoke all on function public.onko_kisan_luoja(uuid) from public;
revoke all on function public.onko_kisan_osallistuja(uuid) from public;
revoke all on function public.onko_hyvaksytty_kisaosallistuja(uuid) from public;
grant execute on function public.onko_kisan_luoja(uuid) to authenticated;
grant execute on function public.onko_kisan_osallistuja(uuid) to authenticated;
grant execute on function public.onko_hyvaksytty_kisaosallistuja(uuid) to authenticated;

-- 2) Sama haavoittuvuustyyppi loytyi myos kolmesta aiemmasta (migraatiot
-- 0003 ja 0004) SECURITY DEFINER -funktiosta - kovennetaan nekin samalla
-- yhtenaisyyden ja kokonaisturvallisuuden vuoksi. Nailla ei ole omaa
-- RLS-rekursio-ongelmaa, mutta sama search_path-kaappausriski koski niita.

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

-- 3) Varmistus: RLS-kaytannot jotka kayttavat naita funktioita (migraatio
-- 0005) EIVAT tarvitse muutoksia. Kaytannot viittaavat funktioihin niiden
-- pysyvan tunnisteen kautta, joten "create or replace function" paivittaa
-- funktion sisallon paikallaan - kaytannot alkavat kayttaa kovennettua
-- versiota valittomasti, eika kisojen aareton rekursio -virhe palaa.
