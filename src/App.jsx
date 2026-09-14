import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import AuthPage from './auth/AuthPage.jsx'
import CatchForm from './catches/CatchForm.jsx'
import CatchList from './catches/CatchList.jsx'
import Stats from './stats/Stats.jsx'
import './App.css'

function Sovellus() {
  const { user, loading, signOut } = useAuth()
  const [valilehti, setValilehti] = useState('lisaa')
  const [paivitysAvain, setPaivitysAvain] = useState(0)

  if (loading) {
    return <p className="tila-teksti tila-koko-ruutu">Ladataan…</p>
  }

  if (!user) {
    return <AuthPage />
  }

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
        {valilehti === 'lisaa' && <CatchForm onTallennettu={saalisTallennettu} />}
        {valilehti === 'historia' && <CatchList paivitysAvain={paivitysAvain} />}
        {valilehti === 'tilastot' && <Stats paivitysAvain={paivitysAvain} />}
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
          className={valilehti === 'tilastot' ? 'aktiivinen' : ''}
          onClick={() => setValilehti('tilastot')}
        >
          Tilastot
        </button>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Sovellus />
    </AuthProvider>
  )
}
