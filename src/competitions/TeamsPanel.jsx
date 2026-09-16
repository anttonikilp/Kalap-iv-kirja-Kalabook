import { useEffect, useState } from 'react'
import * as friendService from '../friends/friendService.js'
import * as competitionService from './competitionService.js'
import { PlusIcon, UsersIcon } from '../components/icons.jsx'

/**
 * Kisan luojan joukkuehallinta: joukkueiden luonti, kavereiden kutsuminen
 * niihin seka oma liittyminen joukkueeseen (luoja lisataan kisaan
 * automaattisesti, mutta ilman joukkuetta, kunnes han valitsee sellaisen).
 */
export default function TeamsPanel({ kisaId, osallistujat, joukkueet, omaId, onMuutos }) {
  const [uusiNimi, setUusiNimi] = useState('')
  const [luodaan, setLuodaan] = useState(false)
  const [virhe, setVirhe] = useState('')

  const [kaverit, setKaverit] = useState([])
  const [lataaKaverit, setLataaKaverit] = useState(true)

  useEffect(() => {
    let peruttu = false

    friendService
      .haeKaverit()
      .then((data) => {
        if (!peruttu) setKaverit(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!peruttu) setLataaKaverit(false)
      })

    return () => {
      peruttu = true
    }
  }, [])

  async function luoUusiJoukkue(e) {
    e.preventDefault()
    setVirhe('')

    if (!uusiNimi.trim()) return

    setLuodaan(true)

    try {
      await competitionService.luoJoukkue(kisaId, uusiNimi.trim())
      setUusiNimi('')
      onMuutos()
    } catch (err) {
      setVirhe(err.message)
    } finally {
      setLuodaan(false)
    }
  }

  const mukanaOlevat = new Set(osallistujat.map((o) => o.kayttaja_id))
  const kutsuttavissa = kaverit.filter((k) => !mukanaOlevat.has(k.profiili.id))
  const omaRivi = osallistujat.find((o) => o.kayttaja_id === omaId)

  return (
    <div className="joukkueet-hallinta">
      <form className="friend-lisays-rivi" onSubmit={luoUusiJoukkue}>
        <input
          type="text"
          placeholder="Uuden joukkueen nimi"
          value={uusiNimi}
          onChange={(e) => setUusiNimi(e.target.value)}
        />
        <button type="submit" disabled={luodaan}>
          <PlusIcon size={16} />
          {luodaan ? 'Luodaan…' : 'Luo joukkue'}
        </button>
      </form>
      {virhe && <p className="lomake-virhe">{virhe}</p>}

      {joukkueet.length === 0 ? (
        <p className="tila-teksti-pieni">Ei vielä joukkueita. Luo ensimmäinen yllä.</p>
      ) : (
        <ul className="friend-list">
          {joukkueet.map((joukkue) => {
            const jasenet = osallistujat.filter((o) => o.joukkue_id === joukkue.id)
            const omaJoukkueTama = omaRivi?.joukkue_id === joukkue.id

            return (
              <li key={joukkue.id} className="friend-item">
                <div className="friend-item-tiedot">
                  <strong>
                    <UsersIcon size={14} /> {joukkue.nimi}
                  </strong>
                  <span>
                    {jasenet.length === 0
                      ? 'Ei vielä jäseniä'
                      : jasenet
                          .map((j) => j.profiili?.nayttonimi || j.profiili?.kayttajanimi || 'Tuntematon')
                          .join(', ')}
                  </span>
                </div>
                {omaRivi && !omaJoukkueTama && (
                  <button
                    type="button"
                    className="friend-nappi-toissijainen"
                    onClick={async () => {
                      await competitionService.asetaJoukkue(omaRivi.id, joukkue.id)
                      onMuutos()
                    }}
                  >
                    Liity itse
                  </button>
                )}
                {omaJoukkueTama && <span className="joukkue-oma-merkki">Sinä olet tässä</span>}
              </li>
            )
          })}
        </ul>
      )}

      <h3 className="joukkueet-kutsu-otsikko">Kutsu kaveri joukkueeseen</h3>
      {lataaKaverit ? (
        <p className="tila-teksti-pieni">Ladataan kavereita...</p>
      ) : joukkueet.length === 0 ? (
        <p className="tila-teksti-pieni">Luo ensin joukkue, jotta voit kutsua siihen kavereita.</p>
      ) : kutsuttavissa.length === 0 ? (
        <p className="tila-teksti-pieni">Kaikki kaverisi ovat jo mukana tai kutsuttuina.</p>
      ) : (
        <KutsuJoukkueeseenLomake
          kisaId={kisaId}
          kaverit={kutsuttavissa}
          joukkueet={joukkueet}
          onKutsuttu={onMuutos}
        />
      )}
    </div>
  )
}

function KutsuJoukkueeseenLomake({ kisaId, kaverit, joukkueet, onKutsuttu }) {
  const [kaveriId, setKaveriId] = useState(kaverit[0]?.profiili.id || '')
  const [joukkueId, setJoukkueId] = useState(joukkueet[0]?.id || '')
  const [kutsutaan, setKutsutaan] = useState(false)
  const [virhe, setVirhe] = useState('')

  useEffect(() => {
    setKaveriId(kaverit[0]?.profiili.id || '')
  }, [kaverit])

  useEffect(() => {
    setJoukkueId(joukkueet[0]?.id || '')
  }, [joukkueet])

  async function kutsu(e) {
    e.preventDefault()
    setVirhe('')
    setKutsutaan(true)

    try {
      await competitionService.kutsuKaveri(kisaId, kaveriId, joukkueId)
      onKutsuttu()
    } catch (err) {
      setVirhe(err.message)
    } finally {
      setKutsutaan(false)
    }
  }

  return (
    <form className="joukkue-kutsu-lomake" onSubmit={kutsu}>
      <select value={kaveriId} onChange={(e) => setKaveriId(e.target.value)}>
        {kaverit.map((k) => (
          <option key={k.profiili.id} value={k.profiili.id}>
            {k.profiili.nayttonimi || k.profiili.kayttajanimi}
          </option>
        ))}
      </select>
      <select value={joukkueId} onChange={(e) => setJoukkueId(e.target.value)}>
        {joukkueet.map((j) => (
          <option key={j.id} value={j.id}>
            {j.nimi}
          </option>
        ))}
      </select>
      <button type="submit" disabled={kutsutaan}>
        {kutsutaan ? 'Kutsutaan…' : 'Kutsu'}
      </button>
      {virhe && <p className="lomake-virhe">{virhe}</p>}
    </form>
  )
}
