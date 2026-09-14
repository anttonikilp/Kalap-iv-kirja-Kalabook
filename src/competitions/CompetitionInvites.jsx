import { useState } from 'react'
import { vastaaKutsuun } from './competitionService.js'
import { muotoilePaiva } from './dateUtils.js'
import { mittarinNimi } from './constants.js'

export default function CompetitionInvites({ kutsut, onMuutos }) {
  if (kutsut.length === 0) return null

  return (
    <section className="friends-osio">
      <h3>Saapuneet kisakutsut</h3>
      <ul className="friend-list">
        {kutsut.map((kutsu) => (
          <InviteItem key={kutsu.id} kutsu={kutsu} onMuutos={onMuutos} />
        ))}
      </ul>
    </section>
  )
}

function InviteItem({ kutsu, onMuutos }) {
  const [kasitellaan, setKasitellaan] = useState(false)
  const [virhe, setVirhe] = useState('')
  const kisa = kutsu.kisa

  async function vastaa(hyvaksy) {
    setVirhe('')
    setKasitellaan(true)

    try {
      await vastaaKutsuun(kutsu.id, hyvaksy)
      onMuutos()
    } catch (err) {
      setVirhe(err.message)
    } finally {
      setKasitellaan(false)
    }
  }

  return (
    <li className="friend-item">
      <div className="friend-item-tiedot">
        <strong>{kisa.nimi}</strong>
        <span>
          {kisa.luoja?.nayttonimi || kisa.luoja?.kayttajanimi || 'Tuntematon'} kutsui ·{' '}
          {muotoilePaiva(kisa.alkupaiva)}–{muotoilePaiva(kisa.loppupaiva)}
        </span>
        <span>{mittarinNimi(kisa.mittari)}</span>
      </div>
      <div className="friend-item-toiminnot">
        <button
          type="button"
          className="friend-nappi-toissijainen"
          onClick={() => vastaa(false)}
          disabled={kasitellaan}
        >
          Hylkää
        </button>
        <button type="button" className="friend-nappi" onClick={() => vastaa(true)} disabled={kasitellaan}>
          Hyväksy
        </button>
      </div>
      {virhe && <p className="lomake-virhe">{virhe}</p>}
    </li>
  )
}
