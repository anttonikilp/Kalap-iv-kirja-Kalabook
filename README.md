# Kalapaivakirja

Mobiili edella toimiva kalastuspaivakirja. Kirjaudu sisaan, kirjaa saalis
muutamalla napautuksella ja seuraa omia tilastojasi. Tausta on Supabase
(tietokanta, kirjautuminen, kuvien tallennus).

Tama on ensimmainen versio (ydin): kirjautuminen, saaliin lisays, oma
historia ja perustilastot. Koodi on jaoteltu omiin kansioihin
(`src/auth`, `src/catches`, `src/stats`), jotta esim. kaverit, kisat tai
ilmoitukset on helppo lisata myohemmin ilman etta olemassa olevaa koodia
tarvitsee purkaa.

## 1. Luo Supabase-projekti

1. Mene osoitteeseen https://supabase.com ja luo ilmainen tili/projekti,
   jos sinulla ei viela ole.
2. Kun projekti on luotu, avaa vasemmalta valikosta **SQL Editor**.

## 2. Aja tietokantaskeema (pakollinen)

1. Avaa tiedosto [`supabase/schema.sql`](supabase/schema.sql) tasta
   repositoriosta.
2. Kopioi **koko** tiedoston sisalto.
3. Liita se Supabasen SQL Editoriin ja paina **Run**.

Tama luo:

- `saaliit`-taulun, johon kalasaaliit tallennetaan.
- Row Level Security (RLS) -kaytannot, jotka varmistavat etta jokainen
  kayttaja nakee ja voi muokata **vain omia** saaliitaan.
- `saalis-kuvat`-nimisen Storage-bucketin saaliskuvia varten, seka
  kaytannot jotka sallivat kayttajan ladata/muokata/poistaa vain omia
  kuviaan (kuvien katselu on julkista, jotta kuvat voidaan nayttaa
  suoraan sovelluksessa).

Voit ajaa skriptin turvallisesti uudelleen (esim. jos teet muutoksia) -
se ei riko olemassa olevaa dataa.

## 3. Hae Supabasen osoite ja avain

1. Avaa Supabase-projektissa **Project Settings -> API**.
2. Kopioi **Project URL** (nayttaa talta: `https://xxxxxxxx.supabase.co`).
3. Kopioi **anon / public** -avain (Supabasen uudemmassa
   kayttoliittymassa tama voi olla nimella "publishable key"). Tama
   avain on tarkoitettu kaytettavaksi selaimessa, joten sen paljastuminen
   ei ole tietoturvaongelma - tietoturva tulee RLS-kaytannoista.

## 4. Aseta ymparistomuuttujat

### Paikallinen kehitys (omalla koneella)

1. Kopioi tiedosto `.env.example` uudella nimella `.env` projektin
   juureen.
2. Taytta arvot:

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=liitä-tahan-oma-avaimesi
   ```

3. `.env`-tiedostoa **ei** koskaan commitoida gitiin (se on jo
   `.gitignore`-tiedostossa) - avaimet pysyvat vain omalla koneellasi.

### Tuotanto / julkaisu (esim. Vercel, Netlify tai muu hosting)

Aseta samat kaksi ymparistomuuttujaa hostingpalvelun asetuksista
(esim. Vercelissa: Project Settings -> Environment Variables):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Muista rakentaa/deployata sovellus uudelleen muuttujien lisaamisen
jalkeen.

## 5. Asenna riippuvuudet ja kaynnista sovellus

Vaaditaan [Node.js](https://nodejs.org/) (versio 18 tai uudempi).

```
npm install
npm run dev
```

Avaa selaimessa osoite, jonka komento tulostaa (yleensa
`http://localhost:5173`).

Muita komentoja:

- `npm run build` - luo tuotantoversion `dist/`-kansioon.
- `npm run preview` - nayttaa build-version paikallisesti.

## 6. Kayttoonotto sovelluksessa

1. Avaa sovellus selaimessa ja rekisteroidy sahkopostilla ja salasanalla.
2. Supabase lahettaa oletuksena vahvistussahkopostin - vahvista tili
   linkista ja kirjaudu sisaan.
   - Jos haluat testata nopeammin ilman sahkopostivahvistusta, voit
     kaydä Supabasessa kohdassa **Authentication -> Providers -> Email**
     ja kytkea "Confirm email" pois paalta (kannattaa ottaa takaisin
     paalle ennen oikeaa julkaisua).
3. Kirjautumisen jalkeen voit heti lisata saaliin: valitse laji ja paina
   "Tallenna saalis". Muut kentat (paino, pituus, sijainti, viehe,
   kalastustapa, kuva, muistiinpanot) loytyvat kohdasta "Lisaa tarkempia
   tietoja" eivatka ole pakollisia.
4. "Historia"-valilehdella nakyvat omat saaliit uusin ensin, pikkukuvan
   kanssa.
5. "Tilastot"-valilehdella nakyvat saaliiden kokonaismaara, maara
   lajeittain ja suurin saalis (painon mukaan) kutakin lajia kohden.

## Projektin rakenne

```
src/
  main.jsx                  Sovelluksen kaynnistys
  App.jsx                   Valilehdet (Lisaa / Historia / Tilastot) + kirjautumisen tarkistus
  App.css / index.css       Tyylit (mobiili edella)
  lib/
    supabaseClient.js        Supabase-yhteyden alustus ymparistomuuttujista
  auth/
    AuthContext.jsx          Kirjautumistilan hallinta (React Context)
    AuthPage.jsx             Kirjautumis- ja rekisterointilomake
  catches/
    species.js               Lajit ja kalastustavat vakioina
    catchService.js          Supabase-kyselyt: hae, lisaa, poista saalis + kuvan lataus
    CatchForm.jsx             Nopea lomake uuden saaliin lisaamiseen
    CatchList.jsx             Oma saalishistoria pikkukuvineen
  stats/
    Stats.jsx                 Perustilastot (maara, lajijakauma, ennatykset)
supabase/
  schema.sql                 Tietokantataulu, RLS-kaytannot ja storage-bucket
```

Rakenne on tarkoituksella modulaarinen: `auth`, `catches` ja `stats` eivat
riipu toisistaan enempaa kuin valttamatonta, joten esim. kaverit-, kisa-,
ilmoitus- tai tekoalyominaisuudet on helppo lisata omina moduuleinaan
myohemmin koskematta olemassa olevaan koodiin.

## Huomioita

- GPS-nappi ("Kirjaa sijaintini") pyytaa selaimelta lupaa paikannukseen -
  selain kysyy tahan luvan erikseen. Jos paikannus ei ole kaytossa,
  sijainnin voi kirjoittaa kasin.
- Kuvat tallennetaan julkiseen Storage-bucketiin nimella
  `{kayttajan_id}/....`, mutta vain omistaja voi lisata/muokata/poistaa
  omia kuviaan - tama on toteutettu Storagen RLS-kaytannoilla.
- Tama versio kattaa tietoisesti vain ytimen: kirjautuminen, saaliin
  lisays, historia ja perustilastot. Kaverit, kisat, ilmoitukset ja
  tekoaly on jatetty tarkoituksella pois - ne on helppo lisata
  myohemmin omina moduuleinaan.
