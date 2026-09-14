import { useState } from 'react'
import { CheckIcon, XIcon, TrashIcon, UserPlusIcon } from '../components/icons.jsx'

const TOIMINTOIKONIT = {
  Hyväksy: CheckIcon,
  Hylkää: XIcon,
  Peru: XIcon,
  Poista: TrashIcon,
  Kutsu: UserPlusIcon,
}

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

  const nimi = profiili?.nayttonimi || profiili?.kayttajanimi || 'Tuntematon käyttäjä'
  const EnsisijainenIkoni = TOIMINTOIKONIT[ensisijainenTeksti]
  const ToissijainenIkoni = TOIMINTOIKONIT[toissijainenTeksti]

  return (
    <li className="friend-item">
      <div className="friend-item-avatar" aria-hidden="true">
        {nimi.charAt(0).toUpperCase()}
      </div>

      <div className="friend-item-tiedot">
        <strong>{nimi}</strong>
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
            {ToissijainenIkoni && <ToissijainenIkoni size={15} />}
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
            {EnsisijainenIkoni && <EnsisijainenIkoni size={15} />}
            {ensisijainenTeksti}
          </button>
        )}
      </div>

      {virhe && <p className="lomake-virhe">{virhe}</p>}
    </li>
  )
}
