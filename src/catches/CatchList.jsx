import { useEffect, useState } from 'react'
import { haeSaaliit } from './catchService.js'
import { lajinNimi } from './species.js'

export default function CatchList({ paivitysAvain }) {
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

  if (lataa) return <p className="tila-teksti">Ladataan saaliita...</p>
  if (virhe) return <p className="lomake-virhe">Virhe: {virhe}</p>
  if (saaliit.length === 0) {
    return <p className="tila-teksti">Ei vielä saaliita. Lisää ensimmäinen saaliisi!</p>
  }

  return (
    <ul className="catch-list">
      {saaliit.map((saalis) => (
        <li key={saalis.id} className="catch-item">
          {saalis.kuva_url ? (
            <img src={saalis.kuva_url} alt={saalis.laji} className="catch-thumb" />
          ) : (
            <div className="catch-thumb catch-thumb-placeholder">-</div>
          )}
          <div className="catch-item-tiedot">
            <strong>{lajinNimi(saalis.laji)}</strong>
            <span>{muotoilePaivamaara(saalis.ajankohta)}</span>
            <span className="catch-item-mitat">
              {saalis.paino_kg ? `${saalis.paino_kg} kg` : ''}
              {saalis.paino_kg && saalis.pituus_cm ? ' - ' : ''}
              {saalis.pituus_cm ? `${saalis.pituus_cm} cm` : ''}
            </span>
            {saalis.sijainti_teksti && <span>{saalis.sijainti_teksti}</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function muotoilePaivamaara(iso) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
