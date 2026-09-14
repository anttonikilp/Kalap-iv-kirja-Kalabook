import { useState } from 'react'

export default function FriendRequestItem({
  profiili,
  ensisijainenTeksti,
  ensisijainenToiminto,
  toissijainenTeksti,
  toissijainenToiminto,
}) {
  const [kasitellaan, setKasitellaan] = useState(false)
  const [virhe, setVirhe] = useState('')

  async function suorita(toiminto) {
    setVirhe('')
    setKasitellaan(true)

    try {
      await toiminto()
    } catch (err) {
      setVirhe(err.message)
    } finally {
      setKasitellaan(false)
    }
  }

  return (
    <li className="friend-item">
      <div className="friend-item-tiedot">
        <strong>{profiili?.nayttonimi || profiili?.kayttajanimi || 'Tuntematon käyttäjä'}</strong>
        {profiili?.nayttonimi && <span>@{profiili.kayttajanimi}</span>}
      </div>

      <div className="friend-item-toiminnot">
        {toissijainenToiminto && (
          <button
            type="button"
            className="friend-nappi-toissijainen"
            onClick={() => suorita(toissijainenToiminto)}
            disabled={kasitellaan}
          >
            {toissijainenTeksti}
          </button>
        )}
        {ensisijainenToiminto && (
          <button
            type="button"
            className="friend-nappi"
            onClick={() => suorita(ensisijainenToiminto)}
            disabled={kasitellaan}
          >
            {ensisijainenTeksti}
          </button>
        )}
      </div>

      {virhe && <p className="lomake-virhe">{virhe}</p>}
    </li>
  )
}
