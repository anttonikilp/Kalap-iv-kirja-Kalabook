import { kisanTila, muotoilePaiva } from './dateUtils.js'
import { mittarinNimi } from './constants.js'
import { TrophyIcon, CalendarIcon } from '../components/icons.jsx'

export default function CompetitionList({ kisat, onValitse }) {
  if (kisat.length === 0) {
    return (
      <div className="tyhja-tila">
        <TrophyIcon size={28} />
        <p>Ei vielä kisoja. Luo ensimmäinen kisa!</p>
      </div>
    )
  }

  const ryhmat = { kaynnissa: [], tuleva: [], paattynyt: [] }
  for (const kisa of kisat) {
    ryhmat[kisanTila(kisa)].push(kisa)
  }

  return (
    <>
      <Ryhma otsikko="Käynnissä" kisat={ryhmat.kaynnissa} onValitse={onValitse} />
      <Ryhma otsikko="Tulevat" kisat={ryhmat.tuleva} onValitse={onValitse} />
      <Ryhma otsikko="Päättyneet" kisat={ryhmat.paattynyt} onValitse={onValitse} />
    </>
  )
}

function Ryhma({ otsikko, kisat, onValitse }) {
  if (kisat.length === 0) return null

  return (
    <section className="friends-osio">
      <h3>{otsikko}</h3>
      <ul className="friend-list">
        {kisat.map((kisa) => (
          <li key={kisa.id} className="friend-item kisa-listarivi" onClick={() => onValitse(kisa)}>
            <div className="kisa-listarivi-ikoni">
              <TrophyIcon size={17} />
            </div>
            <div className="friend-item-tiedot">
              <strong>{kisa.nimi}</strong>
              <span>
                <CalendarIcon size={13} />
                {muotoilePaiva(kisa.alkupaiva)} – {muotoilePaiva(kisa.loppupaiva)} ·{' '}
                {mittarinNimi(kisa.mittari)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
