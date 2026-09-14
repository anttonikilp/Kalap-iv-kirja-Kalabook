import { useEffect, useState } from 'react'
import * as competitionService from './competitionService.js'
import CompetitionInvites from './CompetitionInvites.jsx'
import CompetitionList from './CompetitionList.jsx'
import CompetitionDetail from './CompetitionDetail.jsx'
import CreateCompetitionForm from './CreateCompetitionForm.jsx'

export default function CompetitionsView() {
  const [omaId, setOmaId] = useState(null)
  const [kisat, setKisat] = useState([])
  const [kutsut, setKutsut] = useState([])
  const [lataa, setLataa] = useState(true)
  const [virhe, setVirhe] = useState('')
  const [paivitysAvain, setPaivitysAvain] = useState(0)
  const [valittuKisa, setValittuKisa] = useState(null)
  const [naytaLomake, setNaytaLomake] = useState(false)

  function paivita() {
    setPaivitysAvain((edellinen) => edellinen + 1)
  }

  useEffect(() => {
    competitionService.omaKayttajaId().then(setOmaId)
  }, [])

  useEffect(() => {
    let peruttu = false
    setLataa(true)

    Promise.all([competitionService.haeOmatKisat(), competitionService.haeSaapuneetKutsut()])
      .then(([kisaData, kutsuData]) => {
        if (!peruttu) {
          setKisat(kisaData)
          setKutsut(kutsuData)
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
  }, [paivitysAvain])

  if (valittuKisa) {
    return (
      <CompetitionDetail
        kisa={valittuKisa}
        omaId={omaId}
        onTakaisin={() => {
          setValittuKisa(null)
          paivita()
        }}
      />
    )
  }

  if (naytaLomake) {
    return (
      <CreateCompetitionForm
        onLuotu={(kisa) => {
          setNaytaLomake(false)
          paivita()
          setValittuKisa(kisa)
        }}
        onPeruuta={() => setNaytaLomake(false)}
      />
    )
  }

  return (
    <div className="friends-view">
      <button type="button" className="btn-primary" onClick={() => setNaytaLomake(true)}>
        Luo uusi kisa
      </button>

      {lataa ? (
        <p className="tila-teksti">Ladataan kisoja...</p>
      ) : virhe ? (
        <p className="lomake-virhe">Virhe: {virhe}</p>
      ) : (
        <>
          <CompetitionInvites kutsut={kutsut} onMuutos={paivita} />
          <CompetitionList kisat={kisat} onValitse={setValittuKisa} />
        </>
      )}
    </div>
  )
}
