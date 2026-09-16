import { useRef, useState } from 'react'
import { LAJIT, KALASTUSTAVAT } from './species.js'
import { lisaaSaalis } from './catchService.js'
import { haePaikannimi } from './geocode.js'
import { useTrips } from '../trips/TripsContext.jsx'
import { CameraIcon, MapPinIcon } from '../components/icons.jsx'

function muotoileKoordinaatit(lat, lon) {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

function nytPaikallisena() {
  const nyt = new Date()
  nyt.setMinutes(nyt.getMinutes() - nyt.getTimezoneOffset())
  return nyt.toISOString().slice(0, 16)
}

function tyhjaLomake() {
  return {
    laji: '',
    paino_kg: '',
    pituus_cm: '',
    ajankohta: nytPaikallisena(),
    sijainti_teksti: '',
    viehe: '',
    kalastustapa: '',
    muistiinpanot: '',
  }
}

export default function CatchForm({ onTallennettu }) {
  const { aktiivinenReissu } = useTrips()
  const [lomake, setLomake] = useState(tyhjaLomake)
  const [kuva, setKuva] = useState(null)
  const [kuvaEsikatselu, setKuvaEsikatselu] = useState(null)
  const [tallennetaan, setTallennetaan] = useState(false)
  const [virhe, setVirhe] = useState('')
  const [onnistui, setOnnistui] = useState(false)
  const [haetaanSijaintia, setHaetaanSijaintia] = useState(false)
  const tiedostoInput = useRef(null)

  function paivita(kentta, arvo) {
    setLomake((edellinen) => ({ ...edellinen, [kentta]: arvo }))
  }

  function valitseKuva(e) {
    const tiedosto = e.target.files?.[0]
    if (!tiedosto) return
    setKuva(tiedosto)
    setKuvaEsikatselu(URL.createObjectURL(tiedosto))
  }

  function haeSijainti() {
    if (!navigator.geolocation) {
      setVirhe('Selain ei tue paikannusta. Kirjoita sijainti käsin.')
      return
    }

    setVirhe('')
    setHaetaanSijaintia(true)

    navigator.geolocation.getCurrentPosition(
      async (asema) => {
        const lat = asema.coords.latitude
        const lon = asema.coords.longitude

        try {
          const nimi = await haePaikannimi(lat, lon)
          paivita('sijainti_teksti', nimi || muotoileKoordinaatit(lat, lon))
        } catch {
          paivita('sijainti_teksti', muotoileKoordinaatit(lat, lon))
          setVirhe('Paikannimeä ei saatu - tallennettiin koordinaatit sen sijaan.')
        } finally {
          setHaetaanSijaintia(false)
        }
      },
      () => {
        setVirhe('Sijaintia ei saatu. Voit kirjoittaa sen käsin.')
        setHaetaanSijaintia(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function tallenna(e) {
    e.preventDefault()
    setVirhe('')
    setOnnistui(false)

    if (!lomake.laji) {
      setVirhe('Valitse kalalaji.')
      return
    }

    setTallennetaan(true)

    try {
      const payload = {
        laji: lomake.laji,
        paino_kg: lomake.paino_kg ? Number(lomake.paino_kg) : null,
        pituus_cm: lomake.pituus_cm ? Number(lomake.pituus_cm) : null,
        ajankohta: new Date(lomake.ajankohta).toISOString(),
        sijainti_teksti: lomake.sijainti_teksti || null,
        viehe: lomake.viehe || null,
        kalastustapa: lomake.kalastustapa || null,
        muistiinpanot: lomake.muistiinpanot || null,
        reissu_id: aktiivinenReissu?.id ?? null,
      }

      const uusiSaalis = await lisaaSaalis(payload, kuva)

      setLomake(tyhjaLomake())
      setKuva(null)
      setKuvaEsikatselu(null)
      if (tiedostoInput.current) tiedostoInput.current.value = ''
      setOnnistui(true)
      onTallennettu?.(uusiSaalis)
    } catch (err) {
      setVirhe('Tallennus epäonnistui: ' + err.message)
    } finally {
      setTallennetaan(false)
    }
  }

  return (
    <form className="catch-form" onSubmit={tallenna}>
      <h2>Uusi saalis</h2>

      <div className="laji-valinta">
        {LAJIT.map((laji) => (
          <button
            key={laji.id}
            type="button"
            className={`laji-nappi ${lomake.laji === laji.id ? 'valittu' : ''}`}
            onClick={() => paivita('laji', laji.id)}
          >
            <span className="laji-merkki" aria-hidden="true">
              {laji.nimi.charAt(0)}
            </span>
            <span className="laji-teksti">{laji.nimi}</span>
          </button>
        ))}
      </div>

      <label className="kuva-valinta">
        <CameraIcon size={18} />
        Lisää kuva
        <input
          ref={tiedostoInput}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={valitseKuva}
          hidden
        />
      </label>
      {kuvaEsikatselu && (
        <img src={kuvaEsikatselu} alt="Esikatselu" className="kuva-esikatselu" />
      )}

      <details className="lisatiedot">
        <summary>Lisää tarkempia tietoja (valinnainen)</summary>

        <label>
          Paino (kg)
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={lomake.paino_kg}
            onChange={(e) => paivita('paino_kg', e.target.value)}
          />
        </label>

        <label>
          Pituus (cm)
          <input
            type="number"
            step="1"
            min="0"
            inputMode="decimal"
            value={lomake.pituus_cm}
            onChange={(e) => paivita('pituus_cm', e.target.value)}
          />
        </label>

        <label>
          Ajankohta
          <input
            type="datetime-local"
            value={lomake.ajankohta}
            onChange={(e) => paivita('ajankohta', e.target.value)}
          />
        </label>

        <label>
          Sijainti
          <div className="sijainti-rivi">
            <input
              type="text"
              placeholder="esim. Näsijärvi"
              value={lomake.sijainti_teksti}
              onChange={(e) => paivita('sijainti_teksti', e.target.value)}
            />
            <button type="button" onClick={haeSijainti} disabled={haetaanSijaintia}>
              <MapPinIcon size={16} />
              {haetaanSijaintia ? 'Haetaan…' : 'GPS'}
            </button>
          </div>
        </label>

        <label>
          Viehe
          <input
            type="text"
            placeholder="esim. Rapala Countdown"
            value={lomake.viehe}
            onChange={(e) => paivita('viehe', e.target.value)}
          />
        </label>

        <label>
          Kalastustapa
          <select
            value={lomake.kalastustapa}
            onChange={(e) => paivita('kalastustapa', e.target.value)}
          >
            <option value="">Ei valittu</option>
            {KALASTUSTAVAT.map((tapa) => (
              <option key={tapa.id} value={tapa.id}>
                {tapa.nimi}
              </option>
            ))}
          </select>
        </label>

        <label>
          Muistiinpanot
          <textarea
            rows={3}
            value={lomake.muistiinpanot}
            onChange={(e) => paivita('muistiinpanot', e.target.value)}
          />
        </label>
      </details>

      {virhe && <p className="lomake-virhe">{virhe}</p>}
      {onnistui && <p className="lomake-onnistui">Saalis tallennettu!</p>}

      <button type="submit" className="btn-primary btn-tallenna" disabled={tallennetaan}>
        {tallennetaan ? 'Tallennetaan...' : 'Tallenna saalis'}
      </button>
    </form>
  )
}
