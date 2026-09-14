import { useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { FishIcon } from '../components/icons.jsx'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [tila, setTila] = useState('kirjaudu')
  const [email, setEmail] = useState('')
  const [salasana, setSalasana] = useState('')
  const [virhe, setVirhe] = useState('')
  const [info, setInfo] = useState('')
  const [lahetetaan, setLahetetaan] = useState(false)

  async function lahetaLomake(e) {
    e.preventDefault()
    setVirhe('')
    setInfo('')
    setLahetetaan(true)

    const toiminto = tila === 'kirjaudu' ? signIn : signUp
    const { error } = await toiminto(email, salasana)

    if (error) {
      setVirhe(virheTeksti(error))
    } else if (tila === 'rekisterodi') {
      setInfo('Tarkista sähköpostisi ja vahvista tilisi, jotta voit kirjautua sisään.')
    }

    setLahetetaan(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-tunnus">
          <FishIcon size={22} />
        </div>
        <h1>Kalapäiväkirja</h1>
        <p className="auth-subtitle">
          {tila === 'kirjaudu' ? 'Kirjaudu sisään' : 'Luo uusi tili'}
        </p>

        <form onSubmit={lahetaLomake} className="auth-form">
          <label>
            Sähköposti
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Salasana
            <input
              type="password"
              required
              minLength={6}
              value={salasana}
              onChange={(e) => setSalasana(e.target.value)}
              autoComplete={tila === 'kirjaudu' ? 'current-password' : 'new-password'}
            />
          </label>

          {virhe && <p className="auth-error">{virhe}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button type="submit" className="btn-primary" disabled={lahetetaan}>
            {lahetetaan ? 'Hetki…' : tila === 'kirjaudu' ? 'Kirjaudu sisään' : 'Rekisteröidy'}
          </button>
        </form>

        <button
          type="button"
          className="auth-toggle"
          onClick={() => {
            setTila(tila === 'kirjaudu' ? 'rekisterodi' : 'kirjaudu')
            setVirhe('')
            setInfo('')
          }}
        >
          {tila === 'kirjaudu'
            ? 'Ei vielä tiliä? Rekisteröidy'
            : 'Onko sinulla jo tili? Kirjaudu sisään'}
        </button>
      </div>
    </div>
  )
}

function virheTeksti(error) {
  const viesti = error.message || ''

  if (viesti.includes('Invalid login credentials')) {
    return 'Väärä sähköposti tai salasana.'
  }
  if (viesti.includes('User already registered')) {
    return 'Tunnus on jo olemassa. Kirjaudu sisään.'
  }
  if (viesti.includes('Password should be at least')) {
    return 'Salasanan tulee olla vähintään 6 merkkiä.'
  }
  return 'Jotain meni pieleen: ' + viesti
}
