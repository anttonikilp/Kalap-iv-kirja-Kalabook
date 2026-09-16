import { useState } from 'react'
import { LAJIT } from '../catches/species.js'
import { MITTARIT, LASKENTATAVAT, KISATYYPIT, JOUKKUELASKENTATAVAT } from './constants.js'
import { tanaan } from './dateUtils.js'
import { luoKisa } from './competitionService.js'
import { TrophyIcon, XIcon, PlusIcon } from '../components/icons.jsx'

export default function CreateCompetitionForm({ onLuotu, onPeruuta }) {
  const [nimi, setNimi] = useState('')
  const [laji, setLaji] = useState('')
  const [mittari, setMittari] = useState(MITTARIT[0].id)
  const [laskentatapa, setLaskentatapa] = useState(LASKENTATAVAT[0].id)
  const [tyyppi, setTyyppi] = useState(KISATYYPIT[0].id)
  const [joukkuelaskentatapa, setJoukkuelaskentatapa] = useState(JOUKKUELASKENTATAVAT[0].id)
  const [alkupaiva, setAlkupaiva] = useState(tanaan())
  const [loppupaiva, setLoppupaiva] = useState(tanaan())
  const [virhe, setVirhe] = useState('')
  const [tallennetaan, setTallennetaan] = useState(false)

  async function tallenna(e) {
    e.preventDefault()
    setVirhe('')

    if (loppupaiva < alkupaiva) {
      setVirhe('Loppupäivä ei voi olla ennen alkupäivää.')
      return
    }

    setTallennetaan(true)

    try {
      const kisa = await luoKisa({
        nimi,
        laji,
        mittari,
        laskentatapa,
        alkupaiva,
        loppupaiva,
        tyyppi,
        joukkuelaskentatapa,
      })
      onLuotu(kisa)
    } catch (err) {
      setVirhe('Kisan luonti epäonnistui: ' + err.message)
    } finally {
      setTallennetaan(false)
    }
  }

  return (
    <form className="kisa-lomake" onSubmit={tallenna}>
      <h2>
        <TrophyIcon size={18} />
        Uusi kisa
      </h2>

      <label>
        Nimi
        <input
          type="text"
          required
          value={nimi}
          onChange={(e) => setNimi(e.target.value)}
          placeholder="esim. Kesän hauenpyyntikisa"
        />
      </label>

      <label>
        Kohde
        <select value={laji} onChange={(e) => setLaji(e.target.value)}>
          <option value="">Kaikki lajit</option>
          {LAJIT.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nimi}
            </option>
          ))}
        </select>
      </label>

      <label>
        Kisatyyppi
        <select value={tyyppi} onChange={(e) => setTyyppi(e.target.value)}>
          {KISATYYPIT.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nimi}
            </option>
          ))}
        </select>
      </label>
      <p className="tila-teksti-pieni kisa-ohje">
        Joukkuekisassa joukkueiden koko on vapaa (2 tai enemmän) - sama tyyppi sopii siis myös
        parikisaan.
      </p>

      {tyyppi === 'joukkue' && (
        <label>
          Joukkueiden laskentatapa
          <select
            value={joukkuelaskentatapa}
            onChange={(e) => setJoukkuelaskentatapa(e.target.value)}
          >
            {JOUKKUELASKENTATAVAT.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nimi}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Mittari
        <select value={mittari} onChange={(e) => setMittari(e.target.value)}>
          {MITTARIT.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nimi}
            </option>
          ))}
        </select>
      </label>

      <label>
        Laskentatapa
        <select value={laskentatapa} onChange={(e) => setLaskentatapa(e.target.value)}>
          {LASKENTATAVAT.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nimi}
            </option>
          ))}
        </select>
      </label>
      <p className="tila-teksti-pieni kisa-ohje">
        Automaattinen: kaikki kisan aikana kirjatut, kohteeseen sopivat saaliisi lasketaan mukaan
        itsestään. Ilmoitettavat: vain saaliit jotka erikseen liität kisaan lasketaan.
      </p>

      <label>
        Alkupäivä
        <input type="date" required value={alkupaiva} onChange={(e) => setAlkupaiva(e.target.value)} />
      </label>

      <label>
        Loppupäivä
        <input type="date" required value={loppupaiva} onChange={(e) => setLoppupaiva(e.target.value)} />
      </label>

      {virhe && <p className="lomake-virhe">{virhe}</p>}

      <div className="kisa-lomake-napit">
        <button type="button" className="friend-nappi-toissijainen" onClick={onPeruuta}>
          <XIcon size={15} />
          Peruuta
        </button>
        <button type="submit" className="btn-primary" disabled={tallennetaan}>
          <PlusIcon size={16} />
          {tallennetaan ? 'Luodaan…' : 'Luo kisa'}
        </button>
      </div>
    </form>
  )
}
