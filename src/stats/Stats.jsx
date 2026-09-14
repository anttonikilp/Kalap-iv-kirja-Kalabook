import { useEffect, useState } from 'react'
import { haeSaaliit } from '../catches/catchService.js'
import { lajinNimi } from '../catches/species.js'
import { ChartIcon, FishIcon, MedalIcon } from '../components/icons.jsx'

export default function Stats({ paivitysAvain }) {
  const [saaliit, setSaaliit] = useState([])
  const [lataa, setLataa] = useState(true)
  const [virhe, setVirhe] = useState('')

  useEffect(() => {
    let peruttu = false
    setLataa(true)

    haeSaaliit()
      .then((data) => {
        if (!peruttu) setSaaliit(data)
      })
      .catch((err) => {
        if (!peruttu) setVirhe(err.message)
      })
      .finally(() => {
        if (!peruttu) setLataa(false)
      })

    return () => {
      peruttu = true
    }
  }, [paivitysAvain])

  if (lataa) return <p className="tila-teksti">Lasketaan tilastoja...</p>
  if (virhe) return <p className="lomake-virhe">Virhe: {virhe}</p>
  if (saaliit.length === 0) {
    return (
      <div className="tyhja-tila">
        <ChartIcon size={28} />
        <p>Ei vielä tilastoja - lisää ensin saaliita.</p>
      </div>
    )
  }

  const maaraLajeittain = {}
  const suurinLajeittain = {}

  for (const saalis of saaliit) {
    maaraLajeittain[saalis.laji] = (maaraLajeittain[saalis.laji] ?? 0) + 1

    if (
      saalis.paino_kg != null &&
      (suurinLajeittain[saalis.laji] == null ||
        saalis.paino_kg > suurinLajeittain[saalis.laji].paino_kg)
    ) {
      suurinLajeittain[saalis.laji] = saalis
    }
  }

  return (
    <div className="stats">
      <h2>Tilastot</h2>

      <div className="stats-kortti">
        <FishIcon size={22} />
        <span className="stats-luku">{saaliit.length}</span>
        <span>saalista yhteensä</span>
      </div>

      <h3>Määrä lajeittain</h3>
      <ul className="stats-lista">
        {Object.entries(maaraLajeittain)
          .sort((a, b) => b[1] - a[1])
          .map(([laji, maara]) => (
            <li key={laji}>
              <span>{lajinNimi(laji)}</span>
              <span>{maara} kpl</span>
            </li>
          ))}
      </ul>

      <h3>Suurin saalis lajeittain (paino)</h3>
      {Object.keys(suurinLajeittain).length === 0 ? (
        <p className="tila-teksti-pieni">
          <MedalIcon size={14} />
          Lisää paino saaliille nähdäksesi ennätykset.
        </p>
      ) : (
        <ul className="stats-lista">
          {Object.entries(suurinLajeittain).map(([laji, saalis]) => (
            <li key={laji}>
              <span>{lajinNimi(laji)}</span>
              <span>{saalis.paino_kg} kg</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
