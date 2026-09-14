import { useEffect, useState } from 'react'
import * as competitionService from './competitionService.js'
import { muotoilePaiva, kisanTila } from './dateUtils.js'
import { mittarinNimi, laskentatavanNimi } from './constants.js'
import { lajinNimi } from '../catches/species.js'
import InviteFriendPanel from './InviteFriendPanel.jsx'
import { ArrowLeftIcon, MedalIcon, TrophyIcon, CalendarIcon, FishIcon } from '../components/icons.jsx'

export default function CompetitionDetail({ kisa, omaId, onTakaisin }) {
  const [osallistujat, setOsallistujat] = useState([])
  const [tulokset, setTulokset] = useState([])
  const [lataa, setLataa] = useState(true)
  const [virhe, setVirhe] = useState('')
  const [paivitysAvain, setPaivitysAvain] = useState(0)

  const [omatSaaliit, setOmatSaaliit] = useState([])
  const [linkitetyt, setLinkitetyt] = useState(new Set())

  const onLuoja = kisa.luoja_id === omaId
  const tila = kisanTila(kisa)

  function paivita() {
    setPaivitysAvain((edellinen) => edellinen + 1)
  }

  useEffect(() => {
    let peruttu = false
    setLataa(true)
    setVirhe('')

    Promise.all([
      competitionService.haeKisanOsallistujat(kisa.id),
      competitionService.haeTulostaulukko(kisa.id),
    ])
      .then(([osallistujaData, tulosData]) => {
        if (!peruttu) {
          setOsallistujat(osallistujaData)
          setTulokset(tulosData)
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
  }, [kisa.id, paivitysAvain])

  useEffect(() => {
    if (kisa.laskentatapa !== 'ilmoitettava' || tila === 'tuleva') return

    let peruttu = false

    Promise.all([
      competitionService.haeOmatKelpoisetSaaliit(kisa),
      competitionService.haeLinkitetytSaalisIdt(kisa.id),
    ]).then(([saalisData, linkitData]) => {
      if (!peruttu) {
        setOmatSaaliit(saalisData)
        setLinkitetyt(linkitData)
      }
    })

    return () => {
      peruttu = true
    }
  }, [kisa.id, paivitysAvain])

  async function vaihdaLinkitys(saalisId, onLinkitetty) {
    try {
      if (onLinkitetty) {
        await competitionService.irrotaSaalisKisasta(kisa.id, saalisId)
      } else {
        await competitionService.liitaSaalisKisaan(kisa.id, saalisId)
      }
      paivita()
    } catch (err) {
      setVirhe(err.message)
    }
  }

  return (
    <div className="kisa-detail">
      <button type="button" className="kisa-takaisin" onClick={onTakaisin}>
        <ArrowLeftIcon size={16} />
        Takaisin kisoihin
      </button>

      <div className="kisa-otsikko">
        <h2>{kisa.nimi}</h2>
        <span className={`kisa-tila-merkki kisa-tila-${tila}`}>{tilanNimi(tila)}</span>
      </div>

      <p className="tila-teksti kisa-tiedot-rivi">
        {kisa.laji ? lajinNimi(kisa.laji) : 'Kaikki lajit'} · {mittarinNimi(kisa.mittari)} ·{' '}
        {laskentatavanNimi(kisa.laskentatapa)}
      </p>
      <p className="tila-teksti kisa-tiedot-rivi">
        <CalendarIcon size={13} />
        {muotoilePaiva(kisa.alkupaiva)} – {muotoilePaiva(kisa.loppupaiva)}
      </p>

      {virhe && <p className="lomake-virhe">{virhe}</p>}

      {lataa ? (
        <p className="tila-teksti">Ladataan...</p>
      ) : (
        <>
          <section className="friends-osio">
            <h3>
              <TrophyIcon size={14} />
              Tulostaulukko
            </h3>
            {tulokset.length === 0 ? (
              <p className="tila-teksti-pieni">Ei vielä osallistujia.</p>
            ) : (
              <ol className="kisa-tulostaulukko">
                {tulokset.map((rivi, indeksi) => (
                  <li key={rivi.kayttaja_id} className={rivi.kayttaja_id === omaId ? 'kisa-oma-rivi' : ''}>
                    <span className="kisa-sija">
                      {indeksi === 0 ? <MedalIcon size={16} /> : `${indeksi + 1}.`}
                    </span>
                    <span className="kisa-nimi">{rivi.nayttonimi || rivi.kayttajanimi}</span>
                    <span className="kisa-tulos">
                      {rivi.tulos == null
                        ? '–'
                        : kisa.mittari === 'suurin_kala'
                          ? `${rivi.tulos} kg`
                          : `${rivi.tulos} kpl`}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {kisa.laskentatapa === 'ilmoitettava' && tila !== 'tuleva' && (
            <section className="friends-osio">
              <h3>
                <FishIcon size={14} />
                Liitä omia saaliita kisaan
              </h3>
              {omatSaaliit.length === 0 ? (
                <p className="tila-teksti-pieni">
                  Ei sopivia saaliita kisan aikavälillä
                  {kisa.laji ? ` lajille ${lajinNimi(kisa.laji)}` : ''}.
                </p>
              ) : (
                <ul className="friend-list">
                  {omatSaaliit.map((saalis) => {
                    const onLinkitetty = linkitetyt.has(saalis.id)
                    return (
                      <li key={saalis.id} className="friend-item">
                        <div className="friend-item-tiedot">
                          <strong>{lajinNimi(saalis.laji)}</strong>
                          <span>
                            {muotoilePaiva(saalis.ajankohta.slice(0, 10))}
                            {saalis.paino_kg ? ` · ${saalis.paino_kg} kg` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={onLinkitetty ? 'friend-nappi-toissijainen' : 'friend-nappi'}
                          onClick={() => vaihdaLinkitys(saalis.id, onLinkitetty)}
                        >
                          {onLinkitetty ? 'Irrota' : 'Liitä kisaan'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          <section className="friends-osio">
            <h3>Osallistujat</h3>
            <ul className="friend-list">
              {osallistujat.map((o) => (
                <li key={o.id} className="friend-item">
                  <div className="friend-item-tiedot">
                    <strong>{o.profiili?.nayttonimi || o.profiili?.kayttajanimi || 'Tuntematon'}</strong>
                    <span>{osallistujanTilanNimi(o.tila)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {onLuoja && (
            <section className="friends-osio">
              <h3>
                <TrophyIcon size={14} />
                Kutsu kaveri mukaan
              </h3>
              <InviteFriendPanel kisaId={kisa.id} osallistujat={osallistujat} onKutsuttu={paivita} />
            </section>
          )}
        </>
      )}
    </div>
  )
}

function tilanNimi(tila) {
  if (tila === 'kaynnissa') return 'Käynnissä'
  if (tila === 'tuleva') return 'Tuleva'
  return 'Päättynyt'
}

function osallistujanTilanNimi(tila) {
  if (tila === 'accepted') return 'Mukana'
  if (tila === 'declined') return 'Hylkäsi kutsun'
  return 'Kutsuttu, odottaa vastausta'
}
