export const MITTARIT = [
  { id: 'suurin_kala', nimi: 'Suurin kala (paino)' },
  { id: 'maara', nimi: 'Eniten kaloja' },
]

export const LASKENTATAVAT = [
  { id: 'automaattinen', nimi: 'Automaattinen' },
  { id: 'ilmoitettava', nimi: 'Ilmoitettavat' },
]

export function mittarinNimi(id) {
  return MITTARIT.find((m) => m.id === id)?.nimi ?? id
}

export function laskentatavanNimi(id) {
  return LASKENTATAVAT.find((l) => l.id === id)?.nimi ?? id
}
