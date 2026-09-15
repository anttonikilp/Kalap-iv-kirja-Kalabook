import { useEffect, useState } from 'react'
import { haeOmaProfiili } from '../friends/profileService.js'
import CatchList from '../catches/CatchList.jsx'
import TripsList from '../trips/TripsList.jsx'
import Stats from '../stats/Stats.jsx'
import { ListIcon, CompassIcon, ChartIcon, UserIcon } from '../components/icons.jsx'

const OSIOT = [
  { id: 'historia', nimi: 'Historia', Ikoni: ListIcon },
  { id: 'reissut', nimi: 'Reissut', Ikoni: CompassIcon },
  { id: 'tilastot', nimi: 'Tilastot', Ikoni: ChartIcon },
]

/**
 * Kokoaa Historia-, Reissut- ja Tilastot-nakymat yhdeksi Profiili-
 * valilehdeksi. Itse nakymat (CatchList/TripsList/Stats) ovat taysin
 * ennallaan - tama on vain kevyt kehys ja segmenttivalitsin niiden
 * ymparilla.
 */
export default function ProfileView({ paivitysAvain, osio, onOsioChange }) {
  const [profiili, setProfiili] = useState(null)

  useEffect(() => {
    let peruttu = false

    haeOmaProfiili()
      .then((data) => {
        if (!peruttu) setProfiili(data)
      })
      .catch(() => {})

    return () => {
      peruttu = true
    }
  }, [])

  const nimi = profiili?.nayttonimi || (profiili?.kayttajanimi ? `@${profiili.kayttajanimi}` : 'Profiili')

  return (
    <div className="profiili-view">
      <div className="profiili-otsikko">
        <span className="profiili-avatar">
          <UserIcon size={22} />
        </span>
        <div>
          <h2>{nimi}</h2>
          {profiili?.nayttonimi && profiili?.kayttajanimi && (
            <p className="profiili-kayttajanimi">@{profiili.kayttajanimi}</p>
          )}
        </div>
      </div>

      <div className="profiili-segmentit" role="tablist">
        {OSIOT.map(({ id, nimi: osioNimi, Ikoni }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={osio === id}
            className={osio === id ? 'aktiivinen' : ''}
            onClick={() => onOsioChange(id)}
          >
            <Ikoni size={16} />
            {osioNimi}
          </button>
        ))}
      </div>

      <div className="profiili-sisalto">
        {osio === 'historia' && <CatchList paivitysAvain={paivitysAvain} />}
        {osio === 'reissut' && <TripsList paivitysAvain={paivitysAvain} />}
        {osio === 'tilastot' && <Stats paivitysAvain={paivitysAvain} />}
      </div>
    </div>
  )
}
