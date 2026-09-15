import { useEffect, useState } from 'react'
import * as notificationService from './notificationService.js'
import { kohdeValilehti } from './notificationService.js'
import { CheckIcon } from '../components/icons.jsx'

export default function NotificationPanel({ onSuljetaan, onMuutos, onNavigoi }) {
  const [ilmoitukset, setIlmoitukset] = useState([])
  const [lataa, setLataa] = useState(true)
  const [virhe, setVirhe] = useState('')

  useEffect(() => {
    let peruttu = false

    notificationService
      .haeIlmoitukset()
      .then((data) => {
        if (!peruttu) setIlmoitukset(data)
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

  async function kasitteleValinta(ilmoitus) {
    if (!ilmoitus.luettu) {
      setIlmoitukset((edelliset) =>
        edelliset.map((i) => (i.id === ilmoitus.id ? { ...i, luettu: true } : i))
      )

      try {
        await notificationService.merkitseLuetuksi(ilmoitus.id)
        onMuutos()
      } catch {
        // Ei estetä navigointia, vaikka luetuksi merkintä epäonnistuisi.
      }
    }

    const kohde = kohdeValilehti(ilmoitus)
    if (kohde) onNavigoi(kohde)
  }

  async function merkitseKaikki() {
    setVirhe('')

    try {
      await notificationService.merkitseKaikkiLuetuiksi()
      setIlmoitukset((edelliset) => edelliset.map((i) => ({ ...i, luettu: true })))
      onMuutos()
    } catch (err) {
      setVirhe(err.message)
    }
  }

  const lukemattomat = ilmoitukset.filter((i) => !i.luettu)
  const luetut = ilmoitukset.filter((i) => i.luettu)

  return (
    <>
      <button
        type="button"
        className="ilmoitus-tausta"
        aria-label="Sulje ilmoitukset"
        onClick={onSuljetaan}
      />
      <div className="ilmoitus-paneeli">
        <div className="ilmoitus-paneeli-otsikko">
          <h2>Ilmoitukset</h2>
          {lukemattomat.length > 0 && (
            <button type="button" className="ilmoitus-merkitse-kaikki" onClick={merkitseKaikki}>
              <CheckIcon size={14} />
              Merkitse kaikki luetuiksi
            </button>
          )}
        </div>

        {lataa ? (
          <p className="tila-teksti-pieni">Ladataan...</p>
        ) : virhe ? (
          <p className="lomake-virhe">Virhe: {virhe}</p>
        ) : ilmoitukset.length === 0 ? (
          <p className="tila-teksti-pieni">Ei vielä ilmoituksia.</p>
        ) : (
          <div className="ilmoitus-lista">
            {lukemattomat.length > 0 && (
              <ul className="ilmoitus-ryhma">
                {lukemattomat.map((ilmoitus) => (
                  <IlmoitusRivi key={ilmoitus.id} ilmoitus={ilmoitus} onValinta={kasitteleValinta} />
                ))}
              </ul>
            )}

            {luetut.length > 0 && (
              <>
                <h3 className="ilmoitus-ryhma-otsikko">Aiemmat</h3>
                <ul className="ilmoitus-ryhma">
                  {luetut.map((ilmoitus) => (
                    <IlmoitusRivi key={ilmoitus.id} ilmoitus={ilmoitus} onValinta={kasitteleValinta} />
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function IlmoitusRivi({ ilmoitus, onValinta }) {
  return (
    <li>
      <button
        type="button"
        className={`ilmoitus-rivi ${ilmoitus.luettu ? '' : 'ilmoitus-rivi-lukematon'}`}
        onClick={() => onValinta(ilmoitus)}
      >
        <span className="ilmoitus-rivi-teksti">{ilmoitus.teksti}</span>
        <span className="ilmoitus-rivi-aika">{muotoileAika(ilmoitus.created_at)}</span>
      </button>
    </li>
  )
}

function muotoileAika(iso) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
