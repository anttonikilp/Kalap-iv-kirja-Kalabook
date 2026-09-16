/**
 * Lajikohtaiset kalakuvakkeet lajivalintaan. Sama pelkistetty viivatyyli
 * kuin sovelluksen muissa ikoneissa (ks. components/icons.jsx): runko
 * piirretaan aina nykyisella tekstivarilla (currentColor), jotta se seuraa
 * valinnan mukana muuttuvaa varia. Selkaevä on jokaisessa lajissa sama
 * "tunnusmerkki" ja se on aina sovelluksen turkoosilla paavarilla, jotta
 * kuvakkeet nayttavat yhtenaiselta sarjalta.
 */

function Runko({ children, size = 24, className = '', ...muut }) {
  return (
    <svg
      className={`laji-ikoni ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...muut}
    >
      {children}
    </svg>
  )
}

const HANTAEVA = 'M18,12 L22.5,7.3 L18.7,12 L22.5,16.7 Z'

export function KuhaIkoni(props) {
  // Hoikka, ryhdikas petokala: kapea runko, terava kuono, korkea selkaevä.
  return (
    <Runko {...props}>
      <path d="M2.3,12 C3.2,9.1 6.8,7.6 11.5,7.8 C15,8 18,9.4 18,12 C18,14.6 15,16 11.5,16.2 C6.8,16.4 3.2,14.9 2.3,12 Z" />
      <path d={HANTAEVA} />
      <path
        d="M10.9,7.8 L11.9,1.1 L13.7,8.1"
        fill="var(--vari-paa)"
        stroke="var(--vari-paa)"
        strokeWidth={1}
      />
      <circle cx="5.8" cy="10.8" r="0.9" fill="currentColor" stroke="none" />
    </Runko>
  )
}

export function AhvenIkoni(props) {
  // Korkeaselkainen runko, piikikas (sahalaitainen) selkaevä ja pystyraidat.
  return (
    <Runko {...props}>
      <path d="M2.5,12.5 C3.3,9 7,6.3 12,6.5 C16,6.7 18.3,9 18.3,12.2 C18.3,15.2 15.5,17 12,17.3 C7,17.6 3.3,15.8 2.5,12.5 Z" />
      <path d="M18.3,11.7 L22.5,7 L18.9,11.9 L22.5,16.4 L18.3,12.6 Z" />
      <path
        d="M8.7,6.9 L9.6,4 L10.7,6.7 L11.6,3.6 L12.7,6.7 L13.6,4.1 L14.5,7"
        fill="none"
        stroke="var(--vari-paa)"
        strokeWidth={1.1}
      />
      <path d="M7.6,9 L7.6,15.4 M10.6,8.4 L10.6,16 M13.6,9 L13.6,15.4" strokeWidth={1.1} />
      <circle cx="6.3" cy="10.4" r="0.9" fill="currentColor" stroke="none" />
    </Runko>
  )
}

export function HaukiIkoni(props) {
  // Pitka, littea runko ja iso, pitka "ankannokka"; selkaevä kaukana takana.
  return (
    <Runko {...props}>
      <path d="M1,12 C1.8,9.9 4.5,8.9 9,9.1 C13.2,9.3 17.2,10.1 19.7,12 C17.2,13.9 13.2,14.7 9,14.9 C4.5,15.1 1.8,14.1 1,12 Z" />
      <path d="M1.7,10.9 L7.2,11.4 M1.7,13.1 L7.2,12.6" strokeWidth={1.1} />
      <path d="M18.2,12 L22.5,7.6 L19,12 L22.5,16.4 L18.2,12 Z" />
      <path
        d="M14.3,9.2 L15.2,6.1 L16.3,9.5"
        fill="var(--vari-paa)"
        stroke="var(--vari-paa)"
        strokeWidth={1.1}
      />
      <circle cx="8.3" cy="10.4" r="0.85" fill="currentColor" stroke="none" />
    </Runko>
  )
}

export function TaimenIkoni(props) {
  // Virtaviivainen lohikala: pieni rasvaevä hantaevän edessa ja pilkkuja kyljessa.
  return (
    <Runko {...props}>
      <path d="M2.5,12 C3.3,8.6 6.8,7 11,7.2 C15.2,7.4 17.8,9.3 17.8,12 C17.8,14.7 15.2,16.6 11,16.8 C6.8,17 3.3,15.4 2.5,12 Z" />
      <path d={HANTAEVA} />
      <path
        d="M9.6,7.3 L10.7,3.4 L12.6,7.6"
        fill="var(--vari-paa)"
        stroke="var(--vari-paa)"
        strokeWidth={1.1}
      />
      <path
        d="M15.6,8.6 L16.6,7.1 L16.9,8.9"
        fill="none"
        strokeWidth={1.1}
      />
      <circle cx="6.1" cy="10.3" r="0.9" fill="currentColor" stroke="none" />
      <g fill="currentColor" stroke="none">
        <circle cx="9.4" cy="9.9" r="0.55" />
        <circle cx="12.2" cy="9.5" r="0.55" />
        <circle cx="10.6" cy="13" r="0.55" />
        <circle cx="13.4" cy="12.4" r="0.55" />
      </g>
    </Runko>
  )
}

export function MuuKalaIkoni(props) {
  // Neutraali yleiskala: perusrunko ja pieni, pyoreahko selkaevä.
  return (
    <Runko {...props}>
      <path d="M2.5,12 C3.4,8.5 7,6.8 11.5,7 C15.7,7.2 18.3,9.2 18.3,12 C18.3,14.8 15.7,16.8 11.5,17 C7,17.2 3.4,15.5 2.5,12 Z" />
      <path d={HANTAEVA} />
      <path
        d="M9.8,7.3 C10.6,5.9 12.6,5.9 13.3,7.4"
        fill="var(--vari-paa)"
        stroke="var(--vari-paa)"
        strokeWidth={1}
      />
      <circle cx="6.2" cy="10.6" r="0.9" fill="currentColor" stroke="none" />
    </Runko>
  )
}

export const LAJI_IKONIT = {
  kuha: KuhaIkoni,
  ahven: AhvenIkoni,
  hauki: HaukiIkoni,
  taimen: TaimenIkoni,
  muu: MuuKalaIkoni,
}

export function LajiIkoni({ laji, ...muut }) {
  const Ikoni = LAJI_IKONIT[laji] || MuuKalaIkoni
  return <Ikoni {...muut} />
}
