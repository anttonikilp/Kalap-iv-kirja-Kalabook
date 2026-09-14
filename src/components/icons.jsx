/**
 * Pieni, riippuvuudeton viivaikonijoukko (Lucide-tyylinen: 24x24, stroke=currentColor).
 * Ei ulkoista kirjastoa - vain sovelluksen omaan kayttoon rajattu SVG-joukko,
 * jotta ulkoasu pysyy yhtenaisena ilman uusia riippuvuuksia.
 */

function Pohja({ children, size = 20, className = '', ...muut }) {
  return (
    <svg
      className={`ikoni ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...muut}
    >
      {children}
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M12 5v14M5 12h14" />
    </Pohja>
  )
}

export function ListIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </Pohja>
  )
}

export function CompassIcon(props) {
  return (
    <Pohja {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z" />
    </Pohja>
  )
}

export function ChartIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M4 20V10M12 20V4M20 20v-6" />
      <path d="M2 20h20" />
    </Pohja>
  )
}

export function UsersIcon(props) {
  return (
    <Pohja {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.75 19c.6-3 2.9-5 6.25-5s5.65 2 6.25 5" />
      <path d="M16 8.2c1.2.2 2.1 1.2 2.1 2.55 0 1.05-.55 1.95-1.35 2.4" />
      <path d="M17.5 14.3c1.85.5 3.15 1.9 3.75 3.7" />
    </Pohja>
  )
}

export function TrophyIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5C3 8.5 4.5 10 7 10" />
      <path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5C21 8.5 19.5 10 17 10" />
      <path d="M12 13v3M9 20h6M9.5 20c0-1.7.6-3 2.5-3s2.5 1.3 2.5 3" />
    </Pohja>
  )
}

export function LogOutIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Pohja>
  )
}

export function CameraIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.5h7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.25" />
    </Pohja>
  )
}

export function MapPinIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M12 21s7-6.1 7-11.5S16 2 12 2 5 4.6 5 9.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </Pohja>
  )
}

export function CheckIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Pohja>
  )
}

export function XIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Pohja>
  )
}

export function TrashIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 12.5A2 2 0 0 0 9 21h6a2 2 0 0 0 2-1.5L18 7" />
      <path d="M10 11v6M14 11v6" />
    </Pohja>
  )
}

export function ArrowLeftIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </Pohja>
  )
}

export function FishIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M2.3 12.2c2.3-3.3 6.3-5.3 10-5.3 2.7 0 4.4 2.2 4.7 5.3-.3 3.1-2 5.3-4.7 5.3-3.7 0-7.7-2-10-5.3Z" />
      <path d="M16.8 12.2 21.7 8.6" />
      <path d="M16.8 12.2 21.7 15.8" />
      <circle cx="6.7" cy="10.6" r="0.9" fill="currentColor" stroke="none" />
    </Pohja>
  )
}

export function ImageOffIcon(props) {
  return (
    <Pohja {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 16.5 8 12l3 3 3.5-3.5L20.5 17" />
      <circle cx="8.25" cy="8.75" r="1.25" />
    </Pohja>
  )
}

export function ClockIcon(props) {
  return (
    <Pohja {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </Pohja>
  )
}

export function CalendarIcon(props) {
  return (
    <Pohja {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Pohja>
  )
}

export function MedalIcon(props) {
  return (
    <Pohja {...props}>
      <circle cx="12" cy="14" r="6" />
      <path d="M9.5 3h5l2 5-3.5 3-3.5-3 2-5Z" />
      <path d="M10.3 16.2 12 12l1.7 4.2" />
    </Pohja>
  )
}

export function UserPlusIcon(props) {
  return (
    <Pohja {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.75 19c.6-3 2.9-5 6.25-5s5.65 2 6.25 5" />
      <path d="M18 8v5M15.5 10.5h5" />
    </Pohja>
  )
}

export function InboxIcon(props) {
  return (
    <Pohja {...props}>
      <path d="M4 12.5 6.5 5.5h11L20 12.5" />
      <path d="M4 12.5v5.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-5.5" />
      <path d="M4 12.5h4.2c.3 1.2 1.3 2 3.8 2s3.5-.8 3.8-2H20" />
    </Pohja>
  )
}
