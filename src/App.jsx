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
import './App.css'

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
      </main>

      <nav className="app-nav">
        <button
          className={valilehti === 'lisaa' ? 'aktiivinen' : ''}
          onClick={() => setValilehti('lisaa')}
        >
          Lisää
        </button>
        <button
          className={valilehti === 'historia' ? 'aktiivinen' : ''}
          onClick={() => setValilehti('historia')}
        >
          Historia
        </button>
        <button
          className={valilehti === 'reissut' ? 'aktiivinen' : ''}
          onClick={() => setValilehti('reissut')}
        >
          Reissut
        </button>
        <button
          className={valilehti === 'tilastot' ? 'aktiivinen' : ''}
          onClick={() => setValilehti('tilastot')}
        >
          Tilastot
        </button>
        <button
          className={valilehti === 'kaverit' ? 'aktiivinen' : ''}
          onClick={() => setValilehti('kaverit')}
        >
          Kaverit
        </button>
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
