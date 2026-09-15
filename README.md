# Kalapaivakirja

Mobiili edella toimiva kalastuspaivakirja. Kirjaudu sisaan, kirjaa saalis
muutamalla napautuksella ja seuraa omia tilastojasi. Voit niputtaa saaliit
yhteen kalareissuksi, lisata kavereita kayttajanimella, kilpailla
kavereiden kanssa yksinkertaisissa kisoissa ja saat sovelluksen sisaisia
ilmoituksia tarkeista tapahtumista. Tausta on Supabase (tietokanta,
kirjautuminen, kuvien tallennus).

Koodi on jaoteltu omiin kansioihin (`src/auth`, `src/catches`, `src/trips`,
`src/friends`, `src/competitions`, `src/stats`, `src/notifications`), jotta
uusia ominaisuuksia on helppo lisata myohemmin ilman etta olemassa olevaa
koodia tarvitsee purkaa.

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

Tama luo kaiken kerralla valmiiksi korjattuna ja koventettuna: `saaliit`-,
`reissut`-, `profiilit`-, `kaverit`-, `kisat`-, `kisa_osallistujat`-,
`kisa_saaliit`- ja `ilmoitukset`-taulut, RLS-kaytannot, apufunktiot,
tulostaulukkofunktion, ilmoitusten luontitriggerit seka
`saalis-kuvat`-storage-bucketin.

### Sinulla on jo aiempi asennus

Aja **vain puuttuvat** migraatiot jarjestyksessa kansiosta
`supabase/migrations/`:

1. Jos taulua `reissut` ei viela ole:
   [`0002_reissut.sql`](supabase/migrations/0002_reissut.sql)
2. Jos tauluja `profiilit`/`kaverit` ei viela ole:
   [`0003_kaverit.sql`](supabase/migrations/0003_kaverit.sql)
3. Jos tauluja `kisat`/`kisa_osallistujat`/`kisa_saaliit` ei viela ole:
   [`0004_kisat.sql`](supabase/migrations/0004_kisat.sql)
4. Jos kisan luonti antaa virheen "infinite recursion detected in policy
   for relation kisat":
   [`0005_kisat_rls_korjaus.sql`](supabase/migrations/0005_kisat_rls_korjaus.sql)
5. Aja aina viimeiseksi ennen ilmoituksia (kovensi migraation 0005
   apufunktiot):
   [`0006_kovenna_security_definer.sql`](supabase/migrations/0006_kovenna_security_definer.sql)
6. Jos taulua `ilmoitukset` ei viela ole (sovelluksen sisaiset
   ilmoitukset, kellokuvake ylapalkissa):
   [`0007_ilmoitukset.sql`](supabase/migrations/0007_ilmoitukset.sql)

Avaa tiedosto, kopioi koko sisalto Supabasen SQL Editoriin ja paina **Run**.
Jarjestys on tarkea: `0004_kisat.sql` vaatii etta `0003_kaverit.sql`
(profiilit- ja kaverit-taulut) on jo ajettu, `0005` vaatii etta `0004` on
ajettu, `0006` vaatii etta `0005` on ajettu (se kovensi samat funktiot), ja
`0007_ilmoitukset.sql` vaatii etta `0002`-`0006` on jo ajettu (se kayttaa
tauluja `profiilit`, `kaverit`, `kisat`, `kisa_osallistujat`, `kisa_saaliit`
ja `saaliit`).

Jos olet ajanut vasta `0004_kisat.sql`:n etka viela `0005`:tta, voit ajaa
suoraan `0006_kovenna_security_definer.sql`:n heti `0005`:n jalkeen - se ei
vaadi mitaan valissa.

Kaikki skriptit on turvallista ajaa uudelleen tarvittaessa.

## 3. Hae Supabasen osoite ja avain

1. Avaa Supabase-projektissa **Project Settings -> API**.
2. Kopioi **Project URL** (nayttaa talta: `https://xxxxxxxx.supabase.co`).
3. Kopioi **anon / public** -avain (Supabasen uudemmassa
   kayttoliittymasta tama voi olla nimella "publishable key").

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
5. Ylapalkin **kellokuvake** nayttaa lukemattomien ilmoitusten maaran.
   Painamalla kelloa avautuu lista tuoreimmista ilmoituksista (lukemattomat
   ensin, sitten "Aiemmat"). Ilmoitusta painamalla se merkitaan luetuksi ja
   tarvittaessa siirryt liittyvalle valilehdelle (esim. kaveripyynto ->
   Kaverit-valilehti, kisatapahtuma -> Kisat-valilehti). "Merkitse kaikki
   luetuiksi" nakyy vain kun lukemattomia on.

## Projektin rakenne

```
src/
  main.jsx                  Sovelluksen kaynnistys
  App.jsx                   Valilehdet (Lisaa / Historia / Reissut / Tilastot / Kaverit / Kisat)
  App.css / index.css       Tyylit (mobiili edella)
  lib/
    supabaseClient.js        Supabase-yhteyden alustus ymparistomuuttujista
  auth/                      Kirjautuminen
  catches/                   Saaliin lisays ja historia
  trips/                     Kalareissut
  friends/                   Profiilit ja kaverisuhteet
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
  stats/                     Perustilastot
  notifications/
    notificationService.js    Supabase-kyselyt: ilmoitusten haku, lukemattomien maara, luetuksi merkitseminen
    NotificationBell.jsx      Ylapalkin kellokuvake ja lukemattomien maaran paivitys
    NotificationPanel.jsx     Avautuva ilmoituslista (lukemattomat/luetut)
supabase/
  schema.sql                 Koko tietokantarakenne (taulut, RLS-kaytannot, funktiot, storage-bucket)
  migrations/
    0002_reissut.sql
    0003_kaverit.sql
    0004_kisat.sql                    Kisat, osallistujat, ilmoitettavat saaliit, tulostaulukko-RPC
    0005_kisat_rls_korjaus.sql        Korjaa kisojen RLS-kaytantojen aareton rekursio
    0006_kovenna_security_definer.sql Lukitsee SECURITY DEFINER -funktioiden search_path-asetukset
    0007_ilmoitukset.sql              Sovelluksen sisaiset ilmoitukset: taulu, RLS ja luontitriggerit
```

## Huomioita kisat-ominaisuudesta

- **Tietoturva**: kisan tiedot ja tulostaulukon nakevat vain kisan
  osallistujat. Vain luoja voi muokata/poistaa kisan ja kutsua
  osallistujia. Osallistuja voi liittaa kisaan vain omia saaliitaan, ja
  vain jos on hyvaksytty osallistuja. Tulostaulukko lasketaan tietokannan
  puolella turvallisella funktiolla, joka palauttaa vain kayttajanimen,
  nayttonimen ja lasketun tuloksen - ei koskaan sijaintia, kuvia tai
  muita saaliin yksityiskohtia.
- Kisojen ja niiden osallistujien nakyvyys tarkistetaan kolmen pienen
  apufunktion kautta (`onko_kisan_luoja`, `onko_kisan_osallistuja`,
  `onko_hyvaksytty_kisaosallistuja`), jotka valttavat RLS-kaytantojen
  aarettoman rekursion. Funktiot palauttavat vain tosi/epatosi, eivat
  koskaan rividataa, niiden search_path on lukittu tyhjaksi (ei voi
  kaapata) ja niita saa suorittaa vain kirjautunut kayttaja.
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

## Huomioita ilmoitukset-ominaisuudesta

- **Tietoturva**: `ilmoitukset`-taululla ei ole lainkaan
  INSERT-kaytantoa, joten kayttaja ei voi koskaan luoda ilmoituksia
  suoraan itselleen tai muille - ainoastaan viisi tarkasti rajattua
  SECURITY DEFINER -triggeria (kaverin saalis, kaveripyynto saapui,
  kaveripyynto hyvaksyttiin, kisakutsu, karkipaikan ohitus) voivat lisata
  rivin, ja niidenkin search_path on lukittu tyhjaksi migraation 0006
  tapaan. Kayttaja nakee, merkitsee luetuksi ja poistaa vain omat
  ilmoituksensa. Erillinen trigger estaa myos jalkikateen muuttamasta
  mitaan muuta kuin `luettu`-kenttaa.
- **Yksityisyys**: ilmoitustekstit eivat koskaan sisalla tarkkaa
  sijaintia - vain esim. lajin ja tekijan nimen.
- Kelloa paivitetaan kevyella 45 sekunnin valein tapahtuvalla kyselylla
  (ei Supabase Realtime -tilausta), mika riittaa "sovelluksen sisaiselle"
  ilmoitukselle ilman lisamonimutkaisuutta.
- "Kaveri kirjasi uuden saaliin" -ilmoitusta painamalla ei viela avaudu
  omaa nakymaa, koska sovelluksessa ei ylipaataan viela ole nakymaa
  kaverin yksittaisille saaliille (kaverit-ominaisuus rajattiin
  tietoisesti vain yhteyksien luontiin) - ilmoitus vain merkitaan
  luetuksi. Muut ilmoitustyypit vievat Kaverit- tai Kisat-valilehdelle.
- "Kilpailussa joku ohitti sinut karjessa" -tunnistus vertaa johtajaa
  juuri ennen ja juuri jalkeen uuden saaliin. Jos karjessa on tasapeli,
  "johtaja" valitaan tulos- ja kayttaja-id-jarjestyksella, joten
  satunnaisissa tasapeleissa ilmoitus ei aina osu tarkalleen oikeaan
  henkiloon - karjen todellinen vaihtuminen kuitenkin havaitaan aina.
