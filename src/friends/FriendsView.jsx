import { useEffect, useState } from 'react'
import { haeOmaProfiili } from './profileService.js'
import * as friendService from './friendService.js'
import UsernameForm from './UsernameForm.jsx'
import FriendRequestItem from './FriendRequestItem.jsx'

export default function FriendsView() {
  const [profiili, setProfiili] = useState(null)
  const [lataaProfiili, setLataaProfiili] = useState(true)
  const [virheProfiili, setVirheProfiili] = useState('')

  const [saapuneet, setSaapuneet] = useState([])
  const [lahetetyt, setLahetetyt] = useState([])
  const [kaverit, setKaverit] = useState([])
  const [lataaLista, setLataaLista] = useState(true)
  const [virheLista, setVirheLista] = useState('')

  const [paivitysAvain, setPaivitysAvain] = useState(0)
  const [uusiKayttajanimi, setUusiKayttajanimi] = useState('')
  const [lisataan, setLisataan] = useState(false)
  const [lisaysVirhe, setLisaysVirhe] = useState('')
  const [lisaysOnnistui, setLisaysOnnistui] = useState('')

  function paivita() {
    setPaivitysAvain((edellinen) => edellinen + 1)
  }

  useEffect(() => {
    let peruttu = false
    setLataaProfiili(true)

    haeOmaProfiili()
      .then((data) => {
        if (!peruttu) setProfiili(data)
      })
      .catch((err) => {
        if (!peruttu) setVirheProfiili(err.message)
      })
      .finally(() => {
        if (!peruttu) setLataaProfiili(false)
      })

    return () => {
      peruttu = true
    }
  }, [paivitysAvain])

  useEffect(() => {
    if (!profiili?.kayttajanimi) return

    let peruttu = false
    setLataaLista(true)

    Promise.all([
      friendService.haeSaapuneetPyynnot(),
      friendService.haeLahetetytPyynnot(),
      friendService.haeKaverit(),
    ])
      .then(([saapuneetData, lahetetytData, kaveritData]) => {
        if (!peruttu) {
          setSaapuneet(saapuneetData)
          setLahetetyt(lahetetytData)
          setKaverit(kaveritData)
        }
      })
      .catch((err) => {
        if (!peruttu) setVirheLista(err.message)
      })
      .finally(() => {
        if (!peruttu) setLataaLista(false)
      })

    return () => {
      peruttu = true
    }
  }, [profiili?.kayttajanimi, paivitysAvain])

  async function lahetaPyyntoLomake(e) {
    e.preventDefault()
    setLisaysVirhe('')
    setLisaysOnnistui('')
    setLisataan(true)

    try {
      await friendService.lahetaPyynto(uusiKayttajanimi)
      setUusiKayttajanimi('')
      setLisaysOnnistui('Kaveripyyntö lähetetty!')
      paivita()
    } catch (err) {
      setLisaysVirhe(err.message)
    } finally {
      setLisataan(false)
    }
  }

  if (lataaProfiili) return <p className="tila-teksti">Ladataan...</p>
  if (virheProfiili) return <p className="lomake-virhe">Virhe: {virheProfiili}</p>

  if (!profiili?.kayttajanimi) {
    return <UsernameForm onValmis={() => paivita()} />
  }

  return (
    <div className="friends-view">
      <p className="friends-oma-nimi">
        Oma käyttäjänimi: <strong>@{profiili.kayttajanimi}</strong>
      </p>

      <form className="friend-lisays-lomake" onSubmit={lahetaPyyntoLomake}>
        <h2>Lisää kaveri</h2>
        <div className="friend-lisays-rivi">
          <input
            type="text"
            placeholder="Kaverin käyttäjänimi"
            value={uusiKayttajanimi}
            onChange={(e) => setUusiKayttajanimi(e.target.value)}
            required
          />
          <button type="submit" disabled={lisataan}>
            {lisataan ? 'Lähetetään...' : 'Lähetä pyyntö'}
          </button>
        </div>
        {lisaysVirhe && <p className="lomake-virhe">{lisaysVirhe}</p>}
        {lisaysOnnistui && <p className="lomake-onnistui">{lisaysOnnistui}</p>}
      </form>

      {lataaLista ? (
        <p className="tila-teksti">Ladataan kavereita...</p>
      ) : virheLista ? (
        <p className="lomake-virhe">Virhe: {virheLista}</p>
      ) : (
        <>
          {saapuneet.length > 0 && (
            <section className="friends-osio">
              <h3>Saapuneet pyynnöt</h3>
              <ul className="friend-list">
                {saapuneet.map((rivi) => (
                  <FriendRequestItem
                    key={rivi.id}
                    profiili={rivi.profiili}
                    ensisijainenTeksti="Hyväksy"
                    ensisijainenToiminto={async () => {
                      await friendService.hyvaksyPyynto(rivi.id)
                      paivita()
                    }}
                    toissijainenTeksti="Hylkää"
                    toissijainenToiminto={async () => {
                      await friendService.poistaRivi(rivi.id)
                      paivita()
                    }}
                  />
                ))}
              </ul>
            </section>
          )}

          <section className="friends-osio">
            <h3>Lähetetyt pyynnöt</h3>
            {lahetetyt.length === 0 ? (
              <p className="tila-teksti">Ei odottavia pyyntöjä.</p>
            ) : (
              <ul className="friend-list">
                {lahetetyt.map((rivi) => (
                  <FriendRequestItem
                    key={rivi.id}
                    profiili={rivi.profiili}
                    toissijainenTeksti="Peru"
                    toissijainenToiminto={async () => {
                      await friendService.poistaRivi(rivi.id)
                      paivita()
                    }}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="friends-osio">
            <h3>Kaverit</h3>
            {kaverit.length === 0 ? (
              <p className="tila-teksti">Ei vielä kavereita.</p>
            ) : (
              <ul className="friend-list">
                {kaverit.map((rivi) => (
                  <FriendRequestItem
                    key={rivi.id}
                    profiili={rivi.profiili}
                    toissijainenTeksti="Poista"
                    toissijainenToiminto={async () => {
                      await friendService.poistaRivi(rivi.id)
                      paivita()
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
