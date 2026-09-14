import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import AuthPage from './auth/AuthPage.jsx'
import { TripsProvider } from './trips/TripsContext.jsx'
import ReissuPalkki from './trips/ReissuPalkki.jsx'
import TripsList from './trips/TripsList.jsx'
import CatchForm from './catches/CatchForm.jsx'
import CatchList from './catches/CatchList.jsx'
import Stats from './stats/Stats.jsx'
import FriendsView from './friends/FriendsView.jsx'
import CompetitionsView from './competitions/CompetitionsView.jsx'
import {
  PlusIcon,
  ListIcon,
  CompassIcon,
  ChartIcon,
  UsersIcon,
  TrophyIcon,
  LogOutIcon,
} from './components/icons.jsx'
import './App.css'

const VALILEHDET = [
  { id: 'lisaa', nimi: 'Lisää', Ikoni: PlusIcon },
  { id: 'historia', nimi: 'Historia', Ikoni: ListIcon },
  { id: 'reissut', nimi: 'Reissut', Ikoni: CompassIcon },
  { id: 'tilastot', nimi: 'Tilastot', Ikoni: ChartIcon },
  { id: 'kaverit', nimi: 'Kaverit', Ikoni: UsersIcon },
  { id: 'kisat', nimi: 'Kisat', Ikoni: TrophyIcon },
]

function PaaNakyma({ signOut }) {
  const [valilehti, setValilehti] = useState('lisaa')
  const [paivitysAvain, setPaivitysAvain] = useState(0)

  function saalisTallennettu() {
    setPaivitysAvain((edellinen) => edellinen + 1)
    setValilehti('historia')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kalapäiväkirja</h1>
        <button className="kirjaudu-ulos" onClick={signOut}>
          <LogOutIcon size={16} />
          Kirjaudu ulos
        </button>
      </header>

      <main className="app-sisalto">
        {valilehti === 'lisaa' && (
          <>
            <ReissuPalkki />
            <CatchForm onTallennettu={saalisTallennettu} />
          </>
        )}
        {valilehti === 'historia' && <CatchList paivitysAvain={paivitysAvain} />}
        {valilehti === 'reissut' && <TripsList paivitysAvain={paivitysAvain} />}
        {valilehti === 'tilastot' && <Stats paivitysAvain={paivitysAvain} />}
        {valilehti === 'kaverit' && <FriendsView />}
        {valilehti === 'kisat' && <CompetitionsView />}
      </main>

      <nav className="app-nav">
        {VALILEHDET.map(({ id, nimi, Ikoni }) => (
          <button
            key={id}
            className={valilehti === id ? 'aktiivinen' : ''}
            onClick={() => setValilehti(id)}
          >
            <Ikoni size={19} />
            <span>{nimi}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function Sovellus() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <p className="tila-teksti tila-koko-ruutu">Ladataan…</p>
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <TripsProvider>
      <PaaNakyma signOut={signOut} />
    </TripsProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Sovellus />
    </AuthProvider>
  )
}
