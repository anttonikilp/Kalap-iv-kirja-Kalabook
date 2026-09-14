import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import * as tripService from './tripService.js'

const TripsContext = createContext(undefined)

export function TripsProvider({ children }) {
  const { user } = useAuth()
  const [aktiivinenReissu, setAktiivinenReissu] = useState(null)
  const [lataaAktiivinen, setLataaAktiivinen] = useState(true)
  const [reissuPaivitysAvain, setReissuPaivitysAvain] = useState(0)

  const paivitaAktiivinen = useCallback(() => {
    if (!user) {
      setAktiivinenReissu(null)
      setLataaAktiivinen(false)
      return
    }

    setLataaAktiivinen(true)
    tripService
      .haeAktiivinenReissu()
      .then(setAktiivinenReissu)
      .catch(() => setAktiivinenReissu(null))
      .finally(() => setLataaAktiivinen(false))
  }, [user])

  useEffect(() => {
    paivitaAktiivinen()
  }, [paivitaAktiivinen])

  async function aloitaReissu(paikka) {
    const reissu = await tripService.aloitaReissu(paikka)
    setAktiivinenReissu(reissu)
    setReissuPaivitysAvain((edellinen) => edellinen + 1)
    return reissu
  }

  async function lopetaReissu(muistiinpanot) {
    if (!aktiivinenReissu) return
    await tripService.lopetaReissu(aktiivinenReissu.id, muistiinpanot)
    setAktiivinenReissu(null)
    setReissuPaivitysAvain((edellinen) => edellinen + 1)
  }

  const value = {
    aktiivinenReissu,
    lataaAktiivinen,
    reissuPaivitysAvain,
    aloitaReissu,
    lopetaReissu,
  }

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>
}

export function useTrips() {
  const konteksti = useContext(TripsContext)
  if (konteksti === undefined) {
    throw new Error('useTrips on kaytettava TripsProviderin sisalla')
  }
  return konteksti
}
