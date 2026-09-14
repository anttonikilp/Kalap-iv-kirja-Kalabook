import { useState } from 'react'
import { useTrips } from './TripsContext.jsx'

export default function ReissuPalkki() {
  const { aktiivinenReissu, lataaAktiivinen, aloitaReissu, lopetaReissu } = useTrips()
  const [paikka, setPaikka] = useState('')
  const [kasitellaan, setKasitellaan] = useState(false)
  const [virhe, setVirhe] = useState('')

  if (lataaAktiivinen) return null

  async function kasitteleAloitus(e) {
    e.preventDefault()
    setVirhe('')
    setKasitellaan(true)

    try {
      await aloitaReissu(paikka)
      setPaikka('')
    } catch (err) {
      setVirhe('Reissun aloitus epäonnistui: ' + err.message)
    } finally {
      setKasitellaan(false)
    }
  }

  async function kasitteleLopetus() {
    setVirhe('')
    setKasitellaan(true)

    try {
      await lopetaReissu()
    } catch (err) {
      setVirhe('Reissun lopetus epäonnistui: ' + err.message)
    } finally {
      setKasitellaan(false)
    }
  }

  if (aktiivinenReissu) {
    return (
      <div className="reissu-palkki reissu-palkki-aktiivinen">
        <div className="reissu-palkki-tiedot">
          <strong>Reissu käynnissä</strong>
          <span>
            {aktiivinenReissu.paikka || 'Ei paikkaa merkitty'} · alkoi{' '}
            {muotoileKellonaika(aktiivinenReissu.aloitusaika)}
          </span>
        </div>
        <button type="button" onClick={kasitteleLopetus} disabled={kasitellaan}>
          {kasitellaan ? 'Hetki...' : 'Lopeta reissu'}
        </button>
        {virhe && <p className="lomake-virhe">{virhe}</p>}
      </div>
    )
  }

  return (
    <form className="reissu-palkki" onSubmit={kasitteleAloitus}>
      <input
        type="text"
        placeholder="Paikka (valinnainen)"
        value={paikka}
        onChange={(e) => setPaikka(e.target.value)}
      />
      <button type="submit" disabled={kasitellaan}>
        {kasitellaan ? 'Hetki...' : 'Aloita reissu'}
      </button>
      {virhe && <p className="lomake-virhe">{virhe}</p>}
    </form>
  )
}

function muotoileKellonaika(iso) {
  return new Date(iso).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
}
