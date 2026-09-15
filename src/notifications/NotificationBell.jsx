import { useEffect, useState } from 'react'
import * as notificationService from './notificationService.js'
import NotificationPanel from './NotificationPanel.jsx'
import { BellIcon } from '../components/icons.jsx'

const PAIVITYSVALI_MS = 45000

export default function NotificationBell({ onNavigoi }) {
  const [lukemattomia, setLukemattomia] = useState(0)
  const [avoinna, setAvoinna] = useState(false)
  const [paivitysAvain, setPaivitysAvain] = useState(0)

  useEffect(() => {
    let peruttu = false

    function paivitaMaara() {
      notificationService
        .haeLukemattomienMaara()
        .then((maara) => {
          if (!peruttu) setLukemattomia(maara)
        })
        .catch(() => {})
    }

    paivitaMaara()
    const ajastin = setInterval(paivitaMaara, PAIVITYSVALI_MS)

    return () => {
      peruttu = true
      clearInterval(ajastin)
    }
  }, [paivitysAvain])

  function paivita() {
    setPaivitysAvain((edellinen) => edellinen + 1)
  }

  return (
    <div className="ilmoitus-kello-alue">
      <button
        type="button"
        className="ilmoitus-kello"
        onClick={() => setAvoinna((edellinen) => !edellinen)}
        aria-label="Ilmoitukset"
      >
        <BellIcon size={19} />
        {lukemattomia > 0 && (
          <span className="ilmoitus-badge">{lukemattomia > 9 ? '9+' : lukemattomia}</span>
        )}
      </button>

      {avoinna && (
        <NotificationPanel
          onSuljetaan={() => setAvoinna(false)}
          onMuutos={paivita}
          onNavigoi={(kohde) => {
            setAvoinna(false)
            onNavigoi?.(kohde)
          }}
        />
      )}
    </div>
  )
}
