import { MedalIcon } from '../components/icons.jsx'

/**
 * Joukkuekisan tulostaulukko. Rivit tulevat valmiiksi jarjestettyna
 * tietokannasta (kisan_joukkuetulokset) joukkueen sijoituksen mukaan,
 * jasenet sen sisalla oman osuutensa mukaan - tama vain ryhmittelee
 * peräkkäiset samaan joukkueeseen kuuluvat rivit yhdeksi kortiksi.
 */
export default function TeamScoreboard({ tulokset, mittari, omaId }) {
  if (tulokset.length === 0) {
    return <p className="tila-teksti-pieni">Ei vielä osallistujia joukkueissa.</p>
  }

  const joukkueet = []
  const kartta = new Map()

  for (const rivi of tulokset) {
    if (!kartta.has(rivi.joukkue_id)) {
      const joukkue = { id: rivi.joukkue_id, nimi: rivi.joukkue_nimi, tulos: rivi.joukkue_tulos, jasenet: [] }
      kartta.set(rivi.joukkue_id, joukkue)
      joukkueet.push(joukkue)
    }
    kartta.get(rivi.joukkue_id).jasenet.push(rivi)
  }

  function muotoile(tulos) {
    if (tulos == null) return '–'
    return mittari === 'suurin_kala' ? `${tulos} kg` : `${tulos} kpl`
  }

  return (
    <ol className="kisa-tulostaulukko">
      {joukkueet.map((joukkue, indeksi) => {
        const omaJoukkue = joukkue.jasenet.some((j) => j.kayttaja_id === omaId)
        return (
          <li key={joukkue.id} className={`kisa-joukkue-li ${omaJoukkue ? 'kisa-oma-rivi' : ''}`}>
            <div className="kisa-joukkue-rivi">
              <span className="kisa-sija">
                {indeksi === 0 ? <MedalIcon size={16} /> : `${indeksi + 1}.`}
              </span>
              <span className="kisa-nimi">{joukkue.nimi}</span>
              <span className="kisa-tulos">{muotoile(joukkue.tulos)}</span>
            </div>
            <ul className="kisa-joukkue-jasenet">
              {joukkue.jasenet.map((jasen) => (
                <li
                  key={jasen.kayttaja_id}
                  className={jasen.kayttaja_id === omaId ? 'kisa-oma-jasen' : ''}
                >
                  <span>{jasen.nayttonimi || jasen.kayttajanimi}</span>
                  <span>{muotoile(jasen.jasen_tulos)}</span>
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}
