import { useEffect, useState } from 'react'
import { haeReissut } from './tripService.js'
import { haeSaaliit } from '../catches/catchService.js'
import { useTrips } from './TripsContext.jsx'
import TripCard from './TripCard.jsx'

export default function TripsList({ paivitysAvain }) {
  const { reissuPaivitysAvain, aktiivinenReissu, lopetaReissu } = useTrips()
  const [reissut, setReissut] = useState([])
  const [saaliit, setSaaliit] = useState([])
  const [lataa, setLataa] = useState(true)
  const [virhe, setVirhe] = useState('')

  useEffect(() => {
    let peruttu = false
    setLataa(true)

    Promise.all([haeReissut(), haeSaaliit()])
      .then(([reissuData, saalisData]) => {
        if (!peruttu) {
          setReissut(reissuData)
          setSaaliit(saalisData)
        }
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
  }, [paivitysAvain, reissuPaivitysAvain])

  if (lataa) return <p className="tila-teksti">Ladataan reissuja...</p>
  if (virhe) return <p className="lomake-virhe">Virhe: {virhe}</p>
  if (reissut.length === 0) {
    return <p className="tila-teksti">Ei vielä reissuja. Aloita reissu Lisää-välilehdellä!</p>
  }

  return (
    <ul className="trip-list">
      {reissut.map((reissu) => (
        <TripCard
          key={reissu.id}
          reissu={reissu}
          saaliit={saaliit.filter((saalis) => saalis.reissu_id === reissu.id)}
          onLopeta={reissu.id === aktiivinenReissu?.id ? () => lopetaReissu() : null}
        />
      ))}
    </ul>
  )
}
