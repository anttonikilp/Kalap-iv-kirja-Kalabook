import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import AuthPage from './auth/AuthPage.jsx'
import { TripsProvider } from './trips/TripsContext.jsx'
import ReissuPalkki from './trips/ReissuPalkki.jsx'
import CatchForm from './catches/CatchForm.jsx'
import FriendsView from './friends/FriendsView.jsx'
import CompetitionsView from './competitions/CompetitionsView.jsx'
import NotificationBell from './notifications/NotificationBell.jsx'
import ProfileView from './profile/ProfileView.jsx'
import {
  PlusIcon,
  UsersIcon,
  TrophyIcon,
  UserIcon,
  LogOutIcon,
} from './components/icons.jsx'
import './App.css'

const VALILEHDET = [
  { id: 'lisaa', nimi: 'Lisää', Ikoni: PlusIcon },
  { id: 'kisat', nimi: 'Kisat', Ikoni: TrophyIcon },
  { id: 'kaverit', nimi: 'Kaverit', Ikoni: UsersIcon },
  { id: 'profiili', nimi: 'Profiili', Ikoni: UserIcon },
]

function PaaNakyma({ signOut }) {
  const [valilehti, setValilehti] = useState('lisaa')
  const [paivitysAvain, setPaivitysAvain] = useState(0)
  const [profiiliOsio, setProfiiliOsio] = useState('historia')

  function saalisTallennettu() {
    setPaivitysAvain((edellinen) => edellinen + 1)
    setProfiiliOsio('historia')
    setValilehti('profiili')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kalapäiväkirja</h1>
        <div className="app-header-oikea">
          <NotificationBell onNavigoi={setValilehti} />
          <button className="kirjaudu-ulos" onClick={signOut}>
            <LogOutIcon size={16} />
            Kirjaudu ulos
          </button>
        </div>
      </header>

      <main className="app-sisalto">
        {valilehti === 'lisaa' && (
          <>
            <ReissuPalkki />
            <CatchForm onTallennettu={saalisTallennettu} />
          </>
        )}
        {valilehti === 'kisat' && <CompetitionsView />}
        {valilehti === 'kaverit' && <FriendsView />}
        {valilehti === 'profiili' && (
          <ProfileView
            paivitysAvain={paivitysAvain}
            osio={profiiliOsio}
            onOsioChange={setProfiiliOsio}
          />
        )}
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
