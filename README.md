# Kalapaivakirja

Mobiili edella toimiva kalastuspaivakirja. Kirjaudu sisaan, kirjaa saalis
muutamalla napautuksella ja seuraa omia tilastojasi. Voit niputtaa saaliit
yhteen kalareissuksi, lisata kavereita kayttajanimella ja kilpailla
kavereiden kanssa yksinkertaisissa kisoissa. Tausta on Supabase (tietokanta,
kirjautuminen, kuvien tallennus).

Koodi on jaoteltu omiin kansioihin (`src/auth`, `src/catches`, `src/trips`,
`src/friends`, `src/competitions`, `src/stats`), jotta uusia ominaisuuksia on
helppo lisata myohemmin ilman etta olemassa olevaa koodia tarvitsee purkaa.

## 1. Luo Supabase-projekti

1. Mene osoitteeseen https://supabase.com ja luo ilmainen tili/projekti,
   jos sinulla ei viela ole.
2. Kun projekti on luotu, avaa vasemmalta valikosta **SQL Editor**.

## 2. Aja tietokantaskeema (pakollinen)

### Uusi Supabase-projekti (ei viela mitaan taulua)

1. Avaa tiedosto [`supabase/schema.sql`](supabase/schema.sql) tasta
   repositoriosta.
2. Kopioi **koko** tiedoston sisalto.
3. Liita se Supabasen SQL Editoriin ja paina **Run**.

Tama luo kaiken kerralla: `saaliit`-, `reissut`-, `profiilit`-, `kaverit`-,
`kisat`-, `kisa_osallistujat`- ja `kisa_saaliit`-taulut, RLS-kaytannot,
tulostaulukkofunktion seka `saalis-kuvat`-storage-bucketin.

### Sinulla on jo aiempi asennus

Aja **vain puuttuvat** migraatiot jarjestyksessa kansiosta
`supabase/migrations/`:

1. Jos taulua `reissut` ei viela ole:
   [`0002_reissut.sql`](supabase/migrations/0002_reissut.sql)
2. Jos tauluja `profiilit`/`kaverit` ei viela ole:
   [`0003_kaverit.sql`](supabase/migrations/0003_kaverit.sql)
3. Jos tauluja `kisat`/`kisa_osallistujat`/`kisa_saaliit` ei viela ole:
   [`0004_kisat.sql`](supabase/migrations/0004_kisat.sql)

Avaa tiedosto, kopioi koko sisalto Supabasen SQL Editoriin ja paina **Run**.
Jarjestys on tarkea: `0004_kisat.sql` vaatii etta `0003_kaverit.sql`
(profiilit- ja kaverit-taulut) on jo ajettu.

Kaikki skriptit on turvallista ajaa uudelleen tarvittaessa.

## 3. Hae Supabasen osoite ja avain

1. Avaa Supabase-projektissa **Project Settings -> API**.
2. Kopioi **Project URL** (nayttaa talta: `https://xxxxxxxx.supabase.co`).
3. Kopioi **anon / public** -avain (Supabasen uudemmassa
   kayttoliittymassa tama voi olla nimella "publishable key").

## 4. Aseta ymparistomuuttujat

### Paikallinen kehitys (omalla koneella)

1. Kopioi tiedosto `.env.example` uudella nimella `.env` projektin
   juureen.
2. Taytta arvot:

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=liita-tahan-oma-avaimesi
   ```

3. `.env`-tiedostoa **ei** koskaan commitoida gitiin.

### Tuotanto / julkaisu

Aseta samat kaksi ymparistomuuttujaa hostingpalvelun asetuksista ja
rakenna/deployata sovellus uudelleen sen jalkeen.

## 5. Asenna riippuvuudet ja kaynnista sovellus

```
npm install
npm run dev
```

## 6. Kayttoonotto sovelluksessa

1. Rekisteroidy, vahvista sahkopostisi ja kirjaudu sisaan.
2. Lisaa saaliita, aloita reissuja ja seuraa tilastojasi kuten ennenkin.
3. "Kaverit"-valilehdella valitse kayttajanimi ja lisaa kavereita.
4. "Kisat"-valilehdella:
   - **Luo uusi kisa**: anna nimi, kohde (yksi laji tai kaikki lajit),
     mittari (suurin kala painon mukaan TAI eniten kaloja), laskentatapa
     (Automaattinen tai Ilmoitettavat) seka alku- ja loppupaiva. Sina
     liityt automaattisesti mukaan omaan kisaasi.
   - Avaa luomasi kisa ja **kutsu kavereita** - vain hyvaksytyt kaverisi
     nakyvat kutsuttavina.
   - Kutsutut nakevat kutsun "Saapuneet kisakutsut" -kohdassa ja voivat
     hyvaksya tai hylata sen.
   - "Automaattinen"-kisassa kaikki osallistujan kisa-aikana kirjaamat,
     kohteeseen sopivat saaliit lasketaan mukaan itsestaan.
   - "Ilmoitettavat"-kisassa osallistuja liittaa itse haluamansa saaliit
     kisan sivulta kohdasta "Liita omia saaliita kisaan" (nakyy vain
     kisan ajan omista, kohteeseen sopivista saaliista).
   - Kisan sivulla nakyy tulostaulukko, joka paivittyy valitun mittarin
     mukaan paremmuusjarjestyksessa. Tulostaulukossa nakyy vain
     kayttajanimi/nayttonimi ja tulos - ei sijaintia, kuvia tai muita
     saaliin tietoja.
   - Omat kisat nakyvat ryhmiteltyna: Kaynnissa / Tulevat / Paattyneet.

## Projektin rakenne

```
src/
  main.jsx                  Sovelluksen kaynnistys
  App.jsx                   Valilehdet (Lisaa / Historia / Reissut / Tilastot / Kaverit / Kisat)
  App.css / index.css       Tyylit (mobiili edella)
  lib/
    supabaseClient.js        Supabase-yhteyden alustus ymparistomuuttujista
  auth/                      Kirjautuminen (ei muutettu tassa PR:ssa)
  catches/                   Saaliin lisays ja historia (ei muutettu tassa PR:ssa)
  trips/                     Kalareissut (ei muutettu tassa PR:ssa)
  friends/                   Profiilit ja kaverisuhteet (ei muutettu tassa PR:ssa)
  competitions/
    constants.js              Mittarien ja laskentatapojen vakiot
    dateUtils.js              Paivamaaramuotoilu ja kisan tilan paattely
    competitionService.js     Supabase-kyselyt: kisat, kutsut, osallistujat, tulostaulukko-RPC
    CreateCompetitionForm.jsx Kisan luontilomake
    CompetitionInvites.jsx    Saapuneet kisakutsut (hyvaksy/hylkaa)
    InviteFriendPanel.jsx     Hyvaksyttyjen kavereiden kutsuminen kisaan
    CompetitionList.jsx       Omat kisat ryhmiteltyna (kaynnissa/tulevat/paattyneet)
    CompetitionDetail.jsx     Kisan tiedot, tulostaulukko ja saaliiden liittaminen
    CompetitionsView.jsx      Kisat-valilehden kokoava nakyma
  stats/                     Perustilastot (ei muutettu tassa PR:ssa)
supabase/
  schema.sql                 Koko tietokantarakenne (taulut, RLS-kaytannot, funktiot, storage-bucket)
  migrations/
    0002_reissut.sql
    0003_kaverit.sql
    0004_kisat.sql             Kisat, osallistujat, ilmoitettavat saaliit, tulostaulukko-RPC
```

## Huomioita kisat-ominaisuudesta

- **Tietoturva**: kisan tiedot ja tulostaulukon nakevat vain kisan
  osallistujat. Vain luoja voi muokata/poistaa kisan ja kutsua
  osallistujia. Osallistuja voi liittaa kisaan vain omia saaliitaan, ja
  vain jos on hyvaksytty osallistuja. Tulostaulukko lasketaan tietokannan
  puolella turvallisella funktiolla, joka palauttaa vain kayttajanimen,
  nayttonimen ja lasketun tuloksen - ei koskaan sijaintia, kuvia tai
  muita saaliin yksityiskohtia.
- Koska `catches`-, `trips`-, `friends`-, `stats`- ja `auth`-moduuleja ei
  saanut muuttaa, saaliin liittaminen "ilmoitettavaan" kisaan tehdaan
  kisan omalta sivulta ("Liita omia saaliita kisaan") eika Historia-
  valilehdelta - toiminnallisuus on sama, sijainti sovelluksessa vain
  hieman eri kuin alun perin kuvattu.
- Kisan alku- ja loppupaiva ovat paivan tarkkuudella (ei kellonaikaa),
  mika sopii yksinkertaiseen kisaan.
- Painoa ei vaadita saaliilta (se on aina valinnainen tieto), joten
  "Suurin kala" -mittarilla laskettava kisa nayttaa viivan (-) niille
  osallistujille, joiden saaliille ei ole kirjattu painoa.
- Tama versio kattaa tietoisesti vain yksinkertaisen kisan: ei piste-,
  kausi-, joukkue- eika premium-kisoja. Kisan muokkaus- ja
  poistotoiminnot on valmiina tietoturvassa (RLS), mutta niille ei ole
  viela kayttoliittymaa - ne on helppo lisata myohemmin.
