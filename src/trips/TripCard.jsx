import { useState } from 'react'
import { lajinNimi } from '../catches/species.js'
import { ClockIcon, FishIcon, MedalIcon } from '../components/icons.jsx'

export default function TripCard({ reissu, saaliit, onLopeta }) {
  const [kasitellaan, setKasitellaan] = useState(false)
  const [virhe, setVirhe] = useState('')

  const maaraLajeittain = {}
  let suurin = null
  const vieheet = new Set()

  for (const saalis of saaliit) {
    maaraLajeittain[saalis.laji] = (maaraLajeittain[saalis.laji] ?? 0) + 1

    if (saalis.paino_kg != null && (suurin == null || saalis.paino_kg > suurin.paino_kg)) {
      suurin = saalis
    }

    if (saalis.viehe) vieheet.add(saalis.viehe)
  }

  const kaynnissa = !reissu.lopetusaika

  async function kasitteleLopetus() {
    setVirhe('')
    setKasitellaan(true)

    try {
      await onLopeta()
    } catch (err) {
      setVirhe('Reissun lopetus epäonnistui: ' + err.message)
    } finally {
      setKasitellaan(false)
    }
  }

  return (
    <li className="trip-card">
      <div className="trip-card-header">
        <div>
          <strong>{reissu.paikka || 'Reissu ilman paikkaa'}</strong>
          <span className="trip-card-paivamaara">{muotoilePaiva(reissu.aloitusaika)}</span>
        </div>
        {kaynnissa && <span className="trip-badge">Käynnissä</span>}
      </div>

      <div className="trip-card-rivi">
        <span>
          <ClockIcon size={14} />
          {muotoileKesto(reissu.aloitusaika, reissu.lopetusaika)}
        </span>
        <span>
          <FishIcon size={14} />
          {saaliit.length} saalista
        </span>
      </div>

      {Object.keys(maaraLajeittain).length > 0 && (
        <div className="trip-card-rivi trip-card-lajit">
          {Object.entries(maaraLajeittain).map(([laji, maara]) => (
            <span key={laji} className="trip-tag">
              {lajinNimi(laji)} {maara}
            </span>
          ))}
        </div>
      )}

      {suurin && (
        <div className="trip-card-rivi">
          <span>
            <MedalIcon size={14} />
            Suurin: {lajinNimi(suurin.laji)} {suurin.paino_kg} kg
          </span>
        </div>
      )}

      {vieheet.size > 0 && (
        <div className="trip-card-rivi">
          <span>Vieheet: {Array.from(vieheet).join(', ')}</span>
        </div>
      )}

      {reissu.muistiinpanot && <p className="trip-card-muistiinpanot">{reissu.muistiinpanot}</p>}

      {onLopeta && (
        <>
          <button
            type="button"
            className="trip-lopeta-nappi"
            onClick={kasitteleLopetus}
            disabled={kasitellaan}
          >
            {kasitellaan ? 'Hetki...' : 'Lopeta reissu'}
          </button>
          {virhe && <p className="lomake-virhe">{virhe}</p>}
        </>
      )}
    </li>
  )
}

function muotoilePaiva(iso) {
  return new Date(iso).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function muotoileKesto(alku, loppu) {
  const alkuAika = new Date(alku).getTime()
  const loppuAika = loppu ? new Date(loppu).getTime() : Date.now()
  const minuutit = Math.max(0, Math.round((loppuAika - alkuAika) / 60000))

  if (minuutit < 60) return `${minuutit} min`

  const tunnit = Math.floor(minuutit / 60)
  const loputMinuutit = minuutit % 60
  return loputMinuutit === 0 ? `${tunnit} h` : `${tunnit} h ${loputMinuutit} min`
}
