# Kalapaivakirja

Mobiili edella toimiva kalastuspaivakirja. Kirjaudu sisaan, kirjaa saalis
muutamalla napautuksella ja seuraa omia tilastojasi. Voit niputtaa saaliit
yhteen kalareissuksi ja lisata kavereita kayttajanimella. Tausta on Supabase
(tietokanta, kirjautuminen, kuvien tallennus).

Koodi on jaoteltu omiin kansioihin (`src/auth`, `src/catches`, `src/trips`,
`src/friends`, `src/stats`), jotta esim. kisat tai ilmoitukset on helppo
lisata myohemmin ilman etta olemassa olevaa koodia tarvitsee purkaa.

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

Tama luo kaiken kerralla: `saaliit`-, `reissut`-, `profiilit`- ja
`kaverit`-taulut, RLS-kaytannot seka `saalis-kuvat`-storage-bucketin.

### Sinulla on jo aiempi asennus

Aja **vain puuttuvat** migraatiot jarjestyksessa kansiosta
`supabase/migrations/`:

1. Jos taulua `reissut` ei viela ole:
   [`0002_reissut.sql`](supabase/migrations/0002_reissut.sql)
2. Jos taulua `profiilit` tai `kaverit` ei viela ole:
   [`0003_kaverit.sql`](supabase/migrations/0003_kaverit.sql)

Avaa tiedosto, kopioi koko sisalto Supabasen SQL Editoriin ja paina **Run**.
Jarjestys on tarkea, koska `0003_kaverit.sql` viittaa `saaliit`-tauluun,
joka on luotu pohjaskeemassa.

Kaikki skriptit on turvallista ajaa uudelleen tarvittaessa.

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
   VITE_SUPABASE_ANON_KEY=liita-tahan-oma-avaimesi
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
     kayda Supabasessa kohdassa **Authentication -> Providers -> Email**
     ja kytkea "Confirm email" pois paalta (kannattaa ottaa takaisin
     paalle ennen oikeaa julkaisua).
3. Kirjautumisen jalkeen voit heti lisata saaliin: valitse laji ja paina
   "Tallenna saalis". Muut kentat (paino, pituus, sijainti, viehe,
   kalastustapa, kuva, muistiinpanot) loytyvat kohdasta "Lisaa tarkempia
   tietoja" eivatka ole pakollisia.
4. "Lisaa"-valilehden ylaosassa voit aloittaa reissun (paikka on
   valinnainen, aloitusaika kirjataan automaattisesti). Kaynnissa olevan
   reissun aikana lisatyt saaliit liittyvat reissuun automaattisesti.
5. "Historia"-valilehdella nakyvat omat saaliit uusin ensin, pikkukuvan
   kanssa.
6. "Reissut"-valilehdella nakyvat omat reissut uusin ensin koosteineen.
7. "Tilastot"-valilehdella nakyvat saaliiden kokonaismaara, maara
   lajeittain ja suurin saalis (painon mukaan) kutakin lajia kohden.
8. "Kaverit"-valilehdella:
   - Ensimmaisella kaynnilla sovellus pyytaa valitsemaan **kayttajanimen**
     (3-20 merkkia, pienet kirjaimet, numerot tai alaviiva). Kayttajanimi
     nakyy kavereille - sahkopostiosoitetta ei nayteta koskaan kenellekaan.
   - "Lisaa kaveri" -kohtaan kirjoitetaan toisen kayttajan tarkka
     kayttajanimi ja lahetetaan pyynto.
   - "Saapuneet pyynnot" voi hyvaksya tai hylata.
   - "Lahetetyt pyynnot" (odottaa vastausta) voi perua.
   - "Kaverit"-listassa nakyvat hyvaksytyt kaverit, ja kaverin voi poistaa.
   - Tama versio kattaa vain yhteyksien luonnin - kavereiden saaliita tai
     tilastoja ei viela nayteta, eika kisoja ole viela olemassa.

## Projektin rakenne

```
src/
  main.jsx                  Sovelluksen kaynnistys
  App.jsx                   Valilehdet (Lisaa / Historia / Reissut / Tilastot / Kaverit)
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
  trips/
    tripService.js            Supabase-kyselyt: hae reissut/aktiivinen reissu, aloita, lopeta
    TripsContext.jsx          Kaynnissa olevan reissun tilanhallinta (React Context)
    ReissuPalkki.jsx          Aloita/lopeta-reissu-palkki Lisaa-nakymassa
    TripCard.jsx              Yhden reissun koostekortti
    TripsList.jsx             Reissut-valilehden lista
  friends/
    profileService.js         Supabase-kyselyt: oma profiili, kayttajanimen asetus, haku nimella
    friendService.js          Supabase-kyselyt: pyynnot, hyvaksynta, poisto, kaverilista
    UsernameForm.jsx          Kayttajanimen (ja nayttonimien) asetuslomake
    FriendRequestItem.jsx     Yhden kaverin/pyynnon rivi toimintonappeineen
    FriendsView.jsx           Kaverit-valilehden kokoava nakyma
  stats/
    Stats.jsx                 Perustilastot (maara, lajijakauma, ennatykset)
supabase/
  schema.sql                 Koko tietokantarakenne (taulut, RLS-kaytannot, storage-bucket, triggerit)
  migrations/
    0002_reissut.sql          Pelkka reissu-ominaisuuden lisays olemassa olevaan asennukseen
    0003_kaverit.sql          Pelkka profiilit/kaverit-ominaisuuden lisays olemassa olevaan asennukseen
```

Rakenne on tarkoituksella modulaarinen: `auth`, `catches`, `trips`, `friends`
ja `stats` eivat riipu toisistaan enempaa kuin valttamatonta, joten esim.
kisa- tai ilmoitusominaisuudet on helppo lisata omina moduuleinaan
myohemmin koskematta olemassa olevaan koodiin.

## Huomioita

- GPS-nappi ("GPS") pyytaa selaimelta lupaa paikannukseen - selain kysyy
  tahan luvan erikseen. Jos paikannus ei ole kaytossa, sijainnin voi
  kirjoittaa kasin.
- Kuvat tallennetaan julkiseen Storage-bucketiin nimella
  `{kayttajan_id}/....`, mutta vain omistaja voi lisata/muokata/poistaa
  omia kuviaan - tama on toteutettu Storagen RLS-kaytannoilla.
- Kayttajalla voi olla vain yksi kaynnissa oleva reissu kerrallaan
  (tietokantatasolla varmistettu), mutta reissuja voi olla loputon maara
  ja saaliin voi aina lisata myos ilman reissua.
- Jokaiselle kayttajalle luodaan profiilirivi automaattisesti
  (tietokantatrigger), mutta kayttajanimi jaa tyhjaksi kunnes kayttaja
  valitsee sen itse Kaverit-valilehdella.
- Profiileista on julkisesti (kirjautuneille) luettavissa vain
  kayttajanimi ja nayttonimi - sahkopostiosoitetta ei tallenneta eika
  koskaan nayteta muille kayttajille.
- Kaveripyynto voidaan lahettaa vain kerran samalle parille suuntaan tai
  toiseen (tietokantatasolla varmistettu uniikilla indeksilla), ja vain
  pyynnon vastaanottaja voi hyvaksya sen.
- Kaverit, kisat ja ilmoitukset on jatetty tarkoituksella pois (kaverit-
  ominaisuudesta on toteutettu tassa vaiheessa vain yhteyksien luonti) -
  ne on helppo lisata myohemmin omina moduuleinaan.
