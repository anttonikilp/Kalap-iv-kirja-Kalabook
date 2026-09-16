export const MITTARIT = [
  { id: 'suurin_kala', nimi: 'Suurin kala (paino)' },
  { id: 'maara', nimi: 'Eniten kaloja' },
]

export const LASKENTATAVAT = [
  { id: 'automaattinen', nimi: 'Automaattinen' },
  { id: 'ilmoitettava', nimi: 'Ilmoitettavat' },
]

export const KISATYYPIT = [
  { id: 'yksilo', nimi: 'Yksilökisa' },
  { id: 'joukkue', nimi: 'Joukkuekisa' },
]

export const JOUKKUELASKENTATAVAT = [
  { id: 'yhteistulos', nimi: 'Joukkueen yhteistulos' },
  { id: 'suurin_kala', nimi: 'Joukkueen suurin kala' },
]

export function mittarinNimi(id) {
  return MITTARIT.find((m) => m.id === id)?.nimi ?? id
}

export function laskentatavanNimi(id) {
  return LASKENTATAVAT.find((l) => l.id === id)?.nimi ?? id
}

export function kisatyypinNimi(id) {
  return KISATYYPIT.find((t) => t.id === id)?.nimi ?? id
}

export function joukkuelaskentatavanNimi(id) {
  return JOUKKUELASKENTATAVAT.find((l) => l.id === id)?.nimi ?? id
}
