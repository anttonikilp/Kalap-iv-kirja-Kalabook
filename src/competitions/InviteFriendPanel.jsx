import { useEffect, useState } from 'react'
import * as friendService from '../friends/friendService.js'
import FriendRequestItem from '../friends/FriendRequestItem.jsx'
import { kutsuKaveri } from './competitionService.js'

export default function InviteFriendPanel({ kisaId, osallistujat, onKutsuttu }) {
  const [kaverit, setKaverit] = useState([])
  const [lataa, setLataa] = useState(true)
  const [virhe, setVirhe] = useState('')

  useEffect(() => {
    let peruttu = false

    friendService
      .haeKaverit()
      .then((data) => {
        if (!peruttu) setKaverit(data)
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
  }, [])

  if (lataa) return <p className="tila-teksti">Ladataan kavereita...</p>
  if (virhe) return <p className="lomake-virhe">Virhe: {virhe}</p>

  const mukanaOlevat = new Set(osallistujat.map((o) => o.kayttaja_id))
  const kutsuttavissa = kaverit.filter((k) => !mukanaOlevat.has(k.profiili.id))

  if (kutsuttavissa.length === 0) {
    return <p className="tila-teksti">Kaikki kaverisi ovat jo mukana tai kutsuttuina.</p>
  }

  return (
    <ul className="friend-list">
      {kutsuttavissa.map((kaveri) => (
        <FriendRequestItem
          key={kaveri.id}
          profiili={kaveri.profiili}
          ensisijainenTeksti="Kutsu"
          ensisijainenToiminto={async () => {
            await kutsuKaveri(kisaId, kaveri.profiili.id)
            onKutsuttu()
          }}
        />
      ))}
    </ul>
  )
}
