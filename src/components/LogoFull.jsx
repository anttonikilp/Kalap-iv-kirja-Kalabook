/**
 * Fisko-logo (vaappu + kala -merkki ja "Fisko"-teksti) inline-SVG:na.
 * Piirretaan suoraan JSX:na (ei <img>-viittauksena), jotta tekstin
 * fontFamily-arvo Poppins ehtii ladata sivun omasta <link>-lahteesta -
 * kuvatiedostona upotettuna fontti ei periydy isanta-dokumentista.
 * Varit periytyvat CSS-muuttujista, joten logo pysyy sovittuna teemaan.
 */
export default function LogoFull({ height = 44 }) {
  return (
    <svg viewBox="0 0 260 100" height={height} role="img" aria-label="Fisko">
      <defs>
        <linearGradient id="fisko-vaappu-gradientti" gradientUnits="userSpaceOnUse" x1="47" y1="38" x2="85" y2="38">
          <stop offset="0%" stopColor="var(--vari-paa-tumma)" />
          <stop offset="100%" stopColor="var(--vari-paa)" />
        </linearGradient>
      </defs>
      <g transform="translate(3.8,2.3) rotate(-20 50 50)">
        <path d="M22 54 L9 45 L13 54 L9 63 Z" fill="var(--vari-paa-tumma)" />
        <ellipse cx="35" cy="54" rx="14" ry="9" fill="var(--vari-paa-tumma)" />
        <circle cx="41" cy="51" r="2.2" fill="#ffffff" />
        <circle cx="44" cy="38" r="4" fill="none" stroke="var(--vari-paa-tumma)" strokeWidth="2.2" />
        <ellipse cx="66" cy="38" rx="19" ry="8" fill="url(#fisko-vaappu-gradientti)" />
        <path
          d="M55 34 Q66 30 77 34"
          stroke="#ffffff"
          strokeWidth="1.6"
          fill="none"
          opacity="0.7"
          strokeLinecap="round"
        />
      </g>
      <text
        x="118"
        y="54"
        dominantBaseline="central"
        fontFamily="'Poppins', 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize="46"
        fill="var(--vari-teksti)"
      >
        Fisko
      </text>
    </svg>
  )
}
