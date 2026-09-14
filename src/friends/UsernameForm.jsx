import { useState } from 'react'
import { asetaKayttajanimi } from './profileService.js'
import { UsersIcon } from '../components/icons.jsx'

const KAYTTAJANIMI_SAANTO = /^[a-z0-9_]{3,20}$/

export default function UsernameForm({ onValmis }) {
  const [kayttajanimi, setKayttajanimi] = useState('')
  const [nayttonimi, setNayttonimi] = useState('')
  const [virhe, setVirhe] = useState('')
  const [lahetetaan, setLahetetaan] = useState(false)

  async function lahetaLomake(e) {
    e.preventDefault()
    setVirhe('')

    const siistitty = kayttajanimi.trim().toLowerCase()

    if (!KAYTTAJANIMI_SAANTO.test(siistitty)) {
      setVirhe(
        'Käyttäjänimen tulee olla 3-20 merkkiä: pieniä kirjaimia a-z, numeroita tai alaviivoja.'
      )
      return
    }

    setLahetetaan(true)

    try {
      const profiili = await asetaKayttajanimi(siistitty, nayttonimi)
      onValmis(profiili)
    } catch (err) {
      setVirhe(err.message)
    } finally {
      setLahetetaan(false)
    }
  }

  return (
    <div className="username-kortti">
      <div className="username-ikoni">
        <UsersIcon size={22} />
      </div>
      <h2>Valitse käyttäjänimi</h2>
      <p className="tila-teksti">
        Tarvitset käyttäjänimen, jotta kaverit löytävät sinut. Käyttäjänimi näkyy
        kavereillesi - sähköpostiosoitettasi ei koskaan näyteta kenellekään.
      </p>

      <form onSubmit={lahetaLomake} className="username-lomake">
        <label>
          Käyttäjänimi
          <input
            type="text"
            required
            placeholder="esim. kalajussi"
            value={kayttajanimi}
            onChange={(e) => setKayttajanimi(e.target.value)}
          />
        </label>

        <label>
          Näyttönimi (valinnainen)
          <input
            type="text"
            placeholder="esim. Jussi K."
            value={nayttonimi}
            onChange={(e) => setNayttonimi(e.target.value)}
          />
        </label>

        {virhe && <p className="lomake-virhe">{virhe}</p>}

        <button type="submit" className="btn-primary" disabled={lahetetaan}>
          {lahetetaan ? 'Tallennetaan...' : 'Tallenna'}
        </button>
      </form>
    </div>
  )
}
